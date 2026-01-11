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
    DECIMAL,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Colleges table
class College(Base):
    __tablename__ = "colleges"

    college_id = Column(Integer, primary_key=True, autoincrement=True)
    college_name = Column(String(255), unique=True, nullable=False)
    location = Column(String(255), nullable=True)
    established = Column(Integer, nullable=True)
    infrastructure = Column(String(255), nullable=True)
    area_of_expertise = Column(String(255), nullable=True)

    # Relationships
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
    active_till = Column(Date, nullable=True)
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


class WorkletStage(Base):
    """WorkletStage lookup table for review stages"""
    __tablename__ = "WorkletStage"
    
    stage_id = Column("StageID", Integer, primary_key=True)
    stage = Column("Stage", String(45), nullable=False)
    
    def __repr__(self):
        return f"<WorkletStage(stage_id={self.stage_id}, stage='{self.stage}')>"


class TechDomain(Base):
    """TechDomain lookup table for technology domains"""
    __tablename__ = "TechDomain"
    
    id = Column("TechDomainID", Integer, primary_key=True, autoincrement=True)
    domain_name = Column("DomainName", String(100), unique=True, nullable=False)
    description = Column("Description", Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<TechDomain(id={self.id}, domain_name='{self.domain_name}')>"


class TeamMG(Base):
    """TeamMG lookup table for teams"""
    __tablename__ = "TeamMG"
    
    id = Column("TeamMGID", Integer, primary_key=True, autoincrement=True)
    team_name = Column("TeamName", String(100), unique=True, nullable=False)
    description = Column("Description", Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    def __repr__(self):
        return f"<TeamMG(id={self.id}, team_name='{self.team_name}')>"


class Worklet(Base):
    # Map to existing Prism_Worklet table (do not alter this table via migrations)
    __tablename__ = "Prism_Worklet"

    # Column mappings from Prism_Worklet
    id = Column("WorkletID", Integer, primary_key=True, autoincrement=True)
    cert_id = Column("CertID", String(500), unique=False, nullable=True)
    title = Column("Title", Text, nullable=False)
    image_path = Column("ImagePath", Text, nullable=True)
    problem_statement = Column("ProblemStmt", Text, nullable=True)
    expectation = Column("Expectations", Text, nullable=True)
    prerequisites = Column("Prerequest", Text, nullable=True)
    tech_domain_id = Column("TechDomainID", Integer, nullable=True)
    github_url = Column("GitHubUrl", String(500), nullable=True)
    status_id = Column("StatusID", Integer, nullable=False)
    created_on = Column("CreatedOn", DateTime, nullable=False)
    created_mentor_id = Column("CreatedMentorID", Integer, nullable=False)
    worklet_progress = Column("Progress", Integer, nullable=False, server_default="0")
    start_date = Column("StartDate", Date, nullable=True)
    end_date = Column("EndDate", Date, nullable=True)
    is_active = Column("IsActive", Integer, nullable=False)
    # Performance column for quality/performance tracking
    Performance = Column("Performance", String(45), nullable=True)
    # Risk status column (0=NA/Grey, 1=High/Red, 2=Medium/Amber, 3=Safe/Green)
    RiskStatus = Column("RiskStatus", Integer, nullable=True)
    # New FK to colleges
    college_id = Column("CollegeID", Integer, ForeignKey("colleges.college_id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)

    # Optional/less-used fields mapped for completeness
    group_mg_id = Column("GroupMGID", Integer, nullable=True)
    part_mg_id = Column("PartMGID", Integer, nullable=True)
    team_mg_id = Column("TeamMGID", Integer, ForeignKey("TeamMG.TeamMGID", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    stage_id = Column("StageID", Integer, ForeignKey("WorkletStage.StageID", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)

    # Relationships
    user_associations = relationship("UserWorkletAssociation", back_populates="worklet", cascade="all, delete-orphan")
    college_rel = relationship("College", primaryjoin="Worklet.college_id==College.college_id", uselist=False)
    stage_rel = relationship("WorkletStage", primaryjoin="Worklet.stage_id==WorkletStage.stage_id", uselist=False, foreign_keys=[stage_id])
    team_rel = relationship("TeamMG", primaryjoin="Worklet.team_mg_id==TeamMG.id", uselist=False, foreign_keys=[team_mg_id])
    suggestions = relationship("Suggestion", back_populates="worklet", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="worklet", cascade="all, delete-orphan")

    # Convenience properties to keep API compatibility
    @property
    def created_at(self):
        return self.created_on

    @property
    def updated_at(self):
        # Prism_Worklet doesn't store updated timestamp; expose created_on for compatibility
        return self.created_on

    @property
    def domain(self):
        # Expose tech_domain_id as string domain for backward compatibility if needed
        return str(self.tech_domain_id) if self.tech_domain_id is not None else None

    def __repr__(self):
        return f"<Worklet(id={self.id}, cert_id='{self.cert_id}', title='{(self.title or '')[:30]}', status_id='{self.status_id}')>"


class UserWorkletAssociation(Base):
    __tablename__ = "user_worklet_association"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), primary_key=True)
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
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Evaluation(id={self.id}, user_id={self.user_id}, worklet_id={self.worklet_id}, score={self.score})>"


# Create indexes
Index("ix_user_email", User.email, unique=True)
# DB already has a unique index on Prism_Worklet(CertID); avoid duplicating here
# Index("ix_prism_cert_id", Worklet.cert_id, unique=True)
Index("ix_user_worklet_association", UserWorkletAssociation.user_id, UserWorkletAssociation.worklet_id)

"""
Updated portfolio domain models to align with provided raw SQL schema:
  achievements, papers, patents, commercializations
Legacy Mentor* models removed to avoid creation of unused tables.
"""

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column("achievement_id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    type = Column(SAEnum("Award", "Recognition", "Other", name="achievement_type_enum"), nullable=False, server_default="Other")
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to worklet
    worklet = relationship("Worklet", foreign_keys=[worklet_id], primaryjoin="Achievement.worklet_id==Worklet.id")
    
    # Computed property for cert_id
    @property
    def cert_id(self):
        return self.worklet.cert_id if self.worklet else None

class Paper(Base):
    __tablename__ = "papers"
    id = Column("paper_id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    publication_year = Column(Integer, nullable=True)
    journal = Column(String(255), nullable=True)
    doi = Column(String(255), nullable=True)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to worklet
    worklet = relationship("Worklet", foreign_keys=[worklet_id], primaryjoin="Paper.worklet_id==Worklet.id")
    
    # Computed property for cert_id
    @property
    def cert_id(self):
        return self.worklet.cert_id if self.worklet else None

class Patent(Base):
    __tablename__ = "patents"
    id = Column("patent_id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    application_number = Column(String(100), nullable=True)
    filing_year = Column(Integer, nullable=True)
    status = Column(SAEnum("Filed", "Granted", "Published", name="patent_status_enum"), nullable=False, server_default="Filed")
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to worklet
    worklet = relationship("Worklet", foreign_keys=[worklet_id], primaryjoin="Patent.worklet_id==Worklet.id")
    
    # Computed property for cert_id
    @property
    def cert_id(self):
        return self.worklet.cert_id if self.worklet else None

class Commercialization(Base):
    __tablename__ = "commercializations"
    id = Column("commercialization_id", Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    year = Column(Integer, nullable=True)
    revenue = Column(DECIMAL(12, 2), nullable=True)
    description = Column(Text, nullable=True)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to worklet
    worklet = relationship("Worklet", foreign_keys=[worklet_id], primaryjoin="Commercialization.worklet_id==Worklet.id")
    
    # Computed property for cert_id
    @property
    def cert_id(self):
        return self.worklet.cert_id if self.worklet else None


# Suggestions table
class Suggestion(Base):
    __tablename__ = "Prism_Suggestion"

    suggestion_id = Column(Integer, primary_key=True, autoincrement=True)
    worklet_id = Column(Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    suggestion_title = Column(String(100), nullable=False)
    suggestion_content = Column(Text, nullable=False)
    category = Column(String(50), default="General")
    priority = Column(SAEnum("low", "medium", "high", name="priority_enum"), default="medium")
    is_read = Column(Boolean, default=False, nullable=False)
    is_helpful = Column(Boolean, nullable=True)
    student_response = Column(Text, nullable=True)
    response_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    worklet = relationship("Worklet", back_populates="suggestions")
    mentor = relationship("User", foreign_keys=[mentor_id])

    # Indexes
    __table_args__ = (
        Index('idx_worklet_id', 'worklet_id'),
        Index('idx_mentor_id', 'mentor_id'),
        Index('idx_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<Suggestion(suggestion_id={self.suggestion_id}, worklet_id={self.worklet_id}, title='{self.suggestion_title}')>"


# Milestone table
class Milestone(Base):
    __tablename__ = "Prism_Milestone"

    milestone_id = Column(Integer, primary_key=True, autoincrement=True)
    worklet_id = Column(Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    milestone_type = Column(String(50), nullable=False)
    date_created = Column(DateTime, server_default=func.now(), nullable=False)
    field1_label = Column(String(100), nullable=True)
    field1_value = Column(Text, nullable=True)
    field2_label = Column(String(100), nullable=True)
    field2_value = Column(Text, nullable=True)
    toggle_label = Column(String(100), nullable=True)
    toggle_value = Column(Boolean, default=False)
    attachment_name = Column(String(255), nullable=True)
    attachment_size = Column(Integer, nullable=True)
    attachment_type = Column(String(100), nullable=True)
    attachment_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    worklet = relationship("Worklet", back_populates="milestones")
    student = relationship("User", foreign_keys=[student_id])
    feedbacks = relationship("MilestoneFeedback", back_populates="milestone", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Milestone(milestone_id={self.milestone_id}, type='{self.milestone_type}', worklet_id={self.worklet_id})>"


# Milestone Feedback table
class MilestoneFeedback(Base):
    __tablename__ = "Prism_Milestone_Feedback"

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    milestone_id = Column(Integer, ForeignKey("Prism_Milestone.milestone_id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    reviewer_role = Column(SAEnum("mentor", "professor", name="reviewer_role_enum"), nullable=False)
    feedback_text = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    milestone = relationship("Milestone", back_populates="feedbacks")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def __repr__(self):
        return f"<MilestoneFeedback(feedback_id={self.feedback_id}, milestone_id={self.milestone_id}, role='{self.reviewer_role}')>"


# Meeting table
class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    college_id = Column(Integer, ForeignKey("colleges.college_id", ondelete="CASCADE"), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False, server_default="30")
    meeting_link = Column(String(500), nullable=False)
    status = Column(SAEnum("upcoming", "live", "completed", "cancelled", name="meeting_status_enum"), nullable=False, server_default="upcoming")
    
    # Recurring meeting fields
    repeat_days = Column(String(50), nullable=True, comment="Comma-separated weekday abbreviations: Mon,Wed,Fri")
    repeat_until = Column(Date, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    college_rel = relationship("College", foreign_keys=[college_id])
    organizer = relationship("User", foreign_keys=[organizer_id])
    worklet_associations = relationship("MeetingWorkletAssociation", back_populates="meeting", cascade="all, delete-orphan")
    recurrences = relationship("MeetingRecurrence", back_populates="parent_meeting", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Meeting(meeting_id={self.meeting_id}, title='{self.title}', start='{self.start_datetime}')>"


# Meeting-Worklet association table
class MeetingWorkletAssociation(Base):
    __tablename__ = "meeting_worklet_association"

    meeting_id = Column(Integer, ForeignKey("meetings.meeting_id", ondelete="CASCADE"), primary_key=True)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), primary_key=True)
    scheduled_datetime = Column(DateTime, nullable=False, comment="Specific start time for this worklet in the meeting")

    # Relationships
    meeting = relationship("Meeting", back_populates="worklet_associations")
    worklet = relationship("Worklet")

    def __repr__(self):
        return f"<MeetingWorkletAssociation(meeting_id={self.meeting_id}, worklet_id={self.worklet_id})>"


# Meeting recurrence table
class MeetingRecurrence(Base):
    __tablename__ = "meeting_recurrence"

    recurrence_id = Column(Integer, primary_key=True, autoincrement=True)
    parent_meeting_id = Column(Integer, ForeignKey("meetings.meeting_id", ondelete="CASCADE"), nullable=False, comment="Reference to the master/parent meeting")
    occurrence_datetime = Column(DateTime, nullable=False, comment="Specific date/time for this occurrence")
    is_cancelled = Column(Boolean, default=False, comment="Whether this specific occurrence is cancelled")
    is_rescheduled = Column(Boolean, default=False, comment="Whether this specific occurrence was rescheduled")
    rescheduled_datetime = Column(DateTime, nullable=True, comment="New datetime if rescheduled")
    notes = Column(Text, nullable=True, comment="Optional notes for this occurrence")
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    parent_meeting = relationship("Meeting", back_populates="recurrences")

    def __repr__(self):
        return f"<MeetingRecurrence(recurrence_id={self.recurrence_id}, parent_meeting_id={self.parent_meeting_id}, occurrence={self.occurrence_datetime})>"


# ============= CHAT MODELS =============

# Chat Room table (for individual 1-on-1 chats)
class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    room_id = Column(Integer, primary_key=True, autoincrement=True)
    worklet_id = Column(Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=True)
    user1_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_activity = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    worklet = relationship("Worklet", foreign_keys=[worklet_id])
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")

    # Ensure unique combination
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', 'worklet_id', name='unique_chat_room'),
        Index('idx_chat_room_users', 'user1_id', 'user2_id'),
    )

    def __repr__(self):
        return f"<ChatRoom(room_id={self.room_id}, user1_id={self.user1_id}, user2_id={self.user2_id})>"


# Chat Message table (for individual chats)
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.room_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    sent_at = Column(DateTime, server_default=func.now(), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

    # Indexes for performance
    __table_args__ = (
        Index('idx_chat_message_room', 'room_id', 'sent_at'),
        Index('idx_chat_message_sender', 'sender_id'),
    )

    def __repr__(self):
        return f"<ChatMessage(message_id={self.message_id}, room_id={self.room_id}, sender_id={self.sender_id})>"


# ============= MESSAGES SYSTEM (Original) =============

# Message table
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    worklet_id = Column("WorkletID", Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    worklet = relationship("Worklet", foreign_keys=[worklet_id])

    # Indexes
    __table_args__ = (
        Index('idx_sender', 'sender_id'),
        Index('idx_receiver', 'receiver_id'),
        Index('idx_worklet', 'WorkletID'),
        Index('idx_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<Message(id={self.id}, sender_id={self.sender_id}, receiver_id={self.receiver_id})>"


# MessageRead table
class MessageRead(Base):
    __tablename__ = "message_reads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    message = relationship("Message", foreign_keys=[message_id])
    user = relationship("User", foreign_keys=[user_id])

    # Indexes
    __table_args__ = (
        UniqueConstraint('message_id', 'user_id', name='unique_message_user_read'),
        Index('idx_message_reads_message_id', 'message_id'),
        Index('idx_message_reads_user_id', 'user_id'),
    )

    def __repr__(self):
        return f"<MessageRead(id={self.id}, message_id={self.message_id}, user_id={self.user_id})>"


# Group Chat table (for worklet groups)
class GroupChat(Base):
    __tablename__ = "group_chats"

    group_id = Column(Integer, primary_key=True, autoincrement=True)
    worklet_id = Column(Integer, ForeignKey("Prism_Worklet.WorkletID", ondelete="CASCADE"), nullable=False, unique=True)
    group_name = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    worklet = relationship("Worklet", foreign_keys=[worklet_id])
    creator = relationship("User", foreign_keys=[created_by])
    messages = relationship("GroupChatMessage", back_populates="group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<GroupChat(group_id={self.group_id}, worklet_id={self.worklet_id}, group_name='{self.group_name}')>"


# Group Chat Message table
class GroupChatMessage(Base):
    __tablename__ = "group_chat_messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("group_chats.group_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    sent_at = Column(DateTime, server_default=func.now(), nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    group = relationship("GroupChat", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])

    # Indexes for performance
    __table_args__ = (
        Index('idx_group_message_group', 'group_id', 'sent_at'),
        Index('idx_group_message_sender', 'sender_id'),
    )

    def __repr__(self):
        return f"<GroupChatMessage(message_id={self.message_id}, group_id={self.group_id}, sender_id={self.sender_id})>"
