from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db, engine
from app.models import User, Worklet
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Samsung PRISM Backend"}

@router.get("/public-stats")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Get public statistics for the login page.
    Returns counts of students, projects (worklets), and mentors.
    No authentication required.
    """
    try:
        students_count = db.query(func.count(User.id)).filter(User.role == "Student").scalar() or 0
        mentors_count = db.query(func.count(User.id)).filter(User.role == "Mentor").scalar() or 0
        projects_count = db.query(func.count(Worklet.id)).scalar() or 0
        
        return {
            "students": students_count,
            "projects": projects_count,
            "mentors": mentors_count
        }
    except Exception as e:
        logger.error(f"Failed to get public stats: {str(e)}")
        return {
            "students": 0,
            "projects": 0,
            "mentors": 0
        }

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

