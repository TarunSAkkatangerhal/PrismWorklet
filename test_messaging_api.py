"""
Test script for worklet-based messaging system
Run this after starting the backend server
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Test login and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/token", 
                            data={
                                "username": "test@example.com",  # Replace with actual credentials
                                "password": "testpassword"
                            })
    if response.status_code == 200:
        print("✓ Login successful")
        return response.json()["access_token"]
    else:
        print("✗ Login failed:", response.text)
        return None

def test_get_conversations(token):
    """Test fetching worklet conversations"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=headers)
    
    if response.status_code == 200:
        conversations = response.json()
        print(f"✓ Fetched {len(conversations)} worklet conversations")
        for conv in conversations:
            print(f"  - Worklet: {conv['worklet_title']} ({conv['worklet_cert_id']})")
            print(f"    Members: {conv['member_count']}, Unread: {conv['unread_count']}")
        return conversations
    else:
        print("✗ Failed to fetch conversations:", response.text)
        return []

def test_get_worklet_messages(token, worklet_id):
    """Test fetching messages in a worklet"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/messages/chat/worklet/{worklet_id}", headers=headers)
    
    if response.status_code == 200:
        messages = response.json()
        print(f"✓ Fetched {len(messages)} messages from worklet {worklet_id}")
        for msg in messages[-5:]:  # Show last 5 messages
            print(f"  - {msg['sender_name']}: {msg['content'][:50]}...")
        return messages
    else:
        print(f"✗ Failed to fetch messages:", response.text)
        return []

def test_send_message(token, worklet_id, content):
    """Test sending a message to a worklet"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "receiver_id": 0,
        "content": content,
        "worklet_id": worklet_id
    }
    response = requests.post(f"{BASE_URL}/api/messages/send", headers=headers, json=data)
    
    if response.status_code == 200:
        print(f"✓ Message sent successfully to worklet {worklet_id}")
        return True
    else:
        print(f"✗ Failed to send message:", response.text)
        return False

def main():
    print("=" * 50)
    print("Worklet Messaging System Test")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1. Testing login...")
    token = test_login()
    if not token:
        print("Cannot proceed without authentication")
        return
    
    # Step 2: Get conversations
    print("\n2. Testing get conversations...")
    conversations = test_get_conversations(token)
    
    if conversations:
        # Step 3: Get messages from first worklet
        print("\n3. Testing get worklet messages...")
        first_worklet_id = conversations[0]["worklet_id"]
        test_get_worklet_messages(token, first_worklet_id)
        
        # Step 4: Send a test message
        print("\n4. Testing send message...")
        test_send_message(token, first_worklet_id, "Test message from API!")
    
    print("\n" + "=" * 50)
    print("Tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()
