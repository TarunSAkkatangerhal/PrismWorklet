import requests
from datetime import datetime, timedelta
from jose import jwt

# Configuration
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Test with TarunA (mentor who now has students)
TEST_MENTOR = {
    "user_id": 9,  # TarunA 
    "email": "myworld7583@gmail.com",  # TarunA's email
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

# Generate token for TarunA
token = create_test_token(TEST_MENTOR)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    print("🧪 Testing mentor statistics API...")
    response = requests.get("http://localhost:8000/api/dashboard/mentor-statistics", headers=headers)
    
    print(f"📊 Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        engagement = data.get("engagement_data", {})
        
        print(f"✅ SUCCESS! Students found: {engagement.get('My Students', 0)}")
        print(f"📚 Total Worklets: {engagement.get('Total Worklets', 0)}")
        print(f"⭐ Completion Rate: {engagement.get('Completion Rate', 0)}")
        
        if engagement.get('My Students', 0) > 0:
            print("\n🎉 PROBLEM FIXED! Mentees are now showing up!")
        else:
            print("\n⚠️  Still showing 0 students - need to debug further")
            
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")