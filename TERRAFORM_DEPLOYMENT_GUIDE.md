# Job Board Application - Terraform Deployment Guide

This comprehensive guide will walk you through deploying the Job Board application infrastructure on AWS using Terraform. Follow each step carefully to ensure a successful deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Install Required Tools](#install-required-tools)
4. [Configure AWS CLI](#configure-aws-cli)
5. [Prepare Terraform Configuration](#prepare-terraform-configuration)
6. [Deploy Infrastructure with Terraform](#deploy-infrastructure-with-terraform)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Build and Push Docker Images](#build-and-push-docker-images)
9. [Database Migration and Seeding](#database-migration-and-seeding)
10. [Access Your Application](#access-your-application)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Cleanup](#cleanup)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **AWS Account** with administrative access
- **AWS CLI** installed and configured
- **Terraform** (version 1.0 or later) installed
- **Docker** installed on your local machine
- **Git** installed
- Basic knowledge of AWS services (VPC, ECS, RDS, ALB)
- Basic knowledge of Terraform

---

## AWS Account Setup

### Step 1: Create an AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click **Create an AWS Account**
3. Follow the registration process
4. Add a payment method (required even for free tier)

### Step 2: Create an IAM User for Terraform

1. Log into the **AWS Console**
2. Navigate to **IAM** → **Users** → **Add users**
3. User name: `terraform-user`
4. Select **Access key - Programmatic access**
5. Click **Next: Permissions**
6. Attach the following policies:
   - `AdministratorAccess` (for simplicity; in production, use least privilege)
7. Click **Next** through tags (optional)
8. Click **Create user**
9. **IMPORTANT**: Save the **Access Key ID** and **Secret Access Key** - you'll need these

### Step 3: Note Your AWS Account ID

1. In AWS Console, click on your username (top right)
2. Note down your **Account ID** (12-digit number)

---

## Install Required Tools

### Install Terraform

#### On Windows:

1. Download Terraform from [terraform.io/downloads](https://www.terraform.io/downloads)
2. Extract the ZIP file
3. Move `terraform.exe` to a directory in your PATH (e.g., `C:\Windows\System32`)
4. Verify installation:
   ```powershell
   terraform version
   ```

#### On macOS:

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform version
```

#### On Linux:

```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform version
```

### Install AWS CLI

#### On Windows:

1. Download the AWS CLI MSI installer from [AWS](https://aws.amazon.com/cli/)
2. Run the installer
3. Verify installation:
   ```powershell
   aws --version
   ```

#### On macOS:

```bash
brew install awscli
aws --version
```

#### On Linux:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

### Install Docker

- **Windows/macOS**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow the [official Docker installation guide](https://docs.docker.com/engine/install/)

Verify Docker installation:
```bash
docker --version
```

---

## Configure AWS CLI

### Step 1: Configure AWS Credentials

Run the following command and enter your IAM user credentials:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: [Enter the key from IAM user creation]
- **AWS Secret Access Key**: [Enter the secret from IAM user creation]
- **Default region name**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

### Step 2: Verify AWS Configuration

Test your AWS CLI configuration:

```bash
aws sts get-caller-identity
```

You should see output showing your UserId, Account, and Arn.

---

## Prepare Terraform Configuration

### Step 1: Navigate to the Terraform Directory

```bash
cd terraform
```

### Step 2: Review and Customize Variables (Optional)

Open `variables.tf` and review the default values. You can customize:

- **aws_region**: AWS region for deployment (default: `us-east-1`)
- **environment**: Environment name (default: `prod`)
- **project_name**: Project name (default: `jobboard`)
- **vpc_cidr**: VPC CIDR block (default: `10.0.0.0/16`)
- **db_instance_class**: RDS instance type (default: `db.t3.micro`)
- **ecs_instance_type**: ECS EC2 instance type (default: `t3.small`)
- **ecs_desired_capacity**: Number of ECS instances (default: `2`)

**To override defaults**, create a `terraform.tfvars` file:

```hcl
# terraform/terraform.tfvars
aws_region          = "us-west-2"
environment         = "production"
ecs_desired_capacity = 3
db_instance_class   = "db.t3.small"
```

### Step 3: Initialize Terraform

Initialize Terraform to download required providers:

```bash
terraform init
```

Expected output:
```
Terraform has been successfully initialized!
```

---

## Deploy Infrastructure with Terraform

### Step 1: Review the Execution Plan

Generate and review the execution plan to see what resources will be created:

```bash
terraform plan
```

This will show you:
- All resources that will be created
- Estimated costs (approximate)
- Any errors in configuration

Review the output carefully. You should see approximately 40-50 resources to be created.

### Step 2: Apply the Terraform Configuration

Deploy the infrastructure:

```bash
terraform apply
```

You'll be prompted:
```
Do you want to perform these actions?
  Enter a value: 
```

Type `yes` and press Enter.

**Deployment Time**: This process takes approximately **15-20 minutes** to complete.

During deployment, Terraform will create:
- VPC with public and private subnets
- Internet Gateway and NAT Gateway
- Security Groups
- IAM Roles and Policies
- RDS PostgreSQL database
- ECR repositories
- ECS Cluster and Auto Scaling Group
- Application Load Balancer
- CloudWatch Log Groups
- Secrets Manager secrets

### Step 3: Save Terraform Outputs

Once deployment completes, Terraform will display important outputs. Save these values:

```bash
terraform output > ../terraform-outputs.txt
```

Key outputs:
- **alb_dns_name**: DNS name of your load balancer
- **alb_url**: Full URL to access your application
- **ecr_backend_repository_url**: Backend ECR repository URL
- **ecr_frontend_repository_url**: Frontend ECR repository URL
- **rds_endpoint**: Database endpoint
- **ecs_cluster_name**: ECS cluster name
- **ecs_service_name**: ECS service name

---

## Post-Deployment Steps

### Step 1: Get Output Values

Retrieve the important values from Terraform outputs:

```bash
# Get ALB DNS name
terraform output alb_dns_name

# Get ECR repository URLs
terraform output ecr_backend_repository_url
terraform output ecr_frontend_repository_url

# Get RDS endpoint
terraform output rds_endpoint
```

### Step 2: Verify Infrastructure

Check that all resources are created:

1. **VPC**: 
   ```bash
   aws ec2 describe-vpcs --filters "Name=tag:Project,Values=JobBoard"
   ```

2. **ECS Cluster**:
   ```bash
   aws ecs describe-clusters --clusters jobboard-cluster
   ```

3. **RDS Instance**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier jobboard-db
   ```

4. **Load Balancer**:
   ```bash
   aws elbv2 describe-load-balancers --names jobboard-alb
   ```

---

## Build and Push Docker Images

Now that the infrastructure is ready, you need to build and push your Docker images to ECR.

### Step 1: Get ECR Login Credentials

Authenticate Docker to your ECR registry:

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get your region
AWS_REGION=$(aws configure get region)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

**On Windows PowerShell**:
```powershell
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$AWS_REGION = aws configure get region
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
```

### Step 2: Build and Push Backend Image

Navigate to the project root (parent directory of terraform):

```bash
cd ..
```

Build the backend Docker image:

```bash
# Build backend image
docker build -t jobboard-backend ./backend

# Tag backend image
docker tag jobboard-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-backend:latest

# Push backend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-backend:latest
```

**On Windows PowerShell**:
```powershell
docker build -t jobboard-backend ./backend
docker tag jobboard-backend:latest "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-backend:latest"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-backend:latest"
```

### Step 3: Update Frontend Configuration

Before building the frontend, update the API URL in the frontend build:

Edit `frontend/src/App.jsx` or wherever your API URL is configured, or set the environment variable during build.

For now, get the ALB DNS name:

```bash
cd terraform
ALB_DNS=$(terraform output -raw alb_dns_name)
echo $ALB_DNS
cd ..
```

### Step 4: Build and Push Frontend Image

Build the frontend Docker image:

```bash
# Build frontend image
docker build -t jobboard-frontend ./frontend

# Tag frontend image
docker tag jobboard-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-frontend:latest

# Push frontend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-frontend:latest
```

**On Windows PowerShell**:
```powershell
docker build -t jobboard-frontend ./frontend
docker tag jobboard-frontend:latest "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-frontend:latest"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/jobboard-frontend:latest"
```

### Step 5: Force ECS Service Update

After pushing images, force ECS to pull the latest images:

```bash
aws ecs update-service --cluster jobboard-cluster --service jobboard-service --force-new-deployment
```

Wait for the deployment to complete (3-5 minutes):

```bash
aws ecs wait services-stable --cluster jobboard-cluster --services jobboard-service
```

---

## Database Migration and Seeding

### Step 1: Get Database Connection Details

Retrieve database credentials:

```bash
cd terraform

# Get RDS endpoint
DB_HOST=$(terraform output -raw rds_endpoint | cut -d: -f1)

# Get database password from Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id jobboard/db-password --query SecretString --output text)

echo "DB Host: $DB_HOST"
echo "DB Password: $DB_PASSWORD"
```

**On Windows PowerShell**:
```powershell
cd terraform
$DB_HOST = (terraform output -raw rds_endpoint).Split(':')[0]
$DB_PASSWORD = aws secretsmanager get-secret-value --secret-id jobboard/db-password --query SecretString --output text

Write-Host "DB Host: $DB_HOST"
Write-Host "DB Password: $DB_PASSWORD"
cd ..
```

### Step 2: Connect to ECS Instance via Session Manager

Since ECS instances are in public subnets but we want secure access, use SSM Session Manager:

1. Get an ECS instance ID:
   ```bash
   INSTANCE_ID=$(aws ec2 describe-instances \
     --filters "Name=tag:Name,Values=jobboard-ecs-instance" "Name=instance-state-name,Values=running" \
     --query "Reservations[0].Instances[0].InstanceId" \
     --output text)
   
   echo $INSTANCE_ID
   ```

**Note**: If SSM Session Manager is not set up, you'll need to add the SSM policy to the ECS instance role or connect via EC2 Instance Connect.

### Step 3: Run Database Migrations via ECS Task

Alternatively, run migrations as an ECS task. Create a one-off task:

1. SSH into one of your ECS instances or run a standalone container with database access
2. Run the seed script:

```bash
cd backend
npm install
npm run seed
```

**Easier Method**: Run migrations from your local machine by creating a temporary security group rule:

```bash
# Get RDS security group ID
SG_ID=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=jobboard-rds-sg" --query "SecurityGroups[0].GroupId" --output text)

# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add temporary rule to allow your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32
```

Then from your local machine:

```bash
cd backend

# Set environment variables
export DB_HOST=$DB_HOST
export DB_NAME=jobboard
export DB_USER=postgres
export DB_PASSWORD=$DB_PASSWORD

# Install dependencies
npm install

# Run migrations/seed
npm run seed
```

**After seeding, remove the security group rule**:

```bash
aws ec2 revoke-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32
```

---

## Access Your Application

### Step 1: Get Application URL

```bash
cd terraform
terraform output alb_url
```

Example output:
```
http://jobboard-alb-1234567890.us-east-1.elb.amazonaws.com
```

### Step 2: Access the Application

1. Open your browser
2. Navigate to the ALB URL
3. You should see the Job Board application

**Frontend**: `http://<ALB_DNS_NAME>/`  
**Backend API**: `http://<ALB_DNS_NAME>/api/`

### Step 3: Test the Application

1. Try creating a new user account
2. Log in
3. Create a job posting (if recruiter)
4. Browse jobs (if job seeker)

---

## Monitoring and Logging

### View CloudWatch Logs

1. **AWS Console** → **CloudWatch** → **Log groups**
2. Find `/ecs/jobboard`
3. View log streams:
   - `backend/...` - Backend application logs
   - `frontend/...` - Frontend application logs

**Via AWS CLI**:

```bash
# List recent backend logs
aws logs tail /ecs/jobboard --follow --filter-pattern "backend"

# List recent frontend logs
aws logs tail /ecs/jobboard --follow --filter-pattern "frontend"
```

### Monitor ECS Service

```bash
# Get service status
aws ecs describe-services --cluster jobboard-cluster --services jobboard-service

# List running tasks
aws ecs list-tasks --cluster jobboard-cluster --service-name jobboard-service

# Check task health
aws ecs describe-tasks --cluster jobboard-cluster --tasks <TASK_ARN>
```

### Monitor RDS

```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier jobboard-db --query "DBInstances[0].DBInstanceStatus"
```

### Monitor ALB

```bash
# Check ALB health
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
```

Get target group ARN:
```bash
aws elbv2 describe-target-groups --names jobboard-frontend-tg --query "TargetGroups[0].TargetGroupArn" --output text
```

---

## Cleanup

**WARNING**: This will destroy all resources and data. Make sure you have backups if needed.

### Step 1: Navigate to Terraform Directory

```bash
cd terraform
```

### Step 2: Destroy Infrastructure

```bash
terraform destroy
```

You'll be prompted:
```
Do you really want to destroy all resources?
  Enter a value: 
```

Type `yes` and press Enter.

**Destruction Time**: Approximately **10-15 minutes**.

### Step 3: Verify Cleanup

Check that resources are deleted:

```bash
# Check ECS cluster
aws ecs describe-clusters --clusters jobboard-cluster

# Check RDS instance
aws rds describe-db-instances --db-instance-identifier jobboard-db

# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=JobBoard"
```

### Step 4: Manual Cleanup (if needed)

Sometimes certain resources may fail to delete. Manually delete:

1. **ECR Images**: Empty ECR repositories before Terraform can delete them
   ```bash
   aws ecr batch-delete-image --repository-name jobboard-backend --image-ids imageTag=latest
   aws ecr batch-delete-image --repository-name jobboard-frontend --image-ids imageTag=latest
   ```

2. **CloudWatch Logs**: May need manual deletion
   ```bash
   aws logs delete-log-group --log-group-name /ecs/jobboard
   ```

---

## Troubleshooting

### Issue 1: Terraform Init Fails

**Error**: `Failed to install provider`

**Solution**:
```bash
# Clear Terraform cache
rm -rf .terraform .terraform.lock.hcl

# Re-initialize
terraform init
```

### Issue 2: AWS Authentication Fails

**Error**: `No valid credential sources found`

**Solution**:
```bash
# Reconfigure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity
```

### Issue 3: ECS Service Not Starting

**Error**: Tasks fail to start or are constantly restarting

**Solution**:
1. Check CloudWatch logs for errors
2. Verify ECR images are pushed:
   ```bash
   aws ecr describe-images --repository-name jobboard-backend
   aws ecr describe-images --repository-name jobboard-frontend
   ```
3. Check task definition:
   ```bash
   aws ecs describe-task-definition --task-definition jobboard-task
   ```

### Issue 4: Cannot Access Application via ALB

**Error**: ALB returns 503 Service Unavailable

**Solution**:
1. Check target group health:
   ```bash
   aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
   ```
2. Verify ECS tasks are running:
   ```bash
   aws ecs list-tasks --cluster jobboard-cluster --service-name jobboard-service
   ```
3. Check security group rules
4. Verify containers are healthy in CloudWatch logs

### Issue 5: RDS Connection Fails

**Error**: Backend cannot connect to database

**Solution**:
1. Verify RDS is available:
   ```bash
   aws rds describe-db-instances --db-instance-identifier jobboard-db
   ```
2. Check security group allows ECS instances
3. Verify secrets are accessible:
   ```bash
   aws secretsmanager get-secret-value --secret-id jobboard/db-password
   ```
4. Check IAM role has Secrets Manager permissions

### Issue 6: Terraform Destroy Hangs

**Error**: Terraform destroy takes too long or fails

**Solution**:
1. Manually scale down ECS service to 0:
   ```bash
   aws ecs update-service --cluster jobboard-cluster --service jobboard-service --desired-count 0
   ```
2. Wait for tasks to stop:
   ```bash
   aws ecs wait services-stable --cluster jobboard-cluster --services jobboard-service
   ```
3. Run `terraform destroy` again

### Issue 7: High AWS Costs

**Warning**: Running infrastructure costs money

**Solution**:
1. Use smaller instance types (t3.micro for development)
2. Reduce ECS desired capacity to 1
3. Use RDS db.t3.micro (free tier eligible)
4. Delete resources when not in use:
   ```bash
   terraform destroy
   ```

### Issue 8: Docker Build Fails

**Error**: Docker build fails during image creation

**Solution**:
1. Ensure Docker is running:
   ```bash
   docker ps
   ```
2. Check Dockerfile syntax
3. Verify all dependencies are available
4. Try building with no cache:
   ```bash
   docker build --no-cache -t jobboard-backend ./backend
   ```

---

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

## Cost Estimation

Approximate monthly costs (us-east-1 region):

| Resource | Type | Estimated Cost |
|----------|------|----------------|
| EC2 Instances (2x t3.small) | ECS | ~$30/month |
| RDS (db.t3.micro) | Database | ~$15/month |
| Application Load Balancer | Networking | ~$20/month |
| NAT Gateway | Networking | ~$35/month |
| Data Transfer | Various | ~$10/month |
| **Total** | | **~$110/month** |

**Note**: Costs vary based on usage. Use AWS Cost Explorer to monitor actual costs.

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use Secrets Manager** for sensitive data (already configured)
3. **Enable MFA** on AWS root account
4. **Use IAM roles** instead of access keys where possible
5. **Regularly rotate credentials**
6. **Enable AWS CloudTrail** for audit logging
7. **Use HTTPS** for production (configure SSL certificate on ALB)
8. **Limit security group access** to only necessary ports/IPs
9. **Enable VPC Flow Logs** for network monitoring
10. **Regular security updates** for Docker images

---

## Production Recommendations

For production deployments, consider:

1. **Use S3 backend** for Terraform state:
   ```hcl
   terraform {
     backend "s3" {
       bucket = "your-terraform-state-bucket"
       key    = "jobboard/terraform.tfstate"
       region = "us-east-1"
     }
   }
   ```

2. **Enable SSL/TLS** on ALB with ACM certificate
3. **Use Route53** for custom domain
4. **Enable RDS Multi-AZ** for high availability
5. **Implement CI/CD** with CodePipeline or GitHub Actions
6. **Enable RDS automated backups**
7. **Use larger instance types** based on load testing
8. **Implement auto-scaling** policies
9. **Set up CloudWatch alarms** for monitoring
10. **Use AWS WAF** for application firewall

---

## Next Steps

After successful deployment:

1. ✅ Set up custom domain with Route53
2. ✅ Configure SSL certificate with ACM
3. ✅ Implement CI/CD pipeline
4. ✅ Set up monitoring and alerting
5. ✅ Configure automated backups
6. ✅ Implement log aggregation
7. ✅ Set up staging environment
8. ✅ Load test the application
9. ✅ Document API endpoints
10. ✅ Create runbooks for common operations

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review AWS CloudWatch logs
3. Verify all prerequisites are met
4. Check AWS service quotas/limits
5. Review Terraform plan output carefully

---

**Congratulations!** 🎉 You've successfully deployed the Job Board application on AWS using Terraform!
