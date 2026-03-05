"""
Admin-only router for user management.
All endpoints require an authenticated user with role='Admin'.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models import User, UserProfile, UserWorkletAssociation, College, Worklet
from app.auth import oauth2_scheme, decode_token, get_password_hash
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Pydantic schemas for request bodies ─────────────────────────────

class CreateMentorRequest(BaseModel):
    name: str
    email: EmailStr
    college_id: Optional[int] = None


# ─── Helpers ──────────────────────────────────────────────────────────

def _get_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Verify the caller is an Admin."""
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(User).filter(User.email == payload.get("sub"), User.role == payload.get("role")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ─── GET /users/stats ────────────────────────────────────────────────

@router.get("/users/stats")
def get_user_stats(
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Return counts of users by role."""
    rows = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    counts = {r: c for r, c in rows}
    total = sum(counts.values())
    return {
        "total": total,
        "students": counts.get("Student", 0),
        "professors": counts.get("Professor", 0),
        "mentors": counts.get("Mentor", 0),
        "admins": counts.get("Admin", 0),
    }


# ─── POST /mentors ───────────────────────────────────────────────────

@router.post("/mentors")
def create_mentor(
    data: CreateMentorRequest,
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new mentor user."""
    # Check if email already exists with the same role
    existing = db.query(User).filter(User.email == data.email, User.role == "Mentor").first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists as a Mentor")
    
    # Create new mentor with default password (they can reset it later)
    import secrets
    temp_password = secrets.token_urlsafe(12)
    
    new_mentor = User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(temp_password),
        role="Mentor",
        college_id=data.college_id,
        is_active=True,
        profile_completed=False,
    )
    
    db.add(new_mentor)
    db.commit()
    db.refresh(new_mentor)
    
    logger.info(f"Admin {admin.email} created mentor: {new_mentor.email}")
    
    return {
        "id": new_mentor.id,
        "name": new_mentor.name,
        "email": new_mentor.email,
        "role": new_mentor.role,
        "is_active": new_mentor.is_active,
        "message": "Mentor created successfully",
    }


# ─── GET /users ──────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: Student, Professor, Mentor, Admin"),
    status: Optional[str] = Query(None, description="Filter by status: active, inactive, all"),
    college_id: Optional[int] = Query(None, description="Filter by college ID"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all users with optional filters.
    Returns user data + college name + count of involved worklets.
    """
    # Subquery: count worklets per user
    worklet_count_sq = (
        db.query(
            UserWorkletAssociation.user_id,
            func.count(UserWorkletAssociation.worklet_id).label("worklet_count"),
        )
        .group_by(UserWorkletAssociation.user_id)
        .subquery()
    )

    query = (
        db.query(
            User,
            College.college_name,
            func.coalesce(worklet_count_sq.c.worklet_count, 0).label("worklet_count"),
        )
        .outerjoin(College, User.college_id == College.college_id)
        .outerjoin(worklet_count_sq, User.id == worklet_count_sq.c.user_id)
    )

    # ── Filters ──
    if role:
        query = query.filter(User.role == role)
    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)
    if college_id:
        query = query.filter(User.college_id == college_id)
    if search:
        q = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(q),
                User.email.ilike(q),
            )
        )

    total = query.count()
    users = (
        query
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for user, college_name, wc in users:
        # Get student_id from profile if available
        student_id = None
        if user.profile:
            student_id = user.profile.student_id
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "college_id": user.college_id,
            "college_name": college_name,
            "student_id": student_id,
            "is_active": user.is_active,
            "profile_completed": user.profile_completed,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "involved_worklets": wc,
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": result,
    }


# ─── GET /colleges (for filter dropdowns) ────────────────────────────

@router.get("/colleges")
def list_colleges_for_filter(
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Return slim list of colleges for filter dropdowns."""
    colleges = db.query(College.college_id, College.college_name).order_by(College.college_name).all()
    return [{"id": c.college_id, "name": c.college_name} for c in colleges]


# ─── GET /users/{user_id} ────────────────────────────────────────────

@router.get("/users/{user_id}")
def get_user_by_id(
    user_id: int,
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed information about a specific user by ID."""
    logger.info(f"Fetching user profile for user_id: {user_id}")
    
    # Subquery: count worklets for this user
    worklet_count_sq = (
        db.query(
            UserWorkletAssociation.user_id,
            func.count(UserWorkletAssociation.worklet_id).label("worklet_count"),
        )
        .filter(UserWorkletAssociation.user_id == user_id)
        .group_by(UserWorkletAssociation.user_id)
        .subquery()
    )
    
    result = (
        db.query(
            User,
            College.college_name,
            func.coalesce(worklet_count_sq.c.worklet_count, 0).label("worklet_count"),
        )
        .options(joinedload(User.profile))
        .outerjoin(College, User.college_id == College.college_id)
        .outerjoin(worklet_count_sq, User.id == worklet_count_sq.c.user_id)
        .filter(User.id == user_id)
        .first()
    )
    
    if not result:
        logger.error(f"User not found with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    user, college_name, wc = result
    logger.info(f"Found user: {user.name}, role: {user.role}, college: {college_name}")
    
    # Get student_id from profile if available
    student_id = None
    try:
        if user.profile:
            student_id = user.profile.student_id
    except Exception as e:
        logger.warning(f"Error accessing profile for user {user_id}: {e}")
    
    response_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "college_id": user.college_id,
        "college_name": college_name,
        "student_id": student_id,
        "is_active": user.is_active,
        "profile_completed": user.profile_completed,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "worklet_count": wc,
    }
    
    logger.info(f"Returning user data: {response_data}")
    return response_data


# ─── GET /users/{user_id}/worklets ───────────────────────────────────

@router.get("/users/{user_id}/worklets")
def get_user_worklets(
    user_id: int,
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Get all worklets associated with a specific user."""
    logger.info(f"Fetching worklets for user_id: {user_id}")
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User not found with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get worklet associations with worklet details
    worklet_associations = (
        db.query(UserWorkletAssociation, Worklet)
        .join(Worklet, UserWorkletAssociation.worklet_id == Worklet.id)
        .filter(UserWorkletAssociation.user_id == user_id)
        .order_by(Worklet.created_on.desc())
        .all()
    )
    
    worklets = []
    for association, worklet in worklet_associations:
        # Get mentor information if available
        mentor_name = None
        if worklet.created_mentor_id:
            mentor = db.query(User).filter(User.id == worklet.created_mentor_id).first()
            if mentor:
                mentor_name = mentor.name
        
        # Determine status based on worklet progress and dates
        status = "Pending"
        if worklet.worklet_progress >= 100:
            status = "Completed"
        elif worklet.worklet_progress > 0:
            status = "In Progress"
        
        # Format certificate ID
        certificate_id = worklet.cert_id or f"WL-{worklet.id:04d}"
        
        worklet_data = {
            "id": worklet.id,
            "title": worklet.title,
            "worklet_name": worklet.title,  # Alias for compatibility
            "description": worklet.problem_statement or worklet.expectation,
            "certificate_id": certificate_id,
            "status": status,
            "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
            "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
            "mentor_id": worklet.created_mentor_id,
            "mentor_name": mentor_name,
            "evaluation_score": 0,  # Default since not in current schema
            "progress": worklet.worklet_progress or 0,
            "created_at": worklet.created_on.isoformat() if worklet.created_on else None,
            "role_in_worklet": association.role_in_worklet,
            "tech_domain_id": worklet.tech_domain_id,
            "github_url": worklet.github_url,
            "prerequisites": worklet.prerequisites,
            "expectations": worklet.expectation,
        }
        worklets.append(worklet_data)
    
    logger.info(f"Found {len(worklets)} worklets for user {user_id}")
    return {"worklets": worklets, "total": len(worklets)}


# ─── PATCH /users/{user_id}/toggle-active ────────────────────────────

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    admin: User = Depends(_get_admin_user),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user (toggle is_active)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
    }
