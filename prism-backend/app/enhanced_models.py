"""
Enhanced Models for Many-to-Many Mentor-Worklet Relationships
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, func, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

Base = declarative_base()

class MentorRole(PyEnum):
    PRIMARY = "Primary"
    SECONDARY = "Secondary" 
    COLLABORATOR = "Collaborator"

class MentorWorkletAssignment(Base):
    """Junction table for many-to-many mentor-worklet relationships"""
    __tablename__ = "mentor_worklet_assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    mentor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    worklet_id = Column(Integer, ForeignKey('worklets.id', ondelete='CASCADE'), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    role_type = Column(Enum(MentorRole), default=MentorRole.PRIMARY)
    is_active = Column(Boolean, default=True)
    assigned_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    notes = Column(Text, nullable=True)  # Optional notes about the assignment
    
    # Relationships
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="worklet_assignments")
    worklet = relationship("Worklet", back_populates="mentor_assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<MentorWorkletAssignment(mentor_id={self.mentor_id}, worklet_id={self.worklet_id}, role={self.role_type})>"

# Enhanced User model (add this to your existing User model)
class UserEnhanced:
    """Add these relationships to your existing User model"""
    
    # Add this relationship to User model
    worklet_assignments = relationship(
        "MentorWorkletAssignment", 
        foreign_keys="MentorWorkletAssignment.mentor_id",
        back_populates="mentor",
        cascade="all, delete-orphan"
    )
    
    # Helper property to get active worklets
    @property
    def active_worklets(self):
        """Get all active worklets assigned to this mentor"""
        return [assignment.worklet for assignment in self.worklet_assignments if assignment.is_active]
    
    @property
    def primary_worklets(self):
        """Get worklets where this mentor is primary"""
        return [assignment.worklet for assignment in self.worklet_assignments 
                if assignment.is_active and assignment.role_type == MentorRole.PRIMARY]

# Enhanced Worklet model (add this to your existing Worklet model)
class WorkletEnhanced:
    """Add these relationships to your existing Worklet model"""
    
    # Keep existing mentor_id for backward compatibility
    mentor_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # New many-to-many relationship
    mentor_assignments = relationship(
        "MentorWorkletAssignment", 
        back_populates="worklet",
        cascade="all, delete-orphan"
    )
    
    # Keep existing relationship for backward compatibility
    primary_mentor = relationship("User", foreign_keys=[mentor_id])
    
    # Helper properties
    @property
    def active_mentors(self):
        """Get all active mentors for this worklet"""
        return [assignment.mentor for assignment in self.mentor_assignments if assignment.is_active]
    
    @property
    def primary_mentor_assignment(self):
        """Get the primary mentor assignment"""
        for assignment in self.mentor_assignments:
            if assignment.is_active and assignment.role_type == MentorRole.PRIMARY:
                return assignment
        return None
    
    @property
    def mentor_count(self):
        """Get count of active mentors"""
        return len([a for a in self.mentor_assignments if a.is_active])

# Database migration helper functions
def migrate_existing_mentor_assignments(db_session):
    """
    Migrate existing mentor_id assignments to the new junction table
    Run this once after creating the new table
    """
    from app.models import Worklet  # Import your existing Worklet model
    
    # Get all worklets with mentor_id
    worklets_with_mentors = db_session.query(Worklet).filter(Worklet.mentor_id.isnot(None)).all()
    
    print(f"Migrating {len(worklets_with_mentors)} existing mentor assignments...")
    
    for worklet in worklets_with_mentors:
        # Check if assignment already exists
        existing = db_session.query(MentorWorkletAssignment).filter(
            MentorWorkletAssignment.mentor_id == worklet.mentor_id,
            MentorWorkletAssignment.worklet_id == worklet.id
        ).first()
        
        if not existing:
            # Create new assignment
            assignment = MentorWorkletAssignment(
                mentor_id=worklet.mentor_id,
                worklet_id=worklet.id,
                role_type=MentorRole.PRIMARY,
                is_active=True
            )
            db_session.add(assignment)
    
    db_session.commit()
    print("Migration completed!")

def cleanup_redundant_mentor_id(db_session):
    """
    Optional: Remove mentor_id column after migration is complete and tested
    Only run this after ensuring all functionality works with the new system
    """
    # This would be done via Alembic migration, not in Python
    print("Run this SQL manually when ready:")
    print("ALTER TABLE worklets DROP COLUMN mentor_id;")