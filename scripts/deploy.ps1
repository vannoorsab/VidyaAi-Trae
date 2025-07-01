# VidyAI Deployment Script for Windows

# Error handling
$ErrorActionPreference = "Stop"

# Function to display status messages
function Write-Status($Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

# Function to check exit code
function Check-ExitCode {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Last command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Verify we're on main branch
Write-Status "Verifying git branch..."
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main") {
    Write-Host "Error: Must be on main branch for deployment" -ForegroundColor Red
    exit 1
}

# Pull latest changes
Write-Status "Pulling latest changes..."
git pull
Check-ExitCode

# Build frontend
Write-Status "Building frontend..."
Set-Location client
npm ci --production
Check-ExitCode
npm run build
Check-ExitCode

# Build backend
Write-Status "Building backend..."
Set-Location ..\server
npm ci --production
Check-ExitCode

# Build AI services
Write-Status "Building AI services..."
Set-Location ai_services
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt --no-cache-dir
deactivate

# Stop existing containers
Write-Status "Stopping existing containers..."
Set-Location ..
docker-compose down

# Build and start new containers
Write-Status "Building and starting new containers..."
$env:NODE_ENV = "production"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
Check-ExitCode

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 30

# Run database migrations
Write-Status "Running database migrations..."
docker-compose exec -T server npm run migrate
Check-ExitCode

# Verify services
Write-Status "Verifying services..."

# Check backend health
$backendHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
if ($backendHealth.status -ne "healthy") {
    Write-Host "Error: Backend health check failed" -ForegroundColor Red
    exit 1
}

# Check AI service health
$aiHealth = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
if ($aiHealth.status -ne "healthy") {
    Write-Host "Error: AI service health check failed" -ForegroundColor Red
    exit 1
}

# Check frontend
$frontendResponse = Invoke-WebRequest -Uri "http://localhost" -Method Get
if ($frontendResponse.StatusCode -ne 200) {
    Write-Host "Error: Frontend check failed" -ForegroundColor Red
    exit 1
}

# Cleanup
Write-Status "Cleaning up..."

# Remove old Docker images
docker image prune -f

# Clear npm cache
npm cache clean --force

# Remove temporary files
Remove-Item -Path "tmp/*" -Recurse -Force -ErrorAction SilentlyContinue

# Update monitoring configuration
Write-Status "Updating monitoring configuration..."

# Reload Prometheus configuration
docker-compose exec -T prometheus prometheus --web.enable-lifecycle
Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post

# Reload Grafana dashboards
docker-compose exec -T grafana grafana-cli admin reset-admin-password admin

Write-Status "Deployment completed successfully!"
Write-Host "
Services are running at:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- AI Service: http://localhost:5000
- Monitoring:
  - Prometheus: http://localhost:9090
  - Grafana: http://localhost:3001
" -ForegroundColor Yellow

# Send deployment notification
$deploymentMessage = @{
    text = "VidyAI deployment completed successfully!"
    channel = "#deployments"
    username = "Deployment Bot"
} | ConvertTo-Json

# You can uncomment and configure the following line to send notifications to your preferred platform
# Invoke-RestMethod -Uri $env:WEBHOOK_URL -Method Post -Body $deploymentMessage -ContentType 'application/json'