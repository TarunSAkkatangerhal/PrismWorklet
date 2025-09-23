from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enums
class WorkletStatusEnum(str, Enum):
    draft = "Draft"
    ongoing = "Ongoing" 
    completed = "Completed"
    cancelled = "Cancelled"

class WorkletRoleEnum(str, Enum):
    mentor = "Mentor"
    student = "Student"
    collaborator = "Collaborator"

class CompletionStatusEnum(str, Enum):
    not_started = "Not Started"
    in_progress = "In Progress"
    completed = "Completed"
    on_hold = "On Hold"

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # Mentor, Professor, Student
    team: Optional[str] = None
    college: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class RequestOTP(BaseModel):
    email: EmailStr

class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str

class SetPassword(BaseModel):
    email: EmailStr
    name: str
    role: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    team: Optional[str] = None
    college: Optional[str] = None

# Mentor & Worklet Schemas
class MentorBase(BaseModel):
    name: str
    email: EmailStr
    expertise: Optional[str] = None
    contact: Optional[str] = None
    team: Optional[str] = None
    
    # Profile fields
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[date] = None
    website: Optional[str] = None
    handle: Optional[str] = None

class MentorCreate(MentorBase):
    pass

class MentorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    expertise: Optional[str] = None
    contact: Optional[str] = None
    team: Optional[str] = None
    
    # Profile fields
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[date] = None
    website: Optional[str] = None
    handle: Optional[str] = None

class MentorRead(MentorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True
    class Config:
        from_attributes = True

class WorkletBase(BaseModel):
    cert_id: str
    description: Optional[str] = None
    status: Optional[str] = None
    team: Optional[str] = None
    college: Optional[str] = None
    mentor_id: Optional[int] = None

class WorkletCreate(WorkletBase):
    problem_statement: Optional[str] = None
    expectations: Optional[str] = None
    prerequisites: Optional[str] = None

class WorkletUpdate(BaseModel):
    cert_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    team: Optional[str] = None
    college: Optional[str] = None
    mentor_id: Optional[int] = None
    problem_statement: Optional[str] = None
    expectations: Optional[str] = None
    prerequisites: Optional[str] = None

class WorkletResponse(BaseModel):
    id: int
    cert_id: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_on: Optional[datetime] = None
    year: Optional[int] = None
    team: Optional[str] = None
    college: Optional[str] = None
    git_path: Optional[str] = None
    risk_status: Optional[int] = None
    performance_status: Optional[int] = None
    percentage_completion: Optional[int] = None
    problem_statement: Optional[str] = None
    expectations: Optional[str] = None
    prerequisites: Optional[str] = None
    milestone_id: Optional[int] = None
    mentor_id: Optional[int] = None
    status: Optional[str] = None
    status_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Feedback and Suggestion Schemas
class MentorFeedback(BaseModel):
    """Schema for mentor feedback submission"""
    worklet_id: int
    student_email: str
    feedback_text: str
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5")
    suggestions: Optional[str] = None
    completion_percentage: Optional[int] = Field(default=None, ge=0, le=100)

class StudentFeedback(BaseModel):
    """Schema for student feedback submission"""
    worklet_id: int
    mentor_email: str
    feedback_text: str
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5")
    suggestions: Optional[str] = None

class MentorSuggestion(BaseModel):
    """Schema for mentor suggestion submission"""
    student_email: str
    suggestion_text: str
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    category: Optional[str] = None

# Student Schema
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    worklet_id: int

class StudentCreate(StudentBase):
    mentorship_extension: bool = Field(default=False)

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    worklet_id: Optional[int] = None
    mentorship_extension: bool

class StudentResponse(StudentBase):
    id: int
    mentorship_extension: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Evaluation Schema
class EvaluationBase(BaseModel):
    worklet_id: int
    student_id: int
    mentor_id: int
    score: int = Field(ge=0, le=100)
    feedback: Optional[str] = None

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationUpdate(BaseModel):
    score: Optional[int] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = None

class EvaluationResponse(EvaluationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# User Worklet Association Schemas
class UserWorkletAssociationBase(BaseModel):
    user_id: int
    worklet_id: int
    role_in_worklet: WorkletRoleEnum
    completion_status: CompletionStatusEnum = CompletionStatusEnum.not_started
    progress_percentage: int = Field(default=0, ge=0, le=100)
    notes: Optional[str] = None

class UserWorkletAssociationCreate(UserWorkletAssociationBase):
    assigned_by: Optional[int] = None

class UserWorkletAssociationUpdate(BaseModel):
    role_in_worklet: Optional[WorkletRoleEnum] = None
    completion_status: Optional[CompletionStatusEnum] = None
    progress_percentage: Optional[int] = Field(default=None, ge=0, le=100)
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class UserWorkletAssociationResponse(UserWorkletAssociationBase):
    id: int
    assigned_at: datetime
    is_active: bool
    assigned_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Enhanced Worklet Response with Associations
class WorkletWithAssociations(WorkletResponse):
    mentors: List[UserResponse] = []
    students: List[UserResponse] = []
    collaborators: List[UserResponse] = []
    total_users: int = 0

class UserWithWorklets(UserResponse):
    active_worklets: List[WorkletResponse] = []
    worklet_count: int = 0