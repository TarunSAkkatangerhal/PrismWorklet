from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    Date,
    Enum as SAEnum,
    Index,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Colleges table
class College(Base):
    __tablename__ = "colleges"

    college_id = Column(Integer, primary_key=True, autoincrement=True)
    college_name = Column(String(255), unique=True, nullable=False)

    # Backref to users
    users = relationship("User", back_populates="college_rel")

    def __repr__(self):
        return f"<College(college_id={self.college_id}, college_name='{self.college_name}')>"


# Users table
class User(Base):
    __tablename__ = "users"

    # Keep attribute 'id' for backward compatibility; map to column 'user_id'
    id = Column("user_id", Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum("Admin", "Mentor", "Professor", "Student", name="user_role_enum"), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.college_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, nullable=False)


    # Relationships
    worklet_associations = relationship(
        "UserWorkletAssociation",
        foreign_keys="UserWorkletAssociation.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    college_rel = relationship("College", back_populates="users")

    # Backward-compatible property: treat is_active like is_verified
    @property
    def is_verified(self):
        return self.is_active

    @is_verified.setter
    def is_verified(self, value: bool):
        self.is_active = bool(value)

    # Backward-compatible property: expose college name as 'college'
    @property
    def college(self):
        return self.college_rel.college_name if self.college_rel else None

    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', role='{self.role}')>"


# User Profiles table
class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    linkedin = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    expertise = Column(String(255), nullable=True)
    qualification = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    contact_number = Column(String(20), nullable=True)
    organization = Column(String(150), nullable=True)
    github = Column(String(255), nullable=True)
    handle = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    website = Column(String(255), nullable=True)


    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id})>"


class Worklet(Base):
    __tablename__ = "worklets"

    # Keep attribute 'id' mapped to column 'worklet_id'
    id = Column("worklet_id", Integer, primary_key=True, autoincrement=True)
    cert_id = Column(String(20), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(
        SAEnum("Approved", "Ongoing", "Completed", "Dropped", "On Hold", name="worklet_status_enum"),
        server_default="Ongoing",
        nullable=False,
    )
    year = Column(Integer, nullable=False)
    domain = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user_associations = relationship("UserWorkletAssociation", back_populates="worklet", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Worklet(id={self.id}, cert_id='{self.cert_id}', title='{self.title}', status='{self.status}')>"


class UserWorkletAssociation(Base):
    __tablename__ = "user_worklet_association"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    worklet_id = Column(Integer, ForeignKey("worklets.worklet_id", ondelete="CASCADE"), primary_key=True)
    role_in_worklet = Column(
        SAEnum("Mentor", "Student", "Professor", name="u_w_role_enum"),
        server_default="Student",
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="worklet_associations")
    worklet = relationship("Worklet", back_populates="user_associations")

    def __repr__(self):
        return f"<UserWorkletAssociation(user_id={self.user_id}, worklet_id={self.worklet_id}, role='{self.role_in_worklet}')>"


class Evaluation(Base):
    __tablename__ = "evaluations"

    # Keep attribute 'id' mapped to column 'evaluation_id'
    id = Column("evaluation_id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    worklet_id = Column(Integer, ForeignKey("worklets.worklet_id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Evaluation(id={self.id}, user_id={self.user_id}, worklet_id={self.worklet_id}, score={self.score})>"


# Create indexes
Index("ix_user_email", User.email, unique=True)
Index("ix_worklet_cert_id", Worklet.cert_id, unique=True)
Index("ix_user_worklet_association", UserWorkletAssociation.user_id, UserWorkletAssociation.worklet_id)
