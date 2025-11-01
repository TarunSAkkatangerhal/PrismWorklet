"""
User Worklet Association Router - Handles many-to-many relationships between users and worklets (minimal schema)
Now uses centralized WorkletService for consistent data formatting.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import UserWorkletAssociation, User, Worklet
from app.schemas import (
    UserWorkletAssociationCreate,
    UserWorkletAssociationUpdate,
    UserWorkletAssociationResponse,
    WorkletWithAssociations,
    UserWithWorklets,
    WorkletRoleEnum
)
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.routers.helpers.worklet_helpers import (
    get_worklet_students,
    format_worklet_response,
)
from app.core.constants import normalize_status_text, normalize_performance
from app.services.worklet_service import WorkletService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def decode_token(token: str):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    try:
        payload = decode_token(token)
        user = db.query(User).filter(User.email == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

router = APIRouter(prefix="/associations")

@router.post("/", response_model=UserWorkletAssociationResponse)
def create_association(
    association: UserWorkletAssociationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user-worklet association"""
    
    # Verify user exists
    user = db.query(User).filter(User.id == association.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == association.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Check if association already exists
    existing = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.user_id == association.user_id,
            UserWorkletAssociation.worklet_id == association.worklet_id,
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Active association already exists between this user and worklet"
        )
    
    # Create new association
    db_association = UserWorkletAssociation(
        user_id=association.user_id,
        worklet_id=association.worklet_id,
        role_in_worklet=association.role_in_worklet,
    )
    
    db.add(db_association)
    db.commit()
    db.refresh(db_association)
    
    return db_association

@router.get("/worklet/{worklet_id}", response_model=WorkletWithAssociations)
def get_worklet_with_users(
    worklet_id: int,
    db: Session = Depends(get_db),
    include_inactive: bool = False
):
    """Get worklet with all associated users (mentors, students, collaborators)"""
    
    # Get worklet
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # OPTIMIZATION: Eager load users to avoid N+1 queries
    query = db.query(UserWorkletAssociation).options(
        joinedload(UserWorkletAssociation.user)
    ).filter(
        UserWorkletAssociation.worklet_id == worklet_id
    )
    
    # Minimal schema: no is_active flag

    associations = query.all()
    
    # Categorize users by role
    mentors = []
    students = []
    professors = []
    
    for assoc in associations:
        user = assoc.user
        # role_in_worklet is stored as a string in DB; compare to enum .value
        if assoc.role_in_worklet == WorkletRoleEnum.mentor.value:
            mentors.append(user)
        elif assoc.role_in_worklet == WorkletRoleEnum.student.value:
            students.append(user)
        elif assoc.role_in_worklet == WorkletRoleEnum.professor.value:
            professors.append(user)
    
    # Derive status, year and progress using centralized helpers
    status_text = normalize_status_text(getattr(worklet, 'status_id', None))

    derived_year = None
    try:
        if getattr(worklet, 'start_date', None):
            derived_year = worklet.start_date.year
        elif getattr(worklet, 'end_date', None):
            derived_year = worklet.end_date.year
    except Exception:
        derived_year = None

    # Compute progress if absent
    progress = getattr(worklet, 'worklet_progress', None)
    if progress is None:
        if getattr(worklet, 'start_date', None) and getattr(worklet, 'end_date', None):
            try:
                total_days = (worklet.end_date - worklet.start_date).days or 1
                elapsed_days = (datetime.utcnow().date() - worklet.start_date).days
                if elapsed_days < 0:
                    elapsed_days = 0
                progress = max(0, min(100, int((elapsed_days / total_days) * 100)))
            except Exception:
                progress = 0
        else:
            progress = 0

    # Determine student_count
    student_count = len(students)

    # Prefer worklet's assigned college; fallback to associations
    college_id = getattr(worklet, 'college_id', None)
    college_name = worklet.college_rel.college_name if getattr(worklet, 'college_rel', None) else None
    if college_name is None:
        for s in students:
            if getattr(s, 'college', None):
                college_name = s.college
                college_id = getattr(s, 'college_id', None)
                break
    if college_name is None and mentors:
        m = mentors[0]
        college_name = getattr(m, 'college', None)
        college_id = getattr(m, 'college_id', None)

    # Convert worklet to dict and add associations
    worklet_dict = {
        "id": worklet.id,
        "cert_id": worklet.cert_id,
        "title": getattr(worklet, 'title', None),
        "description": getattr(worklet, "problem_statement", None),
        "start_date": worklet.start_date,
        "end_date": worklet.end_date,
        "created_at": getattr(worklet, "created_at", None),
        "updated_at": getattr(worklet, "updated_at", None),
        "year": derived_year if derived_year is not None else datetime.utcnow().year,
        "domain": getattr(worklet, "domain", None),
        "status": status_text,
        "worklet_progress": progress,
        "college_id": college_id,
        "college": college_name,
        "student_count": student_count,
        "problem_statement": getattr(worklet, "problem_statement", None),
        "expectation": getattr(worklet, "expectation", None),
        "prerequisites": getattr(worklet, "prerequisites", None),
        "performance": normalize_performance(getattr(worklet, 'Performance', None)),
        "mentors": mentors,
        "students": students,
        "professors": professors,
        "total_users": len(associations)
    }
    
    return worklet_dict

