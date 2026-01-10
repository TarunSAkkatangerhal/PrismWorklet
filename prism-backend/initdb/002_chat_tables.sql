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

-- Group Chats (one per worklet)
CREATE TABLE IF NOT EXISTS group_chats (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_group_worklet (worklet_id)
);

-- Group Chat Members
CREATE TABLE IF NOT EXISTS group_chat_members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES group_chats(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_member (group_id, user_id),
    INDEX idx_group_member_user (user_id)
);

-- Group Chat Messages
CREATE TABLE IF NOT EXISTS group_chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES group_chats(group_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_group_message_group (group_id, sent_at),
    INDEX idx_group_message_sender (sender_id)
);
