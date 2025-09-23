"""
User Worklet Association Router - Handles many-to-many relationships between users and worklets
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.database import get_db
from app.models import UserWorkletAssociation, User, Worklet
from app.schemas import (
    UserWorkletAssociationCreate, 
    UserWorkletAssociationUpdate, 
    UserWorkletAssociationResponse,
    WorkletWithAssociations,
    UserWithWorklets,
    WorkletRoleEnum,
    CompletionStatusEnum
)
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings

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

router = APIRouter(prefix="/associations", tags=["User Worklet Associations"])

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
            UserWorkletAssociation.is_active == True
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
        completion_status=association.completion_status,
        progress_percentage=association.progress_percentage,
        notes=association.notes,
        assigned_by=current_user.id
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
    
    # Build query for associations
    query = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == worklet_id
    )
    
    if not include_inactive:
        query = query.filter(UserWorkletAssociation.is_active == True)
    
    associations = query.all()
    
    # Categorize users by role
    mentors = []
    students = []
    collaborators = []
    
    for assoc in associations:
        user = assoc.user
        if assoc.role_in_worklet == WorkletRoleEnum.mentor:
            mentors.append(user)
        elif assoc.role_in_worklet == WorkletRoleEnum.student:
            students.append(user)
        elif assoc.role_in_worklet == WorkletRoleEnum.collaborator:
            collaborators.append(user)
    
    # Convert worklet to dict and add associations
    worklet_dict = {
        "id": worklet.id,
        "cert_id": worklet.cert_id,
        "description": worklet.description,
        "start_date": worklet.start_date,
        "end_date": worklet.end_date,
        "created_on": worklet.created_on,
        "year": worklet.year,
        "team": worklet.team,
        "college": worklet.college,
        "git_path": worklet.git_path,
        "risk_status": worklet.risk_status,
        "performance_status": worklet.performance_status,
        "percentage_completion": worklet.percentage_completion,
        "problem_statement": worklet.problem_statement,
        "expectations": worklet.expectations,
        "prerequisites": worklet.prerequisites,
        "milestone_id": worklet.milestone_id,
        "mentor_id": worklet.mentor_id,
        "status": worklet.status,
        "status_id": worklet.status_id,
        "mentors": mentors,
        "students": students,
        "collaborators": collaborators,
        "total_users": len(associations)
    }
    
    return worklet_dict

@router.get("/user/{user_id}/worklets", response_model=UserWithWorklets)
def get_user_worklets(
    user_id: int,
    db: Session = Depends(get_db),
    role_filter: Optional[WorkletRoleEnum] = None,
    status_filter: Optional[CompletionStatusEnum] = None,
    include_inactive: bool = False
):
    """Get user with all associated worklets"""
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query for associations
    query = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.user_id == user_id
    )
    
    if not include_inactive:
        query = query.filter(UserWorkletAssociation.is_active == True)
    
    if role_filter:
        query = query.filter(UserWorkletAssociation.role_in_worklet == role_filter)
    
    if status_filter:
        query = query.filter(UserWorkletAssociation.completion_status == status_filter)
    
    associations = query.all()
    
    # Get worklets
    worklets = [assoc.worklet for assoc in associations]
    
    # Convert user to dict and add worklets
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "team": user.team,
        "college": user.college,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "active_worklets": worklets,
        "worklet_count": len(worklets)
    }
    
    return user_dict

@router.get("/mentor/{mentor_id}/ongoing-worklets")
def get_mentor_ongoing_worklets(
    mentor_id: int,
    db: Session = Depends(get_db)
):
    """Get ongoing worklets for a specific mentor"""
    
    # Get mentor user
    mentor = db.query(User).filter(
        and_(User.id == mentor_id, User.role == "Mentor")
    ).first()
    
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    # Get active worklet associations for this mentor
    associations = db.query(UserWorkletAssociation).filter(
        and_(
            UserWorkletAssociation.user_id == mentor_id,
            UserWorkletAssociation.role_in_worklet == WorkletRoleEnum.mentor,
            UserWorkletAssociation.is_active == True,
            or_(
                UserWorkletAssociation.completion_status == CompletionStatusEnum.in_progress,
                UserWorkletAssociation.completion_status == CompletionStatusEnum.not_started
            )
        )
    ).all()
    
    # Get worklets with additional details
    ongoing_worklets = []
    for assoc in associations:
        worklet = assoc.worklet
        
        # Get students for this worklet
        student_associations = db.query(UserWorkletAssociation).filter(
            and_(
                UserWorkletAssociation.worklet_id == worklet.id,
                UserWorkletAssociation.role_in_worklet == WorkletRoleEnum.student,
                UserWorkletAssociation.is_active == True
            )
        ).all()
        
        students = [sa.user for sa in student_associations]
        
        worklet_data = {
            "id": worklet.id,
            "cert_id": worklet.cert_id,
            "description": worklet.description,
            "team": worklet.team,
            "college": worklet.college,
            "status": worklet.status,
            "percentage_completion": worklet.percentage_completion,
            "mentor_progress": assoc.progress_percentage,
            "completion_status": assoc.completion_status,
            "students": [{
                "id": student.id,
                "name": student.name,
                "email": student.email
            } for student in students],
            "student_count": len(students),
            "assigned_at": assoc.assigned_at,
            "notes": assoc.notes
        }
        
        ongoing_worklets.append(worklet_data)
    
    return {
        "mentor_id": mentor_id,
        "mentor_name": mentor.name,
        "ongoing_worklets": ongoing_worklets,
        "total_ongoing": len(ongoing_worklets)
    }

@router.put("/{association_id}", response_model=UserWorkletAssociationResponse)
def update_association(
    association_id: int,
    association_update: UserWorkletAssociationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing user-worklet association"""
    
    db_association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.id == association_id
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

@router.delete("/{association_id}")
def deactivate_association(
    association_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deactivate (soft delete) a user-worklet association"""
    
    db_association = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.id == association_id
    ).first()
    
    if not db_association:
        raise HTTPException(status_code=404, detail="Association not found")
    
    db_association.is_active = False
    db.commit()
    
    return {"message": "Association deactivated successfully"}

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
    
    for assignment in user_assignments:
        try:
            # Set worklet_id from URL parameter
            assignment.worklet_id = worklet_id
            
            # Check if user exists
            user = db.query(User).filter(User.id == assignment.user_id).first()
            if not user:
                errors.append(f"User {assignment.user_id} not found")
                continue
            
            # Check if association already exists
            existing = db.query(UserWorkletAssociation).filter(
                and_(
                    UserWorkletAssociation.user_id == assignment.user_id,
                    UserWorkletAssociation.worklet_id == worklet_id,
                    UserWorkletAssociation.is_active == True
                )
            ).first()
            
            if existing:
                errors.append(f"User {assignment.user_id} already assigned to worklet")
                continue
            
            # Create association
            db_association = UserWorkletAssociation(
                user_id=assignment.user_id,
                worklet_id=worklet_id,
                role_in_worklet=assignment.role_in_worklet,
                completion_status=assignment.completion_status,
                progress_percentage=assignment.progress_percentage,
                notes=assignment.notes,
                assigned_by=current_user.id
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