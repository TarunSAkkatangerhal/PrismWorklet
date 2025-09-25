# Prism Backend

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
4. Run the server:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Features
- FastAPI backend for Samsung Prism Worklet Management
- MySQL (SQLAlchemy ORM)
- JWT Auth, OTP, Email (Gmail SMTP)
- Redis cache (see below)

## Redis Cache
- Set `REDIS_URL` in `.env` (default: `redis://localhost:6379/0`)
- Redis is used for caching OTPs and can be extended for other features.

## Project Structure
- `app/` - Main backend code
- `app/models.py` - SQLAlchemy models
- `app/routers/` - API endpoints
- `app/core/` - Config, email, security, rate limiting

## Troubleshooting
- Ensure MySQL and Redis are running and accessible.
- Check `.env` for correct DB/SMTP/Redis settings.
