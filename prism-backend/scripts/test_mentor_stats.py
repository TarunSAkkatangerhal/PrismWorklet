"""
Test mentor statistics API endpoint
"""

import requests
import json

def test_mentor_statistics():
    """Test the mentor statistics endpoint"""
    
    # You'll need to replace this with a valid token
    # You can get this by logging in through the frontend and checking localStorage
    token = "your_actual_token_here"  # Replace with real token
    
    url = "http://localhost:8000/api/dashboard/mentor-statistics"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    try:
        print("🧪 Testing mentor statistics endpoint...")
        response = requests.get(url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success! Response data:")
            print(json.dumps(data, indent=2))
            
            # Check specific data points
            if 'engagement_data' in data:
                print(f"\n📊 Key metrics:")
                print(f"  My Worklets: {data['engagement_data'].get('My Worklets', 'N/A')}")
                print(f"  My Students: {data['engagement_data'].get('My Students', 'N/A')}")
                print(f"  Avg Progress: {data['engagement_data'].get('Avg Progress', 'N/A')}")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {e}")
        return False

def test_without_auth():
    """Test endpoint without authentication to see error handling"""
    url = "http://localhost:8000/api/dashboard/mentor-statistics"
    
    try:
        print("\n🧪 Testing without authentication...")
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Mentor Statistics API")
    print("=" * 50)
    
    # Test with authentication (you need to provide token)
    print("⚠️  Note: Update the token in the script before running")
    print("You can get the token from browser localStorage after logging in")
    
    # Test without authentication first
    test_without_auth()
    
    # Uncomment below and add real token to test with authentication
    # test_mentor_statistics()
    
    print("\n📝 If the API works:")
    print("1. The backend is correctly returning mentor statistics")
    print("2. The frontend should display 'My Students' count")
    print("3. Check browser console for any JavaScript errors")