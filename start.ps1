# AI Code Intelligence — single startup script
# Usage: .\start.ps1
# Opens the app at http://localhost:8000 after building the frontend.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== AI Code Intelligence ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Build the React frontend ──────────────────────────────────────────────
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install --silent
npm run build
Pop-Location
Write-Host "      Frontend built." -ForegroundColor Green

# ── 2. Install Python dependencies ───────────────────────────────────────────
Write-Host "[2/3] Installing backend dependencies..." -ForegroundColor Yellow
& "backend\.venv\Scripts\pip.exe" install -r backend\requirements.txt --quiet
Write-Host "      Dependencies ready." -ForegroundColor Green

# ── 3. Start FastAPI (serves everything on :8000) ────────────────────────────
Write-Host "[3/3] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  App running at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Set-Location backend
& ".venv\Scripts\uvicorn.exe" main:app --host 0.0.0.0 --port 8000
