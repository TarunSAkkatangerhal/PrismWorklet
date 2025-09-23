import requests

# Quick test to check API response
try:
    # Test basic endpoint first 
    response = requests.get('http://localhost:8000/api/dashboard/statistics')
    print("📊 Basic stats response:", response.status_code)
    if response.status_code == 200:
        print(response.json())
    
    print("\n" + "="*50)
    print("🔍 Need authentication token for mentor-specific stats")
    print("The frontend gets this from localStorage after login")
    print("Check browser console for '📊 Mentor statistics received:' logs")
    
except Exception as e:
    print(f"❌ Error: {e}")