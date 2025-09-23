#!/usr/bin/env python3
"""
Test script for basic auth endpoints
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

def test_auth_endpoints():
    """Test basic authentication endpoints"""
    print("🚀 Testing Authentication Endpoints")
    print("=" * 50)
    
    # Generate test token
    token = create_test_token(TEST_MENTOR)
    print(f"📝 Generated token for mentor: {TEST_MENTOR['email']}")
    
    # Test headers
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test 1: /auth/me endpoint
        print(f"\n📡 Testing: {BASE_URL}/auth/me")
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ /auth/me SUCCESS!")
            print(json.dumps(data, indent=2))
        else:
            print(f"❌ /auth/me failed: {response.text}")
            
        # Test 2: Basic dashboard statistics (no auth required)
        print(f"\n📡 Testing: {BASE_URL}/api/dashboard/statistics")
        response2 = requests.get(f"{BASE_URL}/api/dashboard/statistics")
        print(f"📊 Status Code: {response2.status_code}")
        
        if response2.status_code == 200:
            print("✅ Basic statistics endpoint works!")
        else:
            print(f"❌ Basic statistics failed: {response2.text}")
            
        # Test 3: Mentor-specific statistics
        print(f"\n📡 Testing: {BASE_URL}/api/dashboard/mentor-statistics")
        response3 = requests.get(f"{BASE_URL}/api/dashboard/mentor-statistics", headers=headers)
        print(f"📊 Status Code: {response3.status_code}")
        
        if response3.status_code == 200:
            data3 = response3.json()
            print("✅ Mentor statistics SUCCESS!")
            print(json.dumps(data3, indent=2))
        else:
            print(f"❌ Mentor statistics failed: {response3.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server")
        print("Make sure the backend server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    test_auth_endpoints()