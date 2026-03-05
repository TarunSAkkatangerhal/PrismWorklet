from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
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
from app.routers.milestones import check_and_auto_increment_progress
from app.services.worklet_service import WorkletService
from app.core.constants import get_status_id, WORKLET_STATUS_MAP, normalize_performance, normalize_risk_status
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
            user_id_from_token = payload.get("user_id")
            if user_id_from_token:
                user = db.query(User).filter(User.id == user_id_from_token).first()
            else:
                user = db.query(User).filter(User.email == user_email, User.role == payload.get("role")).first()
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
def list_worklets(year: Optional[int] = None, domain: Optional[str] = None, team: Optional[str] = None, db: Session = Depends(get_db)):
    """List worklets from the new DB shape with optional year, domain, and team filtering.
    Year is derived from start_date/end_date when not explicitly stored.
    Uses eager loading to avoid N+1 query problems.
    """
    from sqlalchemy.orm import joinedload
    from app.models import TechDomain, TeamMG
    
    # Build base query with eager loading
    query = db.query(Worklet).options(
        joinedload(Worklet.college_rel),
        joinedload(Worklet.team_rel),
        joinedload(Worklet.stage_rel)
    )
    
    # Apply domain filter if provided
    if domain is not None and domain != "All":
        domain_obj = db.query(TechDomain).filter(TechDomain.domain_name == domain).first()
        if domain_obj:
            query = query.filter(Worklet.tech_domain_id == domain_obj.id)
    
    # Apply team filter if provided
    if team is not None and team != "All":
        team_obj = db.query(TeamMG).filter(TeamMG.team_name == team).first()
        if team_obj:
            query = query.filter(Worklet.team_mg_id == team_obj.id)
    
    worklets = query.all()
    
    # Batch fetch TechDomain names for all worklets to avoid N+1 queries
    tech_domain_ids = list(set(w.tech_domain_id for w in worklets if w.tech_domain_id is not None))
    domain_name_map = {}
    if tech_domain_ids:
        tech_domains = db.query(TechDomain).filter(TechDomain.id.in_(tech_domain_ids)).all()
        domain_name_map = {td.id: td.domain_name for td in tech_domains}
    
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

        # Apply year filter if provided (using start_date year to match dashboard)
        if year is not None:
            # Check if worklet started in the specified year
            start_date = getattr(w, "start_date", None)
            
            if start_date is not None:
                # Only include worklets that started in this year
                if start_date.year != year:
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

        # Get stage info from eager-loaded relationship
        stage_id = getattr(w, 'stage_id', None)
        stage_name = None
        if w.stage_rel:
            stage_name = w.stage_rel.stage

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
            'domain': domain_name_map.get(w.tech_domain_id) if w.tech_domain_id else None,
            'status': status_text,
            'worklet_progress': progress,
            'college_id': college_id,
            'college': college_name,
            'student_count': student_count,
            'team': team_name,
            'group_mg_id': getattr(w, 'group_mg_id', None),
            'stage_id': stage_id,
            'stage': stage_name,
            'github_repo_url': github_url,
            'github_repo': repo_name,
            'performance': normalize_performance(getattr(w, 'Performance', None)),
            'riskStatus': normalize_risk_status(getattr(w, 'RiskStatus', None))
        })
    return response

# ----------------- Groups (for filtering) -----------------
@router.get("/groups", tags=["worklets"])
def get_worklet_groups(db: Session = Depends(get_db)):
    """Return all unique group IDs for filter dropdowns."""
    try:
        # Get all unique non-null group_mg_id values
        groups = db.query(Worklet.group_mg_id).distinct().filter(Worklet.group_mg_id.isnot(None)).order_by(Worklet.group_mg_id).all()
        return [{"group_id": g[0], "label": f"Group {g[0]}"} for g in groups]
    except Exception as e:
        logger.error(f"Error fetching groups: {e}")
        return []

# ----------------- Stages (for filtering) -----------------
@router.get("/stages", tags=["worklets"])
def get_worklet_stages(db: Session = Depends(get_db)):
    """Return all worklet stages for filter dropdowns."""
    from app.models import WorkletStage
    try:
        stages = db.query(WorkletStage).order_by(WorkletStage.stage_id).all()
        return [{"stage_id": s.stage_id, "stage": s.stage} for s in stages]
    except Exception as e:
        logger.error(f"Error fetching stages: {e}")
        return []

