-- =====================================================
-- Chat Tables for Samsung PRISM Worklet Management System
-- Group Chat Only (No Individual/Direct Messages)
-- =====================================================

-- Group Chat Messages (Links directly to worklets)
-- Group membership is implicit via user_worklet_association table
CREATE TABLE IF NOT EXISTS group_chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    WorkletID INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    included_in_email BOOLEAN DEFAULT FALSE,
    starred_at TIMESTAMP NULL,
    FOREIGN KEY (WorkletID) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_group_message_worklet_sent (WorkletID, sent_at),
    INDEX idx_group_message_sender (sender_id),
    INDEX idx_group_message_starred (sender_id, is_starred)
);

-- Group Message Read Receipts (track individual read status per user)
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

-- Email Triggers (track when starred message emails are sent)
CREATE TABLE IF NOT EXISTS email_triggers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT NOT NULL,
    user_id INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_worklet_sent (worklet_id, sent_at)
);
