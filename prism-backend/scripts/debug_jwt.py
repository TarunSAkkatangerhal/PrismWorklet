#!/usr/bin/env python3
"""
Debug JWT token creation and validation
"""

from datetime import datetime, timedelta
from jose import jwt, JWTError
import json

# Configuration from config.py
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Test mentor data
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
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"🔐 Token payload: {json.dumps(to_encode, default=str, indent=2)}")
    return token

def validate_token(token: str):
    """Validate and decode the token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token decoded successfully!")
        print(f"📄 Decoded payload: {json.dumps(payload, default=str, indent=2)}")
        return payload
    except JWTError as e:
        print(f"❌ Token validation failed: {str(e)}")
        return None

def main():
    print("🧪 JWT Token Debug Test")
    print("=" * 40)
    
    # Create token
    print("1️⃣ Creating token...")
    token = create_test_token(TEST_MENTOR)
    print(f"🎫 Full token: {token}")
    
    # Validate token
    print("\n2️⃣ Validating token...")
    payload = validate_token(token)
    
    if payload:
        print("\n✅ Token is valid! The issue might be elsewhere.")
        print("🔍 Check if:")
        print("   - Backend server is using the same SECRET_KEY")
        print("   - Backend server is running from correct directory")
        print("   - Dependencies are properly installed")
    else:
        print("\n❌ Token validation failed locally")

if __name__ == "__main__":
    main()