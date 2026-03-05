from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import Suggestion, Worklet, User
from app.schemas import SuggestionCreate, SuggestionUpdate, SuggestionOut
from app.auth import oauth2_scheme, require_access_token

router = APIRouter(
    prefix="/suggestions",
    tags=["suggestions"]
)

# Helper function to get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current user from JWT token"""
    payload = require_access_token(token)
    user_id = payload.get("user_id")
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(User).filter(User.email == payload.get("sub"), User.role == payload.get("role")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Create a new suggestion (Mentor only)
@router.post("/", response_model=SuggestionOut, status_code=status.HTTP_201_CREATED)
def create_suggestion(
    suggestion: SuggestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new suggestion for a worklet.
    Only mentors can create suggestions.
    """
    # Verify user is a mentor
    if current_user.role.lower() != 'mentor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can create suggestions"
        )
    
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == suggestion.worklet_id).first()
    if not worklet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worklet with id {suggestion.worklet_id} not found"
        )
    
    # Create new suggestion
    new_suggestion = Suggestion(
        worklet_id=suggestion.worklet_id,
        mentor_id=current_user.id,
        suggestion_title=suggestion.suggestion_title,
        suggestion_content=suggestion.suggestion_content,
        category=suggestion.category or "General",
        priority=suggestion.priority or "medium"
    )
    
    db.add(new_suggestion)
    db.commit()
    db.refresh(new_suggestion)
    
    # Add mentor info to response
    result = SuggestionOut.from_orm(new_suggestion)
    result.mentor_name = current_user.name
    result.mentor_email = current_user.email
    
    return result


# Get all suggestions for a worklet
@router.get("/worklet/{worklet_id}", response_model=List[SuggestionOut])
def get_worklet_suggestions(
    worklet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all suggestions for a specific worklet.
    Accessible by students and mentors associated with the worklet.
    """
    # Verify worklet exists
    worklet = db.query(Worklet).filter(Worklet.id == worklet_id).first()
    if not worklet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worklet with id {worklet_id} not found"
        )
    
    # Get all suggestions for this worklet with mentor info
    suggestions = (
        db.query(Suggestion)
        .options(joinedload(Suggestion.mentor))
        .filter(Suggestion.worklet_id == worklet_id)
        .order_by(Suggestion.created_at.desc())
        .all()
    )
    
    # Format response with mentor info
    result = []
    for suggestion in suggestions:
        suggestion_out = SuggestionOut.from_orm(suggestion)
        suggestion_out.mentor_name = suggestion.mentor.name if suggestion.mentor else None
        suggestion_out.mentor_email = suggestion.mentor.email if suggestion.mentor else None
        result.append(suggestion_out)
    
    return result


# Update suggestion (mark as read, helpful, add student response)
@router.patch("/{suggestion_id}", response_model=SuggestionOut)
def update_suggestion(
    suggestion_id: int,
    update_data: SuggestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a suggestion (mark as read, helpful, add response).
    Students can mark as read/helpful and add responses.
    """
    # Get suggestion
    suggestion = db.query(Suggestion).filter(Suggestion.suggestion_id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Suggestion with id {suggestion_id} not found"
        )
    
    # Update fields
    if update_data.is_read is not None:
        suggestion.is_read = update_data.is_read
    
    if update_data.is_helpful is not None:
        suggestion.is_helpful = update_data.is_helpful
    
    if update_data.student_response is not None:
        suggestion.student_response = update_data.student_response
        suggestion.response_date = datetime.utcnow()
    
    db.commit()
    db.refresh(suggestion)
    
    # Add mentor info to response
    result = SuggestionOut.from_orm(suggestion)
    result.mentor_name = suggestion.mentor.name if suggestion.mentor else None
    result.mentor_email = suggestion.mentor.email if suggestion.mentor else None
    
    return result


# Delete suggestion (Mentor who created it only)
@router.delete("/{suggestion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a suggestion. Only the mentor who created it can delete.
    """
    # Get suggestion
    suggestion = db.query(Suggestion).filter(Suggestion.suggestion_id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Suggestion with id {suggestion_id} not found"
        )
    
    # Verify user is the mentor who created it
    if suggestion.mentor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own suggestions"
        )
    
    db.delete(suggestion)
    db.commit()
    
    return None


# Get all suggestions by mentor
@router.get("/mentor/my-suggestions", response_model=List[SuggestionOut])
def get_mentor_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all suggestions created by the current mentor.
    """
    if current_user.role.lower() != 'mentor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can access this endpoint"
        )
    
    suggestions = (
        db.query(Suggestion)
        .options(joinedload(Suggestion.worklet))
        .filter(Suggestion.mentor_id == current_user.id)
        .order_by(Suggestion.created_at.desc())
        .all()
    )
    
    result = []
    for suggestion in suggestions:
        suggestion_out = SuggestionOut.from_orm(suggestion)
        suggestion_out.mentor_name = current_user.name
        suggestion_out.mentor_email = current_user.email
        result.append(suggestion_out)
    
    return result
