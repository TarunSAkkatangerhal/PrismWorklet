from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Milestone, MilestoneFeedback, Worklet, User, UserWorkletAssociation
from app.schemas import MilestoneCreate, MilestoneOut, MilestoneFeedbackCreate, MilestoneFeedbackOut
from app.auth import oauth2_scheme, require_access_token
from app.core.email_utils import send_milestone_notification, send_activity_email
from app.services.worklet_service import WorkletService

router = APIRouter(
    prefix="/milestones",
    tags=["milestones"]
)

# Helper function to get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    payload = require_access_token(token)
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Helper function to auto-increment progress for old milestones without feedback
def check_and_auto_increment_progress(worklet_id: int, db: Session):
    """
    Check if worklet has milestones older than 2 days without mentor feedback.
    If yes, auto-increment progress. This ensures progress moves forward even
    if mentor doesn't provide timely feedback.
    
    Returns True if progress was updated, False otherwise.
    """
    # Get worklet
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        return False
    
    # Calculate cutoff date (2 days ago)
    cutoff_date = datetime.utcnow() - timedelta(days=2)
    
    # Get milestones for this worklet that are older than 2 days
    old_milestones = db.query(Milestone).filter(
        Milestone.worklet_id == worklet_id,
        Milestone.date_created <= cutoff_date
    ).all()
    
    if not old_milestones:
        return False
    
    # Map milestone types to progress values
    # Note: End review capped at 99% for auto-increment; mentor can manually set to 100%
    review_stages = {
        'first review': 17,
        'weekly meeting': 17,
        'second review': 33,
        'monthly meeting': 33,
        'mid review': 50,
        'mid-review': 50,
        'fourth review': 67,
        'fifth review': 83,
        'end review': 99  # Auto-increment stops at 99%, mentor feedback can reach 100%
    }
    
    highest_auto_progress = 0
    current_progress = worklet.worklet_progress or 0
    
    for milestone in old_milestones:
        # Check if this milestone has feedback from mentor/professor
        has_feedback = db.query(MilestoneFeedback).filter(
            MilestoneFeedback.milestone_id == milestone.milestone_id
        ).first()
        
        # Skip if mentor already reviewed this milestone
        if has_feedback:
            continue
        
        # Check if milestone type is a review stage
        milestone_type_lower = milestone.milestone_type.lower() if milestone.milestone_type else ""
        
        for stage_name, progress_value in review_stages.items():
            if stage_name in milestone_type_lower:
                # Track the highest progress from unreviewed milestones
                highest_auto_progress = max(highest_auto_progress, progress_value)
                break
    
    # Update progress only if higher than current
    if highest_auto_progress > current_progress:
        worklet.worklet_progress = highest_auto_progress
        db.commit()
        return True
    
    return False


# Create a new milestone (Student only)
@router.post("/", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def create_milestone(
    milestone: MilestoneCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new milestone for a worklet.
    Only students can create milestones.
    Sends email notification to all mentors/professors associated with the worklet.
    """
    # Verify user is a student
    if current_user.role.lower() != 'student':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create milestones"
        )
    
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == milestone.worklet_id).first()
    if not worklet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worklet with id {milestone.worklet_id} not found"
        )
    
    # Verify student is associated with the worklet
    association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == current_user.id,
        UserWorkletAssociation.worklet_id == milestone.worklet_id,
        UserWorkletAssociation.role_in_worklet == "Student"
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not associated with this worklet as a student"
        )
    
    # Create new milestone
    new_milestone = Milestone(
        worklet_id=milestone.worklet_id,
        student_id=current_user.id,
        milestone_type=milestone.milestone_type,
        date_created=milestone.date_created or datetime.utcnow(),
        field1_label=milestone.field1_label,
        field1_value=milestone.field1_value,
        field2_label=milestone.field2_label,
        field2_value=milestone.field2_value,
        toggle_label=milestone.toggle_label,
        toggle_value=milestone.toggle_value,
        attachment_name=milestone.attachment_name,
        attachment_size=milestone.attachment_size,
        attachment_type=milestone.attachment_type,
        attachment_url=milestone.attachment_url
    )
    
    db.add(new_milestone)
    db.commit()
    db.refresh(new_milestone)
    
    # Get all mentors and professors associated with this worklet
    mentor_associations = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == milestone.worklet_id,
        UserWorkletAssociation.role_in_worklet.in_(["Mentor", "Professor"])
    ).all()
    
    # Send email notifications to all mentors/professors in background
    for mentor_assoc in mentor_associations:
        mentor_user = db.query(User).filter(User.id == mentor_assoc.user_id).first()
        if mentor_user and mentor_user.email:
            background_tasks.add_task(
                send_milestone_notification,
                mentor_email=mentor_user.email,
                mentor_name=mentor_user.name,
                student_name=current_user.name,
                student_email=current_user.email,
                milestone_type=milestone.milestone_type,
                worklet_title=worklet.title,
                field1_label=milestone.field1_label,
                field1_value=milestone.field1_value,
                field2_label=milestone.field2_label,
                field2_value=milestone.field2_value,
                toggle_label=milestone.toggle_label,
                toggle_value=milestone.toggle_value,
                attachment_name=milestone.attachment_name
            )
    
    # Note: Auto-increment logic is now handled by background scheduler or lazy evaluation
    # Progress will only auto-increment after 2 days if mentor hasn't provided feedback
    # This prevents immediate progress increase and gives mentor time to review
    
    # Add student info to response
    result = MilestoneOut.from_orm(new_milestone)
    result.student_name = current_user.name
    result.student_email = current_user.email
    result.feedbacks = []
    
    return result


# Get all milestones for a worklet
@router.get("/worklet/{worklet_id}", response_model=List[MilestoneOut])
def get_worklet_milestones(
    worklet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all milestones for a specific worklet.
    Accessible by students, mentors, and professors associated with the worklet.
    """
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worklet with id {worklet_id} not found"
        )
    
    # Verify user has access to this worklet
    association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == current_user.id,
        UserWorkletAssociation.worklet_id == worklet_id
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this worklet"
        )
    
    # Fetch milestones with feedbacks
    milestones = db.query(Milestone).filter(
        Milestone.worklet_id == worklet_id
    ).options(
        joinedload(Milestone.student),
        joinedload(Milestone.feedbacks).joinedload(MilestoneFeedback.reviewer)
    ).order_by(Milestone.date_created.desc()).all()
    
    # Transform to response format
    result = []
    for m in milestones:
        milestone_out = MilestoneOut.from_orm(m)
        milestone_out.student_name = m.student.name if m.student else None
        milestone_out.student_email = m.student.email if m.student else None
        
        # Add feedback details
        feedbacks = []
        for fb in m.feedbacks:
            fb_out = MilestoneFeedbackOut.from_orm(fb)
            fb_out.reviewer_name = fb.reviewer.name if fb.reviewer else None
            fb_out.reviewer_email = fb.reviewer.email if fb.reviewer else None
            feedbacks.append(fb_out)
        
        milestone_out.feedbacks = feedbacks
        result.append(milestone_out)
    
    return result


