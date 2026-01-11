"""
Real-time messaging system with WebSocket support
Allows students and mentors to communicate based on worklet associations
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Dict, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, UserWorkletAssociation, Message, MessageRead, Worklet
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

# Pydantic schemas
class MessageCreate(BaseModel):
    receiver_id: Optional[int] = None
    worklet_id: Optional[int] = None
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: Optional[int]
    worklet_id: Optional[int]
    content: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    user_id: int
    user_name: str
    worklet_id: Optional[int]
    worklet_title: Optional[str]
    worklet_certid: Optional[str]
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int

# Helper function to get current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = require_access_token(token)
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        # Verify token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        
        if not email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Get user from database
        db = next(get_db())
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Connect user
        await manager.connect(user.id, websocket)
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle ping/pong
                if message_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue
                
                # Handle other message types here if needed
                
        except WebSocketDisconnect:
            manager.disconnect(user.id)
            
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user:
            manager.disconnect(user.id)

# Get all conversations for current user
@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations showing all worklets the user is assigned to"""
    conversations = []
    
    # Get all worklets the current user is associated with  
    user_worklets = db.query(UserWorkletAssociation).options(
        joinedload(UserWorkletAssociation.worklet)
    ).filter(
        UserWorkletAssociation.user_id == current_user.id
    ).all()
    
    # Create group conversation for each worklet
    for assoc in user_worklets:
        worklet = assoc.worklet
        if not worklet:
            continue
        
        worklet_id = worklet.id
        
        # Get last group message for this worklet
        last_msg = db.query(Message).filter(
            and_(
                Message.worklet_id == worklet_id,
                Message.receiver_id.is_(None)
            )
        ).order_by(desc(Message.created_at)).first()
        
        # Count unread group messages
        unread = db.query(func.count(Message.id)).filter(
            and_(
                Message.worklet_id == worklet_id,
                Message.receiver_id.is_(None),
                Message.sender_id != current_user.id,
                ~Message.id.in_(
                    db.query(MessageRead.message_id).filter(
                        MessageRead.user_id == current_user.id
                    )
                )
            )
        ).scalar()
        
        conversations.append(ConversationResponse(
            user_id=0,  # Group conversation
            user_name=f"Group: {worklet.title[:30]}",
            worklet_id=worklet_id,
            worklet_title=worklet.title,
            worklet_certid=worklet.cert_id,
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            unread_count=unread or 0
        ))
    
    # Also get 1-on-1 conversations from existing messages
    sent_to = db.query(Message.receiver_id, Message.worklet_id).filter(
        and_(
            Message.sender_id == current_user.id,
            Message.receiver_id.isnot(None)
        )
    ).distinct().all()
    
    received_from = db.query(Message.sender_id, Message.worklet_id).filter(
        Message.receiver_id == current_user.id
    ).distinct().all()
    
    # Combine and deduplicate 1-on-1 partners
    partners = set()
    for receiver_id, worklet_id in sent_to:
        if receiver_id:
            partners.add((receiver_id, worklet_id))
    for sender_id, worklet_id in received_from:
        partners.add((sender_id, worklet_id))
    
    # Build 1-on-1 conversation objects
    for partner_id, worklet_id in partners:
        # 1-on-1 conversation
        partner = db.query(User).filter(User.id == partner_id).first()
        if not partner:
            continue
            
            # Get last message with worklet info using joinedload
            last_msg = db.query(Message).options(
                joinedload(Message.worklet)
            ).filter(
                and_(
                    Message.worklet_id == worklet_id,
                    or_(
                        and_(Message.sender_id == current_user.id, Message.receiver_id == partner_id),
                        and_(Message.sender_id == partner_id, Message.receiver_id == current_user.id)
                    )
                )
            ).order_by(desc(Message.created_at)).first()
            
            # Count unread
            unread = db.query(func.count(Message.id)).filter(
                and_(
                    Message.sender_id == partner_id,
                    Message.receiver_id == current_user.id,
                    Message.worklet_id == worklet_id,
                    ~Message.id.in_(
                        db.query(MessageRead.message_id).filter(
                            MessageRead.user_id == current_user.id
                        )
                    )
                )
            ).scalar()
            
            worklet = last_msg.worklet if last_msg and last_msg.worklet else None
            
            conversations.append(ConversationResponse(
                user_id=partner_id,
                user_name=partner.name,
                worklet_id=worklet_id,
                worklet_title=worklet.title if worklet else None,
                worklet_certid=worklet.cert_id if worklet else None,
                last_message=last_msg.content if last_msg else None,
                last_message_at=last_msg.created_at if last_msg else None,
                unread_count=unread or 0
            ))
    
    # Sort by last message time (worklets without messages appear at the end)
    conversations.sort(key=lambda x: x.last_message_at or datetime.min, reverse=True)
    return conversations

