"""
Milestone Helper Functions
Centralized authorization and business logic for milestone operations
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.models import User, Worklet, UserWorkletAssociation, Milestone


def verify_worklet_exists(db: Session, worklet_id: int) -> Worklet:
    """
    Verify that a worklet exists.
    
    Args:
        db: Database session
        worklet_id: ID of the worklet
        
    Returns:
        Worklet object
        
    Raises:
        HTTPException: 404 if worklet not found
    """
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worklet not found"
        )
    return worklet


def verify_milestone_exists(db: Session, milestone_id: int) -> Milestone:
    """
    Verify that a milestone exists.
    
    Args:
        db: Database session
        milestone_id: ID of the milestone
        
    Returns:
        Milestone object
        
    Raises:
        HTTPException: 404 if milestone not found
    """
    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id
    ).first()
    
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )
    return milestone


def verify_user_worklet_association(
    db: Session,
    user_id: int,
    worklet_id: int,
    allowed_roles: Optional[list] = None
) -> UserWorkletAssociation:
    """
    Verify that a user is associated with a worklet with specific role(s).
    
    Args:
        db: Database session
        user_id: ID of the user
        worklet_id: ID of the worklet
        allowed_roles: List of allowed roles (e.g., ["Student", "Mentor", "Professor"])
                      If None, any association is allowed
        
    Returns:
        UserWorkletAssociation object
        
    Raises:
        HTTPException: 403 if user not associated or role not allowed
    """
    query = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == user_id,
        UserWorkletAssociation.worklet_id == worklet_id
    )
    
    if allowed_roles:
        query = query.filter(UserWorkletAssociation.role_in_worklet.in_(allowed_roles))
    
    association = query.first()
    
    if not association:
        if allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return association


def verify_student_owns_milestone(
    db: Session,
    milestone_id: int,
    student_id: int
) -> Milestone:
    """
    Verify that a student owns a specific milestone.
    
    Args:
        db: Database session
        milestone_id: ID of the milestone
        student_id: ID of the student
        
    Returns:
        Milestone object
        
    Raises:
        HTTPException: 403 if student doesn't own the milestone
    """
    milestone = verify_milestone_exists(db, milestone_id)
    
    if milestone.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return milestone


def verify_user_role(user: User, allowed_roles: list) -> None:
    """
    Verify that a user has one of the allowed roles.
    
    Args:
        user: User object
        allowed_roles: List of allowed roles
        
    Raises:
        HTTPException: 403 if user role not in allowed_roles
    """
    if user.role.lower() not in [role.lower() for role in allowed_roles]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )


def verify_file_access(
    db: Session,
    filename: str,
    user_id: int
) -> bool:
    """
    Verify that a user has access to a file by checking milestone associations.
    
    Args:
        db: Database session
        filename: Filename to check access for
        user_id: ID of the user requesting access
        
    Returns:
        True if user has access
        
    Raises:
        HTTPException: 403 if user doesn't have access to the file
    """
    # Find milestone with this attachment
    milestone = db.query(Milestone).filter(
        Milestone.attachment_url.like(f"%{filename}%")
    ).first()
    
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if user is associated with the worklet
    association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == user_id,
        UserWorkletAssociation.worklet_id == milestone.worklet_id
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return True


def validate_progress_value(progress: Optional[int]) -> None:
    """
    Validate that progress completion is within valid range.
    
    Args:
        progress: Progress value to validate
        
    Raises:
        HTTPException: 400 if progress is invalid
    """
    if progress is not None:
        if not isinstance(progress, int) or progress < 0 or progress > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Progress must be an integer between 0 and 100"
            )
