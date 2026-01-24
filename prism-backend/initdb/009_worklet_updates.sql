-- Create worklet_updates table with all constraints
CREATE TABLE worklet_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worklet_id INT NOT NULL,
    update_type VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_by INT NOT NULL,
    work_completed TEXT,
    challenges TEXT,
    next_steps TEXT,
    need_support BOOLEAN DEFAULT FALSE,
    additional_notes TEXT,
    meeting_agenda TEXT,
    key_discussions TEXT,
    meeting_next_steps TEXT,
    meeting_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_worklet_id (worklet_id),
    INDEX idx_update_type (update_type),
    INDEX idx_submitted_by (submitted_by),
    CONSTRAINT fk_worklet_updates_worklet FOREIGN KEY (worklet_id) REFERENCES Prism_Worklet(WorkletID) ON DELETE CASCADE,
    CONSTRAINT fk_worklet_updates_user FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

