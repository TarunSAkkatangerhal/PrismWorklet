-- Migration: Add Group Message Read Receipts Table
-- This adds individual read tracking for group messages

-- Create the read receipts table
CREATE TABLE IF NOT EXISTS group_message_read_receipts (
    receipt_id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES group_chat_messages(message_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_user (message_id, user_id),
    INDEX idx_receipt_message (message_id),
    INDEX idx_receipt_user (user_id)
);

-- Verification query
-- SELECT COUNT(*) as receipt_count FROM group_message_read_receipts;
