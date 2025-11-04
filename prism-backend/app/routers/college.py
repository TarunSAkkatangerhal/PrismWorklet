from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import College, Worklet, User, UserWorkletAssociation, Evaluation
from app.schemas import CollegeOut, WorkletOut, StudentOut
from app.core.constants import WORKLET_STATUS_MAP, normalize_status_text, normalize_performance

router = APIRouter(
    prefix="/colleges",
    tags=["colleges"]
)

# Get all colleges with summary stats
def get_college_stats(college: College, db: Session):
    """Compute per-college stats based ONLY on Worklet.college_id.
    This ensures each worklet is counted in exactly one college.
    """
    # Count worklets only by direct college_id assignment
    # Do NOT use student associations to avoid double-counting
    worklets = (
        db.query(Worklet)
        .filter(Worklet.college_id == college.college_id)
        .all()
    )
    stats = {
        "workletCount": len(worklets),
        "veryGoodCount": 0,
        "goodCount": 0,
        "averageCount": 0,
        "poorCount": 0,
        "completedCount": 0,
        "ongoingCount": 0,
        "onHoldCount": 0,
        "terminatedCount": 0,
        "totalStudents": 0,
    }
    
    for w in worklets:
        # Use Performance column from Prism_Worklet table and normalize it
        raw_performance = getattr(w, 'Performance', None)
        performance = normalize_performance(raw_performance)
        
        # Count performance categories
        if performance == "Very Good":
            stats["veryGoodCount"] += 1
        elif performance == "Good":
            stats["goodCount"] += 1
        elif performance == "Average":
            stats["averageCount"] += 1
        elif performance == "Poor":
            stats["poorCount"] += 1
        # NA doesn't count in any category
            
        # Count worklets by status (using centralized constants)
        status_text = normalize_status_text(getattr(w, 'status_id', None))
        if status_text == "Completed":
            stats["completedCount"] += 1
        elif status_text in ("Ongoing", "To Start"):
            stats["ongoingCount"] += 1  # treat "To Start" with ongoing for summary continuity
        elif status_text == "On Hold":
            stats["onHoldCount"] += 1
        elif status_text in ["Dropped", "Terminated"]:
            stats["terminatedCount"] += 1

    # Count all students in the college using User.college_id
    total_students = db.query(User).filter(User.college_id == college.college_id, User.role == "Student").count()
    stats["totalStudents"] = total_students
    return stats

@router.get("", response_model=List[CollegeOut])
@router.get("/", response_model=List[CollegeOut])
def get_colleges(db: Session = Depends(get_db)):
    colleges = db.query(College).all()
    result = []
    for college in colleges:
        stats = get_college_stats(college, db)
        college_dict = college.__dict__.copy()
        college_dict.update(stats)
        result.append(college_dict)
    return result

@router.get("/{college_id}", response_model=CollegeOut)
def get_college(college_id: int, db: Session = Depends(get_db)):
    college = db.query(College).filter(College.college_id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    stats = get_college_stats(college, db)
    college_dict = college.__dict__.copy()
    college_dict.update(stats)
    return college_dict

@router.get("/{college_id}/worklets", response_model=List[WorkletOut])
def get_college_worklets(college_id: int, db: Session = Depends(get_db)):
    """Return worklets for a college.
    Priority: Worklet.college_id == college_id, plus any worklets inferred via
    associated users from that college. De-duplicate by id.
    OPTIMIZED: Uses bulk queries to avoid N+1 problem.
    """
    direct_ids = [r[0] for r in db.query(Worklet.id).filter(Worklet.college_id == college_id).all()]
    assoc_ids = [
        r[0]
        for r in db.query(UserWorkletAssociation.worklet_id)
        .join(User, User.id == UserWorkletAssociation.user_id)
        .filter(User.college_id == college_id)
        .distinct()
        .all()
    ]
    worklet_id_set = set(direct_ids) | set(assoc_ids)
    
    # Eager load team relationship to avoid N+1 queries
    from sqlalchemy.orm import joinedload
    worklets = (
        db.query(Worklet)
        .options(joinedload(Worklet.team_rel))
        .filter(Worklet.id.in_(worklet_id_set))
        .all() if worklet_id_set else []
    )

    # OPTIMIZATION: Bulk fetch all student associations for all worklets in one query
    students_by_worklet = {}
    if worklet_id_set:
        student_rows = (
            db.query(UserWorkletAssociation.worklet_id, User.name, User.email, User.college, User.college_id)
            .join(User, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id.in_(worklet_id_set),
                UserWorkletAssociation.role_in_worklet == "Student",
            )
            .all()
        )
        for worklet_id, name, email, college, college_id in student_rows:
            if worklet_id not in students_by_worklet:
                students_by_worklet[worklet_id] = []
            if email:
                students_by_worklet[worklet_id].append({
                    "name": name, 
                    "email": email,
                    "college": college,
                    "college_id": college_id
                })

    response = []
    for worklet in worklets:
        # Get students from pre-fetched map (no query per worklet)
        assigned_students = students_by_worklet.get(worklet.id, [])
        
        # Get team name from eager-loaded relationship
        team_name = None
        if worklet.team_rel:
            team_name = worklet.team_rel.team_name

        status_text = normalize_status_text(getattr(worklet, 'status_id', None))
        performance_text = normalize_performance(getattr(worklet, 'Performance', None))
        response.append({
            "id": worklet.id,
            "title": worklet.title,
            "description": getattr(worklet, 'problem_statement', None),
            "assignedStudents": assigned_students,
            "performanceStatus": performance_text,
            "progressStatus": status_text,
            "team": team_name,  # Add team name
            "collegeName": (
                worklet.college_rel.college_name
                if getattr(worklet, 'college_rel', None) and getattr(worklet.college_rel, 'college_name', None)
                else db.query(College.college_name).filter(College.college_id == college_id).scalar()
            ),
        })

    return response

@router.get("/{college_id}/students", response_model=List[StudentOut])
def get_college_students(college_id: int, db: Session = Depends(get_db)):
    # Return all students whose User.college_id matches
    students = db.query(User).filter(User.college_id == college_id, User.role == "Student").all()
    return students

# Add more routes as needed for create/update/delete colleges, worklets, etc.
