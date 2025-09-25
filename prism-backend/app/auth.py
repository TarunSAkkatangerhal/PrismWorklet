"""
app/auth.py

Authentication & Authorization for Samsung PRISM Worklet Management System.
Flow:
1. Request OTP (no DB insert yet)
2. Verify OTP
3. Set password -> User inserted into DB
4. Login with email + password
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi import BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os, random, string

from app.core.config import settings
from app import models, schemas
from app.database import get_db
from app.core.email_utils import send_otp_email, send_password_reset_email
from app.core.redis_cache import redis_cache

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- JWT Setup ---
SECRET_KEY = settings.SECRET_KEY or os.getenv("SECRET_KEY")
ALGORITHM = settings.ALGORITHM or os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES or 30)
REFRESH_TOKEN_EXPIRE_MINUTES = int(settings.REFRESH_TOKEN_EXPIRE_MINUTES or 60 * 24 * 7)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- OTP Temp Store (Redis-backed, fallback to in-memory) ---
import json
temp_otps = {}
def set_otp(email, otp_data):
    try:
        redis_cache.set(f"otp:{email}", json.dumps(otp_data), ex=600)
    except Exception:
        temp_otps[email] = otp_data

def get_otp(email):
    try:
        val = redis_cache.get(f"otp:{email}")
        if val:
            return json.loads(val)
    except Exception:
        pass
    return temp_otps.get(email)

def del_otp(email):
    try:
        redis_cache.delete(f"otp:{email}")
    except Exception:
        temp_otps.pop(email, None)

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

# --- Router ---
router = APIRouter(prefix="/auth", tags=["Auth"])

# 1. Request OTP
@router.post("/request-otp")
def request_otp(request_data: schemas.RequestOTP, background_tasks: BackgroundTasks):
    # Check if email is already registered
    from app.database import get_db
    db = next(get_db())
    if db.query(models.User).filter(models.User.email == request_data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    del_otp(request_data.email)

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)

    set_otp(request_data.email, {
        "otp": otp_code,
        "expiry": expiry.isoformat(),
        "verified": False
    })

    background_tasks.add_task(send_otp_email, request_data.email, "User", otp_code)
    return {"message": "OTP sent successfully to your email."}

# 2. Verify OTP
@router.post("/verify-otp")
def verify_otp(verify_data: schemas.VerifyOTP):
    record = get_otp(verify_data.email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found")

    if not record or record["otp"] != verify_data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() > datetime.fromisoformat(record["expiry"]):
        raise HTTPException(status_code=400, detail="OTP expired")

    record["verified"] = True
    set_otp(verify_data.email, record)
    return {"message": "OTP verified. Please set your password."}

# 3. Set Password -> Insert User in DB
@router.post("/set-password")
def set_password(password_data: schemas.SetPassword, db: Session = Depends(get_db)):
    record = get_otp(password_data.email)
    if not record or not record["verified"]:
        raise HTTPException(status_code=400, detail="OTP not verified")

    # Check if already exists
    if db.query(models.User).filter(models.User.email == password_data.email).first():
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = get_password_hash(password_data.password)

    new_user = models.User(
        name=password_data.name,
        email=password_data.email,
        role=password_data.role,
        password_hash=hashed_pw,
        is_verified=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize empty profile row so profile exists after first login
    try:
        if not new_user.profile:
            profile = models.UserProfile(user_id=new_user.id)
            db.add(profile)
            db.commit()
    except Exception:
        # Non-fatal if profile init fails
        db.rollback()

    # Clear temp
    del_otp(password_data.email)

    return {"message": "Account created successfully. You can now login."}

# 4. Login

# Updated login to return tokens, user info, and user profile
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=401, detail="Email not verified")

    access = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    refresh = create_refresh_token({"sub": user.email, "role": user.role, "user_id": user.id})

    # Fetch user profile from user_profiles table
    profile = None
    if user.profile:
        profile = {
            "avatar_url": user.profile.avatar_url,
            "bio": user.profile.bio,
            "linkedin": user.profile.linkedin,
            "portfolio_url": user.profile.portfolio_url,
            "expertise": user.profile.expertise,
            "qualification": user.profile.qualification,
            "experience_years": user.profile.experience_years,
            "contact_number": user.profile.contact_number,
            "organization": user.profile.organization,
            "github": user.profile.github
        }

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "college": user.college,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "profile": profile
        }
    }

@router.post("/refresh")
def refresh_tokens(payload: schemas.TokenRefreshRequest, db: Session = Depends(get_db)):
    """Issue new access and refresh tokens given a valid refresh token."""
    decoded = decode_token(payload.refresh_token)
    user_email = decoded.get("sub")
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    new_refresh = create_refresh_token({"sub": user.email, "role": user.role, "user_id": user.id})

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


# 5. Forgot Password (Redis only)
@router.post("/forgot-password")
def forgot_password(forgot_data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == forgot_data.email).first()
    if not user:
        return {"message": "If your email is registered, you will receive a reset OTP."}

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    set_otp(user.email, {
        "otp": otp_code,
        "expiry": expiry.isoformat(),
        "verified": False
    })

    send_password_reset_email(user.email, user.name, otp_code)
    return {"message": "If your email is registered, you will receive a reset OTP."}

# 6. Reset Password (Redis only)
@router.post("/reset-password")
def reset_password(reset_data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = get_otp(reset_data.email)
    if not record or record["otp"] != reset_data.otp_code or datetime.utcnow() > datetime.fromisoformat(record["expiry"]):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    del_otp(reset_data.email)
    return {"message": "Password reset successfully. You can now login."}

# 7. Get Current User
@router.get("/me", response_model=schemas.UserResponse)
async def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            # team removed on User; use profile.expertise if needed by clients
            "team": user.profile.expertise if user.profile else None,
            "college": user.college,
            "is_verified": user.is_verified,
            "created_at": user.created_at
        }
    except Exception as e:
        print(f"Error in /me endpoint: {str(e)}")  # Debug log
        raise

# 8. Get User Profile (dedicated endpoint)
@router.get("/profile")
async def get_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Base user data
        response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "college": user.college,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
        }

        # Attach unified profile (from user_profiles)
        if user.profile:
            p = user.profile
            response["profile"] = {
                "avatar_url": p.avatar_url,
                "bio": p.bio,
                "linkedin": p.linkedin,
                "portfolio_url": p.portfolio_url,
                "expertise": p.expertise,
                "qualification": p.qualification,
                "experience_years": p.experience_years,
                "contact_number": p.contact_number,
                "organization": p.organization,
                "github": p.github,
                "handle": p.handle,
                "location": p.location,
                "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                "website": p.website,
            }

        return response
        
    except Exception as e:
        print(f"Error in /profile endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# 9. Update Current User Profile
@router.put("/me/profile")
async def update_my_profile(
    profile_data: schemas.UserProfileUpdate,
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(token)
        user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Split updates between User and UserProfile
        data = profile_data.dict(exclude_unset=True)

        # Update name/college on User
        if "name" in data and data["name"] is not None:
            user.name = data["name"]
        if "college" in data and data["college"] is not None:
            # If colleges are normalized, you would look up College and set college_id; keeping simple string for now
            # Here we assume college is a name; leave as-is if None
            pass

        # Upsert into UserProfile
        profile = user.profile
        if not profile:
            profile = models.UserProfile(user_id=user.id)
            db.add(profile)

        # Map allowable profile fields
        profile_fields = [
            "avatar_url", "bio", "linkedin", "portfolio_url", "expertise", "qualification",
            "experience_years", "contact_number", "organization", "github", "handle", "location",
            "date_of_birth", "website"
        ]

        for f in profile_fields:
            if f in data and data[f] is not None:
                setattr(profile, f, data[f])

        db.commit()
        db.refresh(user)
        db.refresh(profile)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "college": user.college,
                "profile": {
                    "avatar_url": profile.avatar_url,
                    "bio": profile.bio,
                    "linkedin": profile.linkedin,
                    "portfolio_url": profile.portfolio_url,
                    "expertise": profile.expertise,
                    "qualification": profile.qualification,
                    "experience_years": profile.experience_years,
                    "contact_number": profile.contact_number,
                    "organization": profile.organization,
                    "github": profile.github,
                    "handle": profile.handle,
                    "location": profile.location,
                    "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                    "website": profile.website,
                }
            }
        }
    except Exception as e:
        print(f"Error in profile update endpoint: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail="Internal server error")
