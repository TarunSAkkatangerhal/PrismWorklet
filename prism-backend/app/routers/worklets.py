from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models import Worklet, User, UserWorkletAssociation
from app.schemas import WorkletCreate, WorkletUpdate, WorkletResponse
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.email_utils import send_activity_email

# Helper utility to collect student recipients for a worklet
def _get_students_for_worklet(db: Session, worklet_id: int):
    """Return list of dicts with student name & email for given worklet id."""
    students = (
        db.query(User.name, User.email)
        .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
        .filter(
            UserWorkletAssociation.worklet_id == worklet_id,
            UserWorkletAssociation.role_in_worklet == "Student",
        )
        .all()
    )
    return [{"name": s.name, "email": s.email} for s in students if s.email]

router = APIRouter()

@router.post("/", response_model=WorkletResponse, status_code=status.HTTP_201_CREATED)
def create_worklet(worklet_in: WorkletCreate, db: Session = Depends(get_db)):
    # Create worklet using new schema fields (no direct mentor mapping here)
    worklet = Worklet(**worklet_in.dict())
    db.add(worklet)
    db.commit()
    db.refresh(worklet)
    return worklet

@router.get("/", response_model=List[WorkletResponse])
def list_worklets(year: Optional[int] = None, db: Session = Depends(get_db)):
    # Eager-load College relationship to avoid N+1 queries and ensure non-null college when linked
    query = db.query(Worklet).options(joinedload(Worklet.college))
    if year is not None:
        query = query.filter(Worklet.year == year)
    worklets = query.all()
    response = []
    for w in worklets:
        progress = getattr(w, 'worklet_progress', None)
        if progress is None:
            if w.start_date and w.end_date:
                try:
                    total_days = (w.end_date - w.start_date).days or 1
                    elapsed_days = (datetime.utcnow().date() - w.start_date).days
                    if elapsed_days < 0:
                        elapsed_days = 0
                    progress = max(0, min(100, int((elapsed_days / total_days) * 100)))
                except Exception:
                    progress = 0
            else:
                progress = 0

        # Gather students (names just for counting) via association
        assoc_students = db.query(User).join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id) \
            .filter(UserWorkletAssociation.worklet_id == w.id, UserWorkletAssociation.role_in_worklet == "Student").all()
        student_count = len(assoc_students)
        # Prefer direct college relation on Worklet; fallback to first student or mentor
        college_id = w.college.college_id if getattr(w, "college", None) else None
        college_name = w.college.college_name if getattr(w, "college", None) else None
        if college_name is None:
            # Determine college from first student or None
            for stu in assoc_students:
                if getattr(stu, 'college', None):
                    college_name = stu.college
                    break
            # Fallback: try mentor college
            if college_name is None:
                mentor_assoc = db.query(User).join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id) \
                    .filter(UserWorkletAssociation.worklet_id == w.id, UserWorkletAssociation.role_in_worklet == "Mentor").first()
                if mentor_assoc and getattr(mentor_assoc, 'college', None):
                    college_name = mentor_assoc.college

        response.append({
            'id': w.id,
            'cert_id': w.cert_id,
            'title': w.title,
            'description': w.description,
            'start_date': w.start_date,
            'end_date': w.end_date,
            'created_at': w.created_at,
            'updated_at': w.updated_at,
            'year': w.year,
            'domain': w.domain,
            'status': w.status,
            'worklet_progress': progress,
            'college_id': college_id,
            'college': college_name,
            'student_count': student_count
        })
    return response

@router.get("/{worklet_identifier}")
def get_worklet_flexible(worklet_identifier: str, db: Session = Depends(get_db)):
    """
    Get worklet by either integer ID or cert_id string
    Examples: /worklets/6 or /worklets/25TST04WT
    """
    worklet = None
    
    # Try to parse as integer first
    try:
        worklet_id = int(worklet_identifier)
        worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    except ValueError:
        # If not an integer, treat as cert_id
        worklet = db.query(Worklet).filter(Worklet.cert_id == worklet_identifier).first()
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")

    # Derive percentage completion if not explicitly stored
    percentage_completion = getattr(worklet, "worklet_progress", None)
    if percentage_completion is None:
        # Derive if missing
        if worklet.start_date and worklet.end_date:
            try:
                total_days = (worklet.end_date - worklet.start_date).days or 1
                elapsed_days = (datetime.utcnow().date() - worklet.start_date).days
                if elapsed_days < 0:
                    elapsed_days = 0
                percentage_completion = max(0, min(100, int((elapsed_days / total_days) * 100)))
            except Exception:
                percentage_completion = 0
        else:
            percentage_completion = 0

    if worklet.status == "Completed":
        quality = "Excellence"
    elif percentage_completion >= 70:
        quality = "Excellence"
    elif percentage_completion >= 30:
        quality = "Good"
    else:
        quality = "Needs Attention"

    # Collect students (names + emails) if associations exist
    student_records = _get_students_for_worklet(db, worklet.id)
    students = [s.get("name") for s in student_records if s.get("name")]  # names list for backward compat

    # Collect professors associated with this worklet
    professor_users = (
        db.query(User)
        .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
        .filter(
            UserWorkletAssociation.worklet_id == worklet.id,
            UserWorkletAssociation.role_in_worklet == "Professor",
        )
        .all()
    )
    professors = [p.name for p in professor_users if getattr(p, "name", None)]

    return {
        "id": worklet.id,
        "cert_id": worklet.cert_id,
        "title": worklet.title,
        "description": worklet.description,
        "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
        "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
        "created_at": worklet.created_at.isoformat() if worklet.created_at else None,
        "updated_at": worklet.updated_at.isoformat() if worklet.updated_at else None,
        "year": worklet.year,
        "domain": worklet.domain,
        "status": worklet.status,
        "percentage_completion": percentage_completion,
        "worklet_progress": percentage_completion,
        "quality": quality,
        "students": students,
        "student_count": len(students),
        "professors": professors,
        "professor_count": len(professors),
    }

