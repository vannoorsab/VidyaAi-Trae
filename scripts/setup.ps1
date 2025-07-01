# VidyAI Setup Script for Windows

# Error handling
$ErrorActionPreference = "Stop"

# Function to check if a command exists
function Test-Command($CommandName) {
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Function to display status messages
function Write-Status($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

# Check for required tools
Write-Status "Checking required tools..."

# Check for Node.js
if (-not (Test-Command node)) {
    Write-Host "Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check for Python
if (-not (Test-Command python)) {
    Write-Host "Python is not installed. Please install Python from https://python.org/" -ForegroundColor Red
    exit 1
}

# Check for Docker
if (-not (Test-Command docker)) {
    Write-Host "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Status "Creating project directories..."
$directories = @(
    "client/public",
    "client/src/components",
    "client/src/pages/student",
    "client/src/pages/teacher",
    "client/src/pages/parent",
    "client/src/stores",
    "client/src/utils",
    "server/routes",
    "server/models",
    "server/middleware",
    "server/config",
    "server/services",
    "server/utils",
    "server/ai_services",
    "docs",
    "tests/client",
    "tests/server",
    "tests/ai_services"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created directory: $dir" -ForegroundColor Green
}

# Install backend dependencies
Write-Status "Installing backend dependencies..."
Set-Location server
npm install

# Install Python dependencies
Write-Status "Installing Python dependencies..."
Set-Location ai_services
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
deactivate

# Install frontend dependencies
Write-Status "Installing frontend dependencies..."
Set-Location ..\..\client
npm install

# Create environment files
Write-Status "Creating environment files..."
Copy-Item ../.env.example ../.env
Copy-Item ../.env.example ./.env

# Initialize Git repository
Write-Status "Initializing Git repository..."
Set-Location ..
git init
git add .
git commit -m "Initial commit"

# Start Docker containers
Write-Status "Starting Docker containers..."
docker-compose up -d

Write-Status "Setup completed successfully!"
Write-Host "
Next steps:
1. Configure the environment variables in .env files
2. Start the development servers:
   - Backend: cd server && npm run dev
   - Frontend: cd client && npm run dev
3. Access the application at http://localhost:5173
" -ForegroundColor Yellow