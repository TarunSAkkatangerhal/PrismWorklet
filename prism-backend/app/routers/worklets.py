from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Worklet, User, UserWorkletAssociation
from app.schemas import WorkletCreate, WorkletUpdate, WorkletResponse
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from app.core.email_utils import send_activity_email
from app.auth import oauth2_scheme, require_access_token
from app.routers.helpers.worklet_helpers import (
    calculate_worklet_progress,
    get_worklet_college,
    get_worklet_students,
    map_status_text
)
from app.services.worklet_service import WorkletService
from app.core.constants import get_status_id, WORKLET_STATUS_MAP, normalize_performance
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

    # Map status to StatusID using centralized constants
    status_text = (worklet_in.status.value if hasattr(worklet_in.status, 'value') else worklet_in.status) or "Ongoing"
    status_id = get_status_id(status_text)

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
    Uses eager loading to avoid N+1 query problems.
    """
    from sqlalchemy.orm import joinedload
    
    # Eager load college and team relationships to avoid N+1 queries
    worklets = db.query(Worklet).options(
        joinedload(Worklet.college_rel),
        joinedload(Worklet.team_rel)
    ).all()
    
    # Batch fetch all student associations to avoid N+1 queries
    worklet_ids = [w.id for w in worklets]
    student_associations = {}
    if worklet_ids:
        assocs = (
            db.query(UserWorkletAssociation.worklet_id, User)
            .join(User, User.id == UserWorkletAssociation.user_id)
            .filter(
                UserWorkletAssociation.worklet_id.in_(worklet_ids),
                UserWorkletAssociation.role_in_worklet == "Student",
            )
            .all()
        )
        for worklet_id, user in assocs:
            if worklet_id not in student_associations:
                student_associations[worklet_id] = []
            student_associations[worklet_id].append(user)
    
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

        # Use pre-fetched student associations
        assoc_students = student_associations.get(w.id, [])
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
        
        # Note: Removed redundant mentor college fallback to avoid additional queries.
        # College should be assigned directly to worklet or through student associations.

        # Map status_id to textual status for API compatibility
        status_text = map_status_text(getattr(w, 'status_id', None))

        # Derive a year from date range (fallback to current year)
        derived_year: Optional[int] = None
        try:
            if getattr(w, "start_date", None):
                derived_year = w.start_date.year
            elif getattr(w, "end_date", None):
                derived_year = w.end_date.year
        except Exception:
            derived_year = None

        # Apply year filter if provided (using active window logic to match dashboard)
        if year is not None:
            # Check if worklet was active at any point during the specified year
            start_date = getattr(w, "start_date", None)
            end_date = getattr(w, "end_date", None) or datetime.utcnow().date()
            
            if start_date is not None:
                year_start = date(year, 1, 1)
                year_end = date(year, 12, 31)
                
                # Skip if worklet ended before year started or started after year ended
                if end_date < year_start or start_date > year_end:
                    continue
            else:
                # If no start date, skip this worklet when year filter is applied
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
        
        # Get team name from eager-loaded relationship
        team_name = None
        if w.team_rel:
            team_name = w.team_rel.team_name

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
            'team': team_name,
            'github_repo_url': github_url,
            'github_repo': repo_name,
            'performance': normalize_performance(getattr(w, 'Performance', None))
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
        logger.error(f"Error fetching student worklets for user: {e}", exc_info=True)
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
        status_text = payload["status"].value if hasattr(payload["status"], 'value') else payload["status"]
        worklet.status_id = get_status_id(status_text)
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

# Note: Use /suggestions/ POST endpoint for persisted suggestions instead of the deprecated
# /worklets/submit-suggestion endpoint which only sent emails without database persistence.