@router.put("/{worklet_id}", response_model=WorkletResponse)
def update_worklet(worklet_id: int, worklet_in: WorkletUpdate, db: Session = Depends(get_db)):
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    for field, value in worklet_in.dict(exclude_unset=True).items():
        setattr(worklet, field, value)
    db.commit()
    db.refresh(worklet)
    return worklet

@router.delete("/{worklet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worklet(worklet_id: int, db: Session = Depends(get_db)):
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    db.delete(worklet)
    db.commit()
    return None

# ----------------- Mentor Worklets -----------------
@router.get("/mentor/{mentor_email}/worklets")
def get_mentor_worklets(mentor_email: str, db: Session = Depends(get_db), only_ongoing: bool = False):
    try:
        mentor = db.query(User).filter(User.email == mentor_email, User.role == "Mentor").first()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")

        # Robust join to get all worklets for which this user is a mentor
        query = db.query(Worklet).join(UserWorkletAssociation, Worklet.id == UserWorkletAssociation.worklet_id)
        query = query.filter(UserWorkletAssociation.user_id == mentor.id, UserWorkletAssociation.role_in_worklet == "Mentor")
        if only_ongoing:
            query = query.filter(Worklet.status == "Ongoing")
        worklets = query.all()

        worklets_data = []
        mentee_set = set()
        for worklet in worklets:
            student_assocs = db.query(UserWorkletAssociation).filter(
                UserWorkletAssociation.worklet_id == worklet.id,
                UserWorkletAssociation.role_in_worklet == "Student"
            ).all()
            student_ids = [assoc.user_id for assoc in student_assocs]
            students = []
            worklet_college = None
            if student_ids:
                student_users = db.query(User).filter(User.id.in_(student_ids)).all()
                students = [u.name for u in student_users if u.name]
                # Determine college from first student with a college
                for su in student_users:
                    if getattr(su, 'college', None):
                        worklet_college = su.college
                        break
                for s in students:
                    mentee_set.add(s)

            # Fallback to mentor's college if no student college found
            if worklet_college is None:
                worklet_college = mentor.college

            percentage_completion = getattr(worklet, "percentage_completion", None)
            if percentage_completion is None:
                if worklet.start_date and worklet.end_date:
                    total_days = (worklet.end_date - worklet.start_date).days or 1
                    elapsed_days = (datetime.utcnow().date() - worklet.start_date).days
                    percentage_completion = max(0, min(100, int((elapsed_days / total_days) * 100)))
                else:
                    percentage_completion = 0

            if worklet.status == "Completed":
                quality = "Excellence"
            elif percentage_completion >= 70:
                quality = "Excellence"
            elif percentage_completion >= 30:
                quality = "Good"
            else:
                quality = "Needs Attention"

            worklets_data.append({
                "id": worklet.id,
                "cert_id": worklet.cert_id,
                "title": getattr(worklet, "title", None),
                "description": worklet.description,
                "status": worklet.status,
                "team": getattr(worklet, "team", None),
                "college": worklet_college,
                "problem_statement": getattr(worklet, "problem_statement", None),
                "expectations": getattr(worklet, "expectations", None),
                "prerequisites": getattr(worklet, "prerequisites", None),
                "worklet_progress": getattr(worklet, "worklet_progress", None),
                "percentage_completion": percentage_completion,
                "quality": quality,
                "students": students,
                "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
                "end_date": worklet.end_date.isoformat() if worklet.end_date else None
            })

        return {
            "worklets": worklets_data,
            "total_worklets": len(worklets_data),
            "total_mentees": len(mentee_set)
        }
    except Exception as e:
        print(f"Error fetching mentor worklets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ----------------- Students for Worklet -----------------
@router.get("/{worklet_identifier}/students")
def get_students_for_worklet_flexible(worklet_identifier: str, db: Session = Depends(get_db)):
    """
    Get students for worklet by either integer ID or cert_id string
    Examples: /worklets/6/students or /worklets/25TST04WT/students
    """
    worklet = None
    
    # Try to parse as integer first
    try:
        worklet_id = int(worklet_identifier)
        worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    except ValueError:
        # If not an integer, treat as cert_id
        worklet = db.query(Worklet).filter(Worklet.cert_id == worklet_identifier).first()
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # For now, return dummy student data as the association table might not be properly set up
    dummy_students = [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "college": "Sample College",
            "university": "Sample University"
        },
        {
            "id": 2,
            "name": "Jane Smith", 
            "email": "jane.smith@example.com",
            "college": "Sample College",
            "university": "Sample University"
        }
    ]
    
    return dummy_students

@router.get("/cert/{cert_id}/students")
def get_students_for_worklet_by_cert_id(cert_id: str, db: Session = Depends(get_db)):
    # Check if worklet exists by cert_id
    worklet = db.query(Worklet).filter(Worklet.cert_id == cert_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # For now, return dummy student data as the association table might not be properly set up
    dummy_students = [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "college": "Sample College",
            "university": "Sample University"
        },
        {
            "id": 2,
            "name": "Jane Smith", 
            "email": "jane.smith@example.com",
            "college": "Sample College",
            "university": "Sample University"
        }
    ]
    
    return dummy_students

# ----------------- Request Update -----------------
class RequestUpdateSchema(BaseModel):
    message: str
    priority: Optional[str] = "medium"

@router.post("/{worklet_identifier}/request-update")
def request_worklet_update_flexible(worklet_identifier: str, request_data: RequestUpdateSchema, db: Session = Depends(get_db)):
    """
    Request update for worklet by either integer ID or cert_id string
    Examples: POST /worklets/6/request-update or POST /worklets/25TST04WT/request-update
    """
    worklet = None
    
    # Try to parse as integer first
    try:
        worklet_id = int(worklet_identifier)
        worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    except ValueError:
        # If not an integer, treat as cert_id
        worklet = db.query(Worklet).filter(Worklet.cert_id == worklet_identifier).first()
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Fetch dynamic students
    student_records = _get_students_for_worklet(db, worklet.id)
    student_emails = [s["email"] for s in student_records]

    email_sent = False
    if student_emails:
        email_subject = f"Update Request for Worklet {worklet.cert_id}"
        email_message = (
            f"A mentor has requested an update for your worklet.\n\n"
            f"Message: {request_data.message}\nPriority: {request_data.priority}"
        )
        email_sent = send_activity_email(student_emails, email_subject, email_message, "Request Update")

    return {
        "message": "Update request submitted successfully",
        "worklet_identifier": worklet_identifier,
        "worklet_cert_id": worklet.cert_id,
        "request_data": request_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "student_emails": student_emails,
        "timestamp": datetime.now().isoformat(),
    }

# ----------------- Submit Feedback -----------------
class FeedbackSchema(BaseModel):
    worklet_id: int
    feedback_content: str
    month: Optional[str] = None
    rating: Optional[int] = None

@router.post("/submit-feedback")
def submit_feedback(feedback_data: FeedbackSchema, db: Session = Depends(get_db)):
    # Check if worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == feedback_data.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Fetch dynamic students
    student_records = _get_students_for_worklet(db, worklet.id)
    student_emails = [s["email"] for s in student_records]

    email_sent = False
    if student_emails:
        email_subject = f"Feedback for Worklet {worklet.cert_id}"
        email_message = (
            f"Your mentor has provided feedback for your worklet.\n\n"
            f"Feedback: {feedback_data.feedback_content}"
        )
        if feedback_data.month:
            email_message += f"\nMonth: {feedback_data.month}"
        if feedback_data.rating:
            email_message += f"\nRating: {feedback_data.rating}/5"
        email_sent = send_activity_email(student_emails, email_subject, email_message, "Submit Feedback")

    return {
        "message": "Feedback submitted successfully",
        "feedback_data": feedback_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "student_emails": student_emails,
        "timestamp": datetime.now().isoformat(),
    }

# ----------------- Submit Suggestion -----------------
class SuggestionSchema(BaseModel):
    worklet_id: int
    suggestion_title: str
    suggestion_content: str

@router.post("/submit-suggestion")
def submit_suggestion(suggestion_data: SuggestionSchema, db: Session = Depends(get_db)):
    # Check if worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == suggestion_data.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Fetch dynamic students
    student_records = _get_students_for_worklet(db, worklet.id)
    student_emails = [s["email"] for s in student_records]

    email_sent = False
    if student_emails:
        email_subject = f"New Suggestion for Worklet {worklet.cert_id}"
        email_message = (
            f"A mentor has shared a suggestion for your worklet.\n\n"
            f"Title: {suggestion_data.suggestion_title}\nSuggestion: {suggestion_data.suggestion_content}"
        )
        email_sent = send_activity_email(student_emails, email_subject, email_message, "Share Suggestion")

    return {
        "message": "Suggestion submitted successfully",
        "suggestion_data": suggestion_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "student_emails": student_emails,
        "timestamp": datetime.now().isoformat(),
    }

# Flexible suggestion endpoint that accepts cert_id
class SuggestionSchemaFlexible(BaseModel):
    worklet_identifier: str  # Can be either integer ID or cert_id string
    suggestion_title: str
    suggestion_content: str

@router.post("/submit-suggestion-flexible")
def submit_suggestion_flexible(suggestion_data: SuggestionSchemaFlexible, db: Session = Depends(get_db)):
    """
    Submit suggestion for worklet by either integer ID or cert_id string
    Examples: worklet_identifier can be 6 or "25TST04WT"
    """
    worklet = None
    
    # Try to parse as integer first
    try:
        worklet_id = int(suggestion_data.worklet_identifier)
        worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    except ValueError:
        # If not an integer, treat as cert_id
        worklet = db.query(Worklet).filter(Worklet.cert_id == suggestion_data.worklet_identifier).first()
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Fetch dynamic students
    student_records = _get_students_for_worklet(db, worklet.id)
    student_emails = [s["email"] for s in student_records]

    email_sent = False
    if student_emails:
        email_subject = f"New Suggestion for Worklet {worklet.cert_id}"
        email_message = (
            f"A mentor has shared a suggestion for your worklet.\n\n"
            f"Title: {suggestion_data.suggestion_title}\nSuggestion: {suggestion_data.suggestion_content}"
        )
        email_sent = send_activity_email(student_emails, email_subject, email_message, "Share Suggestion")

    return {
        "message": "Suggestion submitted successfully",
        "suggestion_data": {
            "worklet_identifier": suggestion_data.worklet_identifier,
            "worklet_cert_id": worklet.cert_id,
            "suggestion_title": suggestion_data.suggestion_title,
            "suggestion_content": suggestion_data.suggestion_content,
        },
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "student_emails": student_emails,
        "timestamp": datetime.now().isoformat(),
    }

# ----------------- Completed Worklets for Mentor -----------------  
@router.get("/completed/{mentor_email}", tags=["worklets"])
def get_completed_worklets_for_mentor(mentor_email: str, db: Session = Depends(get_db)):
    # Decode URL-encoded email
    import urllib.parse
    mentor_email = urllib.parse.unquote(mentor_email)
    
    # For now, return all completed worklets (mentor filter will be added via associations)
    completed_worklets = db.query(Worklet).filter(Worklet.status == "Completed").all()
    
    # Convert to dict format
    worklets_data = []
    for worklet in completed_worklets:
        worklets_data.append({
            "id": worklet.id,
            "cert_id": worklet.cert_id,
            "title": worklet.title,
            "description": worklet.description,
            "status": worklet.status,
            "domain": worklet.domain,
            "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
            "end_date": worklet.end_date.isoformat() if worklet.end_date else None
        })
    
    return worklets_data

# ----------------- Internship Referral -----------------
class InternshipReferralSchema(BaseModel):
    worklet_id: int
    selected_students: List[str]  # List of student emails
    referral_message: str
    company_name: Optional[str] = None
    position_title: Optional[str] = None

@router.post("/internship-referral")
def submit_internship_referral(referral_data: InternshipReferralSchema, db: Session = Depends(get_db)):
    # Check if worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == referral_data.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Send emails to selected students
    email_subject = f"Internship Referral Opportunity"
    if referral_data.company_name:
        email_subject += f" at {referral_data.company_name}"
    
    email_message = f"Congratulations! Your mentor has referred you for an internship opportunity.\n\n"
    if referral_data.company_name:
        email_message += f"Company: {referral_data.company_name}\n"
    if referral_data.position_title:
        email_message += f"Position: {referral_data.position_title}\n"
    email_message += f"Worklet: {worklet.cert_id}\n\nMessage from your mentor:\n{referral_data.referral_message}"
    
    email_sent = send_activity_email(referral_data.selected_students, email_subject, email_message, "Internship Referral")
    
    return {
        "message": "Internship referral submitted successfully",
        "referral_data": referral_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(referral_data.selected_students),
        "timestamp": datetime.now().isoformat()
    }
