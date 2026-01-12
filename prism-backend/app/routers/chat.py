from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from app.models import User, ChatRoom, ChatMessage, GroupChatMessage, Worklet, UserWorkletAssociation, GroupMessageReadReceipt
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

class ChatRoomResponse(BaseModel):
    room_id: int
    worklet_id: Optional[int]
    other_user_id: int
    other_user_name: str
    worklet_title: Optional[str]
    last_message: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    room_id: int
    message_text: str


class MessageResponse(BaseModel):
    message_id: int
    room_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    message_text: str
    sent_at: datetime
    is_read: bool

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


# ============= Chat Room Endpoints =============

@router.get("/rooms", response_model=List[ChatRoomResponse])
async def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat rooms for the current user"""
    rooms = db.query(ChatRoom).filter(
        or_(
            ChatRoom.user1_id == current_user.id,
            ChatRoom.user2_id == current_user.id
        )
    ).all()
    
    result = []
    for room in rooms:
        # Determine the other user
        other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        # Get last message
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.room_id == room.room_id
        ).order_by(desc(ChatMessage.sent_at)).first()
        
        # Count unread messages
        unread_count = db.query(ChatMessage).filter(
            and_(
                ChatMessage.room_id == room.room_id,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.is_read == False
            )
        ).count()
        
        result.append(ChatRoomResponse(
            room_id=room.room_id,
            worklet_id=room.worklet_id,
            other_user_id=other_user_id,
            other_user_name=other_user.name if other_user else "Unknown",
            worklet_title=f"Worklet {room.worklet_id}" if room.worklet_id else "General",
            last_message=last_msg.message_text if last_msg else None,
            last_message_at=last_msg.sent_at if last_msg else None,
            unread_count=unread_count
        ))
    
    return result


@router.post("/rooms")
async def create_or_get_chat_room(
    worklet_id: int = Query(...),
    other_user_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or get existing chat room between two users"""
    # Check if room already exists
    existing_room = db.query(ChatRoom).filter(
        or_(
            and_(ChatRoom.user1_id == current_user.id, ChatRoom.user2_id == other_user_id),
            and_(ChatRoom.user1_id == other_user_id, ChatRoom.user2_id == current_user.id)
        )
    ).first()
    
    if existing_room:
        return {"room_id": existing_room.room_id, "message": "Existing room found"}
    
    # Create new room
    new_room = ChatRoom(
        worklet_id=worklet_id,
        user1_id=current_user.id,
        user2_id=other_user_id
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    return {"room_id": new_room.room_id, "message": "New room created"}


@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    room_id: int,
    limit: int = Query(50, le=100),
    skip: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a chat room"""
    # Verify user has access to this room
    room = db.query(ChatRoom).filter(ChatRoom.room_id == room_id).first()
    if not room or (room.user1_id != current_user.id and room.user2_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.room_id == room_id,
        ChatMessage.is_deleted == False
    ).order_by(desc(ChatMessage.sent_at)).offset(skip).limit(limit).all()
    
    # Mark unread messages from other user as read
    db.query(ChatMessage).filter(
        and_(
            ChatMessage.room_id == room_id,
            ChatMessage.sender_id != current_user.id,
            ChatMessage.is_read == False
        )
    ).update({"is_read": True})
    db.commit()
    
    result = []
    for msg in reversed(messages):
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            message_id=msg.message_id,
            room_id=msg.room_id,
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
            sender_role=sender.role if sender else "Unknown",
            message_text=msg.message_text,
            sent_at=msg.sent_at,
            is_read=msg.is_read
        ))
    
    return result


@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a chat room"""
    # Verify user has access to this room
    room = db.query(ChatRoom).filter(ChatRoom.room_id == message.room_id).first()
    if not room or (room.user1_id != current_user.id and room.user2_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create message
    new_message = ChatMessage(
        room_id=message.room_id,
        sender_id=current_user.id,
        message_text=message.message_text
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Prepare message data
    message_data = {
        "type": "new_message",
        "data": {
            "message_id": new_message.message_id,
            "room_id": new_message.room_id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "sender_role": current_user.role,
            "message_text": new_message.message_text,
            "sent_at": new_message.sent_at.isoformat(),
            "is_read": False
        }
    }
    
    # Send via websocket to other user
    other_user_id = room.user2_id if room.user1_id == current_user.id else room.user1_id
    await manager.send_personal_message(message_data, other_user_id)
    
    # Also send to sender for confirmation (helps with multi-device scenarios)
    await manager.send_personal_message(message_data, current_user.id)
    
    return MessageResponse(
        message_id=new_message.message_id,
        room_id=new_message.room_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        message_text=new_message.message_text,
        sent_at=new_message.sent_at,
        is_read=False
    )


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
            is_read=is_read_by_all
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
        is_read=True
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