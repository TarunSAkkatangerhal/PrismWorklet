"""
Script to create group chats for all existing worklets.
Run this once to migrate existing worklets to the chat system.
"""
import requests
import json

# Configuration
API_URL = "http://localhost:8000"
# You need to login first and get your access token
# You can get it from localStorage in your browser after logging in

def create_group_chats(access_token):
    """Create group chats for all worklets that don't have them"""
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print("Creating group chats for existing worklets...")
    print("-" * 50)
    
    try:
        response = requests.post(
            f"{API_URL}/chat/admin/create-missing-group-chats",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"\nSummary:")
            print(f"  - Groups created: {result['summary']['groups_created']}")
            print(f"  - Groups updated: {result['summary']['groups_updated']}")
            print(f"  - Errors: {result['summary']['errors']}")
            
            if result['created_groups']:
                print(f"\n📝 Created Groups:")
                for group in result['created_groups']:
                    print(f"  - Worklet {group['worklet_id']}: Group {group['group_id']} with {group['members_count']} members")
            
            if result['updated_groups']:
                print(f"\n🔄 Updated Groups:")
                for group in result['updated_groups']:
                    print(f"  - Worklet {group['worklet_id']}: Added {group['new_members_added']} new members")
            
            if result['errors']:
                print(f"\n❌ Errors:")
                for error in result['errors']:
                    print(f"  - Worklet {error['worklet_id']}: {error['error']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")


if __name__ == "__main__":
    print("=" * 50)
    print("Group Chat Migration Tool")
    print("=" * 50)
    print("\nThis script will create group chats for all existing worklets.")
    print("\nTo get your access token:")
    print("1. Login to the application in your browser")
    print("2. Open Developer Tools (F12)")
    print("3. Go to Console tab")
    print("4. Type: localStorage.getItem('access_token')")
    print("5. Copy the token (without quotes)")
    print("\n" + "=" * 50)
    
    access_token = input("\nPaste your access token here: ").strip()
    
    if not access_token:
        print("❌ No token provided. Exiting.")
        exit(1)
    
    create_group_chats(access_token)
    
    print("\n" + "=" * 50)
    print("Migration completed!")
    print("=" * 50)
