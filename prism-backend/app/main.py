from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app import auth
from app.routers import worklets, health, dashboard, evaluations, associations, portfolio, suggestions
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.database import get_db
from typing import Callable
import time
from app.database import Base, engine
from app import models  # ensure models imported for metadata

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
    allow_methods=["*"],
    allow_headers=["*"],
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

# Rate limiting for auth endpoints
auth_rate_limiter = RateLimiter(times=30, window=60)  # 30 requests per minute
@app.middleware("http")
async def rate_limit_auth(request: Request, call_next: Callable):
    if request.url.path.startswith("/auth/"):
        await auth_rate_limiter(request)
    return await call_next(request)


# Routers
from app.routers import college
app.include_router(health.router)
app.include_router(auth.router)
# Mentors router temporarily disabled due to schema refactor; re-enable after migration
app.include_router(worklets.router, prefix="/worklets", tags=["worklets"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(evaluations.router, prefix="/evaluations", tags=["evaluations"])
app.include_router(associations.router, prefix="/api", tags=["associations"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(suggestions.router)
app.include_router(college.router)

# Backwards-compatible alias for student worklets under /api
from fastapi import Depends
from app.auth import oauth2_scheme
from sqlalchemy.orm import Session
import logging
logger = logging.getLogger(__name__)

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
    # Auto-create tables if not present
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.info(f"DB init error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    # You could cleanup connections here
    pass
