-- Add is_starred column to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE AFTER is_deleted;

-- Add is_starred column to group_chat_messages table
ALTER TABLE group_chat_messages 
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE AFTER is_deleted;

-- Add indexes for faster queries on starred messages
CREATE INDEX idx_chat_message_starred ON chat_messages(sender_id, is_starred);
CREATE INDEX idx_group_message_starred ON group_chat_messages(sender_id, is_starred);
