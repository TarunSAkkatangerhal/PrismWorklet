import requests
import json

# Test the milestone feedback endpoint
BASE_URL = "http://localhost:8000"

# First, login to get a token (replace with actual credentials)
print("Testing milestone feedback endpoint...")

# Get auth token
login_data = {
    "email": "mentor@example.com",  # Replace with actual mentor email
    "password": "password"  # Replace with actual password
}

try:
    # Login
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        exit(1)
    
    token = response.json()["access_token"]
    print(f"✅ Login successful")
    
    # Prepare feedback data
    feedback_data = {
        "milestone_id": 1,  # Replace with actual milestone ID
        "reviewer_role": "mentor",
        "feedback_text": "Test feedback from API test",
        "progress_completion": 25
    }
    
    # Submit feedback
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/milestones/feedback",
        json=feedback_data,
        headers=headers
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response body: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        print("✅ Feedback submitted successfully!")
    else:
        print(f"❌ Failed to submit feedback")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
