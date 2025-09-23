"""
Simplified SQL Migration for User Worklet Association
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def execute_simple_migration():
    """Execute simplified SQL migration"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 1. Drop table if exists (for clean start)
            print("🗑️ Dropping existing table if exists...")
            conn.execute(text("DROP TABLE IF EXISTS user_worklet_association;"))
            conn.commit()
            
            # 2. Create table with simplified structure
            print("📋 Creating user_worklet_association table...")
            create_table_sql = """
            CREATE TABLE user_worklet_association (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                worklet_id INT NOT NULL,
                role_in_worklet VARCHAR(20) NOT NULL DEFAULT 'Student',
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                assigned_by INT NULL,
                completion_status VARCHAR(20) DEFAULT 'Not Started',
                progress_percentage INT DEFAULT 0,
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_user_worklet (user_id, worklet_id),
                INDEX idx_active (is_active),
                INDEX idx_role (role_in_worklet)
            );
            """
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Table created successfully!")
            
            # 3. Migrate mentors
            print("👨‍🏫 Migrating mentor assignments...")
            migrate_mentors_sql = """
            INSERT IGNORE INTO user_worklet_association 
            (user_id, worklet_id, role_in_worklet, assigned_at, completion_status, progress_percentage, notes)
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
            result = conn.execute(text(migrate_mentors_sql))
            mentor_count = result.rowcount
            conn.commit()
            print(f"✅ Migrated {mentor_count} mentor assignments")
            
            # 4. Migrate students
            print("👨‍🎓 Migrating student assignments...")
            migrate_students_sql = """
            INSERT IGNORE INTO user_worklet_association 
            (user_id, worklet_id, role_in_worklet, assigned_at, completion_status, progress_percentage, notes)
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
            result = conn.execute(text(migrate_students_sql))
            student_count = result.rowcount
            conn.commit()
            print(f"✅ Migrated {student_count} student assignments")
            
            # 5. Verification
            print("🔍 Verifying migration...")
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
            result = conn.execute(text(verification_sql))
            verification_data = result.fetchall()
            
            print("📊 Migration Summary:")
            for row in verification_data:
                print(f"   - {row[0]}: {row[1]}")
            
            # 6. Sample data
            print("\n📋 Sample associations:")
            sample_sql = """
            SELECT 
                ua.id,
                u.name as user_name,
                w.cert_id as worklet_cert_id,
                ua.role_in_worklet,
                ua.completion_status
            FROM user_worklet_association ua
            JOIN users u ON u.id = ua.user_id
            JOIN worklets w ON w.id = ua.worklet_id
            WHERE ua.is_active = TRUE
            LIMIT 5;
            """
            result = conn.execute(text(sample_sql))
            samples = result.fetchall()
            
            for sample in samples:
                print(f"   - {sample[1]} ({sample[3]}) → {sample[2]} ({sample[4]})")
            
            print("\n✅ Migration completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Simplified SQL Migration")
    print("=" * 50)
    
    if execute_simple_migration():
        print("=" * 50)
        print("✅ Migration successful!")
        print("\n📝 Next steps:")
        print("1. Start the FastAPI server: uvicorn app.main:app --reload")
        print("2. Test endpoints at: http://localhost:8000/docs")
        print("3. Check ongoing worklets in the frontend")
        print("\n🔗 New endpoints available:")
        print("   - GET /api/associations/mentor/{mentor_id}/ongoing-worklets")
        print("   - GET /api/associations/worklet/{worklet_id}")
        print("   - POST /api/associations/")
    else:
        print("❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    main()