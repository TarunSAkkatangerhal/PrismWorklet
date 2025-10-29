from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.models import Meeting, MeetingWorkletAssociation, MeetingRecurrence, Worklet, User, UserWorkletAssociation, College
from app.schemas import MeetingCreate, MeetingUpdate, MeetingReschedule, MeetingOut, WorkletScheduleOut
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from typing import List, Optional
from datetime import datetime, timedelta, date
from app.core.email_utils import send_meeting_notification
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user from token"""
    payload = require_access_token(token)
    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


def calculate_meeting_status(start_datetime: datetime, duration_minutes: int) -> str:
    """Calculate meeting status based on current time"""
    now = datetime.now()
    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
    
    if now < start_datetime:
        return "upcoming"
    elif start_datetime <= now <= end_datetime:
        return "live"
    else:
        return "completed"


def get_worklet_participants(db: Session, worklet_id: int) -> List[User]:
    """Get all participants (students, professors, mentors) for a worklet"""
    associations = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == worklet_id
    ).all()
    
    user_ids = [assoc.user_id for assoc in associations]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    return users


def check_mentor_owns_worklets(db: Session, mentor_id: int, worklet_ids: List[int]) -> bool:
    """Check if mentor is assigned to all specified worklets"""
    for worklet_id in worklet_ids:
        association = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.user_id == mentor_id,
            UserWorkletAssociation.worklet_id == worklet_id,
            UserWorkletAssociation.role_in_worklet == "Mentor"
        ).first()
        
        if not association:
            return False
    
    return True


@router.post("/", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new meeting with multiple worklets.
    Each worklet gets scheduled sequentially with the specified duration.
    Only mentors can create meetings for their assigned worklets.
    """
    # Verify user is a mentor
    if current_user.role != "Mentor":
        raise HTTPException(
            status_code=403,
            detail="Only mentors can create meetings"
        )
    
    # Verify mentor is assigned to all specified worklets
    if not check_mentor_owns_worklets(db, current_user.id, meeting_data.worklet_ids):
        raise HTTPException(
            status_code=403,
            detail="You can only create meetings for worklets you are assigned to"
        )
    
    # Verify all worklets exist and are not completed
    worklets = db.query(Worklet).filter(Worklet.id.in_(meeting_data.worklet_ids)).all()
    if len(worklets) != len(meeting_data.worklet_ids):
        raise HTTPException(status_code=404, detail="One or more worklets not found")
    
    for worklet in worklets:
        if worklet.status_id == 2:  # Status 2 = Completed
            raise HTTPException(
                status_code=400,
                detail=f"Cannot schedule meeting for completed worklet: {worklet.title}"
            )
    
    # Validate recurring meeting fields
    if meeting_data.repeat_days and not meeting_data.repeat_until:
        raise HTTPException(
            status_code=400,
            detail="repeat_until is required when repeat_days is specified"
        )
    
    if meeting_data.repeat_until and meeting_data.repeat_until <= meeting_data.start_datetime.date():
        raise HTTPException(
            status_code=400,
            detail="repeat_until must be after the meeting start date"
        )
    
    # Create meeting
    new_meeting = Meeting(
        title=meeting_data.title,
        description=meeting_data.description,
        college_id=meeting_data.college_id,
        organizer_id=current_user.id,
        start_datetime=meeting_data.start_datetime,
        duration_minutes=meeting_data.duration_minutes,
        meeting_link=meeting_data.meeting_link,
        status="upcoming",
        repeat_days=meeting_data.repeat_days,
        repeat_until=meeting_data.repeat_until
    )
    
    db.add(new_meeting)
    db.flush()  # Get meeting_id without committing
    
    # Create worklet associations with sequential scheduling
    current_start_time = meeting_data.start_datetime
    all_participants = set()
    
    for worklet_id in meeting_data.worklet_ids:
        association = MeetingWorkletAssociation(
            meeting_id=new_meeting.meeting_id,
            worklet_id=worklet_id,
            scheduled_datetime=current_start_time
        )
        db.add(association)
        
        # Collect participants for email notification
        participants = get_worklet_participants(db, worklet_id)
        all_participants.update([p.id for p in participants])
        
        # Increment time for next worklet
        current_start_time += timedelta(minutes=meeting_data.duration_minutes)
    
    db.commit()
    db.refresh(new_meeting)
    
    # Send email notifications to all participants (async/background task in production)
    try:
        for user_id in all_participants:
            if user_id != current_user.id:  # Don't notify organizer
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    send_meeting_notification(
                        recipient_email=user.email,
                        recipient_name=user.name,
                        meeting_title=new_meeting.title,
                        meeting_datetime=new_meeting.start_datetime,
                        meeting_link=new_meeting.meeting_link,
                        organizer_name=current_user.name,
                        notification_type="created"
                    )
        
        db.commit()
    except Exception as e:
        logger.error(f"Failed to send meeting notifications: {str(e)}")
        # Don't fail the meeting creation if email fails
    
    # Fetch complete meeting data for response
    return get_meeting_detail(new_meeting.meeting_id, current_user, db)


