-- Add email tracking table
CREATE TABLE IF NOT EXISTS email_triggers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT NOT NULL,
    user_id INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_worklet_sent (worklet_id, sent_at)
);

-- Add column to track if message was included in email
ALTER TABLE group_chat_messages 
ADD COLUMN included_in_email BOOLEAN DEFAULT FALSE AFTER is_starred;

-- Add column to track when message was starred
ALTER TABLE group_chat_messages 
ADD COLUMN starred_at TIMESTAMP NULL AFTER included_in_email;

