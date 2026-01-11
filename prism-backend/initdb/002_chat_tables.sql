-- Chat tables for Samsung PRISM Worklet Management System

-- Individual Chat Rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_chat_room_users (user1_id, user2_id),
    INDEX idx_chat_room_worklet (worklet_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_chat_message_room (room_id, sent_at),
    INDEX idx_chat_message_sender (sender_id)
);

-- Group Chat Messages (Simplified - links directly to worklets)
-- Group membership is implicit via user_worklet_association table
-- No separate group_chats or group_chat_members tables needed
CREATE TABLE IF NOT EXISTS group_chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    WorkletID INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (WorkletID) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_group_message_worklet_sent (WorkletID, sent_at),
    INDEX idx_group_message_sender (sender_id)
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
