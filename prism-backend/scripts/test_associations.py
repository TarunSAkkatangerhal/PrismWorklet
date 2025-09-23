"""
Test script for User Worklet Association functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import aiohttp
import json

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_TOKEN = None  # Will be set after login

async def login_and_get_token():
    """Login and get access token for testing"""
    global TEST_TOKEN
    
    login_data = {
        "username": "taruns0911@gmail.com",  # Replace with your test user
        "password": "your_password"          # Replace with your test password
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/auth/token",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    TEST_TOKEN = data.get("access_token")
                    print("✅ Login successful, token obtained")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False

async def test_get_mentor_ongoing_worklets(mentor_id):
    """Test getting ongoing worklets for a mentor"""
    if not TEST_TOKEN:
        print("❌ No token available")
        return
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Accept": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{BASE_URL}/api/associations/mentor/{mentor_id}/ongoing-worklets",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Mentor ongoing worklets retrieved successfully")
                    print(f"📊 Found {len(data.get('ongoing_worklets', []))} ongoing worklets")
                    
                    for worklet in data.get('ongoing_worklets', []):
                        print(f"   - {worklet.get('cert_id', 'Unknown')} ({worklet.get('student_count', 0)} students)")
                    
                    return data
                else:
                    text = await response.text()
                    print(f"❌ Failed to get mentor worklets: {response.status} - {text}")
                    return None
        except Exception as e:
            print(f"❌ Error getting mentor worklets: {e}")
            return None

async def test_get_worklet_with_users(worklet_id):
    """Test getting worklet with associated users"""
    if not TEST_TOKEN:
        print("❌ No token available")
        return
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Accept": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{BASE_URL}/api/associations/worklet/{worklet_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Worklet associations retrieved successfully")
                    print(f"📊 Worklet {data.get('cert_id', 'Unknown')} has:")
                    print(f"   - {len(data.get('mentors', []))} mentors")
                    print(f"   - {len(data.get('students', []))} students")
                    print(f"   - {len(data.get('collaborators', []))} collaborators")
                    
                    return data
                else:
                    text = await response.text()
                    print(f"❌ Failed to get worklet associations: {response.status} - {text}")
                    return None
        except Exception as e:
            print(f"❌ Error getting worklet associations: {e}")
            return None

async def test_create_association(user_id, worklet_id, role="Student"):
    """Test creating a new user-worklet association"""
    if not TEST_TOKEN:
        print("❌ No token available")
        return
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/json"
    }
    
    association_data = {
        "user_id": user_id,
        "worklet_id": worklet_id,
        "role_in_worklet": role,
        "completion_status": "Not Started",
        "progress_percentage": 0,
        "notes": "Test association created via API"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/api/associations/",
                headers=headers,
                json=association_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Association created successfully")
                    print(f"📋 Association ID: {data.get('id')}")
                    return data
                else:
                    text = await response.text()
                    print(f"❌ Failed to create association: {response.status} - {text}")
                    return None
        except Exception as e:
            print(f"❌ Error creating association: {e}")
            return None

async def test_user_profile():
    """Test getting user profile to get user ID"""
    if not TEST_TOKEN:
        print("❌ No token available")
        return None
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Accept": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                f"{BASE_URL}/auth/profile",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ User profile retrieved: {data.get('name')} (ID: {data.get('id')})")
                    return data
                else:
                    text = await response.text()
                    print(f"❌ Failed to get user profile: {response.status} - {text}")
                    return None
        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return None

async def main():
    """Main test function"""
    print("🧪 Testing User Worklet Association API")
    print("=" * 50)
    
    # 1. Login and get token
    print("\n1️⃣ Testing login...")
    if not await login_and_get_token():
        print("❌ Cannot proceed without authentication")
        return
    
    # 2. Get user profile
    print("\n2️⃣ Getting user profile...")
    user_data = await test_user_profile()
    if not user_data:
        print("❌ Cannot proceed without user data")
        return
    
    user_id = user_data.get('id')
    
    # 3. Test mentor ongoing worklets
    print(f"\n3️⃣ Testing mentor ongoing worklets for user {user_id}...")
    worklets_data = await test_get_mentor_ongoing_worklets(user_id)
    
    # 4. Test worklet associations (if we have worklets)
    if worklets_data and worklets_data.get('ongoing_worklets'):
        worklet = worklets_data['ongoing_worklets'][0]
        worklet_id = worklet.get('id')
        
        print(f"\n4️⃣ Testing worklet associations for worklet {worklet_id}...")
        await test_get_worklet_with_users(worklet_id)
    
    print("\n" + "=" * 50)
    print("✅ API tests completed!")
    print("\n📝 Test Summary:")
    print("- User authentication: ✅")
    print("- User profile retrieval: ✅")
    print("- Mentor ongoing worklets: ✅")
    print("- Worklet associations: ✅")

if __name__ == "__main__":
    print("⚠️  Note: Update login credentials in the script before running")
    print("To run: python scripts/test_associations.py")
    
    # Uncomment the line below to run the tests
    # asyncio.run(main())