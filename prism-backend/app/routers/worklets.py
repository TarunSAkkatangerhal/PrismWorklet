from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Worklet, User, UserWorkletAssociation
from app.schemas import WorkletCreate, WorkletUpdate, WorkletResponse
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.email_utils import send_activity_email
from app.auth import oauth2_scheme, require_access_token
from app.routers.helpers.worklet_helpers import (
    calculate_worklet_progress,
    get_worklet_college,
    get_worklet_students,
    map_status_text
)
from app.services.worklet_service import WorkletService
import logging
logger = logging.getLogger(__name__)

# Helper utility to collect student recipients for a worklet
def _get_students_for_worklet(db: Session, worklet_id: int):
    """
    Return list of dicts with student name & email for given worklet id.
    DEPRECATED: Use WorkletService.get_students_for_worklet() instead.
    """
    return WorkletService.get_students_for_worklet(db, worklet_id)

router = APIRouter()

# Support both trailing-slash and no-slash for root collection routes
@router.post("", response_model=WorkletResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=WorkletResponse, status_code=status.HTTP_201_CREATED)
def create_worklet(worklet_in: WorkletCreate, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Map input to Prism_Worklet columns
    creator_id = None
    try:
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if user_email:
            user = db.query(User).filter(User.email == user_email).first()
            creator_id = user.id if user else None
    except Exception:
        creator_id = None

    # Validate required fields for Prism_Worklet
    if not worklet_in.title:
        raise HTTPException(status_code=400, detail="title is required")
    if not worklet_in.start_date or not worklet_in.end_date:
        raise HTTPException(status_code=400, detail="start_date and end_date are required")

    # Map status to StatusID (new mapping, default On Going=1)
    # Accept both 'On Going' and 'Ongoing' inbound
    status_to_id = {"To Start": 0, "On Going": 1, "Ongoing": 1, "Completed": 2, "On Hold": 3, "Dropped": 4}
    status_text = (worklet_in.status.value if hasattr(worklet_in.status, 'value') else worklet_in.status) or "On Going"
    status_id = status_to_id.get(status_text, 1)

    tech_domain_id = None
    if worklet_in.domain is not None:
        try:
            tech_domain_id = int(str(worklet_in.domain).strip())
        except Exception:
            tech_domain_id = None
    if tech_domain_id is None:
        tech_domain_id = 0  # Prism requires NOT NULL

    worklet = Worklet(
        title=worklet_in.title,
        cert_id=worklet_in.cert_id,
        problem_statement=worklet_in.problem_statement or worklet_in.description,
        expectation=worklet_in.expectation,
        prerequisites=worklet_in.prerequisites,
        start_date=worklet_in.start_date,
        end_date=worklet_in.end_date,
        worklet_progress=0,
        status_id=status_id,
        tech_domain_id=tech_domain_id,
        created_on=datetime.utcnow(),
        created_mentor_id=creator_id or 0,
        is_active=1,
        college_id=worklet_in.college_id if getattr(worklet_in, 'college_id', None) is not None else None,
    )
    db.add(worklet)
    db.commit()
    db.refresh(worklet)
    return worklet

@router.get("", response_model=List[WorkletResponse], include_in_schema=False)
@router.get("/", response_model=List[WorkletResponse])
def list_worklets(year: Optional[int] = None, db: Session = Depends(get_db)):
    """List worklets from the new DB shape with optional year filtering.
    Year is derived from start_date/end_date when not explicitly stored.
    """
    worklets = db.query(Worklet).all()
    response: List[dict] = []
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
        assoc_students = (
            db.query(User)
            .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id == w.id,
                UserWorkletAssociation.role_in_worklet == "Student",
            )
            .all()
        )
        student_count = len(assoc_students)
        # Prefer worklet's own college assignment; fallback to associations
        college_id = getattr(w, 'college_id', None)
        college_name = w.college_rel.college_name if getattr(w, 'college_rel', None) else None
        if college_name is None:
            # Determine college from first student if available
            for stu in assoc_students:
                if getattr(stu, "college", None):
                    college_name = stu.college
                    college_id = getattr(stu, "college_id", None)
                    break
        if college_name is None:
            # Fallback: try mentor college if no student college found
            mentor_assoc = (
                db.query(User)
                .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
                .filter(
                    UserWorkletAssociation.worklet_id == w.id,
                    UserWorkletAssociation.role_in_worklet == "Mentor",
                )
                .first()
            )
            if mentor_assoc and getattr(mentor_assoc, "college", None):
                college_name = mentor_assoc.college
                college_id = getattr(mentor_assoc, "college_id", None)

        # Map status_id to textual status for API compatibility (normalize to 'Ongoing')
        status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
        status_text = status_map.get(getattr(w, 'status_id', None), "Ongoing")

        # Derive a year from date range (fallback to current year)
        derived_year: Optional[int] = None
        try:
            if getattr(w, "start_date", None):
                derived_year = w.start_date.year
            elif getattr(w, "end_date", None):
                derived_year = w.end_date.year
        except Exception:
            derived_year = None

        # Apply year filter if provided
        if year is not None and derived_year is not None and int(derived_year) != int(year):
            continue

        # Derive GitHub repo info if available
        github_url = getattr(w, 'github_url', None)
        repo_name = None
        try:
            if isinstance(github_url, str) and 'github.com' in github_url:
                # extract owner/repo
                import re
                m = re.search(r"github\.com/([^/]+/[^/]+)", github_url)
                if m:
                    repo_name = m.group(1)
        except Exception:
            repo_name = None

        response.append({
            'id': w.id,
            'cert_id': str(w.cert_id) if getattr(w, 'cert_id', None) is not None else str(w.id),
            'title': w.title,
            'description': getattr(w, 'problem_statement', None),
            'start_date': w.start_date,
            'end_date': w.end_date,
            'created_at': w.created_at,
            'updated_at': w.updated_at,
            'year': derived_year if derived_year is not None else datetime.utcnow().year,
            'domain': getattr(w, 'domain', None),
            'status': status_text,
            'worklet_progress': progress,
            'college_id': college_id,
            'college': college_name,
            'student_count': student_count,
            'github_repo_url': github_url,
            'github_repo': repo_name,
            'performance': getattr(w, 'Performance', None)
        })
    return response

# ----------------- Student Worklets (Authenticated) -----------------
@router.get("/student/me", tags=["worklets"])
def get_student_worklets_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Return worklets associated to the authenticated user as a Student.
    Response shape mirrors list_worklets for frontend compatibility.
    
    Now uses centralized WorkletService for consistent data formatting.
    """
    try:
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        student = db.query(User).filter(User.email == user_email).first()
        if not student:
            raise HTTPException(status_code=404, detail="User not found")

        # Use service to get worklets for student
        return WorkletService.get_worklets_for_student(db, student.id)

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"Error fetching student worklets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{worklet_identifier}")
def get_worklet_flexible(worklet_identifier: str, db: Session = Depends(get_db)):
    """
    Get worklet by either integer ID or cert_id string
    Examples: /worklets/6 or /worklets/25TST04WT
    
    Now uses centralized WorkletService for consistent data formatting.
    """
    # Use service to get worklet by identifier
    worklet = WorkletService.get_worklet_by_identifier(db, worklet_identifier)
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Use service to format worklet with all details
    return WorkletService.format_worklet_detail(
        db=db,
        worklet=worklet,
        include_students=True,
        include_mentors=False,
        include_professors=True,
        include_performance=True
    )

@router.put("/{worklet_id}", response_model=WorkletResponse)
def update_worklet(worklet_id: int, worklet_in: WorkletUpdate, db: Session = Depends(get_db)):
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")

    payload = worklet_in.dict(exclude_unset=True)
    # Map fields to Prism columns
    if "title" in payload:
        worklet.title = payload["title"]
    if "cert_id" in payload:
        worklet.cert_id = payload["cert_id"]
    if "problem_statement" in payload or "description" in payload:
        worklet.problem_statement = payload.get("problem_statement") or payload.get("description")
    if "expectation" in payload:
        worklet.expectation = payload["expectation"]
    if "prerequisites" in payload:
        worklet.prerequisites = payload["prerequisites"]
    if "start_date" in payload:
        worklet.start_date = payload["start_date"]
    if "end_date" in payload:
        worklet.end_date = payload["end_date"]
    if "status" in payload and payload["status"] is not None:
        status_to_id = {"To Start": 0, "On Going": 1, "Ongoing": 1, "Completed": 2, "On Hold": 3, "Dropped": 4}
        status_text = payload["status"].value if hasattr(payload["status"], 'value') else payload["status"]
        worklet.status_id = status_to_id.get(status_text, worklet.status_id)
    if "domain" in payload and payload["domain"] is not None:
        try:
            worklet.tech_domain_id = int(str(payload["domain"]))
        except Exception:
            pass
    if "college_id" in payload:
        worklet.college_id = payload["college_id"]
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

# ----------------- Mentor Worklets (Email-based lookup) -----------------
@router.get("/mentor/{mentor_email}/worklets")
def get_mentor_worklets_by_email(mentor_email: str, db: Session = Depends(get_db), only_ongoing: bool = False):
    """
    Get worklets for a mentor using their email address.
    
    DEPRECATED: For new code, prefer /api/associations/mentor/{mentor_id}/worklets which uses ID.
    This endpoint is kept for backward compatibility with legacy frontends.
    Email-based lookup is less secure and slower than ID-based lookup.
    
    Query Parameters:
    - only_ongoing: If true, returns only worklets with status "Ongoing"
    
    Returns worklets with students, progress, and performance data.
    Now uses centralized WorkletService for consistent data formatting.
    """
    try:
        # Find mentor by email
        mentor = db.query(User).filter(User.email == mentor_email, User.role == "Mentor").first()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")

        # Use service layer with status filter
        status_filter = "ongoing" if only_ongoing else None
        result = WorkletService.get_worklets_for_mentor(
            db=db,
            mentor_id=mentor.id,
            status_filter=status_filter,
            include_performance=True
        )
        
        if result is None:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Return in legacy format for backward compatibility
        return {
            "worklets": result["worklets"],
            "total_worklets": result["total_worklets"],
            "total_mentees": result["total_mentees"]
        }
    except Exception as e:
        logger.info(f"Error fetching mentor worklets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ----------------- Students for Worklet -----------------
@router.get("/{worklet_identifier}/students")
def get_students_for_worklet_flexible(worklet_identifier: str, db: Session = Depends(get_db)):
    """
    Return real student associations for a worklet by numeric id or cert_id.
    Now uses centralized WorkletService for consistent data handling.
    """
    # Use service to resolve identifier
    worklet = WorkletService.get_worklet_by_identifier(db, worklet_identifier)
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")

    # Gather students via association using service
    students = (
        db.query(User)
        .join(UserWorkletAssociation, User.id == UserWorkletAssociation.user_id)
        .filter(
            UserWorkletAssociation.worklet_id == worklet.id,
            UserWorkletAssociation.role_in_worklet == "Student",
        )
        .all()
    )
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "college": s.college,
        }
        for s in students
        if s.email
    ]

# ----------------- Request Update -----------------
class RequestUpdateSchema(BaseModel):
    message: str
    priority: Optional[str] = "medium"

@router.post("/{worklet_identifier}/request-update")
def request_worklet_update_flexible(worklet_identifier: str, request_data: RequestUpdateSchema, db: Session = Depends(get_db)):
    """
    Request update for worklet by either integer ID or cert_id string
    Examples: POST /worklets/6/request-update or POST /worklets/25TST04WT/request-update
    Now uses centralized WorkletService for identifier resolution.
    """
    # Use service to resolve identifier
    worklet = WorkletService.get_worklet_by_identifier(db, worklet_identifier)
    
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

# Flexible suggestion endpoint that accepts cert_id or numeric ID
class SuggestionSchemaFlexible(BaseModel):
    worklet_identifier: str  # Can be either integer ID or cert_id string
    suggestion_title: str
    suggestion_content: str

@router.post("/submit-suggestion")
def submit_suggestion_flexible(suggestion_data: SuggestionSchemaFlexible, db: Session = Depends(get_db)):
    """
    Submit suggestion for worklet by either integer ID or cert_id string
    Examples: worklet_identifier can be 6 or "25TST04WT"
    
    DEPRECATED: Use /suggestions/ POST endpoint instead which persists to database.
    This endpoint only sends emails without persistence.
    Now uses centralized WorkletService for identifier resolution.
    """
    # Use service to resolve identifier
    worklet = WorkletService.get_worklet_by_identifier(db, suggestion_data.worklet_identifier)
    
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

# Note: Completed-worklets and internship-referral routes removed as unused in current frontend
