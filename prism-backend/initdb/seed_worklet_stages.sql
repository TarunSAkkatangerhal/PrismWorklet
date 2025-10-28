-- Insert WorkletStage data if table exists but is empty
-- Run this if your database already exists and needs the stage data

INSERT IGNORE INTO WorkletStage (StageID, Stage) VALUES
  (1, 'First Review'),
  (2, 'Second Review'),
  (3, 'Mid Review'),
  (4, 'Fourth Review'),
  (5, 'End Review'),
  (6, 'Extended Review'),
  (7, 'Add OC');

-- Verify the data
SELECT * FROM WorkletStage ORDER BY StageID;
