"""
Milestone Router
Handles milestone CRUD operations with enhanced security
"""
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import datetime, timedelta
from pathlib import Path
import uuid
import shutil
import logging

from app.database import get_db
from app.models import Milestone, MilestoneFeedback, Worklet, User, UserWorkletAssociation
from app.schemas import MilestoneCreate, MilestoneOut, MilestoneFeedbackCreate, MilestoneFeedbackOut
from app.auth import oauth2_scheme, require_access_token
from app.core.email_utils import send_milestone_notification, send_activity_email
from app.core.rate_limiter import limiter
from app.services.worklet_service import WorkletService
from app.core.config import settings
from app.routers.helpers.milestone_helpers import (
    verify_worklet_exists,
    verify_milestone_exists,
    verify_user_worklet_association,
    verify_student_owns_milestone,
    verify_user_role,
    verify_file_access,
    validate_progress_value
)
from app.routers.helpers.file_validators import (
    validate_uploaded_file,
    validate_path_security,
    ALLOWED_EXTENSIONS
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/milestones",
    tags=["milestones"]
)

# Helper function to get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    payload = require_access_token(token)
    user_id = payload.get("user_id")
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(User).filter(User.email == payload.get("sub"), User.role == payload.get("role")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Helper function to auto-increment progress for old milestones without feedback
def check_and_auto_increment_progress(worklet_id: int, db: Session):
    """
    Check if worklet has milestones older than 2 days without mentor feedback.
    If yes, auto-increment progress. This ensures progress moves forward even
    if mentor doesn't provide timely feedback.
    
    Args:
        worklet_id: ID of the worklet
        db: Database session
    
    Returns:
        True if progress was updated, False otherwise
    """
    try:
        worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
        if not worklet:
            return False
        
        cutoff_date = datetime.utcnow() - timedelta(days=2)
        
        old_milestones = db.query(Milestone).filter(
            Milestone.worklet_id == worklet_id,
            Milestone.date_created <= cutoff_date
        ).all()
        
        if not old_milestones:
            return False
        
        review_stages = {
            'first review': 17,
            'weekly meeting': 17,
            'second review': 33,
            'monthly meeting': 33,
            'mid review': 50,
            'mid-review': 50,
            'fourth review': 67,
            'fifth review': 83,
            'end review': 99
        }
        
        highest_auto_progress = 0
        current_progress = worklet.worklet_progress or 0
        
        for milestone in old_milestones:
            has_feedback = db.query(MilestoneFeedback).filter(
                MilestoneFeedback.milestone_id == milestone.milestone_id
            ).first()
            
            if has_feedback:
                continue
            
            milestone_type_lower = milestone.milestone_type.lower() if milestone.milestone_type else ""
            
            for stage_name, progress_value in review_stages.items():
                if stage_name in milestone_type_lower:
                    highest_auto_progress = max(highest_auto_progress, progress_value)
                    break
        
        if highest_auto_progress > current_progress:
            worklet.worklet_progress = highest_auto_progress
            db.commit()
            return True
        
        return False
    except SQLAlchemyError as e:
        logger.error(f"Database error in auto-increment: {str(e)}")
        db.rollback()
        return False


@router.post("/", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_milestone(
    request: Request,
    milestone: MilestoneCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new milestone for a worklet.
    Only students can create milestones.
    Sends email notification to all mentors/professors associated with the worklet.
    
    Rate limit: 20 requests per minute
    """
    try:
        # Verify user is a student
        verify_user_role(current_user, ['student'])
        
        # Verify worklet exists
        worklet = verify_worklet_exists(db, milestone.worklet_id)
        
        # Verify student is associated with the worklet
        verify_user_worklet_association(
            db,
            current_user.id,
            milestone.worklet_id,
            allowed_roles=["Student"]
        )
        
        # Server-side URL generation - do not trust client
        # If client provided attachment_url, extract only the filename
        attachment_url_to_save = None
        if milestone.attachment_url:
            # Extract filename from URL if it's a full URL
            if '/' in milestone.attachment_url:
                filename = milestone.attachment_url.split('/')[-1]
                attachment_url_to_save = f"/milestones/files/{filename}"
            else:
                attachment_url_to_save = f"/milestones/files/{milestone.attachment_url}"
        
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
            attachment_url=attachment_url_to_save
        )
        
        db.add(new_milestone)
        db.commit()
        db.refresh(new_milestone)
        
        # Get all mentors and professors associated with this worklet
        mentor_associations = db.query(UserWorkletAssociation).filter(
            UserWorkletAssociation.worklet_id == milestone.worklet_id,
            UserWorkletAssociation.role_in_worklet.in_(["Mentor", "Professor"])
        ).all()
        
        # Send email notifications in background
        for mentor_assoc in mentor_associations:
            mentor_user = db.query(User).filter(User.id == mentor_assoc.user_id).first()
            if mentor_user and mentor_user.email and mentor_user.id != current_user.id:
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
        
        # Build response
        result = MilestoneOut.from_orm(new_milestone)
        result.student_name = current_user.name
        result.student_email = current_user.email
        result.feedbacks = []
        
        return result
    
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error creating milestone: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create milestone"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating milestone: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred"
        )


@router.get("/worklet/{worklet_id}", response_model=List[MilestoneOut])
async def get_worklet_milestones(
    worklet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all milestones for a specific worklet.
    Accessible by students, mentors, and professors associated with the worklet.
    """
    try:
        # Verify worklet exists
        verify_worklet_exists(db, worklet_id)
        
        # Verify user has access to this worklet
        verify_user_worklet_association(db, current_user.id, worklet_id)
        
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
    
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching milestones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve milestones"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching milestones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred"
        )


@router.post("/feedback", response_model=MilestoneFeedbackOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_milestone_feedback(
    request: Request,
    feedback: MilestoneFeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add feedback to a milestone.
    Only mentors and professors associated with the worklet can provide feedback.
    
    Rate limit: 30 requests per minute
    """
    try:
        # Verify user is mentor or professor
        verify_user_role(current_user, ['mentor', 'professor'])
        
        # Validate progress completion value
        validate_progress_value(feedback.progress_completion)
        
        # Verify milestone exists
        milestone = verify_milestone_exists(db, feedback.milestone_id)
        
        # Verify user is associated with the worklet as mentor or professor
        association = verify_user_worklet_association(
            db,
            current_user.id,
            milestone.worklet_id,
            allowed_roles=["Mentor", "Professor"]
        )
        
        # Verify reviewer_role matches user's role in the worklet
        if feedback.reviewer_role.lower() != association.role_in_worklet.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviewer role must match your worklet role"
            )
        
        # Check if mentor/professor already provided feedback for this milestone
        existing_feedback = db.query(MilestoneFeedback).filter(
            MilestoneFeedback.milestone_id == feedback.milestone_id,
            MilestoneFeedback.reviewer_id == current_user.id
        ).first()
        
        if existing_feedback:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Feedback already provided for this milestone"
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
            worklet.worklet_progress = feedback.progress_completion
            db.commit()
            db.refresh(worklet)
        
        # Send email notification to students in background
        if worklet:
            try:
                student_records = WorkletService.get_students_for_worklet(db, milestone.worklet_id)
                student_emails = [
                    s["email"] for s in student_records 
                    if s["email"] != current_user.email
                ]
                
                if student_emails:
                    email_subject = f"Milestone Feedback for Worklet {worklet.cert_id}"
                    email_message = (
                        f"Your mentor has provided feedback on your milestone.\n\n"
                        f"Milestone: {milestone.milestone_type}\n"
                        f"Feedback: {feedback.feedback_text}"
                    )
                    if feedback.progress_completion is not None:
                        email_message += f"\nProgress Updated: {feedback.progress_completion}%"
                    
                    background_tasks.add_task(
                        send_activity_email,
                        student_emails,
                        email_subject,
                        email_message,
                        "Milestone Feedback"
                    )
            except Exception as e:
                logger.error(f"Error queuing email: {str(e)}")
        
        # Build response
        result = MilestoneFeedbackOut.from_orm(new_feedback)
        result.reviewer_name = current_user.name
        result.reviewer_email = current_user.email
        
        return result
    
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error adding feedback: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add feedback"
        )
    except Exception as e:
        logger.error(f"Unexpected error adding feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred"
        )


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a milestone.
    Only the student who created the milestone can delete it.
    """
    try:
        # Verify student owns this milestone
        milestone = verify_student_owns_milestone(db, milestone_id, current_user.id)
        
        # Delete associated file if exists
        if milestone.attachment_url:
            try:
                # Extract filename from URL
                filename = milestone.attachment_url.split('/')[-1]
                file_path = Path(settings.UPLOAD_DIR) / filename
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                logger.error(f"Error deleting file: {str(e)}")
                # Continue with milestone deletion even if file deletion fails
        
        db.delete(milestone)
        db.commit()
        
        return None
    
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error deleting milestone: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete milestone"
        )
    except Exception as e:
        logger.error(f"Unexpected error deleting milestone: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred"
        )


@router.post("/upload")
@limiter.limit("15/minute")
async def upload_milestone_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file for milestone attachment.
    Only authenticated users can upload files.
    
    Security features:
    - Extension and MIME type validation
    - File size limits
    - Safe filename generation
    - Path traversal prevention
    
    Rate limit: 15 requests per minute
    """
    try:
        # Comprehensive file validation
        file_extension, file_size = await validate_uploaded_file(
            file,
            max_size_bytes=settings.MAX_FILE_SIZE_MB * 1024 * 1024
        )
        
        # Generate unique filename (UUID-based)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = Path(settings.UPLOAD_DIR) / unique_filename
        
        # Validate path security (prevent path traversal)
        validate_path_security(file_path, Path(settings.UPLOAD_DIR))
        
        # Create upload directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Ensure file pointer is at beginning before saving
        file.file.seek(0)
        
        # Save file securely
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )
        
        # Return server-generated URL (never trust client)
        return {
            "filename": unique_filename,
            "original_filename": file.filename,
            "url": f"/milestones/files/{unique_filename}",
            "content_type": file.content_type,
            "size": file_size
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed"
        )


@router.get("/files/{filename}")
async def get_milestone_file(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Serve milestone attachment files (authenticated access only).
    
    Security features:
    - Authentication required
    - Worklet association verification
    - Path traversal prevention
    - File existence validation
    
    Only users associated with the worklet can access the file.
    """
    try:
        # Verify user has access to this file via worklet association
        verify_file_access(db, filename, current_user.id)
        
        # Construct and validate file path
        file_path = Path(settings.UPLOAD_DIR) / filename
        
        # Security: prevent path traversal
        validate_path_security(file_path, Path(settings.UPLOAD_DIR))
        
        # Check file exists
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Return file with proper headers
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Download failed"
        )
