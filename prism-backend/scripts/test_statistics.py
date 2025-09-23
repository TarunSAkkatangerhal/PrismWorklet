"""
Quick test script to verify mentor statistics endpoint
"""
import requests
import json

def test_mentor_statistics():
    # Test data - you might need to adjust these based on your actual user
    test_email = "taruns0911@gmail.com"  # Replace with your test mentor email
    test_password = "yourpassword"       # Replace with actual password
    
    print("🧪 Testing Mentor Statistics API")
    print("=" * 50)
    
    # 1. Login to get token
    print("1️⃣ Logging in...")
    login_data = {
        "username": test_email,
        "password": test_password
    }
    
    try:
        login_response = requests.post(
            "http://localhost:8000/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            print("✅ Login successful!")
            
            # 2. Test mentor statistics endpoint
            print("\n2️⃣ Fetching mentor statistics...")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
            
            stats_response = requests.get(
                "http://localhost:8000/api/dashboard/mentor-statistics",
                headers=headers
            )
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                print("✅ Statistics fetched successfully!")
                print("\n📊 Statistics Data:")
                print(json.dumps(stats_data, indent=2))
                
                # Check mentees data specifically
                engagement_data = stats_data.get("engagement_data", {})
                students_count = engagement_data.get("My Students", 0)
                print(f"\n👨‍🎓 Mentees/Students Count: {students_count}")
                
                if students_count > 0:
                    print("✅ Mentees data is being fetched correctly!")
                else:
                    print("⚠️  No mentees found. This could be normal if no students are assigned.")
                
            else:
                print(f"❌ Statistics request failed: {stats_response.status_code}")
                print(stats_response.text)
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("⚠️  Note: Update the email and password in the script before running")
    print("To test: python scripts/test_statistics.py")
    # Uncomment to run the test
    # test_mentor_statistics()