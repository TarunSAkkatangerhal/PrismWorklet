from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, UserProfile, College
from app.schemas import StudentRegistrationCreate, StudentRegistrationResponse, UserResponse
import logging
from jose import jwt, JWTError
from app.core.config import settings

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Local get_current_user function (following pattern from other routers)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

router = APIRouter(
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
        # Log the incoming registration data for debugging
        logger.info(f"Registration data received: contact_number={registration_data.contact_number}, "
                   f"college_name={registration_data.college_name}, student_id={registration_data.student_id}, "
                   f"qualification={registration_data.qualification}, program={registration_data.program}, "
                   f"batch_from={registration_data.batch_from}, batch_to={registration_data.batch_to}")
        
        # Find college by name and set college_id
        college = db.query(College).filter(College.college_name == registration_data.college_name).first()
        if college:
            current_user.college_id = college.college_id
            logger.info(f"College found and set: {college.college_name} (ID: {college.college_id})")
        else:
            logger.warning(f"College not found: {registration_data.college_name}")
        
        # Get or create user profile
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        if not user_profile:
            user_profile = UserProfile(user_id=current_user.id)
            db.add(user_profile)
            logger.info(f"Created new user profile for user {current_user.id}")
        
        # Update profile with registration data
        user_profile.contact_number = registration_data.contact_number
        user_profile.student_id = registration_data.student_id
        user_profile.qualification = registration_data.qualification
        user_profile.program = registration_data.program  # Store branch in program field
        user_profile.batch_from = registration_data.batch_from
        user_profile.batch_to = registration_data.batch_to
        
        logger.info(f"Profile data set: contact_number={user_profile.contact_number}, "
                   f"student_id={user_profile.student_id}, qualification={user_profile.qualification}, "
                   f"program={user_profile.program}, batch_from={user_profile.batch_from}, "
                   f"batch_to={user_profile.batch_to}")
        
        # Mark registration as completed in both User and UserProfile for redundancy
        current_user.profile_completed = True
        user_profile.profile_completed = True
        
        db.commit()
        db.refresh(current_user)
        db.refresh(user_profile)
        
        logger.info(f"Student registration completed successfully for user {current_user.id}")
        
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


@router.get("/profile/search", response_model=UserResponse)
def get_user_profile_by_identifier(
    name: Optional[str] = None,
    email: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user profile by name or email.
    Returns full user profile including UserProfile data.
    """
    if not name and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either name or email must be provided"
        )
    
    # Search by email first (more unique), then by name
    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()
    elif name:
        user = db.query(User).filter(User.name == name).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found with {'email: ' + email if email else 'name: ' + name}"
        )
    
    # Build response with full profile
    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "college": user.college,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
    }

    # Attach profile data if available
    if user.profile:
        p = user.profile
        response["profile"] = {
            "avatar_url": p.avatar_url,
            "bio": p.bio,
            "linkedin": p.linkedin,
            "portfolio_url": p.portfolio_url,
            "expertise": p.expertise,
            "qualification": p.qualification,
            "experience_years": p.experience_years,
            "contact_number": p.contact_number,
            "organization": p.organization,
            "github": p.github,
            "handle": p.handle,
            "location": p.location,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "website": p.website,
        }
    
    return response
