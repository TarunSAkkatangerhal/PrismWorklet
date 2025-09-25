from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Worklet, User
from app.schemas import WorkletCreate, WorkletUpdate, WorkletResponse
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.email_utils import send_activity_email

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
def list_worklets(db: Session = Depends(get_db)):
    return db.query(Worklet).all()

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
    
    # Convert to response format
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
def get_mentor_worklets(mentor_email: str, db: Session = Depends(get_db)):
    try:
        # Find mentor
        mentor = db.query(User).filter(User.email == mentor_email, User.role == "Mentor").first()
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Get worklets assigned to this mentor using mentor_id
        worklets = db.query(Worklet).filter(Worklet.mentor_id == mentor.id).all()
        
        # Convert to dict format matching actual database schema
        worklets_data = []
        for worklet in worklets:
            worklets_data.append({
                "id": worklet.id,
                "cert_id": worklet.cert_id,
                "description": worklet.description,
                "status": worklet.status,
                "team": worklet.team,
                "college": worklet.college,
                "problem_statement": worklet.problem_statement,
                "expectations": worklet.expectations,
                "prerequisites": worklet.prerequisites,
                "percentage_completion": worklet.percentage_completion,
                "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
                "end_date": worklet.end_date.isoformat() if worklet.end_date else None
            })
        
        return worklets_data
        
    except Exception as e:
        print(f"Error fetching mentor worklets: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    # Placeholder until associations are refactored to new schema
    return []

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
    
    # Get students for this worklet
    dummy_students = [
        {"email": "john.doe@example.com", "name": "John Doe"},
        {"email": "jane.smith@example.com", "name": "Jane Smith"}
    ]
    
    # Send emails to students
    student_emails = [student["email"] for student in dummy_students]
    email_subject = f"Update Request for Worklet {worklet.cert_id}"
    email_message = f"A mentor has requested an update for your worklet.\n\nMessage: {request_data.message}\nPriority: {request_data.priority}"
    
    email_sent = send_activity_email(student_emails, email_subject, email_message, "Request Update")
    
    return {
        "message": "Update request submitted successfully",
        "worklet_identifier": worklet_identifier,
        "worklet_cert_id": worklet.cert_id,
        "request_data": request_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "timestamp": datetime.now().isoformat()
    }

# ----------------- Submit Feedback -----------------
class FeedbackSchema(BaseModel):
    worklet_id: int
    feedback_type: str
    feedback_content: str
    month: Optional[str] = None
    rating: Optional[int] = None

@router.post("/submit-feedback")
def submit_feedback(feedback_data: FeedbackSchema, db: Session = Depends(get_db)):
    # Check if worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == feedback_data.worklet_id).first()
    if not worklet:
        raise HTTPException(status_code=404, detail="Worklet not found")
    
    # Get students for this worklet
    dummy_students = [
        {"email": "john.doe@example.com", "name": "John Doe"},
        {"email": "jane.smith@example.com", "name": "Jane Smith"}
    ]
    
    # Send emails to students
    student_emails = [student["email"] for student in dummy_students]
    email_subject = f"Feedback for Worklet {worklet.cert_id}"
    email_message = f"Your mentor has provided feedback for your worklet.\n\nFeedback Type: {feedback_data.feedback_type}\nFeedback: {feedback_data.feedback_content}"
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
        "timestamp": datetime.now().isoformat()
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
    
    # Get students for this worklet
    dummy_students = [
        {"email": "john.doe@example.com", "name": "John Doe"},
        {"email": "jane.smith@example.com", "name": "Jane Smith"}
    ]
    
    # Send emails to students
    student_emails = [student["email"] for student in dummy_students]
    email_subject = f"New Suggestion for Worklet {worklet.cert_id}"
    email_message = f"A mentor has shared a suggestion for your worklet.\n\nTitle: {suggestion_data.suggestion_title}\nSuggestion: {suggestion_data.suggestion_content}"
    
    email_sent = send_activity_email(student_emails, email_subject, email_message, "Share Suggestion")
    
    return {
        "message": "Suggestion submitted successfully",
        "suggestion_data": suggestion_data.dict(),
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "timestamp": datetime.now().isoformat()
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
    
    # Get students for this worklet
    dummy_students = [
        {"email": "john.doe@example.com", "name": "John Doe"},
        {"email": "jane.smith@example.com", "name": "Jane Smith"}
    ]
    
    # Send emails to students
    student_emails = [student["email"] for student in dummy_students]
    email_subject = f"New Suggestion for Worklet {worklet.cert_id}"
    email_message = f"A mentor has shared a suggestion for your worklet.\n\nTitle: {suggestion_data.suggestion_title}\nSuggestion: {suggestion_data.suggestion_content}"
    
    email_sent = send_activity_email(student_emails, email_subject, email_message, "Share Suggestion")
    
    return {
        "message": "Suggestion submitted successfully",
        "suggestion_data": {
            "worklet_identifier": suggestion_data.worklet_identifier,
            "worklet_cert_id": worklet.cert_id,
            "suggestion_title": suggestion_data.suggestion_title,
            "suggestion_content": suggestion_data.suggestion_content
        },
        "email_sent": email_sent,
        "students_notified": len(student_emails),
        "timestamp": datetime.now().isoformat()
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