@router.get("/", response_model=List[MeetingOut])
def get_meetings(
    college_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all meetings visible to the current user.
    - Mentors see meetings they organized
    - Students/Professors see meetings for their worklets
    - Filter by college_id or status if provided
    """
    query = db.query(Meeting)
    
    # Role-based filtering
    if current_user.role == "Mentor":
        # Mentors see meetings they created
        query = query.filter(Meeting.organizer_id == current_user.id)
    else:
        # Students/Professors see meetings for their worklets
        user_worklet_ids = [
            assoc.worklet_id 
            for assoc in db.query(UserWorkletAssociation).filter(
                UserWorkletAssociation.user_id == current_user.id
            ).all()
        ]
        
        if not user_worklet_ids:
            return []  # User has no worklets
        
        # Find meetings that include any of user's worklets
        meeting_ids = [
            assoc.meeting_id
            for assoc in db.query(MeetingWorkletAssociation).filter(
                MeetingWorkletAssociation.worklet_id.in_(user_worklet_ids)
            ).all()
        ]
        
        if not meeting_ids:
            return []
        
        query = query.filter(Meeting.meeting_id.in_(meeting_ids))
    
    # Apply filters
    if college_id:
        query = query.filter(Meeting.college_id == college_id)
    
    if status:
        # Auto-update statuses before filtering
        meetings = query.all()
        for meeting in meetings:
            new_status = calculate_meeting_status(meeting.start_datetime, meeting.duration_minutes)
            if meeting.status != new_status and meeting.status != "cancelled":
                meeting.status = new_status
        db.commit()
        
        query = query.filter(Meeting.status == status)
    
    meetings = query.order_by(Meeting.start_datetime.desc()).all()
    
    # Build response with enriched data
    result = []
    for meeting in meetings:
        # Auto-update status if not cancelled
        if meeting.status != "cancelled":
            new_status = calculate_meeting_status(meeting.start_datetime, meeting.duration_minutes)
            if meeting.status != new_status:
                meeting.status = new_status
                db.commit()
        
        meeting_dict = {
            "meeting_id": meeting.meeting_id,
            "title": meeting.title,
            "description": meeting.description,
            "college_id": meeting.college_id,
            "college_name": meeting.college_rel.college_name if meeting.college_rel else None,
            "organizer_id": meeting.organizer_id,
            "organizer_name": meeting.organizer.name if meeting.organizer else None,
            "organizer_email": meeting.organizer.email if meeting.organizer else None,
            "start_datetime": meeting.start_datetime,
            "duration_minutes": meeting.duration_minutes,
            "meeting_link": meeting.meeting_link,
            "status": meeting.status,
            "repeat_days": meeting.repeat_days,
            "repeat_until": meeting.repeat_until,
            "created_at": meeting.created_at,
            "updated_at": meeting.updated_at,
            "worklets": []
        }
        
        # Get worklet schedules
        for assoc in meeting.worklet_associations:
            worklet = db.query(Worklet).filter(Worklet.id == assoc.worklet_id).first()
            if worklet:
                meeting_dict["worklets"].append({
                    "worklet_id": worklet.id,
                    "worklet_cert_id": worklet.cert_id,
                    "worklet_title": worklet.title,
                    "scheduled_datetime": assoc.scheduled_datetime
                })
        
        result.append(MeetingOut(**meeting_dict))
    
    return result


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting_detail(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific meeting"""
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user has access to this meeting
    if current_user.role == "Mentor":
        if meeting.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Check if user is part of any worklet in this meeting
        user_worklet_ids = [
            assoc.worklet_id 
            for assoc in db.query(UserWorkletAssociation).filter(
                UserWorkletAssociation.user_id == current_user.id
            ).all()
        ]
        
        meeting_worklet_ids = [
            assoc.worklet_id 
            for assoc in db.query(MeetingWorkletAssociation).filter(
                MeetingWorkletAssociation.meeting_id == meeting_id
            ).all()
        ]
        
        if not any(wid in meeting_worklet_ids for wid in user_worklet_ids):
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Auto-update status if not cancelled
    if meeting.status != "cancelled":
        new_status = calculate_meeting_status(meeting.start_datetime, meeting.duration_minutes)
        if meeting.status != new_status:
            meeting.status = new_status
            db.commit()
    
    # Build response
    meeting_dict = {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "description": meeting.description,
        "college_id": meeting.college_id,
        "college_name": meeting.college_rel.college_name if meeting.college_rel else None,
        "organizer_id": meeting.organizer_id,
        "organizer_name": meeting.organizer.name if meeting.organizer else None,
        "organizer_email": meeting.organizer.email if meeting.organizer else None,
        "start_datetime": meeting.start_datetime,
        "duration_minutes": meeting.duration_minutes,
        "meeting_link": meeting.meeting_link,
        "status": meeting.status,
        "repeat_days": meeting.repeat_days,
        "repeat_until": meeting.repeat_until,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
        "worklets": []
    }
    
    # Get worklet schedules
    for assoc in meeting.worklet_associations:
        worklet = db.query(Worklet).filter(Worklet.id == assoc.worklet_id).first()
        if worklet:
            meeting_dict["worklets"].append({
                "worklet_id": worklet.id,
                "worklet_cert_id": worklet.cert_id,
                "worklet_title": worklet.title,
                "scheduled_datetime": assoc.scheduled_datetime
            })
    
    return MeetingOut(**meeting_dict)


@router.put("/{meeting_id}/reschedule", response_model=MeetingOut)
def reschedule_meeting(
    meeting_id: int,
    reschedule_data: MeetingReschedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reschedule a meeting to a new datetime.
    Only the meeting organizer (mentor) can reschedule.
    """
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Only organizer can reschedule
    if meeting.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the meeting organizer can reschedule"
        )
    
    # Can't reschedule cancelled or completed meetings
    if meeting.status in ["cancelled", "completed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reschedule a {meeting.status} meeting"
        )
    
    # Update meeting datetime
    old_datetime = meeting.start_datetime
    meeting.start_datetime = reschedule_data.start_datetime
    
    if reschedule_data.duration_minutes:
        meeting.duration_minutes = reschedule_data.duration_minutes
    
    meeting.status = "upcoming"  # Reset to upcoming
    
    # Update worklet associations with new sequential times
    current_start_time = reschedule_data.start_datetime
    all_participants = set()
    
    for assoc in meeting.worklet_associations:
        assoc.scheduled_datetime = current_start_time
        
        # Collect participants
        participants = get_worklet_participants(db, assoc.worklet_id)
        all_participants.update([p.id for p in participants])
        
        current_start_time += timedelta(minutes=meeting.duration_minutes)
    
    db.commit()
    db.refresh(meeting)
    
    # Send rescheduling notifications
    try:
        for user_id in all_participants:
            if user_id != current_user.id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    send_meeting_notification(
                        recipient_email=user.email,
                        recipient_name=user.name,
                        meeting_title=meeting.title,
                        meeting_datetime=meeting.start_datetime,
                        meeting_link=meeting.meeting_link,
                        organizer_name=current_user.name,
                        notification_type="rescheduled",
                        reason=reschedule_data.reason
                    )
        
        db.commit()
    except Exception as e:
        logger.error(f"Failed to send reschedule notifications: {str(e)}")
    
    return get_meeting_detail(meeting.meeting_id, current_user, db)


@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
def cancel_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a meeting.
    Only the meeting organizer (mentor) can cancel.
    """
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Only organizer can cancel
    if meeting.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the meeting organizer can cancel"
        )
    
    # Can't cancel already cancelled or completed meetings
    if meeting.status in ["cancelled", "completed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a {meeting.status} meeting"
        )
    
    # Mark as cancelled instead of deleting
    meeting.status = "cancelled"
    
    # Collect all participants
    all_participants = set()
    for assoc in meeting.worklet_associations:
        participants = get_worklet_participants(db, assoc.worklet_id)
        all_participants.update([p.id for p in participants])
    
    db.commit()
    
    # Send cancellation notifications
    try:
        for user_id in all_participants:
            if user_id != current_user.id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    send_meeting_notification(
                        recipient_email=user.email,
                        recipient_name=user.name,
                        meeting_title=meeting.title,
                        meeting_datetime=meeting.start_datetime,
                        meeting_link=meeting.meeting_link,
                        organizer_name=current_user.name,
                        notification_type="cancelled"
                    )
        
        db.commit()
    except Exception as e:
        logger.error(f"Failed to send cancellation notifications: {str(e)}")
    
    return {
        "message": "Meeting cancelled successfully",
        "meeting_id": meeting_id
    }


@router.get("/mentor/worklets", response_model=List[dict])
def get_mentor_worklets(
    college_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get worklets assigned to the current mentor, optionally filtered by college.
    Excludes completed worklets (StatusID = 2).
    """
    if current_user.role != "Mentor":
        raise HTTPException(
            status_code=403,
            detail="Only mentors can access this endpoint"
        )
    
    # Get mentor's worklet associations
    associations = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == current_user.id,
        UserWorkletAssociation.role_in_worklet == "Mentor"
    ).all()
    
    worklet_ids = [assoc.worklet_id for assoc in associations]
    
    if not worklet_ids:
        return []
    
    # Query worklets
    query = db.query(Worklet).filter(
        Worklet.id.in_(worklet_ids),
        Worklet.status_id != 2  # Exclude completed worklets
    )
    
    if college_id:
        query = query.filter(Worklet.college_id == college_id)
    
    worklets = query.all()
    
    # Build response
    result = []
    for worklet in worklets:
        result.append({
            "id": worklet.id,  # Return numeric WorkletID (not cert_id string)
            "name": f"{worklet.cert_id or worklet.id} - {worklet.title}",
            "college": worklet.college_rel.college_name if worklet.college_rel else "Unknown"
        })
    
    return result
