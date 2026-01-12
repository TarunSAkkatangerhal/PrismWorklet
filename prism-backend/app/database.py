from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, DisconnectionError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
if not db_url or "${" in db_url:
    user = settings.DB_USER
    pwd = settings.DB_PASSWORD
    host = settings.DB_HOST
    port = settings.DB_PORT
    name = settings.DB_NAME
    db_url = f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}"

SQLALCHEMY_DATABASE_URL = db_url

# Added pool_pre_ping to handle stale connections
# Added pool_recycle to prevent connection timeouts
# Pool size and overflow are configurable via environment variables
# Added echo_pool for debugging connection issues
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,          # Check connection health before using
    pool_recycle=3600,            # Recycle connections after 1 hour
    pool_size=settings.DB_POOL_SIZE,         # Per worker (default: 20)
    max_overflow=settings.DB_MAX_OVERFLOW,   # Per worker (default: 30)
    pool_timeout=settings.DB_POOL_TIMEOUT,   # Wait timeout (default: 60s)
    connect_args={"connect_timeout": 10},
    # echo_pool=True,             # Uncomment to debug connection pool issues
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except (OperationalError, DisconnectionError) as e:
        logger.error(f"Database connection error: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
