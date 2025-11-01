"""
Shared helper functions for worklet-related operations
Reduces code duplication across routers
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Worklet, User, UserWorkletAssociation
from app.schemas import WorkletRoleEnum
from app.core.constants import normalize_status_text, WORKLET_STATUS_MAP, normalize_performance


def map_status_text(status_id: Optional[int]) -> str:
    """
    Map status_id to human-readable text
    Uses centralized constants for consistency
    """
    return normalize_status_text(status_id)


def calculate_worklet_progress(worklet: Worklet) -> int:
    """
    Calculate worklet progress percentage
    Priority: 1) stored worklet_progress, 2) calculated from dates
    """
    percentage_completion = getattr(worklet, 'worklet_progress', None)
    
    if percentage_completion is None:
        start_date = getattr(worklet, 'start_date', None)
        end_date = getattr(worklet, 'end_date', None)
        
        if start_date and end_date:
            try:
                total_days = (end_date - start_date).days or 1
                elapsed_days = (datetime.utcnow().date() - start_date).days
                if elapsed_days < 0:
                    elapsed_days = 0
                percentage_completion = max(0, min(100, int((elapsed_days / total_days) * 100)))
            except Exception:
                percentage_completion = 0
        else:
            percentage_completion = 0
    
    return percentage_completion


def get_worklet_college(
    worklet: Worklet,
    students: List[User],
    mentor: Optional[User] = None
) -> tuple[Optional[str], Optional[int]]:
    """
    Determine worklet college with fallback priority:
    1. worklet.college_rel
    2. first student's college
    3. mentor's college
    
    Returns: (college_name, college_id)
    """
    college_name = None
    college_id = getattr(worklet, 'college_id', None)
    
    # Priority 1: worklet's own college
    if getattr(worklet, 'college_rel', None) and getattr(worklet.college_rel, 'college_name', None):
        college_name = worklet.college_rel.college_name
    
    # Priority 2: student's college
    if college_name is None:
        for student in students:
            if getattr(student, 'college', None):
                college_name = student.college
                if college_id is None:
                    college_id = getattr(student, 'college_id', None)
                break
    
    # Priority 3: mentor's college
    if college_name is None and mentor:
        college_name = getattr(mentor, 'college', None)
        if college_id is None:
            college_id = getattr(mentor, 'college_id', None)
    
    return college_name, college_id


def get_worklet_students(db: Session, worklet_id: int) -> List[User]:
    """
    Get all students associated with a worklet
    Returns list of User objects
    """
    student_associations = db.query(UserWorkletAssociation).filter(
        UserWorkletAssociation.worklet_id == worklet_id,
        UserWorkletAssociation.role_in_worklet.in_([
            WorkletRoleEnum.student.value,
            WorkletRoleEnum.student.value.lower()
        ])
    ).all()
    
    return [sa.user for sa in student_associations]


def format_student_response(student: User) -> Dict[str, Any]:
    """Format student data for API response"""
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "college": getattr(student, 'college', None),
        "college_id": getattr(student, 'college_id', None)
    }


def format_worklet_response(
    worklet: Worklet,
    students: List[User],
    mentor: Optional[User] = None,
    include_performance: bool = True
) -> Dict[str, Any]:
    """
    Format worklet data for API response
    Standardized across all worklet endpoints
    """
    college_name, college_id = get_worklet_college(worklet, students, mentor)
    percentage_completion = calculate_worklet_progress(worklet)
    status_text = map_status_text(getattr(worklet, 'status_id', None))
    
    worklet_data = {
        "id": worklet.id,
        "cert_id": worklet.cert_id,
        "title": worklet.title,
        "description": getattr(worklet, "problem_statement", None),
        "domain": getattr(worklet, "domain", None),
        "status": status_text,
        "start_date": getattr(worklet, 'start_date', None),
        "end_date": getattr(worklet, 'end_date', None),
        "college_id": college_id,
        "college": college_name,
        "percentage_completion": percentage_completion,
        "students": [format_student_response(s) for s in students],
        "student_count": len(students),
    }
    
    # Optionally include performance data
    if include_performance:
        raw_performance = getattr(worklet, 'Performance', None)
        worklet_data["performance"] = normalize_performance(raw_performance)
    
    return worklet_data
