from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Mentor
from app.schemas import MentorCreate, MentorUpdate, MentorRead
from app.database import get_db
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# Profile-specific schema for updates
class MentorProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[str] = None  # Accept as string for easier frontend handling
    website: Optional[str] = None
    handle: Optional[str] = None
    contact: Optional[str] = None
    expertise: Optional[str] = None

@router.get("/", response_model=List[MentorRead])
def list_mentors(db: Session = Depends(get_db)):
    return db.query(Mentor).all()

@router.get("/{mentor_id}", response_model=MentorRead)
def get_mentor(mentor_id: int, db: Session = Depends(get_db)):
    mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor

@router.post("/", response_model=MentorRead, status_code=status.HTTP_201_CREATED)
def create_mentor(mentor_in: MentorCreate, db: Session = Depends(get_db)):
    mentor = Mentor(**mentor_in.dict())
    db.add(mentor)
    db.commit()
    db.refresh(mentor)
    return mentor

@router.put("/{mentor_id}", response_model=MentorRead)
def update_mentor(mentor_id: int, mentor_in: MentorUpdate, db: Session = Depends(get_db)):
    mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    for field, value in mentor_in.dict(exclude_unset=True).items():
        setattr(mentor, field, value)
    db.commit()
    db.refresh(mentor)
    return mentor

@router.delete("/{mentor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mentor(mentor_id: int, db: Session = Depends(get_db)):
    mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    db.delete(mentor)
    db.commit()
    return None

# Profile-specific endpoints
@router.get("/profile/{email}", response_model=MentorRead)
def get_mentor_profile_by_email(email: str, db: Session = Depends(get_db)):
    """Get mentor profile by email"""
    mentor = db.query(Mentor).filter(Mentor.email == email).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor

@router.put("/profile/{email}")
def update_mentor_profile_by_email(email: str, profile_data: MentorProfileUpdate, db: Session = Depends(get_db)):
    """Update mentor profile by email"""
    mentor = db.query(Mentor).filter(Mentor.email == email).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    # Update fields that are provided
    update_data = profile_data.dict(exclude_unset=True)
    
    # Handle date_of_birth conversion
    if 'date_of_birth' in update_data and update_data['date_of_birth']:
        from datetime import datetime
        try:
            # Parse date string to date object
            date_obj = datetime.strptime(update_data['date_of_birth'], '%Y-%m-%d').date()
            update_data['date_of_birth'] = date_obj
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    for field, value in update_data.items():
        setattr(mentor, field, value)
    
    db.commit()
    db.refresh(mentor)
    
    return {
        "message": "Profile updated successfully",
        "mentor": mentor
    }
