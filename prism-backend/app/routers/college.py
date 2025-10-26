from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import College, Worklet, User, UserWorkletAssociation, Evaluation
from app.schemas import CollegeOut, WorkletOut, StudentOut

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
        "excellentCount": 0,
        "goodCount": 0,
        "needsAttentionCount": 0,
        "completedCount": 0,
        "ongoingCount": 0,
        "onHoldCount": 0,
        "terminatedCount": 0,
        "totalStudents": 0,
    }
    
    for w in worklets:
        # Calculate performance based on evaluation scores
        avg_score = db.query(func.avg(Evaluation.score)).filter(
            Evaluation.worklet_id == w.id
        ).scalar()
        
        if avg_score is not None:
            # Use evaluation score to determine performance
            if avg_score >= 85:
                stats["excellentCount"] += 1
            elif avg_score >= 70:
                stats["goodCount"] += 1
            else:
                stats["needsAttentionCount"] += 1
        else:
            # No evaluations - use progress and status instead
            progress = getattr(w, 'worklet_progress', 0) or 0
            status_id = getattr(w, 'status_id', None)
            
            # If completed, consider it good by default
            if status_id == 2:  # Completed
                stats["goodCount"] += 1
            # If ongoing with good progress (>= 70%), consider excellent
            elif status_id == 1 and progress >= 70:
                stats["excellentCount"] += 1
            # If ongoing with moderate progress (>= 40%), consider good
            elif status_id == 1 and progress >= 40:
                stats["goodCount"] += 1
            # If on hold, dropped, or low progress, needs attention
            elif status_id in [3, 4] or progress < 40:
                stats["needsAttentionCount"] += 1
            # Default case (To Start, etc.)
            else:
                stats["goodCount"] += 1
            
        # Count worklets by status (new mapping)
        status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
        status_text = status_map.get(getattr(w, 'status_id', None), "Ongoing")
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
    worklets = (
        db.query(Worklet).filter(Worklet.id.in_(worklet_id_set)).all() if worklet_id_set else []
    )

    response = []
    for worklet in worklets:
        student_rows = (
            db.query(User.name, User.email)
            .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id == worklet.id,
                UserWorkletAssociation.role_in_worklet == "Student",
            )
            .all()
        )
        assigned_students = [
            {"name": student.name, "email": student.email}
            for student in student_rows
            if student.email
        ]

        status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
        status_text = status_map.get(getattr(worklet, 'status_id', None), "Ongoing")
        response.append({
            "id": worklet.id,
            "title": worklet.title,
            "description": getattr(worklet, 'problem_statement', None),
            "assignedStudents": assigned_students,
            "performanceStatus": None,
            "progressStatus": status_text,
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
