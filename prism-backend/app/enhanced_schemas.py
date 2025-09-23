"""
Enhanced Schemas for Many-to-Many Mentor-Worklet Relationships
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class MentorRoleType(str, Enum):
    PRIMARY = "Primary"
    SECONDARY = "Secondary"
    COLLABORATOR = "Collaborator"

# Mentor Assignment Schemas
class MentorAssignmentCreate(BaseModel):
    """Schema for creating a new mentor-worklet assignment"""
    mentor_id: int = Field(..., description="ID of the mentor to assign")
    worklet_id: int = Field(..., description="ID of the worklet")
    role_type: MentorRoleType = Field(default=MentorRoleType.PRIMARY, description="Role of the mentor")
    assigned_by: Optional[int] = Field(None, description="ID of the user making the assignment")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about the assignment")

class MentorAssignmentUpdate(BaseModel):
    """Schema for updating an existing mentor-worklet assignment"""
    role_type: Optional[MentorRoleType] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)

class MentorAssignmentResponse(BaseModel):
    """Schema for mentor assignment response"""
    id: int
    mentor_id: int
    worklet_id: int
    assigned_at: datetime
    role_type: MentorRoleType
    is_active: bool
    assigned_by: Optional[int]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

# Enhanced Mentor Schema
class MentorInfo(BaseModel):
    """Basic mentor information"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    
    class Config:
        from_attributes = True

class MentorWithRole(BaseModel):
    """Mentor with their role in a specific worklet"""
    mentor: MentorInfo
    role_type: MentorRoleType
    assigned_at: datetime
    is_active: bool
    notes: Optional[str]

# Enhanced Worklet Schemas
class WorkletBasic(BaseModel):
    """Basic worklet information"""
    id: int
    title: str
    description: Optional[str]
    cert_id: Optional[str]
    status: Optional[str]
    
    class Config:
        from_attributes = True

class WorkletWithMentors(WorkletBasic):
    """Worklet with assigned mentors"""
    mentors: List[MentorWithRole] = []
    mentor_count: int = 0
    primary_mentor: Optional[MentorInfo] = None

class WorkletMentorSummary(BaseModel):
    """Summary of mentor assignments for a worklet"""
    worklet_id: int
    total_mentors: int
    primary_mentors: int
    secondary_mentors: int
    collaborators: int
    active_assignments: int

# Bulk Operations
class BulkMentorAssignment(BaseModel):
    """Schema for bulk mentor assignments"""
    mentor_ids: List[int] = Field(..., description="List of mentor IDs to assign")
    worklet_id: int = Field(..., description="ID of the worklet")
    role_type: MentorRoleType = Field(default=MentorRoleType.SECONDARY, description="Default role for all mentors")
    assigned_by: Optional[int] = None

class MentorTransfer(BaseModel):
    """Schema for transferring mentors between worklets"""
    from_worklet_id: int
    to_worklet_id: int
    mentor_ids: List[int]
    maintain_roles: bool = Field(default=True, description="Keep the same roles in new worklet")

# Dashboard/Analytics Schemas
class MentorWorkload(BaseModel):
    """Mentor workload analytics"""
    mentor: MentorInfo
    total_worklets: int
    primary_worklets: int
    secondary_worklets: int
    collaborator_worklets: int
    worklet_titles: List[str] = []

class WorkletMentorStats(BaseModel):
    """Worklet mentor statistics"""
    total_worklets: int
    worklets_with_mentors: int
    worklets_without_mentors: int
    average_mentors_per_worklet: float
    max_mentors_on_worklet: int

# Search and Filter Schemas
class MentorAssignmentFilter(BaseModel):
    """Filter for mentor assignments"""
    mentor_id: Optional[int] = None
    worklet_id: Optional[int] = None
    role_type: Optional[MentorRoleType] = None
    is_active: Optional[bool] = True
    assigned_after: Optional[datetime] = None
    assigned_before: Optional[datetime] = None

class MentorAvailability(BaseModel):
    """Mentor availability for assignment"""
    mentor: MentorInfo
    current_worklet_count: int
    max_worklets: Optional[int] = Field(default=5, description="Maximum worklets this mentor can handle")
    is_available: bool
    primary_worklet_count: int

# Response Schemas
class AssignmentSuccess(BaseModel):
    """Success response for assignment operations"""
    success: bool = True
    message: str
    assignment_id: Optional[int] = None
    affected_assignments: Optional[int] = None

class AssignmentError(BaseModel):
    """Error response for assignment operations"""
    success: bool = False
    error: str
    details: Optional[str] = None

# Migration/Admin Schemas
class MigrationStatus(BaseModel):
    """Status of data migration"""
    total_worklets: int
    migrated_assignments: int
    failed_migrations: int
    errors: List[str] = []

class AdminMentorSummary(BaseModel):
    """Admin view of mentor assignments"""
    mentor: MentorInfo
    assignments: List[MentorAssignmentResponse]
    total_active_assignments: int
    total_inactive_assignments: int
    workload_score: float  # Based on number and complexity of assignments