# ----------------- Excellent Worklets -----------------
@router.get("/excellent", tags=["worklets"])
def list_excellent_worklets(db: Session = Depends(get_db)):
    """Return worklets where IsExcellent = 1 from Prism_Worklet table."""
    from app.models import TechDomain, TeamMG

    query = db.query(Worklet).options(
        joinedload(Worklet.college_rel),
        joinedload(Worklet.team_rel),
        joinedload(Worklet.stage_rel)
    ).filter(Worklet.is_excellent == 1)

    worklets_list = query.all()

    # Batch fetch domain names
    tech_domain_ids = list(set(w.tech_domain_id for w in worklets_list if w.tech_domain_id is not None))
    domain_name_map = {}
    if tech_domain_ids:
        tech_domains = db.query(TechDomain).filter(TechDomain.id.in_(tech_domain_ids)).all()
        domain_name_map = {td.id: td.domain_name for td in tech_domains}

    # Batch fetch student associations
    worklet_ids = [w.id for w in worklets_list]
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

    response = []
    for w in worklets_list:
        progress = getattr(w, 'worklet_progress', 0) or 0

        assoc_students = student_associations.get(w.id, [])
        student_count = len(assoc_students)

        college_name = w.college_rel.college_name if getattr(w, 'college_rel', None) else None
        college_id = getattr(w, 'college_id', None)
        if college_name is None:
            for stu in assoc_students:
                if getattr(stu, "college", None):
                    college_name = stu.college
                    college_id = getattr(stu, "college_id", None)
                    break

        status_text = map_status_text(getattr(w, 'status_id', None))

        derived_year = None
        try:
            if getattr(w, "start_date", None):
                derived_year = w.start_date.year
            elif getattr(w, "end_date", None):
                derived_year = w.end_date.year
        except Exception:
            derived_year = None

        team_name = w.team_rel.team_name if w.team_rel else None
        stage_name = w.stage_rel.stage if w.stage_rel else None

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
            'domain': domain_name_map.get(w.tech_domain_id) if w.tech_domain_id else None,
            'status': status_text,
            'worklet_progress': progress,
            'college_id': college_id,
            'college': college_name,
            'student_count': student_count,
            'team': team_name,
            'stage_id': getattr(w, 'stage_id', None),
            'stage': stage_name,
            'performance': normalize_performance(getattr(w, 'Performance', None)),
            'riskStatus': normalize_risk_status(getattr(w, 'RiskStatus', None)),
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

        user_id_from_token = payload.get("user_id")
        if user_id_from_token:
            student = db.query(User).filter(User.id == user_id_from_token).first()
        else:
            student = db.query(User).filter(User.email == user_email, User.role == payload.get("role")).first()
        if not student:
            raise HTTPException(status_code=404, detail="User not found")

        # Use service to get worklets for student
        return WorkletService.get_worklets_for_student(db, student.id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student worklets for user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/professor/me", tags=["worklets"])
def get_professor_worklets_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Return worklets associated to the authenticated user as a Professor.
    Response shape mirrors list_worklets for frontend compatibility.
    
    Now uses centralized WorkletService for consistent data formatting.
    """
    try:
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id_from_token = payload.get("user_id")
        if user_id_from_token:
            professor = db.query(User).filter(User.id == user_id_from_token).first()
        else:
            professor = db.query(User).filter(User.email == user_email, User.role == payload.get("role")).first()
        if not professor:
            raise HTTPException(status_code=404, detail="User not found")

        # Use service to get worklets for professor
        return WorkletService.get_worklets_for_professor(db, professor.id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching professor worklets for user: {e}", exc_info=True)
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
    
    # Check and auto-increment progress if needed (2-day delay, stops after mentor review)
    check_and_auto_increment_progress(worklet.id, db)
    
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
def request_worklet_update_flexible(
    worklet_identifier: str, 
    request_data: RequestUpdateSchema, 
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Request update for worklet by either integer ID or cert_id string
    Examples: POST /worklets/6/request-update or POST /worklets/25TST04WT/request-update
    Now uses centralized WorkletService for identifier resolution.
    """
    # Get current user from token
    current_user_email = None
    try:
        payload = require_access_token(token)
        current_user_email = payload.get("sub")
    except Exception:
        pass
    
    # Use service to resolve identifier
    worklet = WorkletService.get_worklet_by_identifier(db, worklet_identifier)
    
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Fetch dynamic students
    student_records = _get_students_for_worklet(db, worklet.id)
    # Exclude the current user (requester) from receiving the notification
    student_emails = [s["email"] for s in student_records if s["email"] != current_user_email]

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
# Note: Use /milestones/feedback endpoint for milestone feedback with database persistence.
# Use /suggestions/ POST endpoint for persisted suggestions.

