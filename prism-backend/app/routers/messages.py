"""
Real-time messaging system with WebSocket support
Allows students and mentors to communicate based on worklet associations
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, and_, or_, desc
from sqlalchemy.sql import func
from typing import List, Dict, Optional
from datetime import datetime
from app.database import get_db, Base
from app.models import User, UserWorkletAssociation, Message, MessageRead
from app.auth import oauth2_scheme, require_access_token
from pydantic import BaseModel
from jose import jwt, JWTError
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["messages"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # user_id -> WebSocket
    
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast_to_users(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

# Pydantic models for messages
class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    worklet_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_role: str
    receiver_id: int
    receiver_name: str
    content: str
    worklet_id: Optional[int]
    created_at: datetime
    is_read: bool
    
    class Config:
        from_attributes = True

class ConversationWorklet(BaseModel):
    worklet_id: int
    worklet_title: str
    worklet_cert_id: Optional[str]
    member_count: int
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    last_sender_name: Optional[str]
    unread_count: int

class ConversationUser(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    unread_count: int

# Helper function to get current user from token
async def get_current_user_from_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    try:
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Helper function to get worklets a user can chat in
def get_user_worklets(db: Session, user_id: int) -> List[Dict]:
    """Get list of worklets the current user can chat in"""
    from app.models import Worklet
    
    # Get all worklets the user is associated with
    user_worklets = db.query(UserWorkletAssociation).options(
        joinedload(UserWorkletAssociation.worklet)
    ).filter(
        UserWorkletAssociation.user_id == user_id
    ).all()
    
    result = []
    for uw in user_worklets:
        if not uw.worklet:
            continue
            
        worklet = uw.worklet
        
        # Count members in this worklet
        member_count = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == worklet.id
        ).count()
        
        # Get last message in this worklet
        last_msg = db.query(Message).filter(
            Message.worklet_id == worklet.id
        ).order_by(desc(Message.created_at)).first()
        
        # Get sender name if there's a last message
        last_sender_name = None
        if last_msg:
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            last_sender_name = sender.name if sender else "Unknown"
        
        # Get unread count for this worklet (messages not read by current user)
        unread = db.query(Message).filter(
            and_(
                Message.worklet_id == worklet.id,
                Message.sender_id != user_id,  # Not sent by current user
            )
        ).outerjoin(
            MessageRead,
            and_(
                MessageRead.message_id == Message.id,
                MessageRead.user_id == user_id
            )
        ).filter(
            MessageRead.id == None  # No read record for this user
        ).count()
        
        result.append({
            'worklet_id': worklet.id,
            'worklet_title': worklet.title or f"Worklet {worklet.cert_id}",
            'worklet_cert_id': worklet.cert_id,
            'member_count': member_count,
            'last_message': last_msg.content if last_msg else None,
            'last_message_time': last_msg.created_at if last_msg else None,
            'last_sender_name': last_sender_name,
            'unread_count': unread
        })
    
    # Sort by last message time
    result.sort(key=lambda x: x['last_message_time'] or datetime.min, reverse=True)
    return result

# Legacy function for backward compatibility (1-on-1 chats)
def get_chattable_users(db: Session, user_id: int) -> List[Dict]:
    """Get list of users that the current user can chat with based on worklet associations"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    chattable_users = set()
    
    # Get all worklets the user is associated with
    user_worklets = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == user_id
    ).all()
    
    worklet_ids = [uw.worklet_id for uw in user_worklets]
    
    if not worklet_ids:
        return []
    
    # Get all other users in the same worklets
    other_associations = db.query(UserWorkletAssociation).options(
        joinedload(UserWorkletAssociation.user)
    ).filter(
        and_(
            UserWorkletAssociation.worklet_id.in_(worklet_ids),
            UserWorkletAssociation.user_id != user_id
        )
    ).all()
    
    for assoc in other_associations:
        if assoc.user:
            chattable_users.add((assoc.user.id, assoc.user.name, assoc.user.email, assoc.user.role))
    
    result = []
    for uid, name, email, role in chattable_users:
        # Get last message
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == uid),
                and_(Message.sender_id == uid, Message.receiver_id == user_id)
            )
        ).order_by(desc(Message.created_at)).first()
        
        # Get unread count
        unread = db.query(Message).filter(
            and_(
                Message.sender_id == uid,
                Message.receiver_id == user_id,
                Message.is_read == False
            )
        ).count()
        
        result.append({
            'user_id': uid,
            'name': name,
            'email': email,
            'role': role,
            'last_message': last_msg.content if last_msg else None,
            'last_message_time': last_msg.created_at if last_msg else None,
            'unread_count': unread
        })
    
    # Sort by last message time
    result.sort(key=lambda x: x['last_message_time'] or datetime.min, reverse=True)
    return result