@router.get("/user/{user_id}/worklets", response_model=UserWithWorklets)
def get_user_worklets(
    user_id: int,
    db: Session = Depends(get_db),
    role_filter: Optional[WorkletRoleEnum] = None
):
    """Get user with all associated worklets"""
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # OPTIMIZATION: Eager load worklets to avoid N+1 queries
    query = db.query(UserWorkletAssociation).options(
        joinedload(UserWorkletAssociation.worklet)
    ).filter(
        UserWorkletAssociation.user_id == user_id
    )
    
    # Minimal schema: no is_active flag
    
    if role_filter:
        query = query.filter(UserWorkletAssociation.role_in_worklet == role_filter)
    
    # Minimal schema: no completion_status
    
    associations = query.all()
    
    # Get worklets
    worklets = [assoc.worklet for assoc in associations]
    
    # Convert user to dict and add worklets
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "team": user.profile.expertise if user.profile else None,
        "college": user.college,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "active_worklets": worklets,
        "worklet_count": len(worklets)
    }
    
    return user_dict

@router.get("/mentor/{mentor_id}/worklets")
def get_mentor_worklets_unified(
    mentor_id: int,
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None,  # "ongoing", "completed", "all", or None (defaults to all)
    include_performance: bool = True
):
    """
    Unified endpoint to get worklets for a specific mentor.
    
    Query Parameters:
    - status_filter: Filter by status ("ongoing", "completed", or "all"/None for all worklets)
    - include_performance: Include performance/quality data (default: True)
    
    Returns worklets with aggregated data including students and statistics.
    Now uses centralized WorkletService for consistent data formatting.
    """
    
    # Use service layer for all business logic
    result = WorkletService.get_worklets_for_mentor(
        db=db,
        mentor_id=mentor_id,
        status_filter=status_filter,
        include_performance=include_performance
    )
    
    if result is None:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    # Format response based on filter
    response = {
        "mentor_id": result["mentor_id"],
        "mentor_name": result["mentor_name"],
        "total_worklets": result["total_worklets"],
        "total_mentees": result["total_mentees"]
    }
    
    # Add appropriate worklet lists based on filter
    if status_filter and status_filter.lower() == "ongoing":
        response["ongoing_worklets"] = result["ongoing_worklets"]
        response["total_ongoing"] = result["total_ongoing"]
    elif status_filter and status_filter.lower() == "completed":
        response["completed_worklets"] = result["completed_worklets"]
        response["total_completed"] = result["total_completed"]
    else:
        # Return all with breakdowns
        response["all_worklets"] = result["worklets"]
        response["ongoing_worklets"] = result["ongoing_worklets"]
        response["completed_worklets"] = result["completed_worklets"]
        response["total_ongoing"] = result["total_ongoing"]
        response["total_completed"] = result["total_completed"]
    
    return response


@router.put("/{user_id}/{worklet_id}", response_model=UserWorkletAssociationResponse)
def update_association(
    user_id: int,
    worklet_id: int,
    association_update: UserWorkletAssociationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing user-worklet association"""
    
    db_association = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.user_id == user_id,
            UserWorkletAssociation.worklet_id == worklet_id,
        )
    ).first()
    
    if not db_association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    # Update fields
    update_data = association_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_association, field, value)
    
    db.commit()
    db.refresh(db_association)
    
    return db_association

@router.delete("/{user_id}/{worklet_id}")
def deactivate_association(
    user_id: int,
    worklet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate (soft delete) a user-worklet association"""
    
    db_association = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.user_id == user_id,
            UserWorkletAssociation.worklet_id == worklet_id,
        )
    ).first()
    
    if not db_association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    db.delete(db_association)
    db.commit()
    return {"message": "Association deleted successfully"}

@router.post("/bulk-assign")
def bulk_assign_users_to_worklet(
    worklet_id: int,
    user_assignments: List[UserWorkletAssociationCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk assign multiple users to a worklet"""
    
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    created_associations = []
    errors = []
    
    # OPTIMIZATION: Bulk fetch all user IDs and existing associations in one query each
    user_ids = [assignment.user_id for assignment in user_assignments]
    
    # Check all users exist at once
    existing_users = db.query(User.id).filter(User.id.in_(user_ids)).all()
    existing_user_ids = {user.id for user in existing_users}
    
    # Check all existing associations at once
    existing_associations = db.query(
        UserWorkletAssociation.user_id
    ).filter(
        and_(
            UserWorkletAssociation.user_id.in_(user_ids),
            UserWorkletAssociation.worklet_id == worklet_id,
        )
    ).all()
    existing_association_user_ids = {assoc.user_id for assoc in existing_associations}
    
    for assignment in user_assignments:
        try:
            # Set worklet_id from URL parameter
            assignment.worklet_id = worklet_id
            
            # Check if user exists (from pre-fetched set)
            if assignment.user_id not in existing_user_ids:
                errors.append(f"User {assignment.user_id} not found")
                continue
            
            # Check if association already exists (from pre-fetched set)
            if assignment.user_id in existing_association_user_ids:
                errors.append(f"User {assignment.user_id} already assigned to worklet")
                continue
            
            # Create association
            db_association = UserWorkletAssociation(
                user_id=assignment.user_id,
                worklet_id=worklet_id,
                role_in_worklet=assignment.role_in_worklet,
            )
            
            db.add(db_association)
            created_associations.append(assignment.user_id)
            
        except Exception as e:
            errors.append(f"Error assigning user {assignment.user_id}: {str(e)}")
    
    if created_associations:
        db.commit()
    
    return {
        "message": f"Bulk assignment completed",
        "successful_assignments": len(created_associations),
        "assigned_user_ids": created_associations,
        "errors": errors
    }