# Add feedback to a milestone (Mentor or Professor only)
@router.post("/feedback", response_model=MilestoneFeedbackOut, status_code=status.HTTP_201_CREATED)
def add_milestone_feedback(
    feedback: MilestoneFeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add feedback to a milestone.
    Only mentors and professors associated with the worklet can provide feedback.
    """  
    # Verify user is mentor or professor
    user_role = current_user.role.lower()
    if user_role not in ['mentor', 'professor']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors and professors can provide feedback"
        )
    
    # Verify milestone exists
    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == feedback.milestone_id
    ).first()
    
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone with id {feedback.milestone_id} not found"
        )
    
    # Verify user is associated with the worklet as mentor or professor
    association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == current_user.id,
        UserWorkletAssociation.worklet_id == milestone.worklet_id,
        UserWorkletAssociation.role_in_worklet.in_(["Mentor", "Professor"])
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not associated with this worklet as a mentor or professor"
        )
    
    # Verify reviewer_role matches user's role in the worklet
    if feedback.reviewer_role.lower() != association.role_in_worklet.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reviewer role must match your role in the worklet: {association.role_in_worklet}"
        )
    
    # Check if mentor/professor already provided feedback for this milestone
    existing_feedback = db.query(MilestoneFeedback).filter(
        MilestoneFeedback.milestone_id == feedback.milestone_id,
        MilestoneFeedback.reviewer_id == current_user.id
    ).first()
    
    if existing_feedback:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already provided feedback for this milestone. Each mentor/professor can only provide feedback once per milestone."
        )
    
    # Create feedback
    new_feedback = MilestoneFeedback(
        milestone_id=feedback.milestone_id,
        reviewer_id=current_user.id,
        reviewer_role=feedback.reviewer_role.lower(),
        feedback_text=feedback.feedback_text
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Get worklet for progress update and email
    worklet = db.query(Worklet).filter(Worklet.id == milestone.worklet_id).first()
    
    # Update worklet progress if mentor provided it
    if feedback.progress_completion is not None and worklet:
        # Mentor feedback overrides any auto-incremented progress
        worklet.worklet_progress = feedback.progress_completion
        db.commit()
        db.refresh(worklet)
    
    # Send email notification to students in background
    if worklet:
        try:
            # Get students for this worklet
            student_records = WorkletService.get_students_for_worklet(db, milestone.worklet_id)
            student_emails = [s["email"] for s in student_records]
            
            if student_emails:
                email_subject = f"Milestone Feedback for Worklet {worklet.cert_id}"
                email_message = (
                    f"Your mentor has provided feedback on your milestone.\n\n"
                    f"Milestone: {milestone.milestone_type}\n"
                    f"Feedback: {feedback.feedback_text}"
                )
                if feedback.progress_completion is not None:
                    email_message += f"\nProgress Updated: {feedback.progress_completion}%"
                
                # Send email in background
                background_tasks.add_task(
                    send_activity_email,
                    student_emails,
                    email_subject,
                    email_message,
                    "Milestone Feedback"
                )
        except Exception as e:
            # Don't fail the request if email fails
            print(f"Error queuing email: {str(e)}")
    
    # Add reviewer info to response
    result = MilestoneFeedbackOut.from_orm(new_feedback)
    result.reviewer_name = current_user.name
    result.reviewer_email = current_user.email
    
    return result


# Delete a milestone (Student who created it only)
@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a milestone.
    Only the student who created the milestone can delete it.
    """
    # Find milestone
    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id
    ).first()
    
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone with id {milestone_id} not found"
        )
    
    # Verify current user is the creator
    if milestone.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own milestones"
        )
    
    db.delete(milestone)
    db.commit()
    
    return None
