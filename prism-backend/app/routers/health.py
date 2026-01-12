from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, engine
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Samsung PRISM Backend"}

@router.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    """
    Check database connection health and pool status.
    Useful for monitoring connection pool exhaustion.
    """
    try:
        # Simple query to verify connection
        db.execute("SELECT 1")
        
        # Get pool status
        pool = engine.pool
        pool_status = {
            "status": "healthy",
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "total_connections": pool.size() + pool.overflow(),
            "available": pool.checkedin(),
            "in_use": pool.checkedout()
        }
        
        # Warn if pool is near exhaustion
        if pool.checkedout() > pool.size() * 0.8:
            pool_status["warning"] = "Connection pool usage is high"
            logger.warning(f"High pool usage: {pool.checkedout()}/{pool.size()} connections in use")
        
        return pool_status
        
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

