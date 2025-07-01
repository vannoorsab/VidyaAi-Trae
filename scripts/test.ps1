# VidyAI Test Script for Windows

# Error handling
$ErrorActionPreference = "Stop"

# Function to display status messages
function Write-Status($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

# Function to run tests with coverage
function Run-TestsWithCoverage($Directory) {
    Set-Location $Directory
    npm run test:coverage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tests failed in $Directory" -ForegroundColor Red
        exit 1
    }
}

# Function to run Python tests
function Run-PythonTests($Directory) {
    Set-Location $Directory
    .\venv\Scripts\Activate
    pytest --cov=. --cov-report=html
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Python tests failed in $Directory" -ForegroundColor Red
        deactivate
        exit 1
    }
    deactivate
}

# Function to run linting
function Run-Linting($Directory) {
    Set-Location $Directory
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Linting failed in $Directory" -ForegroundColor Red
        exit 1
    }
}

# Function to run type checking
function Run-TypeCheck($Directory) {
    Set-Location $Directory
    npm run typecheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Type checking failed in $Directory" -ForegroundColor Red
        exit 1
    }
}

# Start testing process
Write-Status "Starting test suite..."

# Test frontend
Write-Status "Testing frontend..."
Set-Location ..\client

# Install dependencies if needed
if (-not (Test-Path node_modules)) {
    npm install
}

Run-Linting .
Run-TypeCheck .
Run-TestsWithCoverage .

# Test backend
Write-Status "Testing backend..."
Set-Location ..\server

# Install dependencies if needed
if (-not (Test-Path node_modules)) {
    npm install
}

Run-Linting .
Run-TestsWithCoverage .

# Test AI services
Write-Status "Testing AI services..."
Set-Location ai_services

# Create and activate virtual environment if needed
if (-not (Test-Path venv)) {
    python -m venv venv
    .\venv\Scripts\Activate
    pip install -r requirements.txt
    pip install pytest pytest-cov pylint mypy
    deactivate
}

# Run Python linting
.\venv\Scripts\Activate
pylint .\**\*.py
if ($LASTEXITCODE -gt 0) {
    Write-Host "Python linting failed" -ForegroundColor Red
    deactivate
    exit 1
}

# Run Python type checking
mypy .\**\*.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python type checking failed" -ForegroundColor Red
    deactivate
    exit 1
}

# Run Python tests
Run-PythonTests .

# Generate combined coverage report
Write-Status "Generating coverage reports..."

# Move to project root
Set-Location ..\..

# Create coverage directory if it doesn't exist
if (-not (Test-Path coverage)) {
    New-Item -ItemType Directory -Path coverage | Out-Null
}

# Copy coverage reports
Copy-Item .\client\coverage\* .\coverage\client\ -Recurse -Force
Copy-Item .\server\coverage\* .\coverage\server\ -Recurse -Force
Copy-Item .\server\ai_services\htmlcov\* .\coverage\ai_services\ -Recurse -Force

Write-Status "Test suite completed successfully!"
Write-Host "
Coverage reports are available in:
- Frontend: ./coverage/client/index.html
- Backend: ./coverage/server/index.html
- AI Services: ./coverage/ai_services/index.html
" -ForegroundColor Yellow