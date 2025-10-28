from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, date
from enum import Enum
# --- College Dashboard Schemas ---
class CollegeOut(BaseModel):
    college_id: int
    college_name: str
    location: Optional[str] = None
    established: Optional[int] = None
    infrastructure: Optional[str] = None
    area_of_expertise: Optional[Any] = None  # can be list or str
    workletCount: int = 0
    veryGoodCount: int = 0
    goodCount: int = 0
    averageCount: int = 0
    poorCount: int = 0
    completedCount: int = 0
    ongoingCount: int = 0
    onHoldCount: int = 0
    terminatedCount: int = 0
    totalStudents: int = 0
    class Config:
        from_attributes = True

class WorkletOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    assignedStudents: Optional[list] = []
    performanceStatus: Optional[str] = None
    progressStatus: Optional[str] = None
    collegeName: Optional[str] = None
    class Config:
        from_attributes = True

class StudentOut(BaseModel):
    name: str
    email: str
    class Config:
        from_attributes = True

# Enums
class WorkletStatusEnum(str, Enum):
    to_start = "To Start"
    # Accept both legacy and normalized spellings
    on_going = "On Going"
    ongoing = "Ongoing"
    completed = "Completed"
    on_hold = "On Hold"
    dropped = "Dropped"

class WorkletRoleEnum(str, Enum):
    mentor = "Mentor"
    student = "Student"
    professor = "Professor"

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

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class UserProfileUpdate(BaseModel):
    # User fields
    name: Optional[str] = None
    college: Optional[str] = None
    
    # Profile fields
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    handle: Optional[str] = None
    qualification: Optional[str] = None
    location: Optional[str] = None
    date_of_birth: Optional[date] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio_url: Optional[str] = None
    expertise: Optional[str] = None  # maps to "team" concept
    experience_years: Optional[int] = None
    contact_number: Optional[str] = None
    organization: Optional[str] = None
    github: Optional[str] = None

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
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[WorkletStatusEnum] = WorkletStatusEnum.on_going
    year: int
    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    expectation: Optional[str] = None
    prerequisites: Optional[str] = None
    college_id: Optional[int] = None

class WorkletCreate(WorkletBase):
    pass

class WorkletUpdate(BaseModel):
    cert_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[WorkletStatusEnum] = None
    year: Optional[int] = None
    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    expectation: Optional[str] = None
    prerequisites: Optional[str] = None
    college_id: Optional[int] = None

class WorkletResponse(BaseModel):
    id: int
    cert_id: str
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    year: int
    domain: Optional[str] = None
    status: WorkletStatusEnum
    worklet_progress: Optional[int] = 0
    college_id: Optional[int] = None
    college: Optional[str] = None
    student_count: Optional[int] = 0
    problem_statement: Optional[str] = None
    expectation: Optional[str] = None
    prerequisites: Optional[str] = None
    
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
    user_id: int
    worklet_id: int
    score: int = Field(ge=0, le=100)
    feedback: Optional[str] = None

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationUpdate(BaseModel):
    score: Optional[int] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = None

class EvaluationResponse(EvaluationBase):
    id: int
    evaluated_at: datetime
    
    class Config:
        from_attributes = True

# User Worklet Association Schemas
class UserWorkletAssociationBase(BaseModel):
    user_id: int
    worklet_id: int
    role_in_worklet: WorkletRoleEnum

class UserWorkletAssociationCreate(UserWorkletAssociationBase):
    pass

class UserWorkletAssociationUpdate(BaseModel):
    role_in_worklet: Optional[WorkletRoleEnum] = None

class UserWorkletAssociationResponse(UserWorkletAssociationBase):
    pass
    
    class Config:
        from_attributes = True

# Enhanced Worklet Response with Associations
class WorkletWithAssociations(WorkletResponse):
    mentors: List[UserResponse] = []
    students: List[UserResponse] = []
    professors: List[UserResponse] = []
    total_users: int = 0

