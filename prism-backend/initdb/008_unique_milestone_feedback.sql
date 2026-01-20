-- Migration: Add unique constraint to prevent duplicate feedback from same reviewer on same milestone
-- Each mentor/professor can only provide feedback once per milestone

-- Add unique constraint on (milestone_id, reviewer_id)
ALTER TABLE Prism_Milestone_Feedback
ADD CONSTRAINT uq_milestone_reviewer UNIQUE (milestone_id, reviewer_id);
