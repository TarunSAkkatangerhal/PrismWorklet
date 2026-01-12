# Prism Backend

## Quick Start

### Development (with hot reload)
```powershell
.\start_dev.ps1
```

### Production (multiple workers)
```powershell
.\start_production.ps1
```

## Setup

1. Create and activate a Python 3.11+ virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Configure `.env` with your DB and SMTP settings.

## Features
- FastAPI backend for Samsung Prism Worklet Management
- MySQL (SQLAlchemy ORM)
- JWT Auth, OTP, Email (Gmail SMTP)
- Redis cache (see below)
- **Implicit group chats** - No setup required! Any user assigned to a worklet can automatically access that worklet's group chat
- **Production-ready scaling** - Multi-worker support with gunicorn

## Scalability & Performance

**Default Configuration:**
- ✅ 4 workers (handles 500-1000 concurrent users)
- ✅ 50 database connections per worker (200 total)
- ✅ Automatic worker restart on failure
- ✅ Connection pooling with health checks
- ✅ Redis caching for OTPs and session data

**For higher load**, see [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Horizontal scaling strategies
- Load balancing configuration
- Database optimization tips
- Monitoring and troubleshooting

## Group Chat System
Group chats are **automatically available** for any worklet with user assignments. No migration or setup scripts needed - the system determines group chat access based on `UserWorkletAssociation` records.

When you clone and run this app:
1. Database tables are auto-created on first startup
2. Group chats work immediately for any worklet with users
3. No manual migration required

## Redis Cache
- Set `REDIS_URL` in `.env` (default: `redis://localhost:6379/0`)
- Redis is used for caching OTPs and can be extended for other features.

## Project Structure
- `app/` - Main backend code
- `app/models.py` - SQLAlchemy models
- `app/routers/` - API endpoints
- `app/core/` - Config, email, security, rate limiting

## Environment Variables

**Performance & Scaling:**
```env
WEB_CONCURRENCY=4          # Number of workers (production)
DB_POOL_SIZE=20            # DB connections per worker
DB_MAX_OVERFLOW=30         # Additional connections per worker
DB_POOL_TIMEOUT=60         # Connection wait timeout (seconds)
REDIS_MAX_CONNECTIONS=50   # Redis connection pool
```

See `.env.example` for all configuration options.

## Troubleshooting
- Ensure MySQL and Redis are running and accessible.
- Check `.env` for correct DB/SMTP/Redis settings.
- Monitor connection pool: `curl http://localhost:8000/api/health/db`
- Connection errors? Increase `DB_POOL_SIZE` and `DB_MAX_OVERFLOW`
