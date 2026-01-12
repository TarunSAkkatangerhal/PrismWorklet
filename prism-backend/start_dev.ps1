# Development startup script with hot reload
# Use this for local development only

Write-Host "🔧 Starting PRISM Backend in DEVELOPMENT mode" -ForegroundColor Yellow
Write-Host "   Hot reload: ENABLED" -ForegroundColor Cyan
Write-Host "   Workers: 1 (dev mode)" -ForegroundColor Cyan
Write-Host ""

# Start with uvicorn in reload mode
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
