"""
Manual SQL Migration for User Worklet Association
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def execute_sql_migration():
    """Execute SQL commands directly"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # SQL commands
    create_table_sql = """
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
        
        INDEX idx_user_worklet (user_id, worklet_id),
        INDEX idx_active (is_active),
        INDEX idx_role (role_in_worklet)
    );
    """
    
    migrate_mentors_sql = """
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
    
    migrate_students_sql = """
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
    
    verification_sql = """
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
    
    try:
        with engine.connect() as conn:
            # 1. Create table
            print("📋 Creating user_worklet_association table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Table created successfully!")
            
            # 2. Migrate mentors
            print("👨‍🏫 Migrating mentor assignments...")
            result = conn.execute(text(migrate_mentors_sql))
            mentor_count = result.rowcount
            conn.commit()
            print(f"✅ Migrated {mentor_count} mentor assignments")
            
            # 3. Migrate students
            print("👨‍🎓 Migrating student assignments...")
            result = conn.execute(text(migrate_students_sql))
            student_count = result.rowcount
            conn.commit()
            print(f"✅ Migrated {student_count} student assignments")
            
            # 4. Verification
            print("🔍 Verifying migration...")
            result = conn.execute(text(verification_sql))
            verification_data = result.fetchall()
            
            print("📊 Migration Summary:")
            for row in verification_data:
                print(f"   - {row[0]}: {row[1]}")
            
            print("\n✅ Migration completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Manual SQL Migration")
    print("=" * 50)
    
    if execute_sql_migration():
        print("=" * 50)
        print("✅ Migration successful!")
        print("\n📝 Next steps:")
        print("1. Start the FastAPI server")
        print("2. Test the association endpoints")
        print("3. Check the frontend Dashboard for real data")
    else:
        print("❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    main()