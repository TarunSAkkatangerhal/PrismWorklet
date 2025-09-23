#!/usr/bin/env python3
"""
Test script for mentor statistics API with token generation
"""

import requests
import json
from datetime import datetime, timedelta
from jose import jwt

# Configuration
BASE_URL = "http://localhost:8000"
SECRET_KEY = "your-secret-key-here"  # From config.py
ALGORITHM = "HS256"

# Test mentor (from database)
TEST_MENTOR = {
    "user_id": 4,
    "email": "myworld7583@gmail.com",
    "role": "Mentor"
}

def create_test_token(user_data: dict) -> str:
    """Create a test JWT token for the given user"""
    to_encode = {
        "sub": user_data["email"],
        "role": user_data["role"], 
        "user_id": user_data["user_id"],
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def test_mentor_statistics():
    """Test the mentor statistics endpoint"""
    print("🚀 Testing Mentor Statistics API with Generated Token")
    print("=" * 60)
    
    # Generate test token
    token = create_test_token(TEST_MENTOR)
    print(f"📝 Generated token for mentor: {TEST_MENTOR['email']}")
    print(f"🔐 Token (first 50 chars): {token[:50]}...")
    
    # Test API
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"\n📡 Making request to: {BASE_URL}/api/dashboard/mentor-statistics")
        response = requests.get(f"{BASE_URL}/api/dashboard/mentor-statistics", headers=headers)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ SUCCESS! API Response:")
            print(json.dumps(data, indent=2))
            
            # Check specific fields
            if "engagement_data" in data:
                engagement = data["engagement_data"]
                print(f"\n🎯 Key Statistics:")
                print(f"   📚 Total Worklets: {engagement.get('Total Worklets', 'N/A')}")
                print(f"   👥 My Students: {engagement.get('My Students', 'N/A')}")
                print(f"   ⭐ Average Rating: {engagement.get('Average Rating', 'N/A')}")
                print(f"   📈 Completion Rate: {engagement.get('Completion Rate', 'N/A')}")
                
                if engagement.get('My Students', 0) > 0:
                    print("\n✅ SUCCESS: My Students count is properly fetched!")
                else:
                    print("\n⚠️  WARNING: My Students count is 0 - this might be the issue")
            else:
                print("\n❌ ERROR: No engagement_data in response")
                
        elif response.status_code == 401:
            print("\n❌ Authentication failed")
            print(f"Response: {response.text}")
        else:
            print(f"\n❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_mentor_statistics()