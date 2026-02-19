# PowerShell Deployment script for Job Board application
# This script builds and pushes Docker images to ECR, then updates the ECS service

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Job Board Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "terraform") -or -not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Get AWS Account ID and Region
try {
    $AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
    $AWS_REGION = aws configure get region
} catch {
    Write-Host "Error: AWS credentials not configured properly" -ForegroundColor Red
    Write-Host "Please run: aws configure" -ForegroundColor Yellow
    exit 1
}

if (-not $AWS_ACCOUNT_ID -or -not $AWS_REGION) {
    Write-Host "Error: Could not retrieve AWS credentials" -ForegroundColor Red
    exit 1
}

Write-Host "AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Green
Write-Host ""

# Get ECR repository URLs from Terraform outputs
Set-Location terraform

if (-not (Test-Path "terraform.tfstate")) {
    Write-Host "Error: Terraform state not found. Please run 'terraform apply' first" -ForegroundColor Red
    exit 1
}

Write-Host "Getting ECR repository URLs from Terraform..." -ForegroundColor Yellow
$BACKEND_REPO = terraform output -raw ecr_backend_repository_url 2>$null
$FRONTEND_REPO = terraform output -raw ecr_frontend_repository_url 2>$null

if (-not $BACKEND_REPO -or -not $FRONTEND_REPO) {
    Write-Host "Error: Could not get ECR repository URLs from Terraform" -ForegroundColor Red
    exit 1
}

Write-Host "Backend Repository: $BACKEND_REPO" -ForegroundColor Green
Write-Host "Frontend Repository: $FRONTEND_REPO" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Login to ECR
Write-Host "Logging in to Amazon ECR..." -ForegroundColor Yellow
$loginCommand = aws ecr get-login-password --region $AWS_REGION
$loginCommand | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to login to ECR" -ForegroundColor Red
    exit 1
}

Write-Host "Successfully logged in to ECR" -ForegroundColor Green
Write-Host ""

# Build and push backend image
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Building Backend Docker Image" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Set-Location backend

docker build -t jobboard-backend:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Backend Docker build failed" -ForegroundColor Red
    exit 1
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Tagging backend image..." -ForegroundColor Yellow
docker tag jobboard-backend:latest "$BACKEND_REPO:latest"
docker tag jobboard-backend:latest "$BACKEND_REPO:$timestamp"

Write-Host "Pushing backend image to ECR..." -ForegroundColor Yellow
docker push "$BACKEND_REPO:latest"
docker push "$BACKEND_REPO:$timestamp"

Write-Host "Backend image pushed successfully" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Build and push frontend image
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Building Frontend Docker Image" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Set-Location frontend

docker build -t jobboard-frontend:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Frontend Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Tagging frontend image..." -ForegroundColor Yellow
docker tag jobboard-frontend:latest "$FRONTEND_REPO:latest"
docker tag jobboard-frontend:latest "$FRONTEND_REPO:$timestamp"

Write-Host "Pushing frontend image to ECR..." -ForegroundColor Yellow
docker push "$FRONTEND_REPO:latest"
docker push "$FRONTEND_REPO:$timestamp"

Write-Host "Frontend image pushed successfully" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Update ECS service
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Updating ECS Service" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
aws ecs update-service --cluster jobboard-cluster --service jobboard-service --force-new-deployment --region $AWS_REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Failed to update ECS service" -ForegroundColor Yellow
    Write-Host "You may need to update it manually" -ForegroundColor Yellow
} else {
    Write-Host "ECS service update initiated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for service to stabilize (this may take 3-5 minutes)..." -ForegroundColor Yellow
    aws ecs wait services-stable --cluster jobboard-cluster --services jobboard-service --region $AWS_REGION
    Write-Host "Service is now stable" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Get and display the application URL
Set-Location terraform
$ALB_URL = terraform output -raw alb_url 2>$null

if ($ALB_URL) {
    Write-Host ""
    Write-Host "Your application is available at:" -ForegroundColor Green
    Write-Host "$ALB_URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "aws logs tail /ecs/jobboard --follow --region $AWS_REGION" -ForegroundColor White
Write-Host ""

Set-Location ..