# WebSocket endpoint
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    try:
        # Validate token
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await manager.connect(user.id, websocket)
        
        # Send connection success
        await websocket.send_json({
            "type": "connected",
            "user_id": user.id,
            "message": "Connected successfully"
        })
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                
                if data.get("type") == "message":
                    # Save message to database
                    receiver_id = data.get("receiver_id")
                    content = data.get("content")
                    worklet_id = data.get("worklet_id")
                    
                    if not receiver_id or not content:
                        continue
                    
                    # Verify receiver exists
                    receiver = db.query(User).filter(User.id == receiver_id).first()
                    if not receiver:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Receiver not found"
                        })
                        continue
                    
                    # Create message
                    new_message = Message(
                        sender_id=user.id,
                        receiver_id=receiver_id,
                        content=content,
                        worklet_id=worklet_id
                    )
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)
                    
                    # Prepare message for broadcasting
                    message_data = {
                        "type": "message",
                        "id": new_message.id,
                        "sender_id": user.id,
                        "sender_name": user.name,
                        "sender_role": user.role,
                        "receiver_id": receiver_id,
                        "content": content,
                        "worklet_id": worklet_id,
                        "created_at": new_message.created_at.isoformat(),
                        "is_read": False
                    }
                    
                    # Send to receiver if online
                    await manager.send_personal_message(message_data, receiver_id)
                    
                    # Send confirmation to sender
                    await websocket.send_json({
                        **message_data,
                        "type": "sent"
                    })
                
                elif data.get("type") == "mark_read":
                    # Mark messages as read
                    sender_id = data.get("sender_id")
                    if sender_id:
                        db.query(Message).filter(
                            and_(
                                Message.sender_id == sender_id,
                                Message.receiver_id == user.id,
                                Message.is_read == False
                            )
                        ).update({"is_read": True})
                        db.commit()
                        
                        # Notify sender that messages were read
                        await manager.send_personal_message({
                            "type": "read_receipt",
                            "reader_id": user.id,
                            "messages_read": True
                        }, sender_id)
                
                elif data.get("type") == "typing":
                    # Notify receiver that sender is typing
                    receiver_id = data.get("receiver_id")
                    if receiver_id:
                        await manager.send_personal_message({
                            "type": "typing",
                            "user_id": user.id,
                            "user_name": user.name
                        }, receiver_id)
        
        except WebSocketDisconnect:
            manager.disconnect(user.id)
        except Exception as e:
            logger.error(f"WebSocket error for user {user.id}: {e}")
            manager.disconnect(user.id)
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

# REST API endpoints

@router.get("/conversations", response_model=List[ConversationWorklet])
async def get_conversations(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get list of worklets the current user can chat in"""
    try:
        logger.info(f"Fetching worklet conversations for user {current_user.id} ({current_user.role})")
        conversations = get_user_worklets(db, current_user.id)
        logger.info(f"User {current_user.id} has {len(conversations)} worklet conversations")
        
        # Debug: log the conversations
        for conv in conversations:
            logger.info(f"  - Worklet {conv['worklet_cert_id']}: {conv['worklet_title']} - {conv['member_count']} members, {conv['unread_count']} unread")
        
        return conversations
    except Exception as e:
        logger.error(f"Error fetching conversations for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

@router.get("/chat/worklet/{worklet_id}", response_model=List[MessageResponse])
async def get_messages_in_worklet(
    worklet_id: int,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get message history in a worklet group chat"""
    try:
        # Verify user is part of this worklet
        association = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == current_user.id,
                UserWorkletAssociation.worklet_id == worklet_id
            )
        ).first()
        
        if not association:
            raise HTTPException(status_code=403, detail="You are not a member of this worklet")
        
        # Get all messages in this worklet
        messages = db.query(Message).filter(
            Message.worklet_id == worklet_id
        ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()
        
        result = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            receiver = db.query(User).filter(User.id == msg.receiver_id).first() if msg.receiver_id else None
            
            result.append(MessageResponse(
                id=msg.id,
                sender_id=msg.sender_id,
                sender_name=sender.name if sender else "Unknown",
                sender_role=sender.role if sender else "Unknown",
                receiver_id=msg.receiver_id or 0,
                receiver_name=receiver.name if receiver else "Group",
                content=msg.content,
                worklet_id=msg.worklet_id,
                created_at=msg.created_at,
                is_read=msg.is_read
            ))
        
        # Mark messages as read for current user using MessageRead table
        unread_messages = db.query(Message).filter(
            and_(
                Message.worklet_id == worklet_id,
                Message.sender_id != current_user.id
            )
        ).outerjoin(
            MessageRead,
            and_(
                MessageRead.message_id == Message.id,
                MessageRead.user_id == current_user.id
            )
        ).filter(
            MessageRead.id == None  # Not yet read by this user
        ).all()
        
        for msg in unread_messages:
            try:
                read_record = MessageRead(
                    message_id=msg.id,
                    user_id=current_user.id
                )
                db.add(read_record)
            except Exception:
                # Duplicate read record, ignore
                pass
        
        try:
            db.commit()
        except Exception as e:
            logger.warning(f"Error marking messages as read: {e}")
            db.rollback()
        
        logger.info(f"Fetched {len(result)} messages from worklet {worklet_id} for user {current_user.id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching worklet messages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.get("/chat/{user_id}", response_model=List[MessageResponse])
async def get_messages_with_user(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get message history with a specific user"""
    try:
        messages = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()
        
        result = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            receiver = db.query(User).filter(User.id == msg.receiver_id).first()
            
            result.append(MessageResponse(
                id=msg.id,
                sender_id=msg.sender_id,
                sender_name=sender.name if sender else "Unknown",
                sender_role=sender.role if sender else "Unknown",
                receiver_id=msg.receiver_id,
                receiver_name=receiver.name if receiver else "Unknown",
                content=msg.content,
                worklet_id=msg.worklet_id,
                created_at=msg.created_at,
                is_read=msg.is_read
            ))
        
        logger.info(f"Fetched {len(result)} messages between user {current_user.id} and {user_id}")
        return result
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Send a message (fallback for non-WebSocket clients)"""
    try:
        logger.info(f"Attempting to send message from {current_user.id} to worklet {message.worklet_id}")
        
        # Verify user is part of this worklet
        association = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == current_user.id,
                UserWorkletAssociation.worklet_id == message.worklet_id
            )
        ).first()
        
        if not association:
            raise HTTPException(status_code=403, detail="You are not a member of this worklet")
        
        # Create new message (no receiver_id needed for group chat)
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=None,  # Group message has no specific receiver
            content=message.content,
            worklet_id=message.worklet_id,
            is_read=False
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        # Get all worklet members to broadcast to
        worklet_members = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == message.worklet_id
        ).all()
        
        message_data = {
            "type": "new_message",
            "message": {
                "id": new_message.id,
                "sender_id": new_message.sender_id,
                "sender_name": current_user.name,
                "sender_role": current_user.role,
                "receiver_id": 0,
                "receiver_name": "Group",
                "content": new_message.content,
                "worklet_id": new_message.worklet_id,
                "created_at": new_message.created_at.isoformat(),
                "is_read": new_message.is_read
            }
        }
        
        # Broadcast to all online worklet members
        for member in worklet_members:
            if member.user_id != current_user.id:  # Don't send to sender
                await manager.send_personal_message(message_data, member.user_id)
        
        logger.info(f"Message {new_message.id} sent to worklet {message.worklet_id} successfully")
        
        return MessageResponse(
            id=new_message.id,
            sender_id=current_user.id,
            sender_name=current_user.name,
            sender_role=current_user.role,
            receiver_id=0,
            receiver_name="Group",
            content=message.content,
            worklet_id=message.worklet_id,
            created_at=new_message.created_at,
            is_read=False
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.put("/mark-read/{sender_id}")
async def mark_messages_read(
    sender_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark all messages from a user as read"""
    try:
        updated = db.query(Message).filter(
            and_(
                Message.sender_id == sender_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            )
        ).update({"is_read": True})
        db.commit()
        
        logger.info(f"Marked {updated} messages as read for user {current_user.id} from sender {sender_id}")
        return {"updated": updated}
    except Exception as e:
        logger.error(f"Error marking messages as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark messages as read")

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get total unread message count"""
    try:
        count = db.query(Message).filter(
            and_(
                Message.receiver_id == current_user.id,
                Message.is_read == False
            )
        ).count()
        
        logger.info(f"User {current_user.id} has {count} unread messages")
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail="Failed to get unread count")

# Debug endpoint
@router.get("/debug/worklet-associations")
async def debug_worklet_associations(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check user's worklet associations"""
    try:
        # Get user's worklet associations
        user_associations = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.user_id == current_user.id
        ).all()
        
        worklet_ids = [ua.worklet_id for ua in user_associations]
        
        # Get other users in same worklets
        other_users = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.worklet_id.in_(worklet_ids) if worklet_ids else False,
                UserWorkletAssociation.user_id != current_user.id
            )
        ).all()
        
        return {
            "current_user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role
            },
            "worklet_count": len(worklet_ids),
            "worklet_ids": worklet_ids,
            "other_users_count": len(other_users),
            "chattable_users": get_chattable_users(db, current_user.id)
        }
    except Exception as e:
        logger.error(f"Debug error: {e}", exc_info=True)
        return {"error": str(e)}