class UserWithWorklets(UserResponse):
    active_worklets: List[WorkletResponse] = []
    worklet_count: int = 0

# --- Suggestion Schemas ---
class SuggestionCreate(BaseModel):
    worklet_id: int
    suggestion_title: str = Field(..., max_length=100)
    suggestion_content: str
    category: Optional[str] = "General"
    priority: Optional[str] = "medium"

class SuggestionUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_helpful: Optional[bool] = None
    student_response: Optional[str] = None

class SuggestionOut(BaseModel):
    suggestion_id: int
    worklet_id: int
    mentor_id: int
    mentor_name: Optional[str] = None
    mentor_email: Optional[str] = None
    suggestion_title: str
    suggestion_content: str
    category: str
    priority: str
    is_read: bool
    is_helpful: Optional[bool] = None
    student_response: Optional[str] = None
    response_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Milestone Schemas ---
class MilestoneCreate(BaseModel):
    worklet_id: int
    milestone_type: str = Field(..., max_length=50)
    date_created: Optional[datetime] = None
    field1_label: Optional[str] = None
    field1_value: Optional[str] = None
    field2_label: Optional[str] = None
    field2_value: Optional[str] = None
    toggle_label: Optional[str] = None
    toggle_value: Optional[bool] = False
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None
    attachment_type: Optional[str] = None
    attachment_url: Optional[str] = None

class MilestoneOut(BaseModel):
    milestone_id: int
    worklet_id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    milestone_type: str
    date_created: datetime
    field1_label: Optional[str] = None
    field1_value: Optional[str] = None
    field2_label: Optional[str] = None
    field2_value: Optional[str] = None
    toggle_label: Optional[str] = None
    toggle_value: Optional[bool] = False
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None
    attachment_type: Optional[str] = None
    attachment_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    feedbacks: List['MilestoneFeedbackOut'] = []

    class Config:
        from_attributes = True

class MilestoneFeedbackCreate(BaseModel):
    milestone_id: int
    reviewer_role: str = Field(..., pattern="^(mentor|professor)$")
    feedback_text: str

class MilestoneFeedbackOut(BaseModel):
    feedback_id: int
    milestone_id: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    reviewer_role: str
    feedback_text: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Update forward references for nested models
MilestoneOut.model_rebuild()


# ========================
# Meeting Schemas
# ========================

class MeetingStatusEnum(str, Enum):
    upcoming = "upcoming"
    live = "live"
    completed = "completed"
    cancelled = "cancelled"

class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    college_id: int
    worklet_ids: List[int] = Field(..., min_items=1)  # Must select at least one worklet
    start_datetime: datetime
    duration_minutes: int = Field(default=30, ge=15, le=240)  # 15 min to 4 hours
    meeting_link: str = Field(..., min_length=1, max_length=500)
    repeat_days: Optional[str] = None  # Comma-separated: "Mon,Wed,Fri"
    repeat_until: Optional[date] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_link: Optional[str] = Field(None, min_length=1, max_length=500)

class MeetingReschedule(BaseModel):
    start_datetime: datetime
    duration_minutes: Optional[int] = Field(None, ge=15, le=240)
    reason: Optional[str] = None

class WorkletScheduleOut(BaseModel):
    worklet_id: int
    worklet_cert_id: Optional[str] = None
    worklet_title: str
    scheduled_datetime: datetime
    
    class Config:
        from_attributes = True

class MeetingOut(BaseModel):
    meeting_id: int
    title: str
    description: Optional[str] = None
    college_id: int
    college_name: Optional[str] = None
    organizer_id: int
    organizer_name: Optional[str] = None
    organizer_email: Optional[str] = None
    start_datetime: datetime
    duration_minutes: int
    meeting_link: str
    status: MeetingStatusEnum
    repeat_days: Optional[str] = None
    repeat_until: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    worklets: List[WorkletScheduleOut] = []
    
    class Config:
        from_attributes = True
