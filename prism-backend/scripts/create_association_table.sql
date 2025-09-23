"""
Simple SQL script to create user_worklet_association table
"""

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS user_worklet_association (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    worklet_id INT NOT NULL,
    role_in_worklet ENUM('Mentor', 'Student', 'Collaborator') NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by INT NULL,
    completion_status ENUM('Not Started', 'In Progress', 'Completed', 'On Hold') DEFAULT 'Not Started',
    progress_percentage INT DEFAULT 0,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worklet_id) REFERENCES worklets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_worklet (user_id, worklet_id),
    INDEX idx_active (is_active),
    INDEX idx_role (role_in_worklet),
    UNIQUE KEY unique_user_worklet_role (user_id, worklet_id, role_in_worklet)
);
"""

MIGRATE_MENTORS_SQL = """
INSERT IGNORE INTO user_worklet_association (user_id, worklet_id, role_in_worklet, assigned_at, completion_status, progress_percentage, notes)
SELECT 
    w.mentor_id,
    w.id,
    'Mentor',
    COALESCE(w.created_on, NOW()),
    CASE 
        WHEN w.status = 'Completed' THEN 'Completed'
        WHEN w.status = 'Ongoing' THEN 'In Progress'
        ELSE 'Not Started'
    END,
    COALESCE(w.percentage_completion, 0),
    'Migrated from worklets.mentor_id'
FROM worklets w
WHERE w.mentor_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = w.mentor_id);
"""

MIGRATE_STUDENTS_SQL = """
INSERT IGNORE INTO user_worklet_association (user_id, worklet_id, role_in_worklet, assigned_at, completion_status, progress_percentage, notes)
SELECT 
    u.id,
    s.worklet_id,
    'Student',
    COALESCE(s.created_at, NOW()),
    'In Progress',
    0,
    CONCAT('Migrated from students table. Extension: ', s.mentorship_extension)
FROM students s
JOIN users u ON u.email = s.email
WHERE EXISTS (SELECT 1 FROM worklets w WHERE w.id = s.worklet_id);
"""

VERIFICATION_SQL = """
SELECT 
    'Total Associations' as metric,
    COUNT(*) as count
FROM user_worklet_association

UNION ALL

SELECT 
    'Active Associations' as metric,
    COUNT(*) as count
FROM user_worklet_association 
WHERE is_active = TRUE

UNION ALL

SELECT 
    'Mentor Associations' as metric,
    COUNT(*) as count
FROM user_worklet_association 
WHERE role_in_worklet = 'Mentor'

UNION ALL

SELECT 
    'Student Associations' as metric,
    COUNT(*) as count
FROM user_worklet_association 
WHERE role_in_worklet = 'Student';
"""

if __name__ == "__main__":
    print("SQL Scripts for User Worklet Association Migration")
    print("=" * 60)
    print("\n1. Create Table:")
    print(CREATE_TABLE_SQL)
    print("\n2. Migrate Mentors:")
    print(MIGRATE_MENTORS_SQL)
    print("\n3. Migrate Students:")
    print(MIGRATE_STUDENTS_SQL)
    print("\n4. Verification:")
    print(VERIFICATION_SQL)
    print("\n" + "=" * 60)
    print("Run these SQL commands manually in your MySQL database.")