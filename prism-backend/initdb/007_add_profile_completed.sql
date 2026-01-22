-- Add profile_completed field to users table to track registration completion
ALTER TABLE users ADD COLUMN profile_completed TINYINT DEFAULT 0 AFTER is_active;

-- Add additional fields to user_profiles for student registration
ALTER TABLE user_profiles 
  ADD COLUMN year_of_study INT NULL AFTER date_of_birth,
  ADD COLUMN program VARCHAR(100) NULL AFTER year_of_study,
  ADD COLUMN student_id VARCHAR(50) NULL AFTER program,
  ADD COLUMN skills TEXT NULL AFTER student_id,
  ADD COLUMN interests TEXT NULL AFTER skills,
  ADD COLUMN batch_from DATE NULL AFTER interests,
  ADD COLUMN batch_to DATE NULL AFTER batch_from; 
