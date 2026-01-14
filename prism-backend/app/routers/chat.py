from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from app.models import User, ChatRoom, ChatMessage, GroupChatMessage, Worklet, UserWorkletAssociation, GroupMessageReadReceipt, EmailTrigger
from app.core.email_utils import _send_email
from pydantic import BaseModel
import json

router = APIRouter(tags=["chat"])

# Helper function to get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    payload = require_access_token(token)
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============= Pydantic Schemas =============

class MessageResponse(BaseModel):
    message_id: int
    room_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    message_text: str
    sent_at: datetime
    is_read: bool
    is_edited: bool = False
    is_starred: bool = False
    included_in_email: bool = False

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    worklet_id: int


class GroupResponse(BaseModel):
    worklet_id: int
    group_name: str
    worklet_title: Optional[str] = None
    member_count: Optional[int] = None
    last_message: Optional[str] = None
    last_sender_name: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class GroupMessageCreate(BaseModel):
    worklet_id: int
    message_text: str


class GroupMemberInfo(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    is_admin: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class GroupProfileResponse(BaseModel):
    worklet_id: int
    group_name: str
    worklet_title: str
    description: Optional[str] = None
    cert_id: Optional[str] = None
    created_at: datetime
    member_count: int
    members: List[GroupMemberInfo]
    mentor: Optional[GroupMemberInfo] = None

    class Config:
        from_attributes = True


# ============= WebSocket Connection Manager =============

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
                print(f"WebSocket: Message sent to user {user_id}: {message.get('type')}")
            except Exception as e:
                print(f"WebSocket: Failed to send to user {user_id}: {str(e)}")
                self.disconnect(user_id)
        else:
            print(f"WebSocket: User {user_id} not connected, message not sent")


manager = ConnectionManager()


# ============= WebSocket Endpoint =============

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    user_id = None
    try:
        # Validate token and get user
        payload = require_access_token(token)
        user = db.query(User).filter(User.email == payload.get("sub")).first()
        if not user:
            print(f"WebSocket: User not found for token")
            await websocket.close(code=4001)
            return

        user_id = user.id
        print(f"WebSocket: User {user.name} (ID: {user.id}) connecting...")
        await manager.connect(user.id, websocket)
        print(f"WebSocket: User {user.name} (ID: {user.id}) connected successfully")
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle ping/pong
                if message_data.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    
        except WebSocketDisconnect:
            print(f"WebSocket: User {user.name} (ID: {user.id}) disconnected")
            manager.disconnect(user.id)
            
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {str(e)}")
        if user_id:
            manager.disconnect(user_id)
        try:
            await websocket.close()
        except:
            pass


# ============= Group Chat Endpoints =============

@router.get("/groups", response_model=List[GroupResponse])
async def get_group_chats(
    worklet_id: Optional[int] = Query(None),
    status_id: int = Query(1, description="Filter by worklet status (1=Ongoing by default)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all worklet group chats for the current user, filtered by worklet status"""
    # Get worklets where user is a member, with status filtering
    query = db.query(Worklet).join(
        UserWorkletAssociation,
        Worklet.id == UserWorkletAssociation.worklet_id
    ).filter(
        UserWorkletAssociation.user_id == current_user.id,
        Worklet.status_id == status_id
    )
    
    if worklet_id:
        query = query.filter(Worklet.id == worklet_id)
    
    worklets = query.all()
    
    result = []
    for worklet in worklets:
        # Get last message for this worklet
        last_msg = db.query(GroupChatMessage).filter(
            GroupChatMessage.worklet_id == worklet.id
        ).order_by(desc(GroupChatMessage.sent_at)).first()
        
        # Get member count from user_worklet_association
        member_count = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == worklet.id
        ).count()
        
        # Get last message sender name
        last_sender_name = None
        if last_msg:
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            last_sender_name = sender.name if sender else "Unknown"
        
        # Use cert_id as group name, fallback to formatted name
        group_name = worklet.cert_id if worklet.cert_id else f"CertID(NULL)-{worklet.id}"
        
        # Calculate unread count: messages not sent by current user without their read receipt
        unread_count = db.query(GroupChatMessage).filter(
            GroupChatMessage.worklet_id == worklet.id,
            GroupChatMessage.sender_id != current_user.id,
            ~GroupChatMessage.message_id.in_(
                db.query(GroupMessageReadReceipt.message_id).filter(
                    GroupMessageReadReceipt.user_id == current_user.id
                )
            )
        ).count()
        
        result.append(GroupResponse(
            worklet_id=worklet.id,
            group_name=group_name,
            worklet_title=worklet.title,
            member_count=member_count,
            last_message=last_msg.message_text if last_msg else None,
            last_sender_name=last_sender_name,
            last_message_at=last_msg.sent_at if last_msg else None,
            unread_count=unread_count
        ))
    
    return result


@router.post("/groups", response_model=GroupResponse)
async def create_group_chat(
    group: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get or confirm group chat for a worklet (groups are implicit via worklet membership)"""
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == group.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Verify user is a member of this worklet
    is_member = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.worklet_id == group.worklet_id,
            UserWorkletAssociation.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this worklet")
    
    # Get member count
    member_count = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == group.worklet_id
    ).count()
    
    # Get last message
    last_msg = db.query(GroupChatMessage).filter(
        GroupChatMessage.worklet_id == group.worklet_id
    ).order_by(desc(GroupChatMessage.sent_at)).first()
    
    last_sender_name = None
    if last_msg:
        sender = db.query(User).filter(User.id == last_msg.sender_id).first()
        last_sender_name = sender.name if sender else "Unknown"
    
    group_name = worklet.cert_id if worklet.cert_id else f"CertID(NULL)-{worklet.id}"
    
    return GroupResponse(
        worklet_id=worklet.id,
        group_name=group_name,
        worklet_title=worklet.title,
        member_count=member_count,
        last_message=last_msg.message_text if last_msg else None,
        last_sender_name=last_sender_name,
        last_message_at=last_msg.sent_at if last_msg else None,
        unread_count=0
    )


@router.get("/groups/{worklet_id}/profile", response_model=GroupProfileResponse)
async def get_group_profile(
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed group profile with members and worklet info"""
    # Get worklet
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Verify user is a member
    is_member = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.worklet_id == worklet_id,
            UserWorkletAssociation.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this worklet")
    
    # Get all members with their details
    members_query = db.query(User, UserWorkletAssociation).join(
        UserWorkletAssociation,
        User.id == UserWorkletAssociation.user_id
    ).filter(UserWorkletAssociation.worklet_id == worklet_id).all()
    
    members = []
    mentor = None
    
    for user, association in members_query:
        role = association.role_in_worklet
        # Use joined_at from association or a default
        from datetime import datetime
        member_info = GroupMemberInfo(
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=role,
            is_admin=(role == "Mentor"),
            joined_at=association.created_at if hasattr(association, 'created_at') else datetime.now()
        )
        
        members.append(member_info)
        
        if role == "Mentor" and not mentor:
            mentor = member_info
    
    group_name = worklet.cert_id if worklet.cert_id else f"CertID(NULL)-{worklet.id}"
    
    return GroupProfileResponse(
        worklet_id=worklet.id,
        group_name=group_name,
        worklet_title=worklet.title,
        description=worklet.problem_statement,
        cert_id=worklet.cert_id,
        created_at=worklet.created_on,
        member_count=len(members),
        members=members,
        mentor=mentor
    )


@router.get("/groups/{worklet_id}/messages", response_model=List[MessageResponse])
async def get_group_messages(
    worklet_id: int,
    limit: int = Query(50, le=100),
    skip: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a worklet group chat"""
    # Verify user is a member
    is_member = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.worklet_id == worklet_id,
            UserWorkletAssociation.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this worklet")
    
    messages = db.query(GroupChatMessage).filter(
        GroupChatMessage.worklet_id == worklet_id,
        GroupChatMessage.is_deleted == False
    ).order_by(desc(GroupChatMessage.sent_at)).offset(skip).limit(limit).all()
    
    # Mark messages as read by current user (create read receipts)
    for msg in messages:
        if msg.sender_id != current_user.id:
            # Check if receipt already exists
            existing_receipt = db.query(GroupMessageReadReceipt).filter(
                and_(
                    GroupMessageReadReceipt.message_id == msg.message_id,
                    GroupMessageReadReceipt.user_id == current_user.id
                )
            ).first()
            
            if not existing_receipt:
                receipt = GroupMessageReadReceipt(
                    message_id=msg.message_id,
                    user_id=current_user.id
                )
                db.add(receipt)
    db.commit()
    
    # Get total members count (excluding sender)
    total_members = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == worklet_id
    ).count()
    
    result = []
    for msg in reversed(messages):
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        # Calculate is_read_by_all: check if all members (except sender) have read receipts
        read_count = db.query(GroupMessageReadReceipt).filter(
            GroupMessageReadReceipt.message_id == msg.message_id
        ).count()
        
        # Message is read by all if read_count equals total_members - 1 (excluding sender)
        is_read_by_all = read_count >= (total_members - 1) if total_members > 1 else True
        
        result.append(MessageResponse(
            message_id=msg.message_id,
            room_id=worklet_id,  # Using room_id field for worklet_id
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
            sender_role=sender.role if sender else "Unknown",
            message_text=msg.message_text,
            sent_at=msg.sent_at,
            is_read=is_read_by_all,
            is_edited=msg.is_edited,
            is_starred=msg.is_starred
        ))
    
    return result


@router.post("/groups/messages", response_model=MessageResponse)
async def send_group_message(
    message: GroupMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a worklet group chat"""
    # Verify user is a member
    is_member = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.worklet_id == message.worklet_id,
            UserWorkletAssociation.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this worklet")
    
    # Create message
    new_message = GroupChatMessage(
        worklet_id=message.worklet_id,
        sender_id=current_user.id,
        message_text=message.message_text
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Send via websocket to all worklet members
    members = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == message.worklet_id
    ).all()
    
    # Prepare message data
    group_message_data = {
        "type": "new_group_message",
        "data": {
            "group_message_id": new_message.message_id,
            "worklet_id": message.worklet_id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "sender_role": current_user.role,
            "message_text": new_message.message_text,
            "sent_at": new_message.sent_at.isoformat()
        }
    }
    
    # Send to all members including sender
    for member in members:
        await manager.send_personal_message(group_message_data, member.user_id)
    
    return MessageResponse(
        message_id=new_message.message_id,
        room_id=message.worklet_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        message_text=new_message.message_text,
        sent_at=new_message.sent_at,
        is_read=True,
        is_edited=False,
        is_starred=False
    )


# ============= Message Actions =============

@router.patch("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a message as read"""
    message = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only mark as read if user is the receiver
    if message.sender_id == current_user.id:
        return {"status": "success", "message": "Cannot mark own message as read"}
    
    message.is_read = True
    db.commit()
    return {"status": "success"}


@router.put("/messages/{message_id}")
async def edit_message(
    message_id: int,
    message_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit a message - only sender can edit their own message"""
    # Check if it's a direct chat message or group chat message
    direct_message = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
    group_message = None
    
    if not direct_message:
        group_message = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == message_id).first()
    
    if not direct_message and not group_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = direct_message if direct_message else group_message
    
    # Only sender can edit their own message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    
    # Check if message is within 20 minutes of being sent
    time_since_sent = datetime.utcnow() - message.sent_at
    if time_since_sent.total_seconds() > 1200:  # 20 minutes = 1200 seconds
        raise HTTPException(status_code=403, detail="Messages can only be edited within 20 minutes of sending")
    
    # Update message text and mark as edited
    new_text = message_data.get("message_text", "").strip()
    if not new_text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")
    
    message.message_text = new_text
    message.is_edited = True
    db.commit()
    db.refresh(message)
    
    # Notify via websocket
    if direct_message:
        room = db.query(ChatRoom).filter(ChatRoom.room_id == message.room_id).first()
        other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
        
        edit_notification = {
            "type": "message_edited",
            "data": {
                "message_id": message.message_id,
                "room_id": message.room_id,
                "message_text": message.message_text,
                "is_edited": True
            }
        }
        await manager.send_personal_message(edit_notification, other_user_id)
        await manager.send_personal_message(edit_notification, current_user.id)
    else:
        # Group message
        members = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == message.worklet_id
        ).all()
        
        edit_notification = {
            "type": "group_message_edited",
            "data": {
                "message_id": message.message_id,
                "worklet_id": message.worklet_id,
                "message_text": message.message_text,
                "is_edited": True
            }
        }
        
        for member in members:
            await manager.send_personal_message(edit_notification, member.user_id)
    
    return {"status": "success", "message": "Message edited successfully"}


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message - only sender can delete their own message (hard delete)"""
    # Check if it's a direct chat message or group chat message
    direct_message = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
    group_message = None
    
    if not direct_message:
        group_message = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == message_id).first()
    
    if not direct_message and not group_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = direct_message if direct_message else group_message
    
    # Only sender can delete their own message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    
    # Check if message is within 20 minutes of being sent
    time_since_sent = datetime.utcnow() - message.sent_at
    if time_since_sent.total_seconds() > 1200:  # 20 minutes = 1200 seconds
        raise HTTPException(status_code=403, detail="Messages can only be deleted within 20 minutes of sending")
    
    # Hard delete - remove from database
    if direct_message:
        room = db.query(ChatRoom).filter(ChatRoom.room_id == message.room_id).first()
        other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
        
        db.delete(message)
        db.commit()
        
        delete_notification = {
            "type": "message_deleted",
            "data": {
                "message_id": message_id,
                "room_id": message.room_id
            }
        }
        await manager.send_personal_message(delete_notification, other_user_id)
        await manager.send_personal_message(delete_notification, current_user.id)
    else:
        # Group message
        worklet_id = message.worklet_id
        members = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == worklet_id
        ).all()
        
        db.delete(message)
        db.commit()
        
        delete_notification = {
            "type": "group_message_deleted",
            "data": {
                "message_id": message_id,
                "worklet_id": worklet_id
            }
        }
        
        for member in members:
            await manager.send_personal_message(delete_notification, member.user_id)
    
    return {"status": "success", "message": "Message deleted successfully"}


@router.patch("/messages/{message_id}/star")
async def toggle_star_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle star status on a message - only sender can star their own message"""
    # Check if it's a direct chat message or group chat message
    direct_message = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
    group_message = None
    
    if not direct_message:
        group_message = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == message_id).first()
    
    if not direct_message and not group_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = direct_message if direct_message else group_message
    
    # Only sender can star their own message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only star your own messages")
    
    # Check if message is within 20 minutes of being sent
    time_since_sent = datetime.utcnow() - message.sent_at
    if time_since_sent.total_seconds() > 1200:  # 20 minutes = 1200 seconds
        raise HTTPException(status_code=403, detail="Messages can only be starred within 20 minutes of sending")
    
    # Toggle star status
    message.is_starred = not message.is_starred
    
    # Set starred_at timestamp when starring, clear it when unstarring
    if message.is_starred:
        message.starred_at = datetime.utcnow()
    else:
        message.starred_at = None
    
    db.commit()
    
    # Notify via websocket
    if direct_message:
        room = db.query(ChatRoom).filter(ChatRoom.room_id == message.room_id).first()
        other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
        
        star_notification = {
            "type": "message_starred",
            "data": {
                "message_id": message.message_id,
                "room_id": message.room_id,
                "is_starred": message.is_starred
            }
        }
        await manager.send_personal_message(star_notification, other_user_id)
        await manager.send_personal_message(star_notification, current_user.id)
    else:
        # Group message
        members = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == message.worklet_id
        ).all()
        
        star_notification = {
            "type": "group_message_starred",
            "data": {
                "message_id": message.message_id,
                "worklet_id": message.worklet_id,
                "is_starred": message.is_starred
            }
        }
        
        for member in members:
            await manager.send_personal_message(star_notification, member.user_id)
    
    return {"status": "success", "is_starred": message.is_starred}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread message count"""
    # Count unread messages in direct chats
    direct_unread = db.query(ChatMessage).filter(
        and_(
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False,
            ChatMessage.room_id.in_(
                db.query(ChatRoom.room_id).filter(
                    or_(
                        ChatRoom.user1_id == current_user.id,
                        ChatRoom.user2_id == current_user.id
                    )
                )
            )
        )
    ).count()
    
    # Count unread group messages
    user_worklets = db.query(UserWorkletAssociation.worklet_id).filter(
        UserWorkletAssociation.user_id == current_user.id
    ).subquery()
    
    group_messages = db.query(GroupChatMessage.message_id).filter(
        and_(
            GroupChatMessage.worklet_id.in_(user_worklets),
            GroupChatMessage.sender_id != current_user.id
        )
    ).all()
    
    group_unread = 0
    for msg in group_messages:
        receipt = db.query(GroupMessageReadReceipt).filter(
            and_(
                GroupMessageReadReceipt.message_id == msg.message_id,
                GroupMessageReadReceipt.user_id == current_user.id
            )
        ).first()
        if not receipt:
            group_unread += 1
    
    total_unread = direct_unread + group_unread
    return {"unread_count": total_unread}


# ============= Admin/Utility Endpoints =============

@router.post("/admin/create-missing-group-chats")
async def create_missing_group_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    This endpoint is deprecated - groups are now implicit via worklet membership.
    All worklets with user_worklet_association automatically have group chat capability.
    """
    # Count worklets with users
    worklet_count = db.query(Worklet.id).join(
        UserWorkletAssociation,
        Worklet.id == UserWorkletAssociation.worklet_id
    ).distinct().count()
    
    return {
        "status": "success",
        "message": "Group chats are now implicit via worklet membership - no action needed",
        "worklets_with_chat": worklet_count
    }


# ============= Email Trigger Endpoint =============

@router.post("/groups/{worklet_id}/send-starred-email")
async def send_starred_messages_email(
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send an email to all worklet members with starred messages from the last 5 minutes.
    Only one email can be sent per worklet per day.
    """
    # Check if worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Check if user is a member of this worklet
    is_member = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == worklet_id,
        UserWorkletAssociation.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this worklet")
    
    # Check if email already sent today for this worklet
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_trigger = db.query(EmailTrigger).filter(
        EmailTrigger.worklet_id == worklet_id,
        EmailTrigger.sent_at >= today_start
    ).first()
    
    if existing_trigger:
        raise HTTPException(status_code=400, detail="Email has already been sent for this worklet today")
    
    # Get starred messages from the last 5 minutes (based on when they were starred)
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    starred_messages = db.query(GroupChatMessage).filter(
        GroupChatMessage.worklet_id == worklet_id,
        GroupChatMessage.is_starred == True,
        GroupChatMessage.starred_at != None,
        GroupChatMessage.starred_at >= five_minutes_ago,
        GroupChatMessage.included_in_email == False
    ).order_by(GroupChatMessage.sent_at.asc()).all()
    
    if not starred_messages:
        raise HTTPException(status_code=400, detail="No starred messages found in the last 5 minutes")
    
    # Get all worklet members except the sender
    members = db.query(User).join(
        UserWorkletAssociation,
        User.id == UserWorkletAssociation.user_id
    ).filter(
        UserWorkletAssociation.worklet_id == worklet_id,
        User.id != current_user.id
    ).all()
    
    if not members:
        raise HTTPException(status_code=400, detail="No other members to send email to")
    
    # Build email content
    sender_role = current_user.role.capitalize() if current_user.role else "Member"
    
    # Prepare message content with character limit
    messages_html = ""
    total_chars = 0
    max_email_chars = 2000  # Reserve space for header/footer
    included_message_ids = []
    
    for msg in starred_messages:
        # Get sender details
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        sender_name = sender.name if sender else "Unknown"
        
        # Truncate long messages
        message_preview = msg.message_text
        if len(message_preview) > 150:
            message_preview = message_preview[:150] + "..."
        
        # Format timestamp
        time_str = msg.sent_at.strftime("%b %d, %I:%M %p")
        
        # Build message HTML
        msg_html = f"""
        <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #4F46E5;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                <strong>{sender_name}</strong> · {time_str}
            </div>
            <div style="color: #333;">{message_preview}</div>
        </div>
        """
        
        # Check if adding this message would exceed limit
        if total_chars + len(msg_html) > max_email_chars:
            break
        
        messages_html += msg_html
        total_chars += len(msg_html)
        included_message_ids.append(msg.message_id)
    
    # Create email body
    email_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: white; padding: 20px; border: 1px solid #ddd; }}
            .footer {{ background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 0;">📩 Starred Messages from {worklet.title}</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have starred messages from a <strong>{sender_role}</strong> in the worklet <strong>{worklet.title}</strong>:</p>
                <div style="margin: 20px 0;">
                    {messages_html}
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    {len(included_message_ids)} message(s) included · Last 5 minutes
                </p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">PRISM Worklet Platform</p>
                <p style="margin: 5px 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email_subject = f"Starred Messages from {sender_role} - {worklet.title}"
    
    # Send emails to all members
    failed_emails = []
    for member in members:
        try:
            _send_email(
                to_email=member.email,
                subject=email_subject,
                body_html=email_html,
                body_plain=f"You have starred messages from {sender_role} in {worklet.title}. Please check the worklet chat for details."
            )
        except Exception as e:
            failed_emails.append(member.email)
            print(f"Failed to send email to {member.email}: {str(e)}")
    
    # Mark messages as included in email
    for msg_id in included_message_ids:
        msg = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == msg_id).first()
        if msg:
            msg.included_in_email = True
    
    # Record email trigger
    email_trigger = EmailTrigger(
        worklet_id=worklet_id,
        user_id=current_user.id
    )
    db.add(email_trigger)
    db.commit()
    
    return {
        "status": "success",
        "message": "Email sent successfully",
        "recipients_count": len(members) - len(failed_emails),
        "messages_included": len(included_message_ids),
        "failed_emails": failed_emails
    }


@router.get("/groups/{worklet_id}/email-status")
async def check_email_status(
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if email can be sent for this worklet today.
    """
    # Check if email already sent today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_trigger = db.query(EmailTrigger).filter(
        EmailTrigger.worklet_id == worklet_id,
        EmailTrigger.sent_at >= today_start
    ).first()
    
    # Count starred messages from last 5 minutes (based on when they were starred)
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    starred_count = db.query(GroupChatMessage).filter(
        GroupChatMessage.worklet_id == worklet_id,
        GroupChatMessage.is_starred == True,
        GroupChatMessage.starred_at != None,
        GroupChatMessage.starred_at >= five_minutes_ago,
        GroupChatMessage.included_in_email == False
    ).count()
    
    return {
        "can_send": existing_trigger is None,
        "email_sent_today": existing_trigger is not None,
        "starred_messages_available": starred_count,
        "last_sent": existing_trigger.sent_at if existing_trigger else None
    }
