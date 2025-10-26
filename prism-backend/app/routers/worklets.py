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
import logging
logger = logging.getLogger(__name__)

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
        })
    return response

# ----------------- Student Worklets (Authenticated) -----------------
@router.get("/student/me", tags=["worklets"])
def get_student_worklets_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Return worklets associated to the authenticated user as a Student.
    Response shape mirrors list_worklets for frontend compatibility.
    """
    try:
        payload = require_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        student = db.query(User).filter(User.email == user_email).first()
        if not student:
            raise HTTPException(status_code=404, detail="User not found")

        # Join Worklets via association table where this user is a Student
        query = (
            db.query(Worklet)
            .join(UserWorkletAssociation, Worklet.id == UserWorkletAssociation.worklet_id)
            .filter(
                UserWorkletAssociation.user_id == student.id,
                UserWorkletAssociation.role_in_worklet == "Student",
            )
        )

        worklets = query.all()
        response: List[dict] = []
        for w in worklets:
            # derive progress similar to list_worklets
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

            # Determine college: prefer worklet's college, fallback to student's or mentor's
            college_id = getattr(w, 'college_id', None)
            college_name = w.college_rel.college_name if getattr(w, 'college_rel', None) else None
            if college_name is None:
                # fallback to student's own college
                college_id = getattr(student, "college_id", None)
                college_name = getattr(student, "college", None)
            if college_name is None:
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

            # Count students on this worklet for display
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

            # Map status (normalized)
            status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
            status_text = status_map.get(getattr(w, 'status_id', None), "Ongoing")

            # Derive a year from date range (fallback to current year)
            derived_year = None
            try:
                if getattr(w, "start_date", None):
                    derived_year = w.start_date.year
                elif getattr(w, "end_date", None):
                    derived_year = w.end_date.year
            except Exception:
                derived_year = None

            response.append({
                'id': w.id,
                'cert_id': w.cert_id,
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
            })

        return response
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

    # Map status (normalized)
    status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
    status_text = status_map.get(getattr(worklet, 'status_id', None), "Ongoing")

    if status_text == "Completed":
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

    # Derive a year from date range (fallback to current year)
    derived_year = None
    try:
        if getattr(worklet, "start_date", None):
            derived_year = worklet.start_date.year
        elif getattr(worklet, "end_date", None):
            derived_year = worklet.end_date.year
    except Exception:
        derived_year = None

    # Derive GitHub repo info if available
    github_url = getattr(worklet, 'github_url', None)
    repo_name = None
    try:
        if isinstance(github_url, str) and 'github.com' in github_url:
            import re
            m = re.search(r"github\.com/([^/]+/[^/]+)", github_url)
            if m:
                repo_name = m.group(1)
    except Exception:
        repo_name = None

    return {
        "id": worklet.id,
    "cert_id": str(worklet.cert_id) if getattr(worklet, 'cert_id', None) is not None else str(worklet.id),
        "title": worklet.title,
        "description": getattr(worklet, "problem_statement", None),
        "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
        "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
        "created_at": worklet.created_at.isoformat() if worklet.created_at else None,
        "updated_at": worklet.updated_at.isoformat() if worklet.updated_at else None,
        "year": derived_year if derived_year is not None else datetime.utcnow().year,
        "domain": worklet.domain,
        "status": status_text,
        "percentage_completion": percentage_completion,
        "worklet_progress": percentage_completion,
        "quality": quality,
        "students": students,
        "student_count": len(students),
        "professors": professors,
        "professor_count": len(professors),
        "problem_statement": getattr(worklet, "problem_statement", None),
        "expectation": getattr(worklet, "expectation", None),
        "prerequisites": getattr(worklet, "prerequisites", None),
        "college_id": getattr(worklet, 'college_id', None),
        "college": worklet.college_rel.college_name if getattr(worklet, 'college_rel', None) else None,
        "github_repo_url": github_url,
        "github_repo": repo_name,
    }

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
        # Filter by status_id for ongoing if requested (Ongoing id=1)
        if only_ongoing:
            query = query.filter(getattr(Worklet, 'status_id') == 1)
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

            # Prefer worklet's college; fallback to mentor's if missing
            if getattr(worklet, 'college_rel', None) and getattr(worklet.college_rel, 'college_name', None):
                worklet_college = worklet.college_rel.college_name
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

            status_map = {0: "To Start", 1: "Ongoing", 2: "Completed", 3: "On Hold", 4: "Dropped"}
            status_text = status_map.get(getattr(worklet, 'status_id', None), "Ongoing")
            if status_text == "Completed":
                quality = "Excellence"
            elif percentage_completion >= 70:
                quality = "Excellence"
            elif percentage_completion >= 30:
                quality = "Good"
            else:
                quality = "Needs Attention"

            # Derive GitHub repo info if available
            github_url = getattr(worklet, 'github_url', None)
            repo_name = None
            try:
                if isinstance(github_url, str) and 'github.com' in github_url:
                    import re
                    m = re.search(r"github\.com/([^/]+/[^/]+)", github_url)
                    if m:
                        repo_name = m.group(1)
            except Exception:
                repo_name = None

            worklets_data.append({
                "id": worklet.id,
                "cert_id": worklet.cert_id,
                "title": getattr(worklet, "title", None),
                "description": getattr(worklet, "problem_statement", None),
                "status": status_text,
                "team": getattr(worklet, "team", None),
                "college_id": getattr(worklet, 'college_id', None),
                "college": worklet_college,
                "problem_statement": getattr(worklet, "problem_statement", None),
                "expectation": getattr(worklet, "expectation", None),
                "prerequisites": getattr(worklet, "prerequisites", None),
                "worklet_progress": getattr(worklet, "worklet_progress", None),
                "percentage_completion": percentage_completion,
                "quality": quality,
                "students": students,
                "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
                "end_date": worklet.end_date.isoformat() if worklet.end_date else None,
                "github_repo_url": github_url,
                "github_repo": repo_name,
            })

        return {
            "worklets": worklets_data,
            "total_worklets": len(worklets_data),
            "total_mentees": len(mentee_set)
        }
    except Exception as e:
        logger.info(f"Error fetching mentor worklets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ----------------- Students for Worklet -----------------
@router.get("/{worklet_identifier}/students")
def get_students_for_worklet_flexible(worklet_identifier: str, db: Session = Depends(get_db)):
    """Return real student associations for a worklet by numeric id or cert_id."""
    # Resolve identifier
    worklet = None
    try:
      worklet_id = int(worklet_identifier)
      worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    except ValueError:
      worklet = db.query(Worklet).filter(Worklet.cert_id == worklet_identifier).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")

    # Gather students via association
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

@router.get("/cert/{cert_id}/students")
def get_students_for_worklet_by_cert_id(cert_id: str, db: Session = Depends(get_db)):
    """Return student associations given a cert_id."""
    worklet = db.query(Worklet).filter(Worklet.cert_id == cert_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
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

# Note: Completed-worklets and internship-referral routes removed as unused in current frontend
