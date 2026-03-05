import os
import secrets
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, field_validator, ValidationError
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    react_app_api_url: str = "http://localhost:8000"
    model_config = ConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "Samsung PRISM Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False  # Changed default to False for security
    
    # Database configuration
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DB_HOST: str = "localhost"
    DB_PORT: str = "3306"
    DB_NAME: str = "prism"
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost/prism"
    
    # JWT - Generate secure key if not provided
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Email/SMTP
    ENABLE_EMAIL: bool = True  # Toggle email notifications on/off
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_SENDER: str = ""
    
    # Frontend URL (for email links)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # File Upload Configuration
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: str = "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,application/csv"
    
    # CORS and Redis
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Performance & Scaling configuration
    DB_POOL_SIZE: int = 20  # Connections per worker
    DB_MAX_OVERFLOW: int = 30  # Additional connections per worker
    DB_POOL_TIMEOUT: int = 60  # Seconds to wait for connection
    REDIS_MAX_CONNECTIONS: int = 50  # Redis connection pool size
    WEB_CONCURRENCY: int = 4  # Number of gunicorn workers (production)
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v):
        """Validate SECRET_KEY security"""
        if len(v) < 32:
            logger.error("❌ SECRET_KEY is too short! Must be at least 32 characters.")
            raise ValueError("SECRET_KEY must be at least 32 characters for security")
        if v == "your-secret-key-here":
            logger.error("❌ Using default SECRET_KEY! Set SECRET_KEY in environment variables.")
            raise ValueError("Default SECRET_KEY is not allowed")
        return v
    
    @field_validator("SMTP_USER")
    @classmethod
    def validate_smtp_user(cls, v):
        """Warn if SMTP is not configured"""
        if not v or v == "":
            logger.warning("⚠️  SMTP_USER not configured. Email features will not work.")
        return v
    
    def validate_required_settings(self):
        """Validate critical settings on startup"""
        issues = []
        
        if self.SECRET_KEY == "your-secret-key-here":
            issues.append("SECRET_KEY is using default value")
        
        if not self.SMTP_USER or not self.SMTP_PASS:
            issues.append("SMTP credentials not configured - email features disabled")
        
        if self.DEBUG:
            logger.warning("🔧 DEBUG mode is enabled - sensitive errors will be exposed")
        
        if issues:
            logger.warning(f"⚠️  Configuration issues detected:\n  - " + "\n  - ".join(issues))
        else:
            logger.info("✅ All critical settings validated")

settings = Settings()

# Validate settings on module load
settings.validate_required_settings()

# Only log non-sensitive config in production
if settings.DEBUG:
    logger.info(f"SMTP_HOST: {settings.SMTP_HOST}")
    logger.info(f"SMTP_PORT: {settings.SMTP_PORT}")
    logger.info(f"SMTP_USER: {settings.SMTP_USER}")
    logger.info(f"SMTP_SENDER: {settings.SMTP_SENDER}")
    logger.info(f"FRONTEND_URL: {settings.FRONTEND_URL}")
