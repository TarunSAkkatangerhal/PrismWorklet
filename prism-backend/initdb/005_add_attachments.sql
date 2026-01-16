-- Add attachments column to chat messages tables
-- This allows storing file metadata (filename, url, content_type, size) as JSON

-- Add attachments to group_chat_messages (only group chats are used)
ALTER TABLE group_chat_messages
ADD COLUMN attachments JSON NULL
COMMENT 'JSON array of file attachments with metadata';
