from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.auth import oauth2_scheme, require_access_token
from app.models import User

router = APIRouter(prefix="/api/updates", tags=["updates"])


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


# Pydantic schemas
class WorkletUpdateCreate(BaseModel):
    worklet_id: int
    update_type: str  # 'adhoc' or 'meeting'
    
    # Ad-hoc fields
    work_completed: Optional[str] = None
    challenges: Optional[str] = None
    next_steps: Optional[str] = None
    need_support: Optional[bool] = False
    additional_notes: Optional[str] = None
    
    # Meeting fields
    meeting_agenda: Optional[str] = None
    key_discussions: Optional[str] = None
    meeting_next_steps: Optional[str] = None
    meeting_notes: Optional[str] = None


class WorkletUpdateResponse(BaseModel):
    id: int
    worklet_id: int
    update_type: str
    timestamp: datetime
    submitted_by: int
    submitted_by_name: Optional[str] = None
    submitted_by_role: Optional[str] = None
    submitted_by_email: Optional[str] = None
    work_completed: Optional[str]
    challenges: Optional[str]
    next_steps: Optional[str]
    need_support: Optional[bool]
    additional_notes: Optional[str]
    meeting_agenda: Optional[str]
    key_discussions: Optional[str]
    meeting_next_steps: Optional[str]
    meeting_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=WorkletUpdateResponse, status_code=status.HTTP_201_CREATED)
async def create_worklet_update(
    update: WorkletUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new worklet update (meeting or ad-hoc)
    """
    # Validate update type
    if update.update_type not in ['adhoc', 'meeting']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="update_type must be 'adhoc' or 'meeting'"
        )
    
    # Insert into database
    query = text("""
        INSERT INTO worklet_updates (
            worklet_id, update_type, submitted_by, timestamp,
            work_completed, challenges, next_steps, need_support, additional_notes,
            meeting_agenda, key_discussions, meeting_next_steps, meeting_notes
        ) VALUES (
            :worklet_id, :update_type, :submitted_by, :timestamp,
            :work_completed, :challenges, :next_steps, :need_support, :additional_notes,
            :meeting_agenda, :key_discussions, :meeting_next_steps, :meeting_notes
        )
    """)
    
    params = {
        'worklet_id': update.worklet_id,
        'update_type': update.update_type,
        'submitted_by': current_user.id,
        'timestamp': datetime.now(),
        'work_completed': update.work_completed,
        'challenges': update.challenges,
        'next_steps': update.next_steps,
        'need_support': update.need_support,
        'additional_notes': update.additional_notes,
        'meeting_agenda': update.meeting_agenda,
        'key_discussions': update.key_discussions,
        'meeting_next_steps': update.meeting_next_steps,
        'meeting_notes': update.meeting_notes
    }
    
    try:
        result = db.execute(query, params)
        db.commit()
        
        # Get the inserted record ID
        update_id = result.lastrowid
        
        # Fetch the created record
        fetch_query = text("SELECT * FROM worklet_updates WHERE id = :id")
        result = db.execute(fetch_query, {'id': update_id})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created update"
            )
        
        # Convert row to dict
        update_dict = dict(row._mapping)
        
        return WorkletUpdateResponse(**update_dict)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create update: {str(e)}"
        )


@router.get("/worklet/{worklet_id}", response_model=List[WorkletUpdateResponse])
async def get_worklet_updates(
    worklet_id: int,
    update_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all updates for a specific worklet
    """
    query_str = """
        SELECT wu.*, u.name as submitted_by_name, u.role as submitted_by_role, u.email as submitted_by_email
        FROM worklet_updates wu
        LEFT JOIN users u ON wu.submitted_by = u.user_id
        WHERE wu.worklet_id = :worklet_id
    """
    params = {'worklet_id': worklet_id}
    
    if update_type:
        if update_type not in ['adhoc', 'meeting']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="update_type must be 'adhoc' or 'meeting'"
            )
        query_str += " AND wu.update_type = :update_type"
        params['update_type'] = update_type
    
    query_str += " ORDER BY wu.timestamp DESC"
    
    try:
        result = db.execute(text(query_str), params)
        rows = result.fetchall()
        
        updates = [dict(row._mapping) for row in rows]
        
        return [WorkletUpdateResponse(**update) for update in updates]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch updates: {str(e)}"
        )


@router.get("/{update_id}", response_model=WorkletUpdateResponse)
async def get_update_by_id(
    update_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific update by ID
    """
    try:
        query = text("""
            SELECT wu.*, u.name as submitted_by_name, u.role as submitted_by_role, u.email as submitted_by_email
            FROM worklet_updates wu
            LEFT JOIN users u ON wu.submitted_by = u.user_id
            WHERE wu.id = :id
        """)
        result = db.execute(query, {'id': update_id})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Update not found"
            )
        
        update_dict = dict(row._mapping)
        
        return WorkletUpdateResponse(**update_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch update: {str(e)}"
        )
