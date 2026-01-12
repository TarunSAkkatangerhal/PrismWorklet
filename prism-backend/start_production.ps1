# Production startup script with multiple workers
# Use this for production deployments

$workers = 4  # Adjust based on CPU cores (2 * cores + 1)
$host = "0.0.0.0"
$port = 8000
$timeout = 120

Write-Host "🚀 Starting PRISM Backend in PRODUCTION mode" -ForegroundColor Green
Write-Host "   Workers: $workers" -ForegroundColor Cyan
Write-Host "   Timeout: $timeout seconds" -ForegroundColor Cyan
Write-Host "   Binding: ${host}:${port}" -ForegroundColor Cyan
Write-Host ""

# Check if gunicorn is installed
$gunicornInstalled = python -c "import gunicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gunicorn not installed. Installing..." -ForegroundColor Red
    pip install gunicorn
}

# Start with gunicorn
gunicorn app.main:app `
    --workers $workers `
    --worker-class uvicorn.workers.UvicornWorker `
    --bind "${host}:${port}" `
    --timeout $timeout `
    --access-logfile - `
    --error-logfile - `
    --log-level info `
    --graceful-timeout 30 `
    --keep-alive 5
