from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from app.models import User, GroupChatMessage, Worklet, UserWorkletAssociation, GroupMessageReadReceipt, EmailTrigger
from app.core.email_utils import _send_email
from app.core.config import settings
from pydantic import BaseModel
from pathlib import Path
import json
import uuid
import shutil
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

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
    worklet_id: int  # Changed from room_id to be more accurate
    sender_id: int
    sender_name: str
    sender_role: str
    message_text: str
    attachments: Optional[List[dict]] = None
    sent_at: datetime
    is_read: bool
    is_edited: bool = False
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
    attachments: Optional[List[dict]] = None


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


# ============= Helper Functions =============

def calculate_user_unread_count(user_id: int, db: Session) -> int:
    """Calculate unread message count for a specific user"""
    user_worklets = db.query(UserWorkletAssociation.worklet_id).filter(
        UserWorkletAssociation.user_id == user_id
    ).subquery()
    
    group_messages = db.query(GroupChatMessage.message_id).filter(
        and_(
            GroupChatMessage.worklet_id.in_(user_worklets),
            GroupChatMessage.sender_id != user_id,
            GroupChatMessage.is_deleted == False
        )
    ).all()
    
    unread_count = 0
    for msg in group_messages:
        receipt = db.query(GroupMessageReadReceipt).filter(
            and_(
                GroupMessageReadReceipt.message_id == msg.message_id,
                GroupMessageReadReceipt.user_id == user_id
            )
        ).first()
        if not receipt:
            unread_count += 1
    
    return unread_count


async def broadcast_unread_count_to_user(user_id: int, db: Session):
    """Calculate and send unread count to a specific user via WebSocket"""
    unread_count = calculate_user_unread_count(user_id, db)
    message = {
        "type": "unread_count_update",
        "data": {
            "unread_count": unread_count
        }
    }
    await manager.send_personal_message(message, user_id)


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
        
        # Send initial unread count
        await broadcast_unread_count_to_user(user.id, db)
        
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
    """Get messages from a worklet group chat - only past 40 days"""
    # Verify user is a member
    is_member = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.worklet_id == worklet_id,
            UserWorkletAssociation.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this worklet")
    
    # Calculate date 40 days ago
    forty_days_ago = datetime.utcnow() - timedelta(days=40)
    
    messages = db.query(GroupChatMessage).filter(
        GroupChatMessage.worklet_id == worklet_id,
        GroupChatMessage.is_deleted == False,
        GroupChatMessage.sent_at >= forty_days_ago
    ).order_by(desc(GroupChatMessage.sent_at)).offset(skip).limit(limit).all()
    
    # Mark messages as read by current user (create read receipts)
    receipts_created = False
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
                receipts_created = True
    db.commit()
    
    # If any receipts were created, broadcast updated unread count
    if receipts_created:
        await broadcast_unread_count_to_user(current_user.id, db)
    
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
            worklet_id=worklet_id,
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
            sender_role=sender.role if sender else "Unknown",
            message_text=msg.message_text,
            attachments=msg.attachments,
            sent_at=msg.sent_at,
            is_read=is_read_by_all,
            is_edited=msg.is_edited
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
        message_text=message.message_text,
        attachments=message.attachments
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
            "attachments": new_message.attachments,
            "sent_at": new_message.sent_at.isoformat()
        }
    }
    
    # Send to all members including sender
    for member in members:
        await manager.send_personal_message(group_message_data, member.user_id)
    
    # Broadcast unread count updates to all worklet members (except sender)
    for member in members:
        if member.user_id != current_user.id:
            await broadcast_unread_count_to_user(member.user_id, db)
    
    return MessageResponse(
        message_id=new_message.message_id,
        worklet_id=message.worklet_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        sender_role=current_user.role,
        message_text=new_message.message_text,
        attachments=new_message.attachments,
        sent_at=new_message.sent_at,
        is_read=True,
        is_edited=False
    )


# ============= Message Actions =============

