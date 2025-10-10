from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import College, Worklet, User, UserWorkletAssociation
from app.schemas import CollegeOut, WorkletOut, StudentOut

router = APIRouter(
    prefix="/colleges",
    tags=["colleges"]
)

# Get all colleges with summary stats
def get_college_stats(college: College, db: Session):
    worklets = db.query(Worklet).filter(Worklet.college_id == college.college_id).all()
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
        if hasattr(w, "performance_status"):
            if w.performance_status == "Excellent":
                stats["excellentCount"] += 1
            elif w.performance_status == "Good":
                stats["goodCount"] += 1
            elif w.performance_status == "Needs Attention":
                stats["needsAttentionCount"] += 1
        if hasattr(w, "status"):
            if w.status == "Completed":
                stats["completedCount"] += 1
            elif w.status == "Ongoing":
                stats["ongoingCount"] += 1
            elif w.status == "On Hold":
                stats["onHoldCount"] += 1
            elif w.status == "Terminated":
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
    worklets = db.query(Worklet).filter(Worklet.college_id == college_id).all()
    return worklets

@router.get("/{college_id}/students", response_model=List[StudentOut])
def get_college_students(college_id: int, db: Session = Depends(get_db)):
    # Return all students whose User.college_id matches
    students = db.query(User).filter(User.college_id == college_id, User.role == "Student").all()
    return students

# Add more routes as needed for create/update/delete colleges, worklets, etc.
