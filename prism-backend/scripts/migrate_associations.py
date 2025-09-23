"""
Database Migration Script for User Worklet Association Table
Run this script to create the association table and migrate existing data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL, Base
from app.models import UserWorkletAssociation, User, Worklet, Student
from datetime import datetime

def create_user_worklet_association_table():
    """Create the user_worklet_association table"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Create the table
    Base.metadata.create_all(bind=engine, tables=[UserWorkletAssociation.__table__])
    
    print("✅ user_worklet_association table created successfully!")
    return engine

def migrate_existing_data(engine):
    """Migrate existing mentor-worklet and student-worklet relationships"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔄 Starting data migration...")
        
        # 1. Migrate mentor-worklet relationships from worklets.mentor_id
        print("📋 Migrating mentor assignments...")
        worklets_with_mentors = db.query(Worklet).filter(Worklet.mentor_id.isnot(None)).all()
        
        mentor_count = 0
        for worklet in worklets_with_mentors:
            # Check if mentor exists in users table
            mentor = db.query(User).filter(User.id == worklet.mentor_id).first()
            if not mentor:
                print(f"⚠️  Mentor ID {worklet.mentor_id} not found in users table for worklet {worklet.id}")
                continue
            
            # Check if association already exists
            existing = db.query(UserWorkletAssociation).filter(
                UserWorkletAssociation.user_id == worklet.mentor_id,
                UserWorkletAssociation.worklet_id == worklet.id,
                UserWorkletAssociation.role_in_worklet == "Mentor"
            ).first()
            
            if not existing:
                # Create mentor association
                mentor_association = UserWorkletAssociation(
                    user_id=worklet.mentor_id,
                    worklet_id=worklet.id,
                    role_in_worklet="Mentor",
                    assigned_at=worklet.created_on or datetime.now(),
                    is_active=True,
                    completion_status="In Progress",
                    progress_percentage=worklet.percentage_completion or 0,
                    notes=f"Migrated from worklets.mentor_id"
                )
                db.add(mentor_association)
                mentor_count += 1
        
        # 2. Migrate student-worklet relationships from students.worklet_id
        print("👨‍🎓 Migrating student assignments...")
        students = db.query(Student).all()
        
        student_count = 0
        for student in students:
            # Find corresponding user by email
            user = db.query(User).filter(User.email == student.email).first()
            if not user:
                print(f"⚠️  User not found for student email {student.email}")
                continue
            
            # Check if worklet exists
            worklet = db.query(Worklet).filter(Worklet.id == student.worklet_id).first()
            if not worklet:
                print(f"⚠️  Worklet ID {student.worklet_id} not found for student {student.email}")
                continue
            
            # Check if association already exists
            existing = db.query(UserWorkletAssociation).filter(
                UserWorkletAssociation.user_id == user.id,
                UserWorkletAssociation.worklet_id == student.worklet_id,
                UserWorkletAssociation.role_in_worklet == "Student"
            ).first()
            
            if not existing:
                # Create student association
                student_association = UserWorkletAssociation(
                    user_id=user.id,
                    worklet_id=student.worklet_id,
                    role_in_worklet="Student",
                    assigned_at=student.created_at or datetime.now(),
                    is_active=True,
                    completion_status="In Progress",
                    progress_percentage=0,  # Students don't have progress in the old model
                    notes=f"Migrated from students table. Extension: {student.mentorship_extension}"
                )
                db.add(student_association)
                student_count += 1
        
        # Commit all migrations
        db.commit()
        
        print(f"✅ Migration completed successfully!")
        print(f"📊 Summary:")
        print(f"   - Mentor associations migrated: {mentor_count}")
        print(f"   - Student associations migrated: {student_count}")
        print(f"   - Total associations created: {mentor_count + student_count}")
        
        # Verify migration
        total_associations = db.query(UserWorkletAssociation).count()
        print(f"🔍 Total associations in database: {total_associations}")
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def create_sample_associations(engine):
    """Create some sample associations for testing"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🧪 Creating sample associations for testing...")
        
        # Get some users and worklets for sample data
        users = db.query(User).limit(5).all()
        worklets = db.query(Worklet).limit(3).all()
        
        if not users or not worklets:
            print("⚠️  No users or worklets found. Skipping sample data creation.")
            return
        
        sample_count = 0
        for i, worklet in enumerate(worklets):
            if i < len(users):
                user = users[i]
                
                # Check if association already exists
                existing = db.query(UserWorkletAssociation).filter(
                    UserWorkletAssociation.user_id == user.id,
                    UserWorkletAssociation.worklet_id == worklet.id
                ).first()
                
                if not existing:
                    # Create a sample association
                    role = "Mentor" if user.role == "Mentor" else "Student"
                    sample_association = UserWorkletAssociation(
                        user_id=user.id,
                        worklet_id=worklet.id,
                        role_in_worklet=role,
                        assigned_at=datetime.now(),
                        is_active=True,
                        completion_status="In Progress",
                        progress_percentage=50,
                        notes="Sample association for testing"
                    )
                    db.add(sample_association)
                    sample_count += 1
        
        db.commit()
        print(f"✅ Created {sample_count} sample associations")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        db.rollback()
    finally:
        db.close()

def verify_migration(engine):
    """Verify the migration was successful"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔍 Verifying migration...")
        
        # Check total associations
        total = db.query(UserWorkletAssociation).count()
        active = db.query(UserWorkletAssociation).filter(UserWorkletAssociation.is_active == True).count()
        mentors = db.query(UserWorkletAssociation).filter(UserWorkletAssociation.role_in_worklet == "Mentor").count()
        students = db.query(UserWorkletAssociation).filter(UserWorkletAssociation.role_in_worklet == "Student").count()
        
        print(f"📊 Verification Results:")
        print(f"   - Total associations: {total}")
        print(f"   - Active associations: {active}")
        print(f"   - Mentor associations: {mentors}")
        print(f"   - Student associations: {students}")
        
        # Sample some associations
        print(f"📋 Sample associations:")
        samples = db.query(UserWorkletAssociation).limit(5).all()
        for assoc in samples:
            user = db.query(User).filter(User.id == assoc.user_id).first()
            worklet = db.query(Worklet).filter(Worklet.id == assoc.worklet_id).first()
            print(f"   - {user.name if user else 'Unknown'} ({assoc.role_in_worklet}) → {worklet.cert_id if worklet else 'Unknown'}")
        
    finally:
        db.close()

def main():
    """Main migration function"""
    print("🚀 Starting User Worklet Association Migration")
    print("=" * 50)
    
    try:
        # 1. Create the association table
        engine = create_user_worklet_association_table()
        
        # 2. Migrate existing data
        migrate_existing_data(engine)
        
        # 3. Verify migration
        verify_migration(engine)
        
        print("=" * 50)
        print("✅ Migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Test the new association endpoints")
        print("2. Update frontend to use association-based APIs")
        print("3. Gradually deprecate old direct relationships")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print("Please check the error and try again.")

if __name__ == "__main__":
    main()