#!/bin/bash
# Deployment script for Job Board application
# This script builds and pushes Docker images to ECR, then updates the ECS service

set -e

echo "======================================"
echo "Job Board Deployment Script"
echo "======================================"

# Check if we're in the correct directory
if [ ! -d "terraform" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Get AWS Account ID and Region
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=$(aws configure get region)

if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: AWS credentials not configured properly"
    echo "Please run: aws configure"
    exit 1
fi

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# Get ECR repository URLs from Terraform outputs
cd terraform

if [ ! -f "terraform.tfstate" ]; then
    echo "Error: Terraform state not found. Please run 'terraform apply' first"
    exit 1
fi

echo "Getting ECR repository URLs from Terraform..."
BACKEND_REPO=$(terraform output -raw ecr_backend_repository_url 2>/dev/null)
FRONTEND_REPO=$(terraform output -raw ecr_frontend_repository_url 2>/dev/null)

if [ -z "$BACKEND_REPO" ] || [ -z "$FRONTEND_REPO" ]; then
    echo "Error: Could not get ECR repository URLs from Terraform"
    exit 1
fi

echo "Backend Repository: $BACKEND_REPO"
echo "Frontend Repository: $FRONTEND_REPO"
echo ""

cd ..

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

if [ $? -ne 0 ]; then
    echo "Error: Failed to login to ECR"
    exit 1
fi

echo "Successfully logged in to ECR"
echo ""

# Build and push backend image
echo "======================================"
echo "Building Backend Docker Image"
echo "======================================"
cd backend
docker build -t jobboard-backend:latest .

if [ $? -ne 0 ]; then
    echo "Error: Backend Docker build failed"
    exit 1
fi

echo "Tagging backend image..."
docker tag jobboard-backend:latest $BACKEND_REPO:latest
docker tag jobboard-backend:latest $BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

echo "Pushing backend image to ECR..."
docker push $BACKEND_REPO:latest
docker push $BACKEND_REPO:$(date +%Y%m%d-%H%M%S)

echo "Backend image pushed successfully"
echo ""

cd ..

# Build and push frontend image
echo "======================================"
echo "Building Frontend Docker Image"
echo "======================================"
cd frontend
docker build -t jobboard-frontend:latest .

if [ $? -ne 0 ]; then
    echo "Error: Frontend Docker build failed"
    exit 1
fi

echo "Tagging frontend image..."
docker tag jobboard-frontend:latest $FRONTEND_REPO:latest
docker tag jobboard-frontend:latest $FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

echo "Pushing frontend image to ECR..."
docker push $FRONTEND_REPO:latest
docker push $FRONTEND_REPO:$(date +%Y%m%d-%H%M%S)

echo "Frontend image pushed successfully"
echo ""

cd ..

# Update ECS service
echo "======================================"
echo "Updating ECS Service"
echo "======================================"
aws ecs update-service --cluster jobboard-cluster --service jobboard-service --force-new-deployment --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "Warning: Failed to update ECS service"
    echo "You may need to update it manually"
else
    echo "ECS service update initiated"
    echo ""
    echo "Waiting for service to stabilize (this may take 3-5 minutes)..."
    aws ecs wait services-stable --cluster jobboard-cluster --services jobboard-service --region $AWS_REGION
    echo "Service is now stable"
fi

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"

# Get and display the application URL
cd terraform
ALB_URL=$(terraform output -raw alb_url 2>/dev/null)

if [ -n "$ALB_URL" ]; then
    echo ""
    echo "Your application is available at:"
    echo "$ALB_URL"
fi

echo ""
echo "To view logs:"
echo "aws logs tail /ecs/jobboard --follow --region $AWS_REGION"
echo ""
