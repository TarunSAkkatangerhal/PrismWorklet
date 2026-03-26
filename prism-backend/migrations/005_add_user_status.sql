-- Migration 005: Add status column to users table for pending/approved/rejected/skipped workflow
-- NOTE: Uses IF NOT EXISTS for safer re-runs on MySQL 8+

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','rejected','skipped') NOT NULL DEFAULT 'pending';

-- Backfill: mark currently active users as approved; others keep default pending.
UPDATE users
SET status = 'approved'
WHERE is_active = 1;
