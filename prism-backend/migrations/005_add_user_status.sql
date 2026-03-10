-- Migration 005: Add status column to users table for pending/approved/rejected/skipped workflow

ALTER TABLE users
  ADD COLUMN status ENUM('pending','approved','rejected','skipped') NOT NULL DEFAULT 'pending';

-- Backfill: active users are approved, inactive remain pending
UPDATE users SET  is_active = 1  WHERE is_active = 0;
UPDATE users SET status = 'approved' WHERE is_active = 1;
