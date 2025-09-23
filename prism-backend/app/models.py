from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date, Enum, Index, ForeignKey
from sqlalchemy.sql import func, text
from sqlalchemy.orm import relationship
from app.database import Base

# User Worklet Association Table (Many-to-Many)
class UserWorkletAssociation(Base):
    __tablename__ = "user_worklet_association"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    worklet_id = Column(Integer, ForeignKey('worklets.id', ondelete='CASCADE'), nullable=False)
    role_in_worklet = Column(Enum("Mentor", "Student", "Collaborator", name="worklet_role_enum"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    assigned_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    completion_status = Column(Enum("Not Started", "In Progress", "Completed", "On Hold", name="completion_status_enum"), default="Not Started")
    progress_percentage = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="worklet_associations")
    worklet = relationship("Worklet", back_populates="user_associations")
    assigner = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<UserWorkletAssociation(user_id={self.user_id}, worklet_id={self.worklet_id}, role='{self.role_in_worklet}')>"


# User Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("Mentor", "Professor", "Student", name="user_role_enum"), nullable=False)
    team = Column(String(100), nullable=True)
    college = Column(String(150), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # OTP fields for password reset
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    worklet_associations = relationship("UserWorkletAssociation", foreign_keys="UserWorkletAssociation.user_id", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', role='{self.role}')>"


# Mentor Table
class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    contact = Column(String(50), nullable=True)
    team = Column(String(100), nullable=True)
    expertise = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Profile fields
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    qualification = Column(String(150), nullable=True)
    location = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    website = Column(String(255), nullable=True)
    handle = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Mentor(id={self.id}, name='{self.name}', email='{self.email}')>"


# Worklet Table
class Worklet(Base):
    __tablename__ = "worklets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cert_id = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_on = Column(DateTime, nullable=True)  # Database uses created_on, not created_at
    year = Column(Integer, nullable=True)  # year column in database
    team = Column(String(100), nullable=True)
    college = Column(String(150), nullable=True)
    git_path = Column(String(255), nullable=True)
    risk_status = Column(Integer, nullable=True)
    performance_status = Column(Integer, nullable=True)
    percentage_completion = Column(Integer, default=0, nullable=False)
    problem_statement = Column(Text, nullable=True)
    expectations = Column(Text, nullable=True)
    prerequisites = Column(Text, nullable=True)
    milestone_id = Column(Integer, nullable=True)
    mentor_id = Column(Integer, nullable=True)  # Foreign key to users table
    status = Column(String(20), nullable=True)
    status_id = Column(Integer, nullable=True)

    # Relationships
    user_associations = relationship("UserWorkletAssociation", back_populates="worklet")

    def __repr__(self):
        return f"<Worklet(id={self.id}, cert_id='{self.cert_id}', status='{self.status}')>"


# Student Table  
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    worklet_id = Column(Integer, nullable=False)  # Foreign key to worklets table
    mentorship_extension = Column(Boolean, server_default=text("0"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}', worklet_id={self.worklet_id})>"


# Evaluation Table
class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    worklet_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False)
    mentor_id = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Evaluation(id={self.id}, worklet_id={self.worklet_id}, score={self.score})>"


# Create indexes
Index("ix_user_email", User.email, unique=True)
Index("ix_mentor_email", Mentor.email, unique=True)
Index("ix_worklet_cert_id", Worklet.cert_id, unique=True)
Index("ix_user_worklet_association", UserWorkletAssociation.user_id, UserWorkletAssociation.worklet_id)
Index("ix_association_active", UserWorkletAssociation.is_active)