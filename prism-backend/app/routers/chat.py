from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from app.models import User, ChatRoom, ChatMessage, GroupChat, GroupChatMember, GroupChatMessage, Worklet, UserWorkletAssociation
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
    message_text: str
    sent_at: datetime
    is_read: bool

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    worklet_id: int
    group_name: str


class GroupResponse(BaseModel):
    group_id: int
    worklet_id: int
    group_name: str
    worklet_title: Optional[str] = None
    member_count: Optional[int] = None
    last_message: Optional[str] = None
    last_sender_name: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GroupMessageCreate(BaseModel):
    group_id: int
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
    group_id: int
    group_name: str
    worklet_id: int
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
    
    result = []
    for msg in reversed(messages):
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            message_id=msg.message_id,
            room_id=msg.room_id,
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
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
        message_text=new_message.message_text,
        sent_at=new_message.sent_at,
        is_read=False
    )


# ============= Group Chat Endpoints =============

@router.get("/groups", response_model=List[GroupResponse])
async def get_group_chats(
    worklet_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all group chats for the current user"""
    # Get groups where user is a member
    query = db.query(GroupChat).join(
        GroupChatMember, GroupChat.group_id == GroupChatMember.group_id
    ).filter(GroupChatMember.user_id == current_user.id)
    
    if worklet_id:
        query = query.filter(GroupChat.worklet_id == worklet_id)
    
    groups = query.all()
    
    result = []
    for group in groups:
        # Get worklet info
        worklet = db.query(Worklet).filter(Worklet.id == group.worklet_id).first()
        
        # Get last message
        last_msg = db.query(GroupChatMessage).filter(
            GroupChatMessage.group_id == group.group_id
        ).order_by(desc(GroupChatMessage.sent_at)).first()
        
        # Get member count
        member_count = db.query(GroupChatMember).filter(
            GroupChatMember.group_id == group.group_id
        ).count()
        
        # Get last message sender name
        last_sender_name = None
        if last_msg:
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            last_sender_name = sender.name if sender else "Unknown"
        
        result.append(GroupResponse(
            group_id=group.group_id,
            worklet_id=group.worklet_id,
            group_name=group.group_name,
            worklet_title=worklet.title if worklet else f"Worklet {group.worklet_id}",
            member_count=member_count,
            last_message=last_msg.message_text if last_msg else None,
            last_sender_name=last_sender_name,
            last_message_at=last_msg.sent_at if last_msg else None,
            unread_count=0,
            created_at=group.created_at
        ))
    
    return result


@router.post("/groups", response_model=GroupResponse)
async def create_group_chat(
    group: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group chat for a worklet"""
    # Check if group already exists for this worklet
    existing_group = db.query(GroupChat).filter(
        GroupChat.worklet_id == group.worklet_id
    ).first()
    
    if existing_group:
        worklet = db.query(Worklet).filter(Worklet.id == existing_group.worklet_id).first()
        return GroupResponse(
            group_id=existing_group.group_id,
            worklet_id=existing_group.worklet_id,
            group_name=existing_group.group_name,
            worklet_title=worklet.title if worklet else f"Worklet {existing_group.worklet_id}",
            member_count=db.query(GroupChatMember).filter(
                GroupChatMember.group_id == existing_group.group_id
            ).count(),
            last_message=None,
            last_message_at=None,
            unread_count=0,
            created_at=existing_group.created_at
        )
    
    # Create new group
    new_group = GroupChat(
        worklet_id=group.worklet_id,
        group_name=group.group_name,
        created_by=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Add creator as admin member
    creator_member = GroupChatMember(
        group_id=new_group.group_id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(creator_member)
    db.commit()
    
    worklet = db.query(Worklet).filter(Worklet.id == new_group.worklet_id).first()
    
    return GroupResponse(
        group_id=new_group.group_id,
        worklet_id=new_group.worklet_id,
        group_name=new_group.group_name,
        worklet_title=worklet.title if worklet else f"Worklet {new_group.worklet_id}",
        member_count=1,
        last_message=None,
        last_message_at=None,
        unread_count=0,
        created_at=new_group.created_at
    )


@router.get("/groups/{group_id}/profile", response_model=GroupProfileResponse)
async def get_group_profile(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed group profile with members and worklet info"""
    # Get group
    group = db.query(GroupChat).filter(GroupChat.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Verify user is a member
    is_member = db.query(GroupChatMember).filter(
        and_(
            GroupChatMember.group_id == group_id,
            GroupChatMember.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get worklet details
    worklet = db.query(Worklet).filter(Worklet.id == group.worklet_id).first()
    
    # Get all members with their details
    members_query = db.query(GroupChatMember, User, UserWorkletAssociation).join(
        User, GroupChatMember.user_id == User.id
    ).outerjoin(
        UserWorkletAssociation,
        and_(
            UserWorkletAssociation.user_id == User.id,
            UserWorkletAssociation.worklet_id == group.worklet_id
        )
    ).filter(GroupChatMember.group_id == group_id).all()
    
    members = []
    mentor = None
    
    for member, user, association in members_query:
        role = association.role_in_worklet if association else "Member"
        member_info = GroupMemberInfo(
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=role,
            is_admin=member.is_admin,
            joined_at=member.joined_at
        )
        
        members.append(member_info)
        
        if role == "Mentor" and not mentor:
            mentor = member_info
    
    return GroupProfileResponse(
        group_id=group.group_id,
        group_name=group.group_name,
        worklet_id=group.worklet_id,
        worklet_title=worklet.title if worklet else f"Worklet {group.worklet_id}",
        description=worklet.problem_statement if worklet else None,
        cert_id=worklet.cert_id if worklet else None,
        created_at=group.created_at,
        member_count=len(members),
        members=members,
        mentor=mentor
    )


@router.get("/groups/{group_id}/messages", response_model=List[MessageResponse])
async def get_group_messages(
    group_id: int,
    limit: int = Query(50, le=100),
    skip: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a group chat"""
    # Verify user is a member
    is_member = db.query(GroupChatMember).filter(
        and_(
            GroupChatMember.group_id == group_id,
            GroupChatMember.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    messages = db.query(GroupChatMessage).filter(
        GroupChatMessage.group_id == group_id,
        GroupChatMessage.is_deleted == False
    ).order_by(desc(GroupChatMessage.sent_at)).offset(skip).limit(limit).all()
    
    result = []
    for msg in reversed(messages):
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append(MessageResponse(
            message_id=msg.message_id,
            room_id=group_id,  # Using room_id field for group_id
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
            message_text=msg.message_text,
            sent_at=msg.sent_at,
            is_read=True  # Group messages don't track individual read status
        ))
    
    return result


@router.post("/groups/messages", response_model=MessageResponse)
async def send_group_message(
    message: GroupMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a group chat"""
    # Verify user is a member
    is_member = db.query(GroupChatMember).filter(
        and_(
            GroupChatMember.group_id == message.group_id,
            GroupChatMember.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Create message
    new_message = GroupChatMessage(
        group_id=message.group_id,
        sender_id=current_user.id,
        message_text=message.message_text
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Send via websocket to all group members
    members = db.query(GroupChatMember).filter(
        GroupChatMember.group_id == message.group_id
    ).all()
    
    # Prepare message data
    group_message_data = {
        "type": "new_group_message",
        "data": {
            "group_message_id": new_message.message_id,
            "group_id": message.group_id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "message_text": new_message.message_text,
            "sent_at": new_message.sent_at.isoformat()
        }
    }
    
    # Send to all members including sender
    for member in members:
        await manager.send_personal_message(group_message_data, member.user_id)
    
    return MessageResponse(
        message_id=new_message.message_id,
        room_id=message.group_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
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
    return {"status": "success"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread message count"""
    return {"unread_count": 0}


# ============= Admin/Utility Endpoints =============

@router.post("/admin/create-missing-group-chats")
async def create_missing_group_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create group chats for all worklets that have user associations but no group chat.
    This is useful for migrating existing worklets to the chat system.
    """
    
    # Get all worklets that have at least one user association
    worklets_with_users = db.query(Worklet.id).join(
        UserWorkletAssociation,
        Worklet.id == UserWorkletAssociation.worklet_id
    ).distinct().all()
    
    worklet_ids = [w.id for w in worklets_with_users]
    
    created_groups = []
    updated_groups = []
    errors = []
    
    for worklet_id in worklet_ids:
        try:
            # Check if group already exists
            existing_group = db.query(GroupChat).filter(
                GroupChat.worklet_id == worklet_id
            ).first()
            
            if not existing_group:
                # Get worklet details for group name
                worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
                group_name = worklet.cert_id if worklet and worklet.cert_id else f"Worklet-{worklet_id}"
                
                # Create new group
                new_group = GroupChat(
                    worklet_id=worklet_id,
                    group_name=group_name,
                    created_by=current_user.id
                )
                db.add(new_group)
                db.flush()  # Get the group_id
                
                # Get all users for this worklet
                worklet_users = db.query(UserWorkletAssociation).filter(
                    UserWorkletAssociation.worklet_id == worklet_id
                ).all()
                
                members_added = 0
                for user_assoc in worklet_users:
                    is_admin = user_assoc.role_in_worklet == "Mentor"
                    member = GroupChatMember(
                        group_id=new_group.group_id,
                        user_id=user_assoc.user_id,
                        is_admin=is_admin
                    )
                    db.add(member)
                    members_added += 1
                
                db.commit()
                created_groups.append({
                    "worklet_id": worklet_id,
                    "group_id": new_group.group_id,
                    "members_count": members_added
                })
            else:
                # Group exists, check if all users are members
                existing_members = db.query(GroupChatMember.user_id).filter(
                    GroupChatMember.group_id == existing_group.group_id
                ).all()
                existing_member_ids = {m.user_id for m in existing_members}
                
                worklet_users = db.query(UserWorkletAssociation).filter(
                    UserWorkletAssociation.worklet_id == worklet_id
                ).all()
                
                members_added = 0
                for user_assoc in worklet_users:
                    if user_assoc.user_id not in existing_member_ids:
                        is_admin = user_assoc.role_in_worklet == "Mentor"
                        member = GroupChatMember(
                            group_id=existing_group.group_id,
                            user_id=user_assoc.user_id,
                            is_admin=is_admin
                        )
                        db.add(member)
                        members_added += 1
                
                if members_added > 0:
                    db.commit()
                    updated_groups.append({
                        "worklet_id": worklet_id,
                        "group_id": existing_group.group_id,
                        "new_members_added": members_added
                    })
                    
        except Exception as e:
            db.rollback()
            errors.append({
                "worklet_id": worklet_id,
                "error": str(e)
            })
    
    return {
        "status": "completed",
        "summary": {
            "groups_created": len(created_groups),
            "groups_updated": len(updated_groups),
            "errors": len(errors)
        },
        "created_groups": created_groups,
        "updated_groups": updated_groups,
        "errors": errors
    }
