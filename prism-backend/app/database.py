from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Database URL from settings; handle ${VAR} interpolation if present
db_url = settings.DATABASE_URL
if not db_url or "${" in db_url:
    user = settings.DB_USER
    pwd = settings.DB_PASSWORD
    host = settings.DB_HOST
    port = settings.DB_PORT
    name = settings.DB_NAME
    db_url = f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}"

SQLALCHEMY_DATABASE_URL = db_url

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
