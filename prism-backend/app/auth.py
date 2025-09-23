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

# --- OTP Temp Store (use Redis later) ---
temp_otps = {}

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

    if request_data.email in temp_otps:
        temp_otps.pop(request_data.email)

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)

    temp_otps[request_data.email] = {
        "otp": otp_code,
        "expiry": expiry,
        "verified": False
    }

    background_tasks.add_task(send_otp_email, request_data.email, "User", otp_code)
    return {"message": "OTP sent successfully to your email."}

# 2. Verify OTP
@router.post("/verify-otp")
def verify_otp(verify_data: schemas.VerifyOTP):
    record = temp_otps.get(verify_data.email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found")

    if record["otp"] != verify_data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() > record["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    record["verified"] = True
    return {"message": "OTP verified. Please set your password."}

# 3. Set Password -> Insert User in DB
@router.post("/set-password")
def set_password(password_data: schemas.SetPassword, db: Session = Depends(get_db)):
    record = temp_otps.get(password_data.email)
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

    # Clear temp
    temp_otps.pop(password_data.email)

    return {"message": "Account created successfully. You can now login."}

# 4. Login
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Only check email now, role will be taken from DB
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=401, detail="Email not verified")

    # Token still includes role + user_id
    access = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    refresh = create_refresh_token({"sub": user.email, "role": user.role, "user_id": user.id})

    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

# 5. Forgot Password
@router.post("/forgot-password")
def forgot_password(forgot_data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == forgot_data.email).first()
    if not user:
        return {"message": "If your email is registered, you will receive a reset OTP."}

    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    send_password_reset_email(user.email, user.name, otp_code)
    return {"message": "If your email is registered, you will receive a reset OTP."}

# 6. Reset Password
@router.post("/reset-password")
def reset_password(reset_data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.otp_code != reset_data.otp_code or datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user.password_hash = get_password_hash(reset_data.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
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
            "team": user.team,
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
        profile_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "team": user.team,
            "college": user.college,
            "is_verified": user.is_verified,
            "created_at": user.created_at
        }
        
        # If user is a mentor, get mentor profile data
        if user.role == "Mentor":
            mentor = db.query(models.Mentor).filter(models.Mentor.email == user.email).first()
            if mentor:
                profile_data.update({
                    "mentor_profile": {
                        "avatar_url": mentor.avatar_url,
                        "bio": mentor.bio,
                        "qualification": mentor.qualification,
                        "location": mentor.location,
                        "date_of_birth": mentor.date_of_birth.isoformat() if mentor.date_of_birth else None,
                        "website": mentor.website,
                        "handle": mentor.handle,
                        "expertise": mentor.expertise,
                        "contact": mentor.contact
                    }
                })
            else:
                # No mentor profile exists, create default
                profile_data.update({
                    "mentor_profile": {
                        "avatar_url": "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop",
                        "bio": "Welcome to PRISM! 🚀",
                        "qualification": "Mentor",
                        "location": None,
                        "date_of_birth": None,
                        "website": None,
                        "handle": None,
                        "expertise": user.team,
                        "contact": None
                    }
                })
        
        return profile_data
        
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
        
        # Update fields that are provided
        update_data = profile_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "team": user.team,
                "college": user.college
            }
        }
    except Exception as e:
        print(f"Error in profile update endpoint: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail="Internal server error")