# Get messages for a specific conversation
@router.get("/conversation/{partner_id}/worklet/{worklet_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    partner_id: int,
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages in a 1-on-1 conversation"""
    messages = db.query(Message).filter(
        and_(
            Message.worklet_id == worklet_id,
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == partner_id),
                and_(Message.sender_id == partner_id, Message.receiver_id == current_user.id)
            )
        )
    ).order_by(Message.created_at).all()
    
    # Mark messages as read
    for msg in messages:
        if msg.sender_id != current_user.id:
            existing_read = db.query(MessageRead).filter(
                and_(
                    MessageRead.message_id == msg.id,
                    MessageRead.user_id == current_user.id
                )
            ).first()
            
            if not existing_read:
                msg_read = MessageRead(message_id=msg.id, user_id=current_user.id)
                db.add(msg_read)
    
    db.commit()
    
    # Add sender names
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            worklet_id=msg.worklet_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=sender.name if sender else "Unknown"
        ))
    
    return result

# Get group messages
@router.get("/group/{worklet_id}", response_model=List[MessageResponse])
async def get_group_messages(
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages in a group conversation (worklet)"""
    # Verify user is part of the worklet
    association = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.user_id == current_user.id,
            UserWorkletAssociation.worklet_id == worklet_id
        )
    ).first()
    
    if not association:
        raise HTTPException(status_code=403, detail="Not authorized to view this worklet's messages")
    
    messages = db.query(Message).filter(
        and_(
            Message.worklet_id == worklet_id,
            Message.receiver_id.is_(None)
        )
    ).order_by(Message.created_at).all()
    
    # Mark messages as read for current user
    for msg in messages:
        if msg.sender_id != current_user.id:
            existing_read = db.query(MessageRead).filter(
                and_(
                    MessageRead.message_id == msg.id,
                    MessageRead.user_id == current_user.id
                )
            ).first()
            
            if not existing_read:
                msg_read = MessageRead(message_id=msg.id, user_id=current_user.id)
                db.add(msg_read)
    
    db.commit()
    
    # Add sender names
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            worklet_id=msg.worklet_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_name=sender.name if sender else "Unknown"
        ))
    
    return result

# Send a message
@router.post("/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message (either 1-on-1 or group)"""
    # Validate worklet association
    if message_data.worklet_id:
        association = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.user_id == current_user.id,
                UserWorkletAssociation.worklet_id == message_data.worklet_id
            )
        ).first()
        
        if not association:
            raise HTTPException(status_code=403, detail="Not authorized to send messages in this worklet")
    
    # Create message
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        worklet_id=message_data.worklet_id,
        content=message_data.content,
        is_read=False
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Prepare response
    response = MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        receiver_id=new_message.receiver_id,
        worklet_id=new_message.worklet_id,
        content=new_message.content,
        is_read=new_message.is_read,
        created_at=new_message.created_at,
        sender_name=current_user.name
    )
    
    # Send via WebSocket
    if message_data.receiver_id:
        # 1-on-1 message
        await manager.send_personal_message({
            "type": "new_message",
            "data": response.dict()
        }, message_data.receiver_id)
    else:
        # Group message - send to all worklet members
        worklet_members = db.query(UserWorkletAssociation.user_id).filter(
            and_(
                UserWorkletAssociation.worklet_id == message_data.worklet_id,
                UserWorkletAssociation.user_id != current_user.id
            )
        ).all()
        
        member_ids = [m[0] for m in worklet_members]
        await manager.broadcast_to_users({
            "type": "new_group_message",
            "data": response.dict()
        }, member_ids)
    
    return response

# Get unread count
@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread message count for current user"""
    unread = db.query(func.count(Message.id)).filter(
        and_(
            or_(
                Message.receiver_id == current_user.id,
                and_(
                    Message.receiver_id.is_(None),
                    Message.worklet_id.in_(
                        db.query(UserWorkletAssociation.worklet_id).filter(
                            UserWorkletAssociation.user_id == current_user.id
                        )
                    )
                )
            ),
            Message.sender_id != current_user.id,
            ~Message.id.in_(
                db.query(MessageRead.message_id).filter(
                    MessageRead.user_id == current_user.id
                )
            )
        )
    ).scalar()
    
    return {"unread_count": unread}
