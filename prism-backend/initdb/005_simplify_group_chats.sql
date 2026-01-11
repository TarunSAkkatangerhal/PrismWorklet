-- Migration: Simplify Group Chat Tables
-- This migration removes group_chats and group_chat_members tables
-- and updates group_chat_messages to link directly to worklets

-- Step 1: Create backup of existing data (optional but recommended)
CREATE TABLE IF NOT EXISTS group_chat_messages_backup AS SELECT * FROM group_chat_messages;

-- Step 2: Add new WorkletID column to group_chat_messages
ALTER TABLE group_chat_messages 
ADD COLUMN WorkletID INT NULL AFTER message_id;

-- Step 3: Populate WorkletID from existing group_chats relation
UPDATE group_chat_messages gcm
INNER JOIN group_chats gc ON gcm.group_id = gc.group_id
SET gcm.WorkletID = gc.WorkletID;

-- Step 4: Add foreign key constraint to Prism_Worklet
ALTER TABLE group_chat_messages
ADD CONSTRAINT fk_group_messages_worklet 
FOREIGN KEY (WorkletID) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE;

-- Step 5: Drop old group_id column
ALTER TABLE group_chat_messages DROP FOREIGN KEY group_chat_messages_ibfk_1;
ALTER TABLE group_chat_messages DROP COLUMN group_id;

-- Step 6: Add index on WorkletID for better performance
CREATE INDEX idx_group_message_worklet_sent ON group_chat_messages(WorkletID, sent_at);

-- Step 7: Drop old tables (they're no longer needed)
DROP TABLE IF EXISTS group_chat_members;
DROP TABLE IF EXISTS group_chats;

-- Verification query - Check message counts
-- SELECT WorkletID, COUNT(*) as message_count FROM group_chat_messages GROUP BY WorkletID;