@router.put("/messages/{message_id}")
async def edit_message(
    message_id: int,
    message_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit a message - only sender can edit their own message"""
    message = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
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
    
    # Notify via websocket - group message only
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
    message = db.query(GroupChatMessage).filter(GroupChatMessage.message_id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only sender can delete their own message
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    
    # Check if message is within 20 minutes of being sent
    time_since_sent = datetime.utcnow() - message.sent_at
    if time_since_sent.total_seconds() > 1200:  # 20 minutes = 1200 seconds
        raise HTTPException(status_code=403, detail="Messages can only be deleted within 20 minutes of sending")
    
    # Hard delete - remove from database
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


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread message count (group messages only)"""
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
    
    unread_count = 0
    for msg in group_messages:
        receipt = db.query(GroupMessageReadReceipt).filter(
            and_(
                GroupMessageReadReceipt.message_id == msg.message_id,
                GroupMessageReadReceipt.user_id == current_user.id
            )
        ).first()
        if not receipt:
            unread_count += 1
    
    return {"unread_count": unread_count}


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


# ============= Email Notification Endpoint =============

def send_single_email(member: dict, email_html: str, email_subject: str, plain_text_body: str) -> dict:
    """
    Send a single email and return the result.
    Used for concurrent email sending.
    """
    try:
        _send_email(
            to_email=member['email'],
            subject=email_subject,
            body_html=email_html,
            body_plain=plain_text_body
        )
        logger.info(f"✅ Email sent to {member['email']}")
        return {"success": True, "email": member['email']}
    except Exception as e:
        logger.error(f"❌ Failed to send email to {member['email']}: {str(e)}")
        return {"success": False, "email": member['email'], "error": str(e)}


def send_notification_emails_background(
    member_emails: List[dict],
    email_html: str,
    email_subject: str,
    plain_text_body: str
):
    """
    Background task to send notification emails to all worklet members.
    Uses ThreadPoolExecutor to send emails concurrently (10 at a time).
    This runs asynchronously so the API doesn't timeout.
    """
    emails_sent = 0
    emails_failed = 0
    failed_recipients = []
    
    try:
        logger.info(f"📧 [Background] Sending notification emails to {len(member_emails)} members concurrently...")
        
        # Use ThreadPoolExecutor to send emails concurrently
        # Max 10 workers to avoid overwhelming the SMTP server
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all email tasks
            future_to_member = {
                executor.submit(send_single_email, member, email_html, email_subject, plain_text_body): member
                for member in member_emails
            }
            
            # Process results as they complete
            for future in as_completed(future_to_member):
                result = future.result()
                if result['success']:
                    emails_sent += 1
                else:
                    emails_failed += 1
                    failed_recipients.append(result['email'])
        
        logger.info(f"✅ [Background] Email notifications complete: {emails_sent} sent, {emails_failed} failed")
        if failed_recipients:
            logger.warning(f"⚠️ Failed recipients: {', '.join(failed_recipients)}")
        
    except Exception as e:
        logger.error(f"❌ [Background] Error in send_notification_emails_background: {str(e)}")


@router.post("/groups/{worklet_id}/send-notification-email")
async def send_notification_email(
    worklet_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a notification email to all worklet members.
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
    
    # Check if this user already sent email today for this worklet
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_trigger = db.query(EmailTrigger).filter(
        EmailTrigger.worklet_id == worklet_id,
        EmailTrigger.user_id == current_user.id,
        EmailTrigger.sent_at >= today_start
    ).first()
    
    if existing_trigger:
        raise HTTPException(status_code=400, detail="You have already sent an email notification for this worklet today")
    
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
    sender_name = current_user.name
    
    # Create professional notification email
    email_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1a1f29; margin: 0; padding: 0; background: #f5f7fb; }}
            .container {{ max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 32px 24px; text-align: center; }}
            .header h2 {{ margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.3px; }}
            .content {{ padding: 32px 28px; }}
            .notification-box {{ background: linear-gradient(135deg, #EEF2FF, #F3E8FF); border-left: 4px solid #4F46E5; padding: 20px; margin: 24px 0; border-radius: 8px; }}
            .notification-box p {{ margin: 0; }}
            .notification-title {{ font-size: 16px; font-weight: 600; color: #4F46E5; margin-bottom: 12px; }}
            .notification-details {{ font-size: 14px; color: #475569; line-height: 1.8; }}
            .action-section {{ text-align: center; margin: 32px 0; }}
            .action-button {{ display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }}
            .footer {{ background: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }}
            .security-note {{ font-size: 13px; color: #64748B; background: #F1F5F9; padding: 14px; border-radius: 6px; margin-top: 20px; border-left: 3px solid #94A3B8; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📩 PRISM Worklet Notification</h2>
            </div>
            <div class="content">
                <p style="font-size: 15px; margin-bottom: 20px;">Dear Team Member,</p>
                <div class="notification-box">
                    <div class="notification-title">You have new messages in your worklet</div>
                    <div class="notification-details">
                        <strong>From:</strong> {sender_name} ({sender_role})<br>
                        <strong>Worklet:</strong> {worklet.title}
                    </div>
                </div>
                <p style="font-size: 15px; line-height: 1.7; color: #334155;">
                    Important updates have been shared in your worklet chat. Please log in to the PRISM platform to view and respond to these messages at your earliest convenience.
                </p>
                <div class="action-section">
                    <a href="#" class="action-button">View Messages on PRISM</a>
                </div>
                <div class="security-note">
                    <strong>Security Notice:</strong> For your privacy and security, message content is not included in email notifications. Please access the PRISM platform directly to view all details.
                </div>
            </div>
            <div class="footer">
                <p style="margin: 5px 0; font-weight: 600; color: #475569;">Samsung PRISM Worklet Platform</p>
                <p style="margin: 5px 0;">This is an automated notification. Please do not reply to this email.</p>
                <p style="margin: 10px 0 5px; font-size: 11px;">© 2026 Samsung PRISM. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email_subject = f"PRISM: New Messages in {worklet.title}"
    
    # Plain text version
    plain_text_body = f"""Dear Team Member,

You have new messages in your worklet.

From: {sender_name} ({sender_role})
Worklet: {worklet.title}

Important updates have been shared in your worklet chat. Please log in to the PRISM platform to view and respond to these messages at your earliest convenience.

Security Notice: For your privacy and security, message content is not included in email notifications. Please access the PRISM platform directly to view all details.

---
Samsung PRISM Worklet Platform
This is an automated notification. Please do not reply to this email.
"""
    
    # Record email trigger BEFORE sending emails (for instant response)
    email_trigger = EmailTrigger(
        worklet_id=worklet_id,
        user_id=current_user.id
    )
    db.add(email_trigger)
    db.commit()
    
    # Prepare member data for background task
    member_emails = [{"email": member.email, "name": member.name} for member in members]
    
    # Schedule emails to be sent in background (non-blocking)
    logger.info(f"📧 Scheduling background task to send emails to {len(members)} members...")
    background_tasks.add_task(
        send_notification_emails_background,
        member_emails=member_emails,
        email_html=email_html,
        email_subject=email_subject,
        plain_text_body=plain_text_body
    )
    logger.info("✅ Email notification scheduled. Emails will be sent in background.")
    
    # Return immediately without waiting for emails to be sent
    return {
        "status": "success",
        "message": "Notification emails scheduled successfully",
        "recipients_count": len(members),
        "failed_emails": []  # We can't know failed emails yet since they're sent in background
    }


@router.get("/groups/{worklet_id}/email-status")
async def check_email_notification_status(
    worklet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if email notification can be sent for this worklet today.
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
    
    # Check if this user already sent email today for this worklet
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_trigger = db.query(EmailTrigger).filter(
        EmailTrigger.worklet_id == worklet_id,
        EmailTrigger.user_id == current_user.id,
        EmailTrigger.sent_at >= today_start
    ).first()
    
    return {
        "can_send": existing_trigger is None,
        "email_sent_today": existing_trigger is not None,
        "last_sent": existing_trigger.sent_at if existing_trigger else None
    }


# ============= File Upload Endpoints =============

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file for chat"""
    
    # Validate file type
    allowed_types = settings.ALLOWED_FILE_TYPES.split(",")
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file.content_type}' not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
        )
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = Path(settings.UPLOAD_DIR) / unique_filename
    
    # Create upload directory if it doesn't exist
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "url": f"/api/chat/files/{unique_filename}",
        "content_type": file.content_type,
        "size": file_size
    }


@router.get("/files/{filename}")
async def get_file(
    filename: str
):
    """Serve uploaded files (public access)"""
    
    file_path = Path(settings.UPLOAD_DIR) / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check: ensure file is within upload directory
    try:
        file_path.resolve().relative_to(Path(settings.UPLOAD_DIR).resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Return file with proper headers for download
    return FileResponse(
        file_path,
        media_type='application/octet-stream',
        filename=filename
    )


@router.delete("/cleanup-old-messages")
async def cleanup_old_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete messages older than 40 days from the database"""
    # Only allow admin/system to run cleanup (optional security check)
    # if current_user.role not in ['admin', 'system']:
    #     raise HTTPException(status_code=403, detail="Unauthorized")
    
    forty_days_ago = datetime.utcnow() - timedelta(days=40)
    
    # Delete old messages
    deleted_count = db.query(GroupChatMessage).filter(
        GroupChatMessage.sent_at < forty_days_ago
    ).delete(synchronize_session=False)
    
    # Delete associated read receipts for deleted messages
    db.query(GroupMessageReadReceipt).filter(
        ~GroupMessageReadReceipt.message_id.in_(
            db.query(GroupChatMessage.message_id)
        )
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Deleted {deleted_count} messages older than 40 days",
        "deleted_count": deleted_count
    }
