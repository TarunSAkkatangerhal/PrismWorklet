-- Add extra and profile_completed columns to user_profiles table
-- This migration adds support for student registration data

ALTER TABLE user_profiles
ADD COLUMN extra JSON NULL;

ALTER TABLE user_profiles
ADD COLUMN profile_completed TINYINT NOT NULL DEFAULT 0;
