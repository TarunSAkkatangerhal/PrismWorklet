from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import Milestone, MilestoneFeedback, Worklet, User, UserWorkletAssociation
from app.schemas import MilestoneCreate, MilestoneOut, MilestoneFeedbackCreate, MilestoneFeedbackOut
from app.auth import oauth2_scheme, require_access_token

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


# Create a new milestone (Student only)
@router.post("/", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def create_milestone(
    milestone: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new milestone for a worklet.
    Only students can create milestones.
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
