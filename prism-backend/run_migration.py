"""
Quick script to run the group chat migration for existing worklets.
This will create group chats for ALL worklets (mentor and student worklets).
"""
import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Worklet, UserWorkletAssociation, GroupChat, User

def create_group_chats_for_existing_worklets():
    """Create group chats for all worklets with user associations"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("GROUP CHAT MIGRATION FOR EXISTING WORKLETS")
        print("=" * 60)
        print()
        
        # Get all worklets that have at least one user association
        worklets_with_users = db.query(Worklet.id, Worklet.cert_id).join(
            UserWorkletAssociation,
            Worklet.id == UserWorkletAssociation.worklet_id
        ).distinct().all()
        
        print(f"Found {len(worklets_with_users)} worklets with user assignments")
        print("-" * 60)
        
        created_groups = 0
        updated_groups = 0
        skipped_groups = 0
        errors = 0
        
        for worklet_id, cert_id in worklets_with_users:
            try:
                # Check if group already exists
                existing_group = db.query(GroupChat).filter(
                    GroupChat.worklet_id == worklet_id
                ).first()
                
                if not existing_group:
                    # Create new group
                    group_name = cert_id if cert_id else f"Worklet-{worklet_id}"
                    
                    # Get the first mentor as creator (or any user if no mentor)
                    creator = db.query(UserWorkletAssociation).filter(
                        UserWorkletAssociation.worklet_id == worklet_id
                    ).first()
                    
                    new_group = GroupChat(
                        worklet_id=worklet_id,
                        group_name=group_name,
                        created_by=creator.user_id if creator else None
                    )
                    db.add(new_group)
                    db.commit()
                    
                    # Get member count for logging
                    members_count = db.query(UserWorkletAssociation).filter(
                        UserWorkletAssociation.worklet_id == worklet_id
                    ).count()
                    
                    created_groups += 1
                    print(f"✅ Created: {group_name} (Worklet {worklet_id}) - {members_count} associated users")
                    
                else:
                    # Group exists, no member table to update
                    # All users with worklet associations can access
                    skipped_groups += 1
                    print(f"⏭️  Skipped: {existing_group.group_name} - Already exists")
                        
            except Exception as e:
                db.rollback()
                errors += 1
                print(f"❌ Error with worklet {worklet_id}: {str(e)}")
        
        print()
        print("=" * 60)
        print("MIGRATION SUMMARY")
        print("=" * 60)
        print(f"✅ Groups created:     {created_groups}")
        print(f"🔄 Groups updated:     {updated_groups}")
        print(f"⏭️  Groups skipped:     {skipped_groups}")
        print(f"❌ Errors:             {errors}")
        print(f"📊 Total processed:    {len(worklets_with_users)}")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print()
    print("This script will create group chats for all existing worklets")
    print("that have student or mentor assignments.")
    print()
    
    response = input("Do you want to continue? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        print()
        create_group_chats_for_existing_worklets()
        print()
        print("✅ Migration completed!")
        print()
    else:
        print("Migration cancelled.")
