"""
Fix user_worklet_association table structure
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def fix_table_structure():
    """Add missing columns to user_worklet_association table"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # First, check current structure
            print("🔍 Checking current table structure...")
            result = conn.execute(text("DESCRIBE user_worklet_association;"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Current columns: {columns}")
            
            # Add missing columns
            missing_columns = []
            
            if 'role_in_worklet' not in columns:
                print("➕ Adding role_in_worklet column...")
                conn.execute(text("ALTER TABLE user_worklet_association ADD COLUMN role_in_worklet VARCHAR(20) DEFAULT 'Student';"))
                missing_columns.append('role_in_worklet')
            
            if 'assigned_at' not in columns:
                print("➕ Adding assigned_at column...")
                conn.execute(text("ALTER TABLE user_worklet_association ADD COLUMN assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP;"))
                missing_columns.append('assigned_at')
            
            if 'completion_status' not in columns:
                print("➕ Adding completion_status column...")
                conn.execute(text("ALTER TABLE user_worklet_association ADD COLUMN completion_status VARCHAR(20) DEFAULT 'In Progress';"))
                missing_columns.append('completion_status')
            
            if 'progress_percentage' not in columns:
                print("➕ Adding progress_percentage column...")
                conn.execute(text("ALTER TABLE user_worklet_association ADD COLUMN progress_percentage INT DEFAULT 0;"))
                missing_columns.append('progress_percentage')
            
            if 'notes' not in columns:
                print("➕ Adding notes column...")
                conn.execute(text("ALTER TABLE user_worklet_association ADD COLUMN notes TEXT NULL;"))
                missing_columns.append('notes')
            
            conn.commit()
            
            if missing_columns:
                print(f"✅ Added columns: {missing_columns}")
            else:
                print("ℹ️  All columns already exist")
            
            # Now update the role_in_worklet based on user roles
            print("🔄 Updating role_in_worklet based on user roles...")
            update_roles_sql = """
            UPDATE user_worklet_association ua
            JOIN users u ON u.id = ua.user_id
            SET ua.role_in_worklet = CASE 
                WHEN u.role = 'Mentor' THEN 'Mentor'
                WHEN u.role = 'Student' THEN 'Student'
                ELSE 'Student'
            END
            WHERE ua.role_in_worklet = 'Student' OR ua.role_in_worklet IS NULL;
            """
            result = conn.execute(text(update_roles_sql))
            updated_rows = result.rowcount
            conn.commit()
            print(f"✅ Updated {updated_rows} role assignments")
            
            # Verify the updates
            print("🔍 Verifying role distribution...")
            verify_sql = """
            SELECT 
                ua.role_in_worklet,
                COUNT(*) as count
            FROM user_worklet_association ua
            GROUP BY ua.role_in_worklet;
            """
            result = conn.execute(text(verify_sql))
            for row in result.fetchall():
                print(f"   - {row[0]}: {row[1]} associations")
            
            # Show sample mentor-student data
            print("\n📊 Sample mentor-student associations:")
            sample_sql = """
            SELECT 
                u.name as user_name,
                u.role as user_role,
                ua.role_in_worklet,
                w.cert_id as worklet_cert_id,
                ua.completion_status
            FROM user_worklet_association ua
            JOIN users u ON u.id = ua.user_id
            JOIN worklets w ON w.id = ua.worklet_id
            WHERE ua.is_active = 1
            ORDER BY ua.role_in_worklet, u.name
            LIMIT 10;
            """
            result = conn.execute(text(sample_sql))
            for row in result.fetchall():
                print(f"   - {row[0]} ({row[1]}) → {row[3]} as {row[2]} ({row[4]})")
            
            print("\n✅ Table structure fixed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error fixing table structure: {str(e)}")
        return False

def main():
    """Main function"""
    print("🔧 Fixing user_worklet_association table structure")
    print("=" * 60)
    
    if fix_table_structure():
        print("=" * 60)
        print("✅ Table structure fixed!")
        print("\n📝 Next steps:")
        print("1. The table now has proper role_in_worklet column")
        print("2. Backend endpoints can now distinguish mentors from students")
        print("3. Statistics page will show correct mentees data")
    else:
        print("❌ Failed to fix table structure")

if __name__ == "__main__":
    main()