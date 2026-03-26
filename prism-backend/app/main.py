from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app import auth
from app.routers import worklets, health, dashboard, evaluations, associations, portfolio, suggestions, milestones, meetings, students, updates, admin
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.database import get_db
from typing import Callable
import time
import logging
from app.database import Base, engine, SessionLocal
from app import models  # ensure models imported for metadata

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend compatibility
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Specific methods only
    allow_headers=["*"],
    expose_headers=["*"],
)

# Static files for uploaded documents
import os
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads")))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to Samsung Prism Backend!"}

# Removed unused root-level completed worklets endpoint

# HTTPS enforcement middleware (production only) - DISABLED
# This was causing issues with localhost development
# For production deployment, use a reverse proxy (Nginx/Traefik) for HTTPS enforcement instead
# @app.middleware("http")
# async def https_redirect(request: Request, call_next):
#     if not settings.DEBUG and request.url.scheme == "http":
#         url = request.url.replace(scheme="https")
#         from fastapi.responses import RedirectResponse
#         return RedirectResponse(url=str(url), status_code=301)
#     return await call_next(request)


# Request size limit middleware (10MB max)
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    max_size = 10 * 1024 * 1024  # 10MB
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > max_size:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum size is 10MB."}
        )
    return await call_next(request)

# Custom middleware for request timing and logging
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )
# Smart rate limiting - only for sensitive auth endpoints
# Excludes frequent check endpoints like /auth/me, /auth/profile to prevent UX issues
login_rate_limiter = RateLimiter(times=10, window=60)  # 10 login attempts per minute
auth_check_rate_limiter = RateLimiter(times=200, window=60)  # 200 auth checks per minute

@app.middleware("http")
async def smart_rate_limit(request: Request, call_next: Callable):
    path = request.url.path
    
    # Strict rate limiting for login/register (prevent brute force)
    if path in ["/auth/login", "/auth/register", "/auth/token"]:
        await login_rate_limiter(request)
    # Lenient rate limiting for auth checks (allow frequent legitimate use)
    elif path.startswith("/auth/"):
        await auth_check_rate_limiter(request)
    
    response = await call_next(request)
    return response


# Routers
from app.routers import college, chat
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router, prefix="/api/students", tags=["students"])
# Mentors router temporarily disabled due to schema refactor; re-enable after migration
app.include_router(worklets.router, prefix="/worklets", tags=["worklets"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])
app.include_router(associations.router, prefix="/api", tags=["associations"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(suggestions.router)
app.include_router(milestones.router)
app.include_router(college.router)
app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(updates.router)
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Backwards-compatible alias for student worklets under /api
from fastapi import Depends
from app.auth import oauth2_scheme
from sqlalchemy.orm import Session

@app.get("/api/worklets", tags=["worklets"])
def list_worklets_alias(db: Session = Depends(get_db)):
    # Delegate to the existing list_worklets handler for consistency
    return worklets.list_worklets(db=db)

@app.get("/api/worklets/student/me", tags=["worklets"])
def student_worklets_me_alias(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return worklets.get_student_worklets_me(token=token, db=db)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Auto-create tables if not present
        Base.metadata.create_all(bind=engine)

        # Backward-compatible schema patch: add users.status when DB is older than model.
        inspector = inspect(engine)
        user_columns = {col["name"] for col in inspector.get_columns("users")}
        if "status" not in user_columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN status ENUM('pending','approved','rejected','skipped') NOT NULL DEFAULT 'pending'
                        """
                    )
                )
                conn.execute(text("UPDATE users SET status = 'approved' WHERE is_active = 1"))
            logger.info("Added missing users.status column and backfilled active users")

        logger.info("Database tables initialized successfully")
        
        # Display configuration warnings
        if settings.DEBUG:
            print("🔧 DEBUG mode is enabled - sensitive errors will be exposed")
        
        # Configuration validation warnings
        settings.validate_required_settings()
        
        print("✅ Database initialized - Group chats are now implicit via worklet membership")
        
    except Exception as e:
        logger.error(f"Startup error: {e}", exc_info=True)
        print(f"⚠️ Startup error: {e}")


def auto_create_group_chats():
    """Automatically create group chats for worklets that don't have them"""
    db = SessionLocal()
    try:
        from app.models import Worklet, UserWorkletAssociation, GroupChat
        
        # Get worklets with users but no group chat
        worklets_needing_groups = db.query(Worklet.id, Worklet.cert_id).join(
            UserWorkletAssociation,
            Worklet.id == UserWorkletAssociation.worklet_id
        ).outerjoin(
            GroupChat,
            Worklet.id == GroupChat.worklet_id
        ).filter(
            GroupChat.id == None
        ).distinct().all()
        
        if not worklets_needing_groups:
            logger.info("All worklets already have group chats")
            return
        
        created = 0
        for worklet_id, cert_id in worklets_needing_groups:
            try:
                group_name = cert_id if cert_id else f"Worklet-{worklet_id}"
                creator = db.query(UserWorkletAssociation).filter(
                    UserWorkletAssociation.worklet_id == worklet_id
                ).first()
                
                new_group = GroupChat(
                    worklet_id=worklet_id,
                    group_name=group_name,
                    created_by=creator.user_id if creator else None
                )
                db.add(new_group)
                created += 1
            except Exception as e:
                logger.error(f"Error creating group for worklet {worklet_id}: {e}")
                continue
        
        if created > 0:
            db.commit()
            logger.info(f"Auto-created {created} group chats on startup")
            print(f"📢 Auto-created {created} group chat(s) for worklets")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error in auto_create_group_chats: {e}")
    finally:
        db.close()

@app.on_event("shutdown")
async def shutdown_event():
    # You could cleanup connections here
    logger.info("Application shutting down")
    pass