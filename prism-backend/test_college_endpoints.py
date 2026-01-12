"""
Test script for college endpoints
Run this to verify all college endpoints are working correctly
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def print_response(endpoint: str, response: requests.Response):
    """Print formatted response"""
    print(f"\n{'='*60}")
    print(f"Endpoint: {endpoint}")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            print(f"Results: {len(data)} items")
            if len(data) > 0:
                print("First item sample:")
                print(json.dumps(data[0], indent=2, default=str))
        else:
            print("Response:")
            print(json.dumps(data, indent=2, default=str))
    else:
        print(f"Error: {response.text}")
    print('='*60)

def test_colleges():
    """Test GET /colleges endpoint"""
    print("\n🧪 Testing GET /colleges")
    try:
        response = requests.get(f"{BASE_URL}/colleges")
        print_response("GET /colleges", response)
        
        if response.status_code == 200:
            colleges = response.json()
            return colleges
        return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_college_by_id(college_id: int):
    """Test GET /colleges/{college_id}"""
    print(f"\n🧪 Testing GET /colleges/{college_id}")
    try:
        response = requests.get(f"{BASE_URL}/colleges/{college_id}")
        print_response(f"GET /colleges/{college_id}", response)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_college_worklets(college_id: int):
    """Test GET /colleges/{college_id}/worklets"""
    print(f"\n🧪 Testing GET /colleges/{college_id}/worklets")
    try:
        response = requests.get(f"{BASE_URL}/colleges/{college_id}/worklets")
        print_response(f"GET /colleges/{college_id}/worklets", response)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_college_students(college_id: int):
    """Test GET /colleges/{college_id}/students"""
    print(f"\n🧪 Testing GET /colleges/{college_id}/students")
    try:
        response = requests.get(f"{BASE_URL}/colleges/{college_id}/students")
        print_response(f"GET /colleges/{college_id}/students", response)
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 Starting College Endpoints Test Suite")
    print("="*60)
    
    # Test 1: Get all colleges
    colleges = test_colleges()
    
    if not colleges:
        print("\n⚠️  No colleges found or endpoint failed. Cannot proceed with detailed tests.")
        return
    
    print(f"\n✅ Found {len(colleges)} colleges")
    
    # Test 2-4: Test first college in detail
    if len(colleges) > 0:
        first_college = colleges[0]
        college_id = first_college.get('college_id') or first_college.get('id')
        college_name = first_college.get('college_name') or first_college.get('name')
        
        print(f"\n📋 Testing detailed endpoints for: {college_name} (ID: {college_id})")
        
        test_college_by_id(college_id)
        test_college_worklets(college_id)
        test_college_students(college_id)
    
    # Summary
    print("\n" + "="*60)
    print("✅ Test Suite Completed!")
    print("="*60)
    print("\n📊 Summary:")
    print(f"  - Total colleges: {len(colleges)}")
    if colleges:
        # Check if colleges have expected fields
        sample = colleges[0]
        expected_fields = ['college_name', 'workletCount', 'veryGoodCount', 'goodCount', 
                          'averageCount', 'poorCount', 'completedCount', 'ongoingCount', 
                          'onHoldCount', 'terminatedCount', 'totalStudents']
        
        print("\n  Field Validation:")
        for field in expected_fields:
            alt_field = field.replace('college_name', 'name')
            has_field = field in sample or alt_field in sample
            status = "✅" if has_field else "❌"
            print(f"    {status} {field}")

if __name__ == "__main__":
    main()
