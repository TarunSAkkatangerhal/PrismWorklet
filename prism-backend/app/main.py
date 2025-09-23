from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app import auth
from app.routers import mentors, worklets, health, dashboard, evaluations, associations
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.database import get_db
from typing import Callable
import time

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

# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to Samsung Prism Backend!"}

# Completed worklets endpoint (needs to be at root level for frontend compatibility)
@app.get("/completed-worklets")
def get_completed_worklets_root(db: Session = Depends(get_db)):
    from app.models import Worklet
    # Get all completed worklets
    completed_worklets = db.query(Worklet).filter(Worklet.status == "Completed").all()
    
    # Convert to dict format
    worklets_data = []
    for worklet in completed_worklets:
        worklets_data.append({
            "id": worklet.id,
            "cert_id": worklet.cert_id,
            "description": worklet.description,
            "status": worklet.status,
            "team": worklet.team,
            "college": worklet.college,
            "percentage_completion": worklet.percentage_completion,
            "start_date": worklet.start_date.isoformat() if worklet.start_date else None,
            "end_date": worklet.end_date.isoformat() if worklet.end_date else None
        })
    
    return worklets_data

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
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(mentors.router, prefix="/mentors", tags=["mentors"])
app.include_router(worklets.router, prefix="/worklets", tags=["worklets"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(evaluations.router, tags=["evaluations"])
app.include_router(associations.router, prefix="/api", tags=["associations"])

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    # You could initialize connections here
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # You could cleanup connections here
    pass