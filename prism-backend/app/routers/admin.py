"""
Admin-only router for user management.
All endpoints require an authenticated user with role='Admin'.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List

from app.database import get_db
from app.models import User, UserProfile, UserWorkletAssociation, College
from app.auth import oauth2_scheme, decode_token
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────

def _get_admin_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Verify the caller is an Admin."""
    payload = decode_token(token)
    user = db.query(User).filter(User.email == payload.get("sub")).first()
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
