from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import User, UserProfile, College
from app.schemas import StudentRegistrationCreate, StudentRegistrationResponse, UserResponse
from app.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/students",
    tags=["students"]
)


@router.post("/complete-registration", response_model=StudentRegistrationResponse)
def complete_student_registration(
    registration_data: StudentRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete student registration after signup.
    This endpoint should be called after a student signs up to collect additional profile information.
    """
    # Verify the user is a student
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available for students"
        )
    
    # Check if already completed
    if current_user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration already completed"
        )
    
    try:
        # Find college by name and set college_id
        college = db.query(College).filter(College.college_name == registration_data.college_name).first()
        if college:
            current_user.college_id = college.college_id
        
        # Get or create user profile
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        if not user_profile:
            user_profile = UserProfile(user_id=current_user.id)
            db.add(user_profile)
        
        # Update profile with registration data
        user_profile.contact_number = registration_data.contact_number
        user_profile.student_id = registration_data.student_id
        user_profile.qualification = registration_data.qualification
        user_profile.organization = registration_data.program  # Store branch in organization field
        user_profile.batch_from = registration_data.batch_from
        user_profile.batch_to = registration_data.batch_to
        
        # Mark registration as completed
        current_user.profile_completed = True
        
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Student registration completed for user {current_user.id}")
        
        return StudentRegistrationResponse(
            message="Registration completed successfully",
            profile_completed=True
        )
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing student registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete registration"
        )


@router.get("/registration-status", response_model=dict)
def check_registration_status(
    current_user: User = Depends(get_current_user)
):
    """
    Check if the current user has completed their registration.
    """
    return {
        "profile_completed": current_user.profile_completed,
        "role": current_user.role
    }


@router.get("/me", response_model=UserResponse)
def get_current_student(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current student's profile information.
    """
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available for students"
        )
    
    return current_user
