-- ===============================================
-- Performance Indexes Migration
-- Samsung PRISM Worklet Management System
-- Date: February 17, 2026
-- ===============================================

-- This migration adds critical indexes to improve query performance
-- Run this with: mysql -u root -p prism < 002_add_performance_indexes.sql

USE prism;

-- ============================================
-- 1. Worklet Performance Indexes
-- ============================================

-- Index for status-based queries (most common filtering)
CREATE INDEX IF NOT EXISTS idx_worklet_status ON Prism_Worklet(StatusID);

-- Index for date range queries (dashboard statistics)
CREATE INDEX IF NOT EXISTS idx_worklet_start_date ON Prism_Worklet(StartDate);
CREATE INDEX IF NOT EXISTS idx_worklet_end_date ON Prism_Worklet(EndDate);
CREATE INDEX IF NOT EXISTS idx_worklet_dates_combined ON Prism_Worklet(StartDate, EndDate);

-- Index for college-based queries
CREATE INDEX IF NOT EXISTS idx_worklet_college ON Prism_Worklet(CollegeID);

-- Index for creator queries
CREATE INDEX IF NOT EXISTS idx_worklet_creator ON Prism_Worklet(CreatorID);

-- Index for domain filtering
CREATE INDEX IF NOT EXISTS idx_worklet_domain ON Prism_Worklet(TechDomainID);

-- Index for team filtering
CREATE INDEX IF NOT EXISTS idx_worklet_team ON Prism_Worklet(TeamMGID);

-- Composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_worklet_status_dates ON Prism_Worklet(StatusID, StartDate, EndDate);

-- Index for search by title
CREATE INDEX IF NOT EXISTS idx_worklet_title ON Prism_Worklet(Title(255));

-- Index for stage filtering
CREATE INDEX IF NOT EXISTS idx_worklet_stage ON Prism_Worklet(StageID);

-- Index for group filtering
CREATE INDEX IF NOT EXISTS idx_worklet_group ON Prism_Worklet(GroupMGID);

-- ============================================
-- 2. User Performance Indexes
-- ============================================

-- Index for role-based queries (critical for dashboard)
CREATE INDEX IF NOT EXISTS idx_user_role ON User(Role);

-- Index for college-based user queries
CREATE INDEX IF NOT EXISTS idx_user_college ON User(CollegeID);

-- Composite index for active users by role
CREATE INDEX IF NOT EXISTS idx_user_role_active ON User(Role, ActiveTill);

-- Index for email lookups (authentication)
CREATE INDEX IF NOT EXISTS idx_user_email ON User(Email);

-- ============================================
-- 3. Association Performance Indexes
-- ============================================

-- Index for role filtering in associations
CREATE INDEX IF NOT EXISTS idx_assoc_role ON UserWorkletAssociation(RoleInWorklet);

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_assoc_worklet_role ON UserWorkletAssociation(WorkletID, RoleInWorklet);
CREATE INDEX IF NOT EXISTS idx_assoc_user_role ON UserWorkletAssociation(UserID, RoleInWorklet);

-- Index for association timestamps
CREATE INDEX IF NOT EXISTS idx_assoc_created ON UserWorkletAssociation(AssociatedAt);

-- ============================================
-- 4. Chat Message Indexes
-- ============================================

-- Index for worklet+time based queries (chat history)
CREATE INDEX IF NOT EXISTS idx_chat_worklet_time ON ChatMessage(WorkletID, Timestamp DESC);

-- Index for sender queries
CREATE INDEX IF NOT EXISTS idx_chat_sender ON ChatMessage(SenderID);

-- ============================================
-- 5. Portfolio Indexes
-- ============================================

-- Index for user portfolio queries
CREATE INDEX IF NOT EXISTS idx_paper_user ON Paper(StudentID);
CREATE INDEX IF NOT EXISTS idx_paper_year ON Paper(Year);
CREATE INDEX IF NOT EXISTS idx_paper_user_year ON Paper(StudentID, Year);

CREATE INDEX IF NOT EXISTS idx_patent_user ON Patent(StudentID);
CREATE INDEX IF NOT EXISTS idx_patent_year ON Patent(Year);
CREATE INDEX IF NOT EXISTS idx_patent_user_year ON Patent(StudentID, Year);

-- ============================================
-- 6. Milestone Indexes
-- ============================================

-- Index for worklet milestone queries
CREATE INDEX IF NOT EXISTS idx_milestone_worklet ON Milestone(WorkletID);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_milestone_status ON Milestone(Status);

-- Composite index for worklet milestones by order
CREATE INDEX IF NOT EXISTS idx_milestone_worklet_order ON Milestone(WorkletID, OrderIndex);

-- ============================================
-- 7. Meeting Indexes
-- ============================================

-- Index for worklet meetings
CREATE INDEX IF NOT EXISTS idx_meeting_worklet ON WorkletMeeting(WorkletID);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_meeting_date ON WorkletMeeting(MeetingDate DESC);

-- Index for creator queries
CREATE INDEX IF NOT EXISTS idx_meeting_creator ON WorkletMeeting(CreatedBy);

-- Composite index for worklet meetings by date
CREATE INDEX IF NOT EXISTS idx_meeting_worklet_date ON WorkletMeeting(WorkletID, MeetingDate DESC);

-- ============================================
-- 8. Update Feed Indexes
-- ============================================

-- Index for worklet updates
CREATE INDEX IF NOT EXISTS idx_update_worklet ON WorkletUpdate(WorkletID);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_update_timestamp ON WorkletUpdate(UpdatedAt DESC);

-- Index for author queries
CREATE INDEX IF NOT EXISTS idx_update_author ON WorkletUpdate(AuthorID);

-- Composite index for worklet update feed
CREATE INDEX IF NOT EXISTS idx_update_worklet_time ON WorkletUpdate(WorkletID, UpdatedAt DESC);

-- ============================================
-- 9. Evaluation Indexes
-- ============================================

-- Index for worklet evaluations
CREATE INDEX IF NOT EXISTS idx_eval_worklet ON Evaluation(WorkletID);

-- Index for evaluator queries
CREATE INDEX IF NOT EXISTS idx_eval_evaluator ON Evaluation(EvaluatorID);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_eval_date ON Evaluation(EvaluatedAt DESC);

-- Composite index for worklet evaluations
CREATE INDEX IF NOT EXISTS idx_eval_worklet_date ON Evaluation(WorkletID, EvaluatedAt DESC);

-- ============================================
-- Verification: Show all indexes
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
FROM 
    INFORMATION_SCHEMA.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'prism'
    AND TABLE_NAME IN (
        'Prism_Worklet', 'User', 'UserWorkletAssociation', 
        'ChatMessage', 'Paper', 'Patent', 'Milestone',
        'WorkletMeeting', 'WorkletUpdate', 'Evaluation'
    )
GROUP BY 
    TABLE_NAME, INDEX_NAME
ORDER BY 
    TABLE_NAME, INDEX_NAME;

-- ============================================
-- Migration Complete
-- ============================================
SELECT 'Performance indexes migration completed successfully!' as Status;
