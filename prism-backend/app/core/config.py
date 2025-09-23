import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")
    
    PROJECT_NAME: str = "Samsung PRISM Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database configuration
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DB_HOST: str = "localhost"
    DB_PORT: str = "3306"
    DB_NAME: str = "prism_db"
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost/prism_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Email/SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_SENDER: str = ""
    
    # CORS and Redis
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    REDIS_URL: str = "redis://localhost:6379/0"

settings = Settings()