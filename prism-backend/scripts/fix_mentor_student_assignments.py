#!/usr/bin/env python3
"""
Fix mentor-student relationships by assigning students to mentor's worklets
"""

import mysql.connector
from mysql.connector import Error

def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="root", 
        password="password",
        database="prism_db"
    )

def fix_mentor_student_assignments():
    """Assign students to worklets that belong to mentors"""
    
    connection = None
    try:
        connection = connect_to_db()
        cursor = connection.cursor()
        
        print("🔧 Fixing mentor-student worklet assignments...")
        
        # Get mentors and their worklets
        cursor.execute("""
            SELECT w.id as worklet_id, w.cert_id, w.mentor_id, u.name as mentor_name
            FROM worklets w 
            JOIN users u ON u.id = w.mentor_id 
            WHERE w.mentor_id IS NOT NULL
        """)
        
        mentor_worklets = cursor.fetchall()
        print(f"📚 Found {len(mentor_worklets)} worklets assigned to mentors")
        
        # Get available students
        cursor.execute("""
            SELECT id, name FROM users WHERE role = 'Student' LIMIT 10
        """)
        
        students = cursor.fetchall()
        print(f"👥 Found {len(students)} students available for assignment")
        
        assignments_made = 0
        
        # Assign 2-3 students to each mentor's worklet
        for worklet_id, cert_id, mentor_id, mentor_name in mentor_worklets:
            print(f"\n📝 Assigning students to worklet {cert_id} (Mentor: {mentor_name})")
            
            # Take first 3 students for this worklet 
            for i, (student_id, student_name) in enumerate(students[:3]):
                
                # Check if already assigned
                cursor.execute("""
                    SELECT COUNT(*) FROM user_worklet_association 
                    WHERE user_id = %s AND worklet_id = %s
                """, (student_id, worklet_id))
                
                if cursor.fetchone()[0] == 0:  # Not already assigned
                    # Insert student assignment
                    cursor.execute("""
                        INSERT INTO user_worklet_association 
                        (user_id, worklet_id, role_in_worklet, assigned_by, completion_status, progress_percentage)
                        VALUES (%s, %s, 'Student', %s, 'Ongoing', %s)
                    """, (student_id, worklet_id, mentor_id, 25 + (i * 20)))  # Varying progress
                    
                    assignments_made += 1
                    print(f"   ✅ Assigned {student_name} to {cert_id}")
                else:
                    print(f"   ⏭️  {student_name} already assigned to {cert_id}")
            
            # Rotate students for next worklet
            students = students[1:] + students[:1]
        
        connection.commit()
        print(f"\n🎉 Successfully created {assignments_made} student assignments!")
        
        # Verify the assignments
        cursor.execute("""
            SELECT 
                w.cert_id,
                u_mentor.name as mentor_name,
                COUNT(uwa.id) as student_count
            FROM worklets w
            JOIN users u_mentor ON u_mentor.id = w.mentor_id
            LEFT JOIN user_worklet_association uwa ON uwa.worklet_id = w.id AND uwa.role_in_worklet = 'Student'
            WHERE w.mentor_id IS NOT NULL
            GROUP BY w.id, w.cert_id, u_mentor.name
            ORDER BY student_count DESC
        """)
        
        verification = cursor.fetchall()
        print(f"\n📊 Verification - Students per mentor's worklet:")
        for cert_id, mentor_name, student_count in verification:
            print(f"   📚 {cert_id} (Mentor: {mentor_name}) - {student_count} students")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection:
            connection.rollback()
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    fix_mentor_student_assignments()