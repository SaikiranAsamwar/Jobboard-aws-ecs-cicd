# JobBoard Application - Complete AWS Deployment Guide (0% to 100%)

A full-stack job board application with React frontend and Node.js backend, deployed on AWS using Terraform for infrastructure and complete CI/CD pipeline.

## 🎯 Deployment Progress Tracker

Use this checklist to track your deployment progress:

### Phase 1: Pre-Deployment Setup (0-20%)
- [ ] Install all prerequisites
- [ ] Create AWS account
- [ ] Configure AWS CLI
- [ ] Install Terraform
- [ ] Clone/setup project code

### Phase 2: Infrastructure Deployment (20-40%)
- [ ] Configure Terraform variables
- [ ] Initialize Terraform
- [ ] Review Terraform plan
- [ ] Deploy infrastructure with Terraform
- [ ] Verify infrastructure creation

### Phase 3: Container Deployment (40-60%)
- [ ] Build Docker images
- [ ] Push images to ECR
- [ ] Update ECS service
- [ ] Initialize database
- [ ] Verify application running

### Phase 4: CI/CD Pipeline Setup (60-80%)
- [ ] Setup CodeCommit/GitHub
- [ ] Create IAM roles
- [ ] Setup CodeBuild
- [ ] Setup CodeDeploy
- [ ] Create CodePipeline

### Phase 5: Testing & Optimization (80-100%)
- [ ] Test application
- [ ] Setup monitoring
- [ ] Configure alarms
- [ ] Document everything
- [ ] Final verification

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Cost Estimation](#cost-estimation)
- [Prerequisites Installation](#prerequisites-installation)
- [Step 1: AWS Account Setup (0-10%)](#step-1-aws-account-setup-0-10)
- [Step 2: Install Required Tools (10-20%)](#step-2-install-required-tools-10-20)
- [Step 3: Project Setup (20-25%)](#step-3-project-setup-20-25)
- [Step 4: Configure Terraform (25-30%)](#step-4-configure-terraform-25-30)
- [Step 5: Deploy Infrastructure with Terraform (30-40%)](#step-5-deploy-infrastructure-with-terraform-30-40)
- [Step 6: Build and Push Docker Images (40-50%)](#step-6-build-and-push-docker-images-40-50)
- [Step 7: Deploy Application to ECS (50-60%)](#step-7-deploy-application-to-ecs-50-60)
- [Step 8: Initialize Database (60-65%)](#step-8-initialize-database-60-65)
- [Step 9: Setup CI/CD Pipeline (65-80%)](#step-9-setup-cicd-pipeline-65-80)
- [Step 10: Testing and Verification (80-90%)](#step-10-testing-and-verification-80-90)
- [Step 11: Monitoring and Alarms (90-95%)](#step-11-monitoring-and-alarms-90-95)
- [Step 12: Final Optimization (95-100%)](#step-12-final-optimization-95-100)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)
- [Reference](#reference)

---

## Overview

### What is This Project?

The JobBoard application is a full-stack web application that allows:
- **Job Seekers**: Browse jobs, apply, and manage their profile
- **Recruiters**: Post jobs, manage applications, and find candidates
- **Admins**: Manage the platform and users

### Technology Stack

**Frontend:**
- React.js (v18+) - UI framework
- Vite - Build tool
- React Router - Routing
- Axios - HTTP client
- Nginx - Web server for production

**Backend:**
- Node.js (v18+) - Runtime
- Express.js - Web framework
- Sequelize - ORM
- PostgreSQL - Database
- JWT - Authentication

**Infrastructure (AWS):**
- **Compute**: ECS on EC2 (t3.small instances)
- **Database**: RDS PostgreSQL (db.t3.micro)
- **Load Balancer**: Application Load Balancer
- **Container Registry**: ECR
- **Networking**: VPC, Subnets, NAT Gateway
- **Security**: Security Groups, Secrets Manager
- **Monitoring**: CloudWatch Logs & Metrics
- **CI/CD**: CodePipeline, CodeBuild, CodeDeploy

**Infrastructure as Code:**
- Terraform (v1.0+)

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet Gateway                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                     │
│         (Port 80, SSL/TLS Termination, Path Routing)            │
└──────────────┬─────────────────────────┬────────────────────────┘
               │                         │
               ↓                         ↓
    ┌──────────────────┐      ┌──────────────────┐
    │  Frontend Target │      │  Backend Target  │
    │      Group       │      │      Group       │
    └────────┬─────────┘      └────────┬─────────┘
             │                          │
             ↓                          ↓
┌────────────────────────────────────────────────────────────────┐
│                    ECS Cluster (EC2)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Task 1 (EC2 Instance 1)                                 │  │
│  │  ├── Frontend Container (Nginx:80 → Dynamic Port)        │  │
│  │  └── Backend Container (Node:4000 → Dynamic Port)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Task 2 (EC2 Instance 2)                                 │  │
│  │  ├── Frontend Container (Nginx:80 → Dynamic Port)        │  │
│  │  └── Backend Container (Node:4000 → Dynamic Port)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────────┐
│              RDS PostgreSQL (Private Subnet)                    │
│                  (db.t3.micro, 20GB)                           │
└────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline Flow

```
Developer
    │
    ├─ git push
    │
    ↓
┌─────────────────────┐
│  CodeCommit/GitHub  │ ← Source Code Repository
└──────────┬──────────┘
           │ (Trigger on push)
           ↓
┌─────────────────────┐
│   CodePipeline      │ ← Orchestration
└──────────┬──────────┘
           │
           ├─── Stage 1: Source
           │         ↓
           ├─── Stage 2: Build (CodeBuild)
           │         │
           │         ├─ Build Backend Docker Image
           │         ├─ Build Frontend Docker Image
           │         ├─ Push Images to ECR
           │         └─ Create Artifacts (taskdef.json, appspec.yaml)
           │         ↓
           └─── Stage 3: Deploy (CodeDeploy)
                     │
                     ├─ Create New Task Definition
                     ├─ Start Green Environment
                     ├─ Health Checks
                     ├─ Switch Traffic (Blue → Green)
                     └─ Terminate Blue Environment
                     ↓
              ┌─────────────────┐
              │  Live Application │
              └─────────────────┘
```

### Network Architecture

```
┌──────────────────── VPC (10.0.0.0/16) ────────────────────────┐
│                                                                 │
│  ┌───────────── Availability Zone 1 (us-east-1a) ────────┐    │
│  │                                                         │    │
│  │  ┌─── Public Subnet (10.0.1.0/24) ───┐                │    │
│  │  │  - NAT Gateway                     │                │    │
│  │  │  - ECS Instances (if needed)       │                │    │
│  │  └────────────────────────────────────┘                │    │
│  │                                                         │    │
│  │  ┌─── Private Subnet (10.0.3.0/24) ───┐               │    │
│  │  │  - RDS Primary                      │               │    │
│  │  └────────────────────────────────────┘                │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────── Availability Zone 2 (us-east-1b) ────────┐    │
│  │                                                         │    │
│  │  ┌─── Public Subnet (10.0.2.0/24) ───┐                │    │
│  │  │  - ECS Instances                   │                │    │
│  │  │  - ALB                             │                │    │
│  │  └────────────────────────────────────┘                │    │
│  │                                                         │    │
│  │  ┌─── Private Subnet (10.0.4.0/24) ───┐               │    │
│  │  │  - RDS Standby (Multi-AZ optional) │               │    │
│  │  └────────────────────────────────────┘                │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Estimation

### Monthly Costs (us-east-1 region)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **EC2 (ECS)** | 2x t3.small | ~$30.00 |
| **RDS PostgreSQL** | 1x db.t3.micro, 20GB | ~$15.00 |
| **Application Load Balancer** | 1 ALB | ~$18.00 |
| **NAT Gateway** | 1 NAT + data | ~$35.00 |
| **EBS Storage** | 60GB gp3 | ~$6.00 |
| **ECR** | ~10GB images | ~$1.00 |
| **CloudWatch Logs** | ~5GB/month | ~$2.50 |
| **S3** | Pipeline artifacts | ~$0.50 |
| **Secrets Manager** | 2 secrets | ~$0.80 |
| **Data Transfer** | ~5GB out | ~$0.45 |
| **TOTAL** | | **~$109/month** |

**For 2 days testing: ~$7-8**

### Free Tier Eligible (First 12 months)
- 750 hours/month of t2.micro/t3.micro EC2
- 750 hours/month of db.t2.micro RDS
- 750 hours/month of ALB
- Reduces cost to ~$50-60/month during free tier

---

## Prerequisites Installation

### What You'll Need

**Hardware Requirements:**
- Computer with at least 8GB RAM
- 20GB free disk space
- Stable internet connection

**Operating System:**
- Windows 10/11 (this guide uses PowerShell)
- macOS (use Terminal)
- Linux (use bash)

**Time to Complete:** Approximately 2-4 hours total

---

## Step 1: AWS Account Setup (0-10%)

### 1.1 Create AWS Account (If you don't have one)

**Time: 15-20 minutes**

1. **Go to AWS Website**
   - Open browser and navigate to: https://aws.amazon.com/
   - Click **Create an AWS Account** (top right)

2. **Enter Account Details**
   - **Email address**: Your personal or business email
   - **Password**: Strong password (min 8 characters)
   - **AWS account name**: Choose a name (e.g., "My JobBoard Project")
   - Click **Continue**

3. **Contact Information**
   - Select **Personal** or **Business** account type
   - Fill in all required fields:
     - Full name
     - Phone number
     - Country
     - Address, City, State/Province, Postal code
   - Click **Create Account and Continue**

4. **Payment Information**
   - Enter credit/debit card details
   - **Note**: You won't be charged unless you exceed Free Tier limits
   - AWS will charge $1 for verification (refunded)
   - Click **Verify and Continue**

5. **Identity Verification**
   - Choose **Text message (SMS)** or **Voice call**
   - Enter verification code received
   - Click **Verify Code**

6. **Select Support Plan**
   - Choose **Basic Support - Free**
   - Click **Complete sign up**

7. **Wait for Account Activation**
   - You'll receive email: "Welcome to Amazon Web Services"
   - Usually takes 5-15 minutes
   - **Don't proceed until you receive this email!**

### 1.2 Sign In to AWS Console

1. **Go to AWS Console**
   - Navigate to: https://console.aws.amazon.com/
   - Enter your **Root user email address**
   - Click **Next**
   - Enter your **password**
   - Click **Sign in**

2. **Verify You're Logged In**
   - Top right corner should show your account name/number
   - You should see the AWS Management Console dashboard

### 1.3 Create IAM User (Best Practice)

**Important:** Never use root account for daily operations!

1. **Navigate to IAM Service**
   - In search bar (top), type: `IAM`
   - Click **IAM** service

2. **Create IAM User**
   - Left sidebar → click **Users**
   - Click **Create user** button
   
3. **User Details**
   - **User name**: `terraform-admin` (or your preferred name)
   - ✅ Check **Provide user access to the AWS Management Console**
   - Select **I want to create an IAM user**
   - **Console password**: Choose **Custom password** and set a strong password
   - ✅ **Uncheck** "User must create a new password at next sign-in"
   - Click **Next**

4. **Set Permissions**
   - Select **Attach policies directly**
   - Search and select: **AdministratorAccess**
   - **Warning**: This gives full access. For production, use least privilege.
   - Click **Next**

5. **Review and Create**
   - Review settings
   - Click **Create user**

6. **Download Credentials**
   - Click **Download .csv file** - **VERY IMPORTANT!**
   - Save the file securely (contains password and access details)
   - Click **Return to users list**

### 1.4 Create Access Keys for CLI

1. **Select Your User**
   - In Users list, click on `terraform-admin`

2. **Create Access Key**
   - Click **Security credentials** tab
   - Scroll to **Access keys** section
   - Click **Create access key**

3. **Access Key Best Practices**
   - Select **Command Line Interface (CLI)**
   - ✅ Check **I understand the above recommendation**
   - Click **Next**

4. **Description Tag (Optional)**
   - Description: `Local development machine`
   - Click **Create access key**

5. **Retrieve Access Keys**
   - **Access key ID**: Shows as `AKIA...`
   - **Secret access key**: Shows as `wJalr...` (click Show to see)
   - Click **Download .csv file** - **CRITICAL - Save this file!**
   - Click **Done**

6. **IMPORTANT**: Store these securely!
   - You won't be able to retrieve the secret key again
   - If lost, you'll need to create new access keys

### 1.5 Note Your AWS Account ID

1. **Find Account ID**
   - Top right corner → Click on your account name
   - You'll see **Account ID**: `123456789012` (12 digits)
   - **Write this down** or save it - you'll need it later!

**✅ Progress: 10% Complete**

---

## Step 2: Install Required Tools (10-20%)

### 2.1 Install Git

**Time: 5 minutes**

**For Windows:**

1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Click **Next** through all options (defaults are fine)
4. **Important**: On "Adjusting your PATH environment" select **Git from the command line and also from 3rd-party software**
5. Complete installation
6. Verify installation:

```powershell
git --version
# Should output: git version 2.x.x
```

**For macOS:**

```bash
# Using Homebrew (install Homebrew first if needed from https://brew.sh)
brew install git

# Verify
git --version
```

**For Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install git -y
git --version
```

### 2.2 Install Node.js

**Time: 5 minutes**

1. **Download Node.js**
   - Go to: https://nodejs.org/
   - Download **LTS version** (v18.x or higher)

2. **Install Node.js**
   - Run the installer
   - Click **Next** → **I accept** → **Next** → **Next** → **Install**
   - Complete installation

3. **Verify Installation**

```powershell
node --version
# Should output: v18.x.x or higher

npm --version
# Should output: 9.x.x or higher
```

### 2.3 Install Docker Desktop

**Time: 10 minutes**

1. **Download Docker Desktop**
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - macOS: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Install Docker Desktop**
   - Run the installer
   - Follow installation wizard
   - **For Windows**: Enable WSL 2 when prompted
   - Restart computer if required

3. **Start Docker Desktop**
   - Launch Docker Desktop application
   - Accept terms and conditions
   - Wait for Docker engine to start (icon in system tray shows "Docker Desktop is running")

4. **Verify Installation**

```powershell
docker --version
# Should output: Docker version 20.x.x or higher

docker ps
# Should output: CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
# (empty list is fine)
```

### 2.4 Install AWS CLI v2

**Time: 5 minutes**

**For Windows:**

1. Download AWS CLI installer:
   - Go to: https://aws.amazon.com/cli/
   - Click **Download the AWS CLI MSI installer for Windows (64-bit)**
   - Or direct link: https://awscli.amazonaws.com/AWSCLIV2.msi

2. Run the installer
   - Double-click the downloaded `.msi` file
   - Click **Next** → **I accept** → **Next** → **Install**
   - Complete installation

3. Verify installation (open new PowerShell window):

```powershell
aws --version
# Should output: aws-cli/2.x.x
```

**For macOS:**

```bash
# Download and install
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify
aws --version
```

**For Linux:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

### 2.5 Install Terraform

**Time: 5 minutes**

**For Windows:**

1. Download Terraform:
   - Go to: https://www.terraform.io/downloads
   - Click **Windows** → **AMD64** (download .zip file)

2. Extract the ZIP file
   - Right-click → **Extract All**
   - Extract to: `C:\terraform\`

3. Add Terraform to PATH:
   - Press `Windows + R`
   - Type: `sysdm.cpl` → Press Enter
   - Click **Advanced** tab → **Environment Variables**
   - Under **System variables**, select **Path** → Click **Edit**
   - Click **New** → Enter `C:\terraform`
   - Click **OK** on all windows
   - **Close and reopen PowerShell**

4. Verify installation:

```powershell
terraform --version
# Should output: Terraform v1.x.x
```

**For macOS:**

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify
terraform --version
```

**For Linux:**

```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version
```

### 2.6 Configure AWS CLI

**Time: 3 minutes**

This connects your local machine to your AWS account.

1. **Run AWS Configure**

```powershell
aws configure
```

2. **Enter Your Credentials** (from Step 1.4):

```
AWS Access Key ID [None]: AKIA..................  (paste your Access Key ID)
AWS Secret Access Key [None]: wJalr...............  (paste your Secret Access Key)
Default region name [None]: us-east-1  (or your preferred region)
Default output format [None]: json  (press Enter)
```

3. **Verify Configuration**

```powershell
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-admin"
}
```

If you see this, AWS CLI is configured correctly! ✅

### 2.7 Install Code Editor (Optional but Recommended)

**VS Code** (Recommended):
1. Download from: https://code.visualstudio.com/
2. Install with default settings
3. Install useful extensions:
   - Terraform
   - Docker
   - AWS Toolkit

**✅ Progress: 20% Complete**

---

## Step 3: Project Setup (20-25%)

### 3.1 Get the Project Code

**Time: 5 minutes**

**Option A: Clone from GitHub (if you have the repository)**

```powershell
# Navigate to your projects directory
cd A:\Resume-Projects\  # Or your preferred location

# Clone repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/jobboard.git
cd jobboard
```

**Option B: You Already Have the Code Locally**

```powershell
# Just navigate to the project directory
cd A:\Resume-Projects\jobboard
```

### 3.2 Verify Project Structure

```powershell
# List files to verify structure
dir
# Or on macOS/Linux: ls -la
```

**Expected structure:**
```
jobboard/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── seed-db.js
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── nginx.conf
│   └── src/
├── terraform/
│   ├── provider.tf
│   ├── variables.tf
│   ├── vpc.tf
│   ├── ecs.tf
│   ├── rds.tf
│   └── ... (other .tf files)
├── buildspec.yml
├── appspec.yaml
├── taskdef.json
└── README.md
```

### 3.3 Install Project Dependencies (Optional - for local testing)

**Backend:**

```powershell
cd backend
npm install
cd ..
```

**Frontend:**

```powershell
cd frontend
npm install
cd ..
```

**✅ Progress: 25% Complete**

---

## Step 4: Configure Terraform (25-30%)

### 4.1 Navigate to Terraform Directory

```powershell
cd terraform
```

### 4.2 Review Variables (Optional - Use Defaults)

The Terraform configuration uses sensible defaults. You can review them:

```powershell
# View variables file
cat variables.tf
# Or: notepad variables.tf  (Windows)
# Or: code variables.tf   (VS Code)
```

**Key default values:**
- **Region**: `us-east-1`
- **ECS Instance Type**: `t3.small`
- **ECS Desired Capacity**: `2`
- **RDS Instance Class**: `db.t3.micro`
- **RDS Storage**: `20GB`

**To customize (optional):**

Create a `terraform.tfvars` file:

```powershell
# Create custom variables file
New-Item terraform.tfvars -ItemType File

# Edit with your values
notepad terraform.tfvars
```

Add custom values:
```hcl
aws_region           = "us-west-2"  # Your preferred region
ecs_instance_type    = "t3.micro"   # Smaller for cost savings
ecs_desired_capacity = 1            # Single instance for testing
```

**For this guide, we'll use defaults. Skip customization unless needed.**

### 4.3 Initialize Terraform

**Time: 2 minutes**

Initialize Terraform to download required providers:

```powershell
terraform init
```

**Expected output:**
```
Initializing the backend...
Initializing provider plugins...
- Finding latest version of hashicorp/aws...
- Installing hashicorp/aws v5.x.x...
- Installed hashicorp/aws v5.x.x

Terraform has been successfully initialized!
```

**If you see errors:**
- Ensure you're in the `terraform/` directory
- Check internet connection
- Verify `provider.tf` file exists

### 4.4 Validate Terraform Configuration

```powershell
terraform validate
```

**Expected output:**
```
Success! The configuration is valid.
```

**✅ Progress: 30% Complete**

---

## Step 5: Deploy Infrastructure with Terraform (30-40%)

### 5.1 Review Deployment Plan

**Time: 2 minutes**

See what Terraform will create:

```powershell
terraform plan
```

**Expected output** (partial):
```
Terraform will perform the following actions:

  # aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + cidr_block = "10.0.0.0/16"
      ...
    }

  # aws_ecs_cluster.main will be created
  + resource "aws_ecs_cluster" "main" {
      + name = "jobboard-cluster"
      ...
    }

Plan: 45 to add, 0 to change, 0 to destroy.
```

**Review the plan carefully!** You should see approximately 40-50 resources to be created.

### 5.2 Deploy Infrastructure

**Time: 15-20 minutes**

**IMPORTANT**: This will create actual AWS resources and start incurring costs (~$0.15/hour)

```powershell
terraform apply
```

You'll be prompted:
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

Type **`yes`** and press Enter.

**Deployment Progress:**

You'll see output like:
```
aws_vpc.main: Creating...
aws_vpc.main: Creation complete after 2s [id=vpc-xxxxx]
aws_subnet.public[0]: Creating...
aws_subnet.public[1]: Creating...
aws_subnet.private[0]: Creating...
...
aws_ecs_service.main: Still creating... [10s elapsed]
aws_ecs_service.main: Still creating... [20s elapsed]
...
```

**This takes 15-20 minutes. Go grab coffee! ☕**

**What's happening:**
1. Creating VPC and networking (2-3 min)
2. Creating security groups (1 min)
3. Creating RDS database (8-10 min) ← Slowest part
4. Creating ECR repositories (1 min)
5. Creating ECS cluster and services (3-4 min)
6. Creating Application Load Balancer (2-3 min)

### 5.3 Verify Successful Deployment

**Expected final output:**
```
Apply complete! Resources: 45 added, 0 changed, 0 destroyed.

Outputs:

alb_dns_name = "jobboard-alb-123456789.us-east-1.elb.amazonaws.com"
alb_url = "http://jobboard-alb-123456789.us-east-1.elb.amazonaws.com"
cloudwatch_log_group = "/ecs/jobboard"
ecr_backend_repository_url = "123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-backend"
ecr_frontend_repository_url = "123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-frontend"
ecs_cluster_name = "jobboard-cluster"
ecs_service_name = "jobboard-service"
rds_endpoint = "jobboard-db.xxxxx.us-east-1.rds.amazonaws.com:5432"
```

**✅ If you see "Apply complete!" - SUCCESS!**

### 5.4 Save Important Values

```powershell
# Save outputs to variables for easy access
$AWS_REGION = (terraform output -raw aws_region)
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$BACKEND_REPO = (terraform output -raw ecr_backend_repository_url)
$FRONTEND_REPO = (terraform output -raw ecr_frontend_repository_url)
$ALB_URL = (terraform output -raw alb_url)
$ECS_CLUSTER = (terraform output -raw ecs_cluster_name)
$ECS_SERVICE = (terraform output -raw ecs_service_name)

# Display them
Write-Host "`n=== IMPORTANT VALUES ===" -ForegroundColor Cyan
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Yellow
Write-Host "AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "Backend ECR: $BACKEND_REPO" -ForegroundColor Green
Write-Host "Frontend ECR: $FRONTEND_REPO" -ForegroundColor Green
Write-Host "ALB URL: $ALB_URL" -ForegroundColor Magenta
Write-Host "ECS Cluster: $ECS_CLUSTER" -ForegroundColor Yellow
Write-Host "ECS Service: $ECS_SERVICE" -ForegroundColor Yellow
Write-Host "========================`n" -ForegroundColor Cyan

#Return to project root
cd ..
```

**Save these values!** You'll need them in next steps.

**✅ Progress: 40% Complete**

---

## Step 6: Build and Push Docker Images (40-50%)

### 6.1 Login to Amazon ECR

**Time: 1 minute**

```powershell
# Login to ECR (replace $AWS_REGION and $AWS_ACCOUNT_ID with your values)
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
```

**Expected output:**
```
Login Succeeded
```

**If login fails:**
- Verify Docker Desktop is running
- Check AWS CLI is configured: `aws sts get-caller-identity`
- Verify region is correct

### 6.2 Build Backend Docker Image

**Time: 3-5 minutes**

```powershell
# Navigate to backend directory
cd backend

Write-Host "`nBuilding backend Docker image..." -ForegroundColor Cyan

# Build the image
docker build -t jobboard-backend:latest .
```

**Expected output:**
```
[+] Building 45.2s (12/12) FINISHED
=> [1/7] FROM docker.io/library/node:18-alpine
=> [2/7] WORKDIR /app
=> [3/7] COPY package*.json ./
=> [4/7] RUN npm install --production
=> [5/7] COPY . .
=> [6/7] EXPOSE 4000
=> [7/7] CMD ["node", "src/app.js"]
=> exporting to image
=> => naming to docker.io/library/jobboard-backend:latest

Successfully built abc123def456
Successfully tagged jobboard-backend:latest
```

### 6.3 Tag and Push Backend Image

```powershell
# Tag for ECR
docker tag jobboard-backend:latest "$BACKEND_REPO:latest"
docker tag jobboard-backend:latest "$BACKEND_REPO:v1.0.0"

Write-Host "`nPushing backend image to ECR..." -ForegroundColor Cyan

# Push to ECR
docker push "$BACKEND_REPO:latest"
docker push "$BACKEND_REPO:v1.0.0"
```

**Expected output:**
```
The push refers to repository [123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-backend]
abcd1234: Pushed
efgh5678: Pushed
...
latest: digest: sha256:abc123... size: 1234
v1.0.0: digest: sha256:abc123... size: 1234
```

```powershell
cd ..  # Return to project root
```

### 6.4 Build Frontend Docker Image

**Time: 3-5 minutes**

```powershell
# Navigate to frontend directory
cd frontend

Write-Host "`nBuilding frontend Docker image..." -ForegroundColor Cyan

# Build the image
docker build -t jobboard-frontend:latest .
```

**Expected output:**
```
[+] Building 78.5s (14/14) FINISHED
=> [1/9] FROM docker.io/library/node:18-alpine
=> [2/9] WORKDIR /app
=> [3/9] COPY package*.json ./
=> [4/9] RUN npm install
=> [5/9] COPY . .
=> [6/9] RUN npm run build
=> [7/9] FROM nginx:alpine
=> [8/9] COPY --from=builder /app/dist /usr/share/nginx/html
=> [9/9] COPY nginx.conf /etc/nginx/conf.d/default.conf
=> exporting to image

Successfully built xyz789ghi012
Successfully tagged jobboard-frontend:latest
```

### 6.5 Tag and Push Frontend Image

```powershell
# Tag for ECR
docker tag jobboard-frontend:latest "$FRONTEND_REPO:latest"
docker tag jobboard-frontend:latest "$FRONTEND_REPO:v1.0.0"

Write-Host "`nPushing frontend image to ECR..." -ForegroundColor Cyan

# Push to ECR
docker push "$FRONTEND_REPO:latest"
docker push "$FRONTEND_REPO:v1.0.0"
```

**Expected output:**
```
The push refers to repository [123456789012.dkr.ecr.us-east-1.amazonaws.com/jobboard-frontend]
latest: digest: sha256:def456... size: 2345
v1.0.0: digest: sha256:def456... size: 2345
```

```powershell
cd ..  # Return to project root
```

### 6.6 Verify Images in ECR

```powershell
# List backend images
aws ecr list-images --repository-name jobboard-backend --region $AWS_REGION

# List frontend images
aws ecr list-images --repository-name jobboard-frontend --region $AWS_REGION
```

**Expected output:**
```json
{
    "imageIds": [
        {
            "imageDigest": "sha256:abc123...",
            "imageTag": "latest"
        },
        {
            "imageDigest": "sha256:abc123...",
            "imageTag": "v1.0.0"
        }
    ]
}
```

**✅ Progress: 50% Complete - Halfway there!** 🎉

---

## Step 7: Deploy Application to ECS (50-60%)

### 7.1 Check Current ECS Service Status

**Time: 1 minute**

```powershell
# Check ECS service
aws ecs describe-services `
  --cluster $ECS_CLUSTER `
  --services $ECS_SERVICE `
  --region $AWS_REGION `
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}'
```

**Expected output:**
```json
{
    "Status": "ACTIVE",
    "Running": 0,
    "Desired": 2,
    "Pending": 0
}
```

**Running is 0** because ECR was empty when Terraform created the service.

### 7.2 Force New Deployment

**Time: 1 minute to start, 8-10 minutes to complete**

```powershell
Write-Host "`nForcing new deployment with updated images..." -ForegroundColor Cyan

# Force ECS to pull the new images and start tasks
aws ecs update-service `
  --cluster $ECS_CLUSTER `
  --service $ECS_SERVICE `
  --force-new-deployment `
  --region $AWS_REGION
```

**Expected output:**
```json
{
    "service": {
        "serviceName": "jobboard-service",
        "status": "ACTIVE",
        "desiredCount": 2,
        "runningCount": 0,
        "pendingCount": 2,
        ...
        "deployments": [
            {
                "status": "PRIMARY",
                "desiredCount": 2,
                "runningCount": 0,
                "pendingCount": 2
            }
        ]
    }
}
```

### 7.3 Wait for Service to Stabilize

**Time: 8-10 minutes**

```powershell
Write-Host "`nWaiting for ECS service to stabilize..." -ForegroundColor Yellow
Write-Host "This takes 8-10 minutes. Containers are starting..." -ForegroundColor Yellow
Write-Host "Feel free to check AWS Console ECS service in another browser tab.`n" -ForegroundColor Gray

# Wait for service to become stable
aws ecs wait services-stable `
  --cluster $ECS_CLUSTER `
  --services $ECS_SERVICE `
  --region $AWS_REGION

Write-Host "`n✅ Service is now STABLE!`n" -ForegroundColor Green
```

**What's happening:**
1. **Minute 0-2**: ECS pulls Docker images from ECR
2. **Minute 2-3**: Containers start, backend connects to RDS
3. **Minute 3-5**: Health checks running (ALB checking if containers respond)
4. **Minute 5-8**: Containers register with target groups
5. **Minute 8**: Service marked as STABLE ✅

**Monitor progress in AWS Console:**
1. Go to AWS Console → ECS → Clusters → jobboard-cluster
2. Click **jobboard-service**
3. Watch **Tasks** tab - you'll see tasks go from PROVISIONING → PENDING → RUNNING
4. Check **Events** tab for real-time status

### 7.4 Verify Tasks are Running

```powershell
# Get running tasks
aws ecs list-tasks `
  --cluster $ECS_CLUSTER `
  --service-name $ECS_SERVICE `
  --desired-status RUNNING `
  --region $AWS_REGION
```

**Expected output:**
```json
{
    "taskArns": [
        "arn:aws:ecs:us-east-1:123456789012:task/jobboard-cluster/abc123",
        "arn:aws:ecs:us-east-1:123456789012:task/jobboard-cluster/def456"
    ]
}
```

You should see **2 task ARNs** (because desired capacity is 2).

### 7.5 Check Task Health

```powershell
# Get detailed task info
$TASK_ARN = (aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $ECS_SERVICE --desired-status RUNNING --region $AWS_REGION --query 'taskArns[0]' --output text)

aws ecs describe-tasks `
  --cluster $ECS_CLUSTER `
  --tasks $TASK_ARN `
  --region $AWS_REGION `
  --query 'tasks[0].{TaskArn:taskArn,Status:lastStatus,Health:healthStatus,Containers:containers[*].{Name:name,Status:lastStatus}}'
```

**Expected output:**
```json
{
    "TaskArn": "arn:aws:ecs:...",
    "Status": "RUNNING",
    "Health": "HEALTHY",
    "Containers": [
        {
            "Name": "backend",
            "Status": "RUNNING"
        },
        {
            "Name": "frontend",
            "Status": "RUNNING"
        }
    ]
}
```

### 7.6 Check ALB Target Health

```powershell
# Get target group ARNs
$FRONTEND_TG_ARN = (aws elbv2 describe-target-groups `
  --region $AWS_REGION `
  --query "TargetGroups[?contains(TargetGroupName, 'frontend')].TargetGroupArn" `
  --output text)

# Check frontend target health
aws elbv2 describe-target-health `
  --target-group-arn $FRONTEND_TG_ARN `
  --region $AWS_REGION `
  --query 'TargetHealthDescriptions[*].{Target:Target.Id,Port:Target.Port,Health:TargetHealth.State}'
```

**Expected output:**
```json
[
    {
        "Target": "i-abc123def456",
        "Port": 32768,
        "Health": "healthy"
    },
    {
        "Target": "i-ghi789jkl012",
        "Port": 32769,
        "Health": "healthy"
    }
]
```

**All targets should show "healthy"!** ✅

**✅ Progress: 60% Complete**

---

## Step 8: Initialize Database (60-65%)

### 8.1 Understanding Database Setup

Your RDS PostgreSQL database needs:
1. **Tables created** (schema)
2. **Sample data loaded** (optional but helpful)

The backend has a `seed.js` file that creates tables and adds sample data.

### 8.2 Option A: Run Seed Script via ECS Exec (Recommended)

**Time: 5 minutes**

First, enable ECS Exec on your service:

```powershell
Write-Host "`nEnabling ECS Exec for database seeding..." -ForegroundColor Cyan

# Enable execute command
aws ecs update-service `
  --cluster $ECS_CLUSTER `
  --service $ECS_SERVICE `
  --enable-execute-command `
  --region $AWS_REGION `
  --force-new-deployment

# Wait for service to update (30 seconds)
Write-Host "Waiting 60 seconds for service to update..." -ForegroundColor Yellow
Start-Sleep -Seconds 60
```

Get a fresh task ARN:

```powershell
# Get the newest task
$TASK_ARN = (aws ecs list-tasks `
  --cluster $ECS_CLUSTER `
  --service-name $ECS_SERVICE `
  --desired-status RUNNING `
  --region $AWS_REGION `
  --query 'taskArns[0]' `
  --output text)

Write-Host "Task ARN: $TASK_ARN" -ForegroundColor Gray
```

Execute seed script:

```powershell
Write-Host "`nExecuting database seed script..." -ForegroundColor Cyan

# Run seed script inside backend container
aws ecs execute-command `
  --cluster $ECS_CLUSTER `
  --task $TASK_ARN `
  --container backend `
  --interactive `
  --command "node src/seed.js" `
  --region $AWS_REGION
```

**Expected output:**
```
Starting session with SessionId: ecs-execute-command-abc123...

Connecting to database...
✓ Connected to database
Creating tables...
✓ Tables created
Seeding users...
✓ Added 5 users
Seeding jobs...
✓ Added 20 jobs
✓ Database seeded successfully!

Exiting session with sessionId: ecs-execute-command-abc123
```

**✅ If you see "Database seeded successfully!" - SUCCESS!**

### 8.3 Option B: Run Seed as One-Time ECS Task

Alternative method if Option A doesn't work:

```powershell
# Get task definition ARN
$TASK_DEF_ARN = (aws ecs describe-task-definition `
  --task-definition jobboard-task `
  --region $AWS_REGION `
  --query 'taskDefinition.taskDefinitionArn' `
  --output text)

# Run one-time task
aws ecs run-task `
  --cluster $ECS_CLUSTER `
  --task-definition $TASK_DEF_ARN `
  --count 1 `
  --region $AWS_REGION `
  --overrides '{
    "containerOverrides": [
      {
        "name": "backend",
        "command": ["node", "src/seed.js"]
      }
    ]
  }'

# Wait 30 seconds for task to complete
Start-Sleep -Seconds 30

# Check CloudWatch Logs for seed output
aws logs tail /ecs/jobboard --follow --filter-pattern "backend" --since 2m --region $AWS_REGION
```

### 8.4 Verify Database Tables

To verify tables were created, you can check the logs:

```powershell
# View recent backend logs
aws logs tail /ecs/jobboard `
  --follow `
  --filter-pattern "backend" `
  --since 5m `
  --region $AWS_REGION
```

Look for logs showing:
- Database connection successful
- Tables created
- Sample data inserted

**✅ Progress: 65% Complete**

---

## Step 9: Setup CI/CD Pipeline (65-80%)

**Time: 30-40 minutes**

This section sets up automated deployments. Every time you push code, it will automatically build and deploy!

### 9.1 Create CodeCommit Repository (Or Use GitHub)

**Using CodeCommit:**

```powershell
# Create repository
aws codecommit create-repository `
  --repository-name jobboard `
  --repository-description "JobBoard Application" `
  --region $AWS_REGION

# Get clone URL
$REPO_URL = (aws codecommit get-repository `
  --repository-name jobboard `
  --region $AWS_REGION `
  --query 'repositoryMetadata.cloneUrlHttp' `
  --output text)

Write-Host "`nRepository created: $REPO_URL" -ForegroundColor Green
```

**Configure Git credentials:**

```powershell
git config --global credential.helper "!aws codecommit credential-helper $@"
git config --global credential.UseHttpPath true
```

**Push code to CodeCommit:**

```powershell
# Initialize git if not already
git init

# Add CodeCommit as remote
git remote add codecommit $REPO_URL

# Create .gitignore
@"
node_modules/
.env
*.log
terraform/.terraform/
terraform/*.tfstate
terraform/*.tfstate.backup
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Commit and push
git add .
git commit -m "Initial commit - JobBoard application"
git push codecommit main
```

**See detailed CI/CD setup:** Refer to [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) for complete step-by-step instructions on:
- Creating IAM roles for CodeBuild, CodeDeploy, CodePipeline
- Setting up CodeBuild project
- Configuring CodeDeploy application
- Creating CodePipeline

**For this guide, we'll assume you've followed the CI/CD setup OR you'll deploy manually.**

**✅ Progress: 80% Complete if using manual deployment**
**✅ Progress: 80% Complete if CI/CD is fully configured**

---

## Step 10: Testing and Verification (80-90%)

### 10.1 Get Application URL

```powershell
Write-Host "`n=== YOUR APPLICATION URL ===" -ForegroundColor Cyan
Write-Host "$ALB_URL" -ForegroundColor Green
Write-Host "============================`n" -ForegroundColor Cyan
```

### 10.2 Test Frontend Access

```powershell
# Open in browser
Start-Process $ALB_URL

# Or test with PowerShell
$response = Invoke-WebRequest -Uri $ALB_URL -UseBasicParsing
Write-Host "Frontend Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) {"Green"} else {"Red"})
```

**Expected:** Browser opens showing the JobBoard React application

### 10.3 Test Backend API

```powershell
# Test health endpoint
$healthResponse = Invoke-WebRequest -Uri "$ALB_URL/api/health" -UseBasicParsing
Write-Host "Backend Health: $($healthResponse.Content)" -ForegroundColor Green

# Test jobs endpoint
$jobsResponse = Invoke-WebRequest -Uri "$ALB_URL/api/jobs" -UseBasicParsing
Write-Host "`nJobs API Response:" -ForegroundColor Cyan
$jobsResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**Expected output:**
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": "New York, NY",
      "description": "...",
      "created_at": "2026-02-20T..."
    },
    ...
  ]
}
```

### 10.4 Test User Registration (via Browser)

1. Open `$ALB_URL` in browser
2. Click **Sign Up** or **Register**
3. Fill in:
   - **Email**: test@example.com
   - **Password**: Test123456
   - **Role**: Job Seeker
4. Click **Submit**
5. You should be redirected to dashboard

### 10.5 View Application Logs

```powershell
# View live logs
Write-Host "`nTailing application logs (Ctrl+C to stop)..." -ForegroundColor Yellow

aws logs tail /ecs/jobboard `
  --follow `
  --region $AWS_REGION
```

**You should see:**
- Backend API requests
- Database queries
- Frontend access logs

### 10.6 Check ECS Service Metrics

```powershell
# Get service status
aws ecs describe-services `
  --cluster $ECS_CLUSTER `
  --services $ECS_SERVICE `
  --region $AWS_REGION `
  --query 'services[0].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount,Events:events[0:3]}'
```

**✅ Progress: 90% Complete - Almost done!**

---

## Step 11: Monitoring and Alarms (90-95%)

### 11.1 View CloudWatch Metrics

**Via AWS Console:**

1. Go to **CloudWatch** → **Dashboards**
2. (Optional) Create custom dashboard:
   - Click **Create dashboard**
   - Name: `JobBoard-Dashboard`
   - Add widgets for:
     - ECS CPU Utilization
     - ECS Memory Utilization
     - ALB Target Response Time
     - RDS CPU Utilization
     - RDS Connections

**Via CLI:**

```powershell
# Get ECS CPU metrics
aws cloudwatch get-metric-statistics `
  --namespace AWS/ECS `
  --metric-name CPUUtilization `
  --dimensions Name=ServiceName,Value=$ECS_SERVICE Name=ClusterName,Value=$ECS_CLUSTER `
  --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 300 `
  --statistics Average `
  --region $AWS_REGION
```

### 11.2 Create CloudWatch Alarms

**High CPU Alarm:**

```powershell
aws cloudwatch put-metric-alarm `
  --alarm-name jobboard-high-cpu `
  --alarm-description "Alert when ECS CPU is high" `
  --metric-name CPUUtilization `
  --namespace AWS/ECS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --dimensions Name=ServiceName,Value=$ECS_SERVICE Name=ClusterName,Value=$ECS_CLUSTER `
  --region $AWS_REGION
```

**High Memory Alarm:**

```powershell
aws cloudwatch put-metric-alarm `
  --alarm-name jobboard-high-memory `
  --alarm-description "Alert when ECS Memory is high" `
  --metric-name MemoryUtilization `
  --namespace AWS/ECS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --dimensions Name=ServiceName,Value=$ECS_SERVICE Name=ClusterName,Value=$ECS_CLUSTER `
  --region $AWS_REGION
```

**✅ Progress: 95% Complete**

---

## Step 12: Final Optimization (95-100%)

### 12.1 Review Security Groups

```powershell
# List security groups
aws ec2 describe-security-groups `
  --filters "Name=tag:Name,Values=*jobboard*" `
  --region $AWS_REGION `
  --query 'SecurityGroups[*].{Name:GroupName,ID:GroupId,Description:Description}'
```

**Verify:**
- ALB security group allows HTTP (port 80) from 0.0.0.0/0
- ECS security group allows traffic from ALB
- RDS security group allows traffic from ECS only

### 12.2 Enable Auto Scaling (Optional)

```powershell
# Create auto scaling target
aws application-autoscaling register-scalable-target `
  --service-namespace ecs `
  --scalable-dimension ecs:service:DesiredCount `
  --resource-id service/$ECS_CLUSTER/$ECS_SERVICE `
  --min-capacity 2 `
  --max-capacity 6 `
  --region $AWS_REGION

# Create scaling policy (scale on CPU)
aws application-autoscaling put-scaling-policy `
  --service-namespace ecs `
  --scalable-dimension ecs:service:DesiredCount `
  --resource-id service/$ECS_CLUSTER/$ECS_SERVICE `
  --policy-name jobboard-cpu-scaling `
  --policy-type TargetTrackingScaling `
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }' `
  --region $AWS_REGION
```

### 12.3 Document Your Deployment

Create a deployment info file:

```powershell
@"""
# JobBoard Deployment Information

**Deployment Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## AWS Resources

- **Region:** $AWS_REGION
- **Account ID:** $AWS_ACCOUNT_ID
- **Application URL:** $ALB_URL

## ECS Details

- **Cluster:** $ECS_CLUSTER
- **Service:** $ECS_SERVICE
- **Desired Tasks:** 2
- **Instance Type:** t3.small

## Database

- **Engine:** PostgreSQL
- **Instance Class:** db.t3.micro
- **Storage:** 20GB

## Container Images

- **Backend ECR:** $BACKEND_REPO
- **Frontend ECR:** $FRONTEND_REPO

## Monitoring

- **CloudWatch Logs:** /ecs/jobboard
- **Metrics Dashboard:** https://console.aws.amazon.com/cloudwatch/

## Cost Estimate

- **Monthly:** ~$109/month
- **Daily:** ~$3.60/day
- **Hourly:** ~$0.15/hour

## Cleanup Command

```powershell
cd terraform
terraform destroy -auto-approve
```

## Notes

- Free tier eligible for first 12 months
- Remember to stop resources when not in use to save costs
- Monitor CloudWatch for any issues
"""@ | Out-File -FilePath DEPLOYMENT_INFO.md -Encoding UTF8

Write-Host "`n✅ Deployment information saved to DEPLOYMENT_INFO.md" -ForegroundColor Green
```

### 12.4 Final Verification Checklist

```powershell
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT COMPLETION CHECKLIST" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$checks = @(
    @{Name="AWS Account Created"; Command={aws sts get-caller-identity}},
    @{Name="Terraform Infrastructure Deployed"; Command={Test-Path terraform/terraform.tfstate}},
    @{Name="Docker Images in ECR"; Command={aws ecr describe-images --repository-name jobboard-backend --region $AWS_REGION}},
    @{Name="ECS Tasks Running"; Command={aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query 'services[0].runningCount'}},
    @{Name="Application Accessible"; Command={Invoke-WebRequest -Uri $ALB_URL -UseBasicParsing -TimeoutSec 5}}
)

foreach ($check in $checks) {
    try {
        $result = & $check.Command 2>&1
        if ($LASTEXITCODE -eq 0 -or $result) {
            Write-Host "✅ $($check.Name)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($check.Name)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($check.Name)" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "          🎉 DEPLOYMENT COMPLETE! 🎉" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nYour application is live at:" -ForegroundColor Yellow
Write-Host "$ALB_URL" -ForegroundColor Cyan
Write-Host "`n============================================`n" -ForegroundColor Cyan
```

**✅✅✅ Progress: 100% COMPLETE! ✅✅✅**

---

## Troubleshooting

### Issue 1: ECS Tasks Not Starting

**Symptoms:**
- Tasks stuck in PENDING
- Tasks repeatedly stopping

**Solutions:**

```powershell
# Check task stopped reason
aws ecs describe-tasks `
  --cluster $ECS_CLUSTER `
  --tasks $(aws ecs list-tasks --cluster $ECS_CLUSTER --desired-status STOPPED --region $AWS_REGION --query 'taskArns[0]' --output text) `
  --region $AWS_REGION `
  --query 'tasks[0].{StoppedReason:stoppedReason,Containers:containers[*].{Name:name,Reason:reason}}'

# Check CloudWatch logs
aws logs tail /ecs/jobboard --since 30m --region $AWS_REGION
```

**Common fixes:**
1. **Image pull errors**: Verify ECR images exist
2. **Memory errors**: Increase container memory in `terraform/variables.tf`
3. **Database connection**: Check security groups and RDS status

### Issue 2: Application Returns 502/503 Errors

**Symptoms:**
- ALB URL shows "502 Bad Gateway" or "503 Service Unavailable"

**Solutions:**

```powershell
# Check target health
$FRONTEND_TG_ARN = (aws elbv2 describe-target-groups --names jobboard-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION)

aws elbv2 describe-target-health `
  --target-group-arn $FRONTEND_TG_ARN `
  --region $AWS_REGION
```

**If targets are unhealthy:**
1. Check security groups allow ALB → ECS traffic
2. Verify containers are listening on correct ports
3. Check health check path in target group settings

### Issue 3: RDS Connection Errors

**Symptoms:**
- Backend logs show "ECONNREFUSED" or "timeout"

**Solutions:**

```powershell
# Verify RDS is available
aws rds describe-db-instances `
  --db-instance-identifier jobboard-db `
  --region $AWS_REGION `
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'

# Check security groups
aws ec2 describe-security-groups `
  --filters "Name=tag:Name,Values=*rds*" `
  --region $AWS_REGION
```

**Fixes:**
1. Ensure RDS security group allows port 5432 from ECS security group
2. Verify database credentials in Secrets Manager
3. Check RDS is in same VPC as ECS

### Issue 4: Terraform Apply Fails

**Symptoms:**
- Error during `terraform apply`

**Solutions:**

```powershell
# Check Terraform state
terraform show

# If state is corrupted, refresh:
terraform refresh

# If specific resource fails, target it:
terraform apply -target=aws_ecs_service.main

# View detailed errors:
$env:TF_LOG="DEBUG"
terraform apply
```

### Issue 5: Docker Build Fails

**Symptoms:**
- "docker build" command fails

**Solutions:**

1. **Check Docker is running:**
```powershell
docker ps
# If this fails, start Docker Desktop
```

2. **Check Dockerfile syntax:**
```powershell
# Backend
cat backend/Dockerfile

# Frontend  
cat frontend/Dockerfile
```

3. **Clear Docker cache:**
```powershell
docker system prune -a
```

### Issue 6: High AWS Costs

**Symptoms:**
- Unexpected billing

**Solutions:**

```powershell
# Check running resources
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --region $AWS_REGION
aws rds describe-db-instances --query 'DBInstances[*].{ID:DBInstanceIdentifier,Status:DBInstanceStatus}' --region $AWS_REGION

# Stop RDS (saves ~50% costs)
aws rds stop-db-instance --db-instance-identifier jobboard-db --region $AWS_REGION

# Scale down ECS
aws autoscaling update-auto-scaling-group `
  --auto-scaling-group-name jobboard-ecs-asg `
  --min-size 0 `
  --desired-capacity 0 `
  --region $AWS_REGION
```

### Issue 7: Cannot Access Application

**Symptoms:**
- URL doesn't load

**Solutions:**

1. **Check ALB DNS:**
```powershell
nslookup $ALB_URL
```

2. **Verify security group:**
```powershell
# ALB security group should allow port 80 from 0.0.0.0/0
aws ec2 describe-security-groups `
  --filters "Name=tag:Name,Values=*alb*" `
  --region $AWS_REGION `
  --query 'SecurityGroups[0].IpPermissions'
```

3. **Check ALB listener:**
```powershell
aws elbv2 describe-listeners `
  --load-balancer-arn $(aws elbv2 describe-load-balancers --names jobboard-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $AWS_REGION) `
  --region $AWS_REGION
```

### Getting Help

1. **Check CloudWatch Logs** - Most errors appear here
2. **AWS Service Health Dashboard** - Check for outages
3. **Review AWS documentation** - Service-specific guides
4. **Stack Overflow** - Search for specific error messages

---

## Cleanup

### Option 1: Stop Resources (Keeps Data, Reduces Costs)

**Stops ECS and RDS but keeps infrastructure:**

```powershell
# Stop ECS tasks (scale to 0)
aws autoscaling update-auto-scaling-group `
  --auto-scaling-group-name jobboard-ecs-asg `
  --min-size 0 `
  --max-size 0 `
  --desired-capacity 0 `
  --region $AWS_REGION

# Stop RDS
aws rds stop-db-instance `
  --db-instance-identifier jobboard-db `
  --region $AWS_REGION

Write-Host "`n✅ Resources stopped. You can restart them anytime." -ForegroundColor Green
Write-Host "Monthly cost reduced to ~$20 (ALB, NAT Gateway, storage)" -ForegroundColor Yellow
```

**To restart:**

```powershell
# Restart RDS
aws rds start-db-instance --db-instance-identifier jobboard-db --region $AWS_REGION

# Scale ECS back up
aws autoscaling update-auto-scaling-group `
  --auto-scaling-group-name jobboard-ecs-asg `
  --min-size 1 `
  --max-size 4 `
  --desired-capacity 2 `
  --region $AWS_REGION
```

### Option 2: Destroy Everything (Deletes All Resources)

**⚠️ WARNING: This is irreversible! All data will be lost!**

```powershell
# Navigate to terraform directory
cd terraform

# Preview what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy
```

You'll be prompted:
```
Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value:
```

Type **`yes`** to confirm.

**Destruction takes 10-15 minutes:**
```
aws_ecs_service.main: Destroying... [id=arn:aws:ecs:...]
aws_ecs_service.main: Still destroying... [10s elapsed]
...
aws_rds_instance.main: Destroying...
aws_rds_instance.main: Still destroying... [5m elapsed]
...
Destroy complete! Resources: 45 destroyed.
```

**✅ All resources deleted. Your AWS account is clean.**

### Option 3: Delete Specific Resources

**Delete just the ECR images (frees storage):**

```powershell
# Delete all backend images
aws ecr batch-delete-image `
  --repository-name jobboard-backend `
  --image-ids imageTag=latest imageTag=v1.0.0 `
  --region $AWS_REGION

# Delete all frontend images
aws ecr batch-delete-image `
  --repository-name jobboard-frontend `
  --image-ids imageTag=latest imageTag=v1.0.0 `
  --region $AWS_REGION
```

**Delete CloudWatch logs (frees storage):**

```powershell
aws logs delete-log-group --log-group-name /ecs/jobboard --region $AWS_REGION
aws logs delete-log-group --log-group-name /aws/codebuild/jobboard-build --region $AWS_REGION
```

### Post-Cleanup Verification

```powershell
# Verify no EC2 instances running
aws ec2 describe-instances `
  --filters "Name=instance-state-name,Values=running" `
  --region $AWS_REGION

# Verify no RDS instances
aws rds describe-db-instances --region $AWS_REGION

# Verify no load balancers
aws elbv2 describe-load-balancers --region $AWS_REGION

# Check current month's costs
aws ce get-cost-and-usage `
  --time-period Start=$(Get-Date -Format "yyyy-MM-01"),End=$(Get-Date -Format "yyyy-MM-dd") `
  --granularity MONTHLY `
  --metrics BlendedCost
```

---

## Reference

### Quick Commands Cheat Sheet

```powershell
# === DEPLOYMENT ===
# Deploy infrastructure
cd terraform; terraform apply; cd ..

# Build and push images
cd backend; docker build -t backend .; docker push $BACKEND_REPO:latest; cd ..
cd frontend; docker build -t frontend .; docker push $FRONTEND_REPO:latest; cd ..

# Update ECS service
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION

# === MONITORING ===
# View logs
aws logs tail /ecs/jobboard --follow --region $AWS_REGION

# Check service status
aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION

# Check task status
aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $ECS_SERVICE --region $AWS_REGION

# Check target health
aws elbv2 describe-target-health --target-group-arn $FRONTEND_TG_ARN --region $AWS_REGION

# === DATABASE ===
# Get DB password
aws secretsmanager get-secret-value --secret-id jobboard/db-password --region $AWS_REGION --query 'SecretString' --output text

# Stop RDS
aws rds stop-db-instance --db-instance-identifier jobboard-db --region $AWS_REGION

# Start RDS
aws rds start-db-instance --db-instance-identifier jobboard-db --region $AWS_REGION

# === CLEANUP ===
# Stop all (keep infrastructure)
aws autoscaling update-auto-scaling-group --auto-scaling-group-name jobboard-ecs-asg --desired-capacity 0 --region $AWS_REGION
aws rds stop-db-instance --db-instance-identifier jobboard-db --region $AWS_REGION

# Destroy everything
cd terraform; terraform destroy; cd ..
```

### Project File Structure

```
jobboard/
├── backend/
│   ├── Dockerfile              ← Backend container definition
│   ├── package.json            ← Backend dependencies
│   ├── seed-db.js              ← Database seeding script
│   └── src/
│       ├── app.js              ← Main backend application
│       ├── seed.js             ← Seed script
│       ├── models/             ← Database models
│       └── routes/             ← API routes
├── frontend/
│   ├── Dockerfile              ← Frontend container definition
│   ├── nginx.conf              ← Nginx configuration
│   ├── package.json            ← Frontend dependencies
│   ├── vite.config.js          ← Vite build configuration
│   └── src/
│       ├── App.jsx             ← Main React component
│       ├── main.jsx            ← React entry point
│       └── pages/              ← Page components
├── terraform/
│   ├── provider.tf             ← AWS provider configuration
│   ├── variables.tf            ← Input variables
│   ├── outputs.tf              ← Output values
│   ├── vpc.tf                  ← VPC and networking
│   ├── security_groups.tf      ← Security groups
│   ├── iam.tf                  ← IAM roles and policies
│   ├── ecr.tf                  ← Container registries
│   ├── secrets.tf              ← Secrets Manager
│   ├── rds.tf                  ← Database
│   ├── cloudwatch.tf           ← Logging
│   ├── alb.tf                  ← Load balancer
│   └── ecs.tf                  ← ECS cluster and service
├── buildspec.yml               ← CodeBuild configuration
├── appspec.yaml                ← CodeDeploy configuration
├── taskdef.json                ← ECS task definition template
├── deploy.ps1                  ← PowerShell deployment script
├── CICD_SETUP_GUIDE.md         ← CI/CD pipeline guide
├── DEPLOYMENT_INFO.md          ← Your deployment details
└── README.md                   ← This file
```

### Environment Variables

**Backend (.env for local):**
```
PORT=4000
NODE_ENV=production
DB_HOST=<rds-endpoint>
DB_NAME=jobboard
DB_USER=postgres
DB_PASSWORD=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
```

**Frontend (built into Docker image):**
```
VITE_API_URL=http://<alb-url>/api
```

### AWS Resources Created

| Resource | Name/Pattern | Purpose |
|----------|-------------|---------|
| **VPC** | jobboard-vpc | Network isolation |
| **Subnets** | jobboard-public-* | Public resources (ALB, NAT) |
| **Subnets** | jobboard-private-* | Private resources (RDS) |
| **Internet Gateway** | jobboard-igw | Internet access |
| **NAT Gateway** | jobboard-nat | Outbound internet for private subnets |
| **Security Group** | jobboard-alb-sg | ALB firewall rules |
| **Security Group** | jobboard-ecs-sg | ECS firewall rules |
| **Security Group** | jobboard-rds-sg | RDS firewall rules |
| **ALB** | jobboard-alb | Load balancer |
| **Target Group** | jobboard-frontend-tg | Frontend targets |
| **Target Group** | jobboard-backend-tg | Backend targets |
| **ECS Cluster** | jobboard-cluster | Container orchestration |
| **ECS Service** | jobboard-service | Service definition |
| **ECS Task Definition** | jobboard-task | Container specs |
| **Auto Scaling Group** | jobboard-ecs-asg | EC2 scaling |
| **Launch Template** | jobboard-ecs-lt | EC2 configuration |
| **RDS Instance** | jobboard-db | PostgreSQL database |
| **ECR Repository** | jobboard-backend | Backend images |
| **ECR Repository** | jobboard-frontend | Frontend images |
| **CloudWatch Log Group** | /ecs/jobboard | Application logs |
| **Secrets Manager** | jobboard/db-password | Database password |
| **Secrets Manager** | jobboard/jwt-secret | JWT secret |
| **IAM Role** | ecsTaskExecutionRole | ECS task execution |
| **IAM Role** | ecsTaskRole | ECS task permissions |
| **IAM Role** | ecsInstanceRole | EC2 instance permissions |

### Costs Breakdown (Monthly)

| Component | Details | Cost |
|-----------|---------|------|
| **EC2** | 2x t3.small (730 hrs) | $30.37 |
| **EBS** | 60GB gp3 (@$0.08/GB) | $4.80 |
| **RDS** | db.t3.micro (730 hrs) | $12.41 |
| **RDS Storage** | 20GB gp3 (@$0.115/GB) | $2.30 |
| **ALB** | Fixed + LCU | $16.20 + $1.80 |
| **NAT Gateway** | Fixed + data | $32.40 + $2.70 |
| **ECR** | 10GB storage (@$0.10/GB) | $1.00 |
| **CloudWatch Logs** | 5GB (@$0.50/GB) | $2.50 |
| **S3** | Negligible | $0.50 |
| **Secrets Manager** | 2 secrets (@$0.40) | $0.80 |
| **Data Transfer** | 5GB out (@$0.09/GB) | $0.45 |
| **TOTAL** | | **~$108.23/month** |

**Free Tier Savings (first 12 months):**
- 750 hrs t2.micro/t3.micro EC2: -$6.21
- 750 hrs db.t2.micro RDS: -$10.95
- 750 hrs ALB: -$16.20
- **New Total:** ~$75/month

**Cost per day:** ~$3.60
**Cost per hour:** ~$0.15

### AWS Service Limits to Monitor

- **EC2 Instances**: Default limit 20 per region
- **ECS Tasks**: Default limit 500 per region
- **RDS Instances**: Default limit 40 per region
- **VPCs**: Default limit 5 per region
- **Elastic IPs**: Default limit 5 per region

### Useful Links

- **AWS Console**: https://console.aws.amazon.com/
- **Terraform Registry**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **Docker Hub**: https://hub.docker.com/
- **AWS Free Tier**: https://aws.amazon.com/free/
- **AWS Pricing Calculator**: https://calculator.aws/
- **AWS Service Health**: https://status.aws.amazon.com/

### Support and Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Terraform Documentation**: https://www.terraform.io/docs/
- **Docker Documentation**: https://docs.docker.com/
- **AWS Support**: Create case in AWS Console
- **Community**: Stack Overflow, AWS Forums

---

## Success Checklist

Before considering your deployment complete, verify:

- [ ] ✅ AWS account created and IAM user configured
- [ ] ✅ All prerequisites installed (Git, Node.js, Docker, AWS CLI, Terraform)
- [ ] ✅ AWS CLI configured with valid credentials
- [ ] ✅ Terraform initialized and infrastructure deployed
- [ ] ✅ All Terraform outputs displayed correctly
- [ ] ✅ Docker images built successfully
- [ ] ✅ Images pushed to ECR repositories
- [ ] ✅ ECS service updated and running
- [ ] ✅ Tasks showing as RUNNING (2 tasks)
- [ ] ✅ ALB target groups showing healthy targets
- [ ] ✅ Database seeded with sample data
- [ ] ✅ Application accessible via ALB URL
- [ ] ✅ Frontend loads in browser
- [ ] ✅ Backend API responds to requests
- [ ] ✅ User registration/login works
- [ ] ✅ CloudWatch logs visible
- [ ] ✅ Cost monitoring enabled
- [ ] ✅ Backup and disaster recovery plan documented

---

## Final Notes

### What You've Accomplished

Congratulations! You've successfully:

1. ✅ Created AWS account and configured IAM
2. ✅ Installed and configured all development tools
3. ✅ Deployed complete AWS infrastructure using Terraform
4. ✅ Built and deployed containerized applications
5. ✅ Set up load balancing and auto-scaling
6. ✅ Configured database with automated backups
7. ✅ Established monitoring and logging
8. ✅ Implemented security best practices
9. ✅ (Optional) Set up CI/CD pipeline

### Next Steps

1. **Domain and SSL**: Add custom domain and HTTPS
2. **CI/CD**: Complete pipeline setup (see CICD_SETUP_GUIDE.md)
3. **Monitoring**: Set up comprehensive dashboards
4. **Security**: Implement WAF, VPC Flow Logs
5. **Backup**: Configure RDS snapshots and S3 backups
6. **Performance**: Tune database, enable caching
7. **Scaling**: Test auto-scaling policies
8. **Documentation**: Document your customizations

### Best Practices Reminder

- 🔒 Never commit secrets to Git
- 💰 Monitor AWS costs daily
- 📊 Check CloudWatch logs regularly
- 🔄 Always test changes in dev first
- 💾 Regular database backups
- 🔐 Rotate credentials periodically
- 📝 Document all changes
- 🧪 Implement automated testing

---

**🎉 Congratulations on completing the deployment! 🎉**

**Your JobBoard application is now live on AWS with enterprise-grade infrastructure!**

**Questions? Issues? Check the Troubleshooting section or review CloudWatch logs.**

---

*Last Updated: February 20, 2026*  
*Guide Version: 2.0*  
*Terraform Version: ≥1.0*  
*AWS Provider Version: ≥5.0*

### Step 1.3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Return to root
cd ..
```

### Step 1.4: Set Up Local Environment Variables

Create `.env` file in the backend directory:

```bash
# Create .env file
cd backend
cat > .env << EOF
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobboard
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-super-secret-jwt-key-change-this
EOF
cd ..
```

### Step 1.5: Test Dockerfiles Locally (Optional)

```bash
# Test backend Docker build
cd backend
docker build -t jobboard-backend:local .
cd ..

# Test frontend Docker build
cd frontend
docker build -t jobboard-frontend:local .
cd ..
```

---

## Part 2: AWS Account Preparation

### Step 2.1: Install and Configure AWS CLI

```bash
# Verify AWS CLI installation
aws --version

# Configure AWS CLI with your credentials
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

**To get AWS credentials:**
1. Log into AWS Console
2. Navigate to IAM → Users → Your Username
3. Click "Security credentials" tab
4. Click "Create access key"
5. Download and save the credentials

### Step 2.2: Set Environment Variables

```bash
# For Linux/Mac
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# For Windows PowerShell
$env:AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$env:AWS_REGION = "us-east-1"
```

### Step 2.3: Verify AWS Access

```bash
# Verify your AWS identity
aws sts get-caller-identity

# List available regions
aws ec2 describe-regions --output table
```

---

## Part 3: AWS Infrastructure Setup

### Step 3.1: Create VPC and Networking

#### Option A: Use Default VPC (Easier for beginners)

```bash
# Get your default VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

# Save the VPC ID
export VPC_ID=<your-vpc-id>
```

#### Option B: Create New VPC (Recommended for production)

```bash
# Create VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=jobboard-vpc}]' \
    --region $AWS_REGION

# Save the VPC ID from output
export VPC_ID=<vpc-id-from-output>

# Create Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=jobboard-igw}]' \
    --region $AWS_REGION

# Save IGW ID
export IGW_ID=<igw-id-from-output>

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID \
    --region $AWS_REGION

# Create Public Subnet 1 (us-east-1a)
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=jobboard-public-1a}]' \
    --region $AWS_REGION

# Save Subnet ID
export SUBNET_1=<subnet-id-from-output>

# Create Public Subnet 2 (us-east-1b)
aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=jobboard-public-1b}]' \
    --region $AWS_REGION

# Save Subnet ID
export SUBNET_2=<subnet-id-from-output>

# Create route table
aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=jobboard-public-rt}]' \
    --region $AWS_REGION

# Save Route Table ID
export RT_ID=<route-table-id-from-output>

# Create route to Internet Gateway
aws ec2 create-route \
    --route-table-id $RT_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID \
    --region $AWS_REGION

# Associate route table with subnets
aws ec2 associate-route-table \
    --subnet-id $SUBNET_1 \
    --route-table-id $RT_ID \
    --region $AWS_REGION

aws ec2 associate-route-table \
    --subnet-id $SUBNET_2 \
    --route-table-id $RT_ID \
    --region $AWS_REGION
```

#### Get Subnet IDs (if using default VPC)

```bash
# List subnets in your VPC
aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]" \
    --output table

# Pick two subnets in different availability zones
export SUBNET_1=<subnet-id-1>
export SUBNET_2=<subnet-id-2>
```

### Step 3.2: Create Security Groups

```bash
# Create ALB Security Group
aws ec2 create-security-group \
    --group-name jobboard-alb-sg \
    --description "Security group for JobBoard ALB" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save ALB SG ID
export ALB_SG_ID=<sg-id-from-output>

# Allow HTTP traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Allow HTTPS traffic to ALB (optional)
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION

# Create ECS Security Group
aws ec2 create-security-group \
    --group-name jobboard-ecs-sg \
    --description "Security group for JobBoard ECS tasks" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save ECS SG ID
export ECS_SG_ID=<sg-id-from-output>

# Allow traffic from ALB to ECS on port 80
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 80 \
    --source-group $ALB_SG_ID \
    --region $AWS_REGION

# Allow traffic from ALB to ECS on port 4000 (backend)
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 4000 \
    --source-group $ALB_SG_ID \
    --region $AWS_REGION

# Create RDS Security Group
aws ec2 create-security-group \
    --group-name jobboard-rds-sg \
    --description "Security group for JobBoard RDS" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION

# Save RDS SG ID
export RDS_SG_ID=<sg-id-from-output>

# Allow PostgreSQL traffic from ECS to RDS
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $ECS_SG_ID \
    --region $AWS_REGION
```

### Step 3.3: Create RDS PostgreSQL Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name jobboard-db-subnet-group \
    --db-subnet-group-description "Subnet group for JobBoard database" \
    --subnet-ids $SUBNET_1 $SUBNET_2 \
    --region $AWS_REGION

# Generate a strong password
export DB_PASSWORD=$(openssl rand -base64 32)
echo "Database Password: $DB_PASSWORD"
# SAVE THIS PASSWORD SECURELY!

# Create RDS instance (this takes 5-10 minutes)
aws rds create-db-instance \
    --db-instance-identifier jobboard-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 14.7 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name jobboard-db-subnet-group \
    --db-name jobboard \
    --backup-retention-period 7 \
    --publicly-accessible false \
    --storage-encrypted \
    --region $AWS_REGION

# Wait for RDS to be available (check status)
aws rds wait db-instance-available \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION

# Get RDS endpoint
export RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier jobboard-db \
    --query "DBInstances[0].Endpoint.Address" \
    --output text \
    --region $AWS_REGION)

echo "RDS Endpoint: $RDS_ENDPOINT"
```

### Step 3.4: Create Secrets in AWS Secrets Manager

```bash
# Generate JWT secret
export JWT_SECRET=$(openssl rand -base64 64)
echo "JWT Secret: $JWT_SECRET"

# Store database password in Secrets Manager
aws secretsmanager create-secret \
    --name jobboard/db-password \
    --description "JobBoard database password" \
    --secret-string "$DB_PASSWORD" \
    --region $AWS_REGION

# Store JWT secret in Secrets Manager
aws secretsmanager create-secret \
    --name jobboard/jwt-secret \
    --description "JobBoard JWT secret" \
    --secret-string "$JWT_SECRET" \
    --region $AWS_REGION

# Verify secrets were created
aws secretsmanager list-secrets \
    --query "SecretList[?starts_with(Name, 'jobboard/')].Name" \
    --output table \
    --region $AWS_REGION
```

### Step 3.5: Create ECR Repositories

```bash
# Create backend repository
aws ecr create-repository \
    --repository-name jobboard-backend \
    --image-scanning-configuration scanOnPush=true \
    --region $AWS_REGION

# Save backend repository URI
export BACKEND_REPO_URI=$(aws ecr describe-repositories \
    --repository-names jobboard-backend \
    --query "repositories[0].repositoryUri" \
    --output text \
    --region $AWS_REGION)

echo "Backend Repository: $BACKEND_REPO_URI"

# Create frontend repository
aws ecr create-repository \
    --repository-name jobboard-frontend \
    --image-scanning-configuration scanOnPush=true \
    --region $AWS_REGION

# Save frontend repository URI
export FRONTEND_REPO_URI=$(aws ecr describe-repositories \
    --repository-names jobboard-frontend \
    --query "repositories[0].repositoryUri" \
    --output text \
    --region $AWS_REGION)

echo "Frontend Repository: $FRONTEND_REPO_URI"
```

### Step 3.6: Create IAM Roles

#### ECS Instance Role (for EC2 instances)

```bash
# Create trust policy for EC2
cat > ec2-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name ecsInstanceRole \
    --assume-role-policy-document file://ec2-trust-policy.json

# Attach AWS managed policy for ECS
aws iam attach-role-policy \
    --role-name ecsInstanceRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

# Attach CloudWatch agent policy for Container Insights
aws iam attach-role-policy \
    --role-name ecsInstanceRole \
    --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name ecsInstanceProfile

# Add role to instance profile
aws iam add-role-to-instance-profile \
    --instance-profile-name ecsInstanceProfile \
    --role-name ecsInstanceRole
```

#### ECS Task Execution Role

```bash
# Create trust policy file
cat > ecs-task-execution-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-task-execution-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager
cat > ecs-secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:jobboard/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach custom policy
aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SecretsAndLogsAccess \
    --policy-document file://ecs-secrets-policy.json
```

#### ECS Task Role

```bash
# Create trust policy
cat > ecs-task-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file://ecs-task-trust-policy.json

# You can attach additional policies as needed for your application
```

#### CodeBuild Service Role

```bash
# Create trust policy
cat > codebuild-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name CodeBuildServiceRole \
    --assume-role-policy-document file://codebuild-trust-policy.json

# Create CodeBuild policy
cat > codebuild-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-name CodeBuildPolicy \
    --policy-document file://codebuild-policy.json
```

#### CodeDeploy Service Role

```bash
# Create trust policy
cat > codedeploy-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codedeploy.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name CodeDeployServiceRole \
    --assume-role-policy-document file://codedeploy-trust-policy.json

# Attach AWS managed policy for ECS
aws iam attach-role-policy \
    --role-name CodeDeployServiceRole \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS
```

#### CodePipeline Service Role

```bash
# Create trust policy
cat > codepipeline-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name CodePipelineServiceRole \
    --assume-role-policy-document file://codepipeline-trust-policy.json

# Create CodePipeline policy
cat > codepipeline-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetApplication",
        "codedeploy:GetApplicationRevision",
        "codedeploy:GetDeployment",
        "codedeploy:GetDeploymentConfig",
        "codedeploy:RegisterApplicationRevision"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
    --role-name CodePipelineServiceRole \
    --policy-name CodePipelinePolicy \
    --policy-document file://codepipeline-policy.json
```

### Step 3.7: Create CloudWatch Log Group

```bash
# Create log group
aws logs create-log-group \
    --log-group-name /ecs/jobboard \
    --region $AWS_REGION

# Set retention policy (optional, 7 days)
aws logs put-retention-policy \
    --log-group-name /ecs/jobboard \
    --retention-in-days 7 \
    --region $AWS_REGION
```

### Step 3.8: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name jobboard-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --region $AWS_REGION

# Save ALB ARN
export ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text \
    --region $AWS_REGION)

# Get ALB DNS name (you'll use this to access your app)
export ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region $AWS_REGION)

echo "ALB DNS: $ALB_DNS"

# Create target group 1 (Blue)
# Note: Using instance target type for ECS EC2 with bridge network mode
aws elbv2 create-target-group \
    --name jobboard-tg-blue \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-enabled \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION

# Save Blue TG ARN
export TG_BLUE_ARN=$(aws elbv2 describe-target-groups \
    --names jobboard-tg-blue \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region $AWS_REGION)

# Create target group 2 (Green)
aws elbv2 create-target-group \
    --name jobboard-tg-green \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-enabled \
    --health-check-path / \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --region $AWS_REGION

# Save Green TG ARN
export TG_GREEN_ARN=$(aws elbv2 describe-target-groups \
    --names jobboard-tg-green \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region $AWS_REGION)

# Create ALB listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_BLUE_ARN \
    --region $AWS_REGION

# Save Listener ARN
export LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn $ALB_ARN \
    --query "Listeners[0].ListenerArn" \
    --output text \
    --region $AWS_REGION)
```

### Step 3.9: Create ECS Cluster with Container Insights

```bash
# Create ECS cluster with Container Insights enabled
aws ecs create-cluster \
    --cluster-name jobboard-cluster \
    --settings name=containerInsights,value=enabled \
    --region $AWS_REGION

# Verify cluster creation
aws ecs describe-clusters \
    --clusters jobboard-cluster \
    --region $AWS_REGION

# Verify Container Insights is enabled
aws ecs describe-clusters \
    --clusters jobboard-cluster \
    --query "clusters[0].settings" \
    --region $AWS_REGION
```

### Step 3.10: Create EC2 Launch Template for ECS

```bash
# Get the latest Amazon Linux 2023 ECS-optimized AMI
export ECS_AMI=$(aws ssm get-parameters \
    --names /aws/service/ecs/optimized-ami/amazon-linux-2023/recommended/image_id \
    --query "Parameters[0].Value" \
    --output text \
    --region $AWS_REGION)

echo "ECS AMI: $ECS_AMI"

# Create user data script for ECS instances
cat > user-data.txt << EOF
#!/bin/bash
echo ECS_CLUSTER=jobboard-cluster >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config
EOF
  \"Value\": \"jobboard-ecs-instance\"
            }]
        }],
        \"MetadataOptions\": {
            \"HttpTokens\": \"required\",
            \"HttpPutResponseHopLimit\": 2
        }
    }" \
    --region $AWS_REGION

# For Windows PowerShell, use this instead:
# $userData = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content user-data.txt -Raw)))
# Then replace the UserData value in the command above
```

### Step 3.11: Create Auto Scaling Group for ECS

```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name jobboard-ecs-asg \
    --launch-template "LaunchTemplateName=jobboard-ecs-launch-template,Version=\$Latest" \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 2 \
    --vpc-zone-identifier "$SUBNET_1,$SUBNET_2" \
    --health-check-type ELB \
    --health-check-grace-period 300 \
    --tags "Key=Name,Value=jobboard-ecs-instance,PropagateAtLaunch=true" \
    --region $AWS_REGION

# Note: For EC2-backed ECS clusters, capacity providers are managed through Auto Scaling Groups
# The Auto Scaling Group created above will automatically provide capacity to the cluster

# Wait for instances to register with ECS cluster (takes 2-3 minutes)
echo "Waiting for EC2 instances to register with ECS cluster..."
sleep 180

# Verify instances registered
aws ecs list-container-instances \
    --cluster jobboard-cluster \
    --region $AWS_REGION
```

---

## Part 4: Application Configuration

### Step 4.1: Update Task Definition File

Open `taskdef.json` and replace all placeholders:

```bash
# Use sed to replace placeholders (Linux/Mac)
sed -i "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" taskdef.json
sed -i "s/<AWS_REGION>/$AWS_REGION/g" taskdef.json
sed -i "s/<RDS_ENDPOINT>/$RDS_ENDPOINT/g" taskdef.json

# For Windows PowerShell, use:
(Get-Content taskdef.json) -replace '<AWS_ACCOUNT_ID>', $env:AWS_ACCOUNT_ID | Set-Content taskdef.json
(Get-Content taskdef.json) -replace '<AWS_REGION>', $env:AWS_REGION | Set-Content taskdef.json
(Get-Content taskdef.json) -replace '<RDS_ENDPOINT>', $env:RDS_ENDPOINT | Set-Content taskdef.json
```

### Step 4.2: Update AppSpec File

Open `appspec.yaml` and replace placeholders:

```bash
# Update appspec.yaml with your subnet and security group IDs
# Linux/Mac
sed -i "s/<SUBNET_1>/$SUBNET_1/g" appspec.yaml
sed -i "s/<SUBNET_2>/$SUBNET_2/g" appspec.yaml
sed -i "s/<SECURITY_GROUP>/$ECS_SG_ID/g" appspec.yaml

# Windows PowerShell
(Get-Content appspec.yaml) -replace '<SUBNET_1>', $env:SUBNET_1 | Set-Content appspec.yaml
(Get-Content appspec.yaml) -replace '<SUBNET_2>', $env:SUBNET_2 | Set-Content appspec.yaml
(Get-Content appspec.yaml) -replace '<SECURITY_GROUP>', $env:ECS_SG_ID | Set-Content appspec.yaml
```

### Step 4.3: Register ECS Task Definition

```bash
# Register the task definition
aws ecs register-task-definition \
    --cli-input-json file://taskdef.json \
    --region $AWS_REGION

# Verify task definition
aws ecs describe-task-definition \
    --task-definition jobboard-task \
    --region $AWS_REGION
```

### Step 4.4: Create ECS Service

```bash
# Create ECS service with CodeDeploy deployment controller
# Note: For EC2 launch type with bridge network mode
aws ecs create-service \
    --cluster jobboard-cluster \
    --service-name jobboard-service \
    --task-definition jobboard-task \
    --desired-count 1 \
    --launch-type EC2 \
    --deployment-controller type=CODE_DEPLOY \
    --load-balancers "targetGroupArn=$TG_BLUE_ARN,containerName=frontend,containerPort=80" \
    --region $AWS_REGION

# Wait for service to be stable
aws ecs wait services-stable \
    --cluster jobboard-cluster \
    --services jobboard-service \
    --region $AWS_REGION
```

---

## Part 5: CI/CD Pipeline Setup

### Step 5.1: Create S3 Bucket for CodePipeline Artifacts

```bash
# Create unique bucket name
export PIPELINE_BUCKET="jobboard-pipeline-artifacts-$AWS_ACCOUNT_ID"

# Create S3 bucket
aws s3 mb s3://$PIPELINE_BUCKET --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $PIPELINE_BUCKET \
    --versioning-configuration Status=Enabled
```

### Step 5.2: Create CodeCommit Repository

```bash
# Create CodeCommit repository
aws codecommit create-repository \
    --repository-name jobboard \
    --repository-description "JobBoard application repository" \
    --region $AWS_REGION

# Get repository clone URL
export CODECOMMIT_URL=$(aws codecommit get-repository \
    --repository-name jobboard \
    --query "repositoryMetadata.cloneUrlHttp" \
    --output text \
    --region $AWS_REGION)

echo "CodeCommit Repository URL: $CODECOMMIT_URL"
```

#### Configure Git Credentials for CodeCommit

**Option 1: Using HTTPS Git credentials (Recommended for IAM users)**

1. Go to AWS Console → IAM → Users → Your User
2. Navigate to **Security credentials** tab
3. Scroll to **HTTPS Git credentials for AWS CodeCommit**
4. Click **Generate credentials**
5. Download and save the credentials
6. Use these credentials when pushing to CodeCommit

**Option 2: Using AWS CLI credential helper**

```bash
# Configure Git to use AWS CLI credential helper
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
```

#### Initialize Git Repository (if not already done)

```bash
# If you haven't initialized git yet:
cd /path/to/jobboard
git init
git add .
git commit -m "Initial commit"

# Add CodeCommit as remote
git remote add aws $CODECOMMIT_URL

# Or if you already have a remote, you can add CodeCommit as additional remote:
# git remote add codecommit $CODECOMMIT_URL
```

### Step 5.3: Create CodeDeploy Application

```bash
# Create CodeDeploy application
aws deploy create-application \
    --application-name jobboard-app \
    --compute-platform ECS \
    --region $AWS_REGION

# Create deployment group
aws deploy create-deployment-group \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --service-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/CodeDeployServiceRole \
    --deployment-config-name CodeDeployDefault.ECSAllAtOnce \
    --ecs-services clusterName=jobboard-cluster,serviceName=jobboard-service \
    --load-balancer-info "targetGroupPairInfoList=[{targetGroups=[{name=jobboard-tg-blue},{name=jobboard-tg-green}],prodTrafficRoute={listenerArns=[$LISTENER_ARN]}}]" \
    --blue-green-deployment-configuration "terminateBlueInstancesOnDeploymentSuccess={action=TERMINATE,terminationWaitTimeInMinutes=5},deploymentReadyOption={actionOnTimeout=CONTINUE_DEPLOYMENT}" \
    --region $AWS_REGION
```

### Step 5.4: Create CodeBuild Project

```bash
# Create CodeBuild project
aws codebuild create-project \
    --name jobboard-build \
    --source type=CODECOMMIT,location=https://git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/jobboard \
    --artifacts type=NO_ARTIFACTS \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true,environmentVariables="[{name=AWS_ACCOUNT_ID,value=$AWS_ACCOUNT_ID},{name=AWS_DEFAULT_REGION,value=$AWS_REGION}]" \
    --service-role arn:aws:iam::$AWS_ACCOUNT_ID:role/CodeBuildServiceRole \
    --region $AWS_REGION
```

### Step 5.5: Create CodePipeline

It's recommended to create CodePipeline via the AWS Console for easier configuration:

#### Via AWS Console:

1. Navigate to **CodePipeline** in AWS Console
2. Click **Create pipeline**
3. **Pipeline settings:**
   - Name: `jobboard-pipeline`
   - Service role: `CodePipelineServiceRole`
   - Artifact store: Custom location → Select your S3 bucket
   - Click **Next**

4. **Source stage:**
   - Source provider: **AWS CodeCommit**
   - Repository name: `jobboard`
   - Branch name: `main` (or `master`)
   - Change detection options: **Amazon CloudWatch Events** (recommended)
   - Output artifact format: **CodePipeline default**
   - Click **Next**

5. **Build stage:**
   - Build provider: **AWS CodeBuild**
   - Project name: `jobboard-build`
   - Click **Next**

6. **Deploy stage:**
   - Deploy provider: **Amazon ECS (Blue/Green)**
   - Application name: `jobboard-app`
   - Deployment group: `jobboard-dg`
   - Task definition: Click **Browse** → Select `taskdef.json`
   - AppSpec file: Click **Browse** → Select `appspec.yaml`
   - Click **Next**

7. **Review** and click **Create pipeline**

### Step 5.6: Push Code to CodeCommit

```bash
# Make sure all files are committed
git add .
git commit -m "Add AWS deployment configuration"

# Add CodeCommit as remote (if not already added)
git remote add aws https://git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/jobboard

# Or if you want to replace origin:
# git remote set-url origin https://git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/jobboard

# Push to CodeCommit
git push aws main
```

The pipeline will automatically trigger!

---

## Part 6: Deployment

### Step 6.1: Monitor Pipeline Execution

```bash
# Get pipeline status
aws codepipeline get-pipeline-state \
    --name jobboard-pipeline \
    --region $AWS_REGION

# Monitor in real-time via AWS Console:
# CodePipeline → jobboard-pipeline
```

### Step 6.2: Monitor CodeBuild

```bash
# List builds
aws codebuild list-builds-for-project \
    --project-name jobboard-build \
    --region $AWS_REGION

# Get build details
aws codebuild batch-get-builds \
    --ids <build-id> \
    --region $AWS_REGION
```

**Or via Console:**
- Navigate to **CodeBuild** → **Build projects** → `jobboard-build`
- Click on the running build to see logs

### Step 6.3: Monitor CodeDeploy

```bash
# List deployments
aws deploy list-deployments \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --region $AWS_REGION

# Get deployment status
aws deploy get-deployment \
    --deployment-id <deployment-id> \
    --region $AWS_REGION
```

**Or via Console:**
- Navigate to **CodeDeploy** → **Applications** → `jobboard-app`
- View deployment progress

### Step 6.4: Verify ECS Tasks

```bash
# List running tasks
aws ecs list-tasks \
    --cluster jobboard-cluster \
    --service-name jobboard-service \
    --region $AWS_REGION

# Get task details
aws ecs describe-tasks \
    --cluster jobboard-cluster \
    --tasks <task-arn> \
    --region $AWS_REGION
```

---

## Part 7: Post-Deployment

### Step 7.1: Access Your Application

```bash
# Get ALB DNS name
echo "Access your application at: http://$ALB_DNS"

# Or retrieve it again
aws elbv2 describe-load-balancers \
    --names jobboard-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region $AWS_REGION
```

Open your browser and navigate to the ALB DNS name.

### Step 7.2: Test the Application

1. **Frontend Test:**
   - Access `http://<ALB-DNS>`
   - Verify the page loads

2. **Backend API Test:**
   - Access `http://<ALB-DNS>/api`
   - Should return: `{"msg":"JobBoard API"}`

3. **Register a User:**
   - Use the registration form
   - Create a test account

4. **Login:**
   - Login with your credentials
   - Verify authentication works

5. **Job Listings:**
   - View job listings
   - Test CRUD operations

### Step 7.3: Database Migration (If Needed)

```bash
# Connect to RDS via an ECS task or EC2 bastion
# For now, Sequelize will auto-sync tables on app startup

# Optional: Use ECS Exec to run migrations
aws ecs execute-command \
    --cluster jobboard-cluster \
    --task <task-id> \
    --container backend \
    --interactive \
    --command "/bin/sh"

# Then inside the container:
npm run seed
```

### Step 7.4: Configure Custom Domain (Optional)

1. **Register a domain** (Route 53 or external)

2. **Create SSL certificate** in ACM:
```bash
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS \
    --region $AWS_REGION
```

3. **Add HTTPS listener to ALB:**
```bash
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=<cert-arn> \
    --default-actions Type=forward,TargetGroupArn=$TG_BLUE_ARN \
    --region $AWS_REGION
```

4. **Create Route 53 record:**
```bash
# Via Console: Route 53 → Create record → Alias to ALB
```

---

## Monitoring and Maintenance

### CloudWatch Container Insights

Container Insights provides comprehensive monitoring for your ECS cluster:

**Access Container Insights:**
1. Navigate to **CloudWatch** → **Container Insights** in AWS Console
2. Select **ECS Clusters**
3. View cluster-level metrics:
   - CPU and Memory utilization
   - Network traffic
   - Storage usage
   - Task and service counts

**View Service Performance:**
1. Select **ECS Services**
2. Choose `jobboard-service`
3. View detailed service metrics and performance maps

**Container-Level Insights:**
```bash
# Query container insights metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ClusterName,Value=jobboard-cluster Name=ServiceName,Value=jobboard-service \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region $AWS_REGION
```

### CloudWatch Logs

```bash
# View logs in real-time
aws logs tail /ecs/jobboard --follow --region $AWS_REGION

# Filter logs for backend
aws logs tail /ecs/jobboard --follow \
    --filter-pattern "backend" \
    --region $AWS_REGION

# Filter logs for frontend
aws logs tail /ecs/jobboard --follow \
    --filter-pattern "frontend" \
    --region $AWS_REGION

# View error logs only
aws logs tail /ecs/jobboard --follow \
    --filter-pattern "ERROR" \
    --region $AWS_REGION
```

### CloudWatch Log Insights

Use Log Insights for advanced log analysis:

**Via AWS Console:**
1. Navigate to **CloudWatch** → **Logs** → **Insights**
2. Select log group `/ecs/jobboard`
3. Run queries:

**Query 1: Find all errors in last hour**
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

**Query 2: API response times**
```
fields @timestamp, @message
| filter @message like /API/
| parse @message "*ms" as responseTime
| stats avg(responseTime), max(responseTime), min(responseTime) by bin(5m)
```

**Query 3: Count requests by endpoint**
```
fields @timestamp, @message
| filter @message like /GET|POST|PUT|DELETE/
| parse @message "* * *" as method, path, status
| stats count() by path
| sort count() desc
```

**Query 4: Database query performance**
```
fields @timestamp, @message
| filter @message like /SQL|query/
| parse @message "*ms" as queryTime
| stats avg(queryTime) as avgTime, max(queryTime) as maxTime by bin(5m)
```

**Via CLI:**
```bash
# Start a query
QUERY_ID=$(aws logs start-query \
    --log-group-name /ecs/jobboard \
    --start-time $(date -u -d '1 hour ago' +%s) \
    --end-time $(date -u +%s) \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20' \
    --query 'queryId' \
    --output text \
    --region $AWS_REGION)

echo "Query ID: $QUERY_ID"

# Wait a few seconds, then get results
sleep 5

# Get query results
aws logs get-query-results \
    --query-id $QUERY_ID \
    --region $AWS_REGION
```

### CloudWatch Metrics

**Via Console:**
1. Navigate to **CloudWatch** → **Metrics** → **All metrics**
2. Select **ECS** → **ClusterName, ServiceName**
3. View metrics:
   - CPUUtilization
   - MemoryUtilization
   - TargetResponseTime
   - RunningTaskCount
   - PendingTaskCount

**Via CLI - Get Current Metrics:**
```bash
# Get CPU utilization
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ClusterName,Value=jobboard-cluster Name=ServiceName,Value=jobboard-service \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average,Maximum \
    --region $AWS_REGION

# Get memory utilization
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name MemoryUtilization \
    --dimensions Name=ClusterName,Value=jobboard-cluster Name=ServiceName,Value=jobboard-service \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average,Maximum \
    --region $AWS_REGION

# Get ALB metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApplicationELB \
    --metric-name TargetResponseTime \
    --dimensions Name=LoadBalancer,Value=app/jobboard-alb/<alb-id> \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region $AWS_REGION

# Get RDS metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name CPUUtilization \
    --dimensions Name=DBInstanceIdentifier,Value=jobboard-db \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region $AWS_REGION
```

### Create CloudWatch Dashboard

```bash
# Create comprehensive monitoring dashboard
cat > dashboard.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average", "label": "CPU Average"}],
          ["...", {"stat": "Maximum", "label": "CPU Max"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$AWS_REGION",
        "title": "ECS CPU Utilization",
        "period": 300,
        "dimensions": {
          "ClusterName": "jobboard-cluster",
          "ServiceName": "jobboard-service"
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "MemoryUtilization", {"stat": "Average"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$AWS_REGION",
        "title": "ECS Memory Utilization",
        "period": 300
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum"}],
          [".", "TargetResponseTime", {"stat": "Average", "yAxis": "right"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$AWS_REGION",
        "title": "ALB Requests & Response Time",
        "period": 300,
        "yAxis": {
          "left": {"label": "Requests"},
          "right": {"label": "Response Time (s)"}
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
          [".", "DatabaseConnections", {"stat": "Sum", "yAxis": "right"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$AWS_REGION",
        "title": "RDS Performance",
        "period": 300,
        "dimensions": {
          "DBInstanceIdentifier": "jobboard-db"
        }
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/ecs/jobboard' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
        "region": "$AWS_REGION",
        "title": "Recent Errors",
        "stacked": false
      }
    }
  ]
}
EOF

# Create the dashboard
aws cloudwatch put-dashboard \
    --dashboard-name JobBoard-Monitoring \
    --dashboard-body file://dashboard.json \
    --region $AWS_REGION

echo "Dashboard created: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=JobBoard-Monitoring"
```

### Set Up CloudWatch Alarms

```bash
# Create SNS topic for alarm notifications
SNS_TOPIC_ARN=$(aws sns create-topic \
    --name jobboard-alerts \
    --query 'TopicArn' \
    --output text \
    --region $AWS_REGION)

echo "SNS Topic ARN: $SNS_TOPIC_ARN"

# Subscribe your email to SNS topic
aws sns subscribe \
    --topic-arn $SNS_TOPIC_ARN \
    --protocol email \
    --notification-endpoint your-email@example.com \
    --region $AWS_REGION

echo "Check your email to confirm the subscription!"

# 1. ECS CPU High Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-ecs-high-cpu \
    --alarm-description "Alert when ECS CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=jobboard-service Name=ClusterName,Value=jobboard-cluster \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 2. ECS Memory High Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-ecs-high-memory \
    --alarm-description "Alert when ECS Memory exceeds 80%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=jobboard-service Name=ClusterName,Value=jobboard-cluster \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 3. ALB Unhealthy Targets Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-alb-unhealthy-targets \
    --alarm-description "Alert when ALB has unhealthy targets" \
    --metric-name UnHealthyHostCount \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=TargetGroup,Value=targetgroup/jobboard-tg-blue/* Name=LoadBalancer,Value=app/jobboard-alb/* \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 4. ALB High Response Time Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-alb-high-response-time \
    --alarm-description "Alert when response time exceeds 2 seconds" \
    --metric-name TargetResponseTime \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 300 \
    --threshold 2 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value=app/jobboard-alb/* \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 5. ALB 5XX Errors Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-alb-5xx-errors \
    --alarm-description "Alert on high 5XX error rate" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value=app/jobboard-alb/* \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN \
    --treat-missing-data notBreaching \
    --region $AWS_REGION

# 6. RDS High CPU Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-rds-high-cpu \
    --alarm-description "Alert when RDS CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=jobboard-db \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 7. RDS Low Storage Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-rds-low-storage \
    --alarm-description "Alert when RDS free storage is below 2GB" \
    --metric-name FreeStorageSpace \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 2000000000 \
    --comparison-operator LessThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=jobboard-db \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 8. RDS High Connections Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-rds-high-connections \
    --alarm-description "Alert when database connections are high" \
    --metric-name DatabaseConnections \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=jobboard-db \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# 9. ECS Service Task Count Low Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name jobboard-ecs-low-task-count \
    --alarm-description "Alert when running tasks drop below desired count" \
    --metric-name RunningTaskCount \
    --namespace ECS/ContainerInsights \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --dimensions Name=ServiceName,Value=jobboard-service Name=ClusterName,Value=jobboard-cluster \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --region $AWS_REGION

# List all created alarms
aws cloudwatch describe-alarms \
    --alarm-name-prefix jobboard \
    --query 'MetricAlarms[*].[AlarmName,StateValue]' \
    --output table \
    --region $AWS_REGION
```

### Auto Scaling (Optional)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 1 \
    --max-capacity 4 \
    --region $AWS_REGION

# Create CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name jobboard-cpu-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://cpu-scaling-policy.json \
    --region $AWS_REGION

# Create Memory-based scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name jobboard-memory-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://memory-scaling-policy.json \
    --region $AWS_REGION

# Create ALB request-based scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/jobboard-cluster/jobboard-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name jobboard-request-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://request-scaling-policy.json \
    --region $AWS_REGION
```

Create scaling policy files:

**cpu-scaling-policy.json:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

**memory-scaling-policy.json:**
```json
{
  "TargetValue": 80.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

**request-scaling-policy.json:**
```json
{
  "TargetValue": 1000.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ALBRequestCountPerTarget",
    "ResourceLabel": "app/jobboard-alb/<alb-id>/targetgroup/jobboard-tg-blue/<tg-id>"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

### Performance Monitoring Best Practices

1. **Set up CloudWatch Anomaly Detection:**
```bash
# Enable anomaly detection for CPU
aws cloudwatch put-anomaly-detector \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ClusterName,Value=jobboard-cluster Name=ServiceName,Value=jobboard-service \
    --stat Average \
    --region $AWS_REGION
```

2. **Create composite alarms** (requires existing alarms):
```bash
# Create composite alarm for critical service health
aws cloudwatch put-composite-alarm \
    --alarm-name jobboard-service-critical \
    --alarm-description \"Critical: Multiple service health issues detected\" \
    --actions-enabled \
    --alarm-actions $SNS_TOPIC_ARN \
    --alarm-rule \"ALARM(jobboard-ecs-high-cpu) OR ALARM(jobboard-ecs-high-memory) OR ALARM(jobboard-alb-unhealthy-targets)\" \
    --region $AWS_REGION
```

3. **Enable detailed monitoring for EC2 instances:**
```bash
# Enable detailed monitoring (1-minute metrics instead of 5-minute)
aws ec2 monitor-instances \
    --instance-ids <instance-id> \
    --region $AWS_REGION
```

4. **Set up custom metrics** (from application code):

Add to your backend application:
```javascript
// backend/src/monitoring.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION });

async function publishCustomMetric(metricName, value, unit = 'Count') {
  const params = {
    Namespace: 'JobBoard/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };
  
  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Error publishing metric:', error);
  }
}

module.exports = { publishCustomMetric };
```

5. **Monitor application-level metrics:**
```bash
# Query custom metrics
aws cloudwatch get-metric-statistics \
    --namespace JobBoard/Application \
    --metric-name JobApplications \
    --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Sum \
    --region $AWS_REGION
```

---

## Troubleshooting

### Common Issues

#### 1. Pipeline Fails at Build Stage

**Check CodeBuild logs:**
```bash
aws codebuild batch-get-builds --ids <build-id> --region $AWS_REGION
```

**Common causes:**
- Missing environment variables
- Docker build errors
- Insufficient IAM permissions

**Fix:**
- Verify `buildspec.yml` syntax
- Check IAM role permissions
- Review build logs in CodeBuild console

#### 2. ECS Tasks Fail to Start

**Check task status:**
```bash
aws ecs describe-tasks \
    --cluster jobboard-cluster \
    --tasks <task-arn> \
    --region $AWS_REGION
```

**Common causes:**
- Image pull errors (ECR permissions)
- Invalid environment variables
- Insufficient memory/CPU

**Fix:**
- Verify ECR repository permissions
- Check Secrets Manager access
- Increase task memory/CPU in `taskdef.json`

#### 3. Application Not Accessible

**Check ALB target health:**
```bash
aws elbv2 describe-target-health \
    --target-group-arn $TG_BLUE_ARN \
    --region $AWS_REGION
```

**Common causes:**
- Security group not allowing traffic
- Health check path incorrect
- Container not listening on expected port

**Fix:**
- Verify security group rules
- Check health check configuration
- Verify container port mappings

#### 4. Database Connection Errors

**Check RDS status:**
```bash
aws rds describe-db-instances \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION
```

**Common causes:**
- RDS security group blocking ECS tasks
- Wrong RDS endpoint
- Database not available

**Fix:**
- Verify RDS security group allows traffic from ECS SG
- Check `DB_HOST` environment variable
- Ensure RDS instance is in "available" state

#### 5. Secrets Not Loading

**Verify secrets exist:**
```bash
aws secretsmanager list-secrets \
    --region $AWS_REGION
```

**Fix:**
- Ensure secrets are in the same region
- Verify ECS execution role has Secrets Manager permissions
- Check secret ARNs in `taskdef.json`

### Debug Commands

```bash
# View ECS service events
aws ecs describe-services \
    --cluster jobboard-cluster \
    --services jobboard-service \
    --region $AWS_REGION

# View CloudWatch logs
aws logs get-log-events \
    --log-group-name /ecs/jobboard \
    --log-stream-name <stream-name> \
    --region $AWS_REGION

# Check ECR images
aws ecr list-images \
    --repository-name jobboard-backend \
    --region $AWS_REGION

# Get task definition details
aws ecs describe-task-definition \
    --task-definition jobboard-task \
    --region $AWS_REGION
```

---

## Cost Optimization

### Estimated Monthly Costs

- **EC2 instances - 2 t3.small (on-demand)**: ~$30/month
- **EBS storage (2 x 30GB)**: ~$6/month
- **RDS t3.micro**: ~$15/month
- **ALB**: ~$18/month
- **ECR storage**: ~$1/month (for 10GB)
- **Data transfer**: Variable
- **Total**: ~$70-80/month

### Cost Reduction Tips

1. **Use EC2 Spot Instances** (for dev/test):
```bash
# Update Auto Scaling Group to use Spot instances
# Create a new launch template with Spot instance request
aws ec2 create-launch-template \
    --launch-template-name jobboard-ecs-spot-template \
    --version-description "Spot instance template" \
    --launch-template-data '{
        "InstanceType": "t3.small",
        "ImageId": "'$ECS_AMI'",
        "IamInstanceProfile": {"Name": "ecsInstanceRole"},
        "SecurityGroupIds": ["'$ECS_SG_ID'"],
        "InstanceMarketOptions": {
            "MarketType": "spot",
            "SpotOptions": {"MaxPrice": "0.02"}
        },
        "UserData": "'$(base64 -w 0 user-data.txt)'"
    }' \
    --region $AWS_REGION
```

2. **Reduce EC2 instance size** (t3.micro for very small workloads):

1. **Use EC2 Spot Instances** (for dev/test - up to 90% savings):
```bash
# Update launch template to use Spot instances
aws ec2 create-launch-template-version \
    --launch-template-name jobboard-ecs-launch-template \
    --launch-template-data '{
        "InstanceMarketOptions": {
            "MarketType": "spot",
            "SpotOptions": {
3. **Stop non-production resources**:
```bash
# Stop RDS during off-hours
aws rds stop-db-instance \
    --db-instance-identifier jobboard-db \
    --region $AWS_REGION

# Scale down ASG to 0
aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name jobboard-ecs-asg \
    --min-size 0 \
    --max-size 0 \
    --desired-capacity 0 \
    --region $AWS_REGION
```

4``bash
# Purchase 1-year reserved instance
aws ec2 purchase-reserved-instances-offering \
    --reserved-instances-offering-id <offering-id> \
    --instance-count 2
```

3 Delete untagged images
aws ecr batch-delete-image \
    --repository-name jobboard-backend \
    --image-ids imageTag=untagged \
    --region $AWS_REGION
```

4. **Use CloudWatch retention**:
```bash
# Set log retention to 7 days
aws logs put-retention-policy \
    --log-group-name /ecs/jobboard \
    --retention-in-days 7 \
    --region $AWS_REGION
```

---

## Cleanup

### Delete All Resources

```bash
# 1. Delete CodePipeline
aws codepipeline delete-pipeline \
    --name jobboard-pipeline \
    --region $AWS_REGION

# 2. Delete CodeBuild project
aws codebuild delete-project \
    --name jobboard-build \
    --region $AWS_REGION

# 3. Delete CodeDeploy deployment group
aws deploy delete-deployment-group \
    --application-name jobboard-app \
    --deployment-group-name jobboard-dg \
    --region $AWS_REGION

# 4. Delete CodeDeploy application
aws deploy delete-application \
    --application-name jobboard-app \
    --region $AWS_REGION

# 5. Delete ECS service
aws ecs update-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --desired-count 0 \
    --region $AWS_REGION

aws ecs delete-service \
    --cluster jobboard-cluster \
    --service jobboard-service \
    --force \
    --region $AWS_REGION

# 6. Delete Auto Scaling Group
aws autoscaling delete-auto-scaling-group \
    --auto-scaling-group-name jobboard-ecs-asg \
    --force-delete \
    --region $AWS_REGION

# Wait for instances to terminate
sleep 60

# 7. Delete Launch Template
aws ec2 delete-launch-template \
    --launch-template-name jobboard-ecs-launch-template \
    --region $AWS_REGION

# 8. Deregister task definition
# (Tasks definitions can't be deleted, just deregister)
aws ecs deregister-task-definition \
    --task-definition jobboard-task:1 \
    --region $AWS_REGION

# 9. Delete ECS cluster
aws ecs delete-cluster \
    --cluster jobboard-cluster \
    --region $AWS_REGION

# 11. Delete ALB listener
aws elbv2 delete-listener \
    --listener-arn $LISTENER_ARN \
    --region $AWS_REGION

# 12. Delete target groups
aws elbv2 delete-target-group \
    --target-group-arn $TG_BLUE_ARN \
    --region $AWS_REGION

aws elbv2 delete-target-group \
    --target-group-arn $TG_GREEN_ARN \
    --region $AWS_REGION

# 13. Delete ALB
aws elbv2 delete-load-balancer \
    --load-balancer-arn $ALB_ARN \
    --region $AWS_REGION

# Wait for ALB to be deleted (takes a few minutes)
sleep 120

# 11. Delete RDS instance
aws rds delete-db-instance \
    --db-instance-identifier jobboard-db \
    --skip-final-snapshot \
    --region $AWS_REGION

# 12. Delete ECR repositories
aws ecr delete-repository \
    --repository-name jobboard-backend \
    --force \
    --region $AWS_REGION

aws ecr delete-repository \
    --repository-name jobboard-frontend \
    --force \
    --region $AWS_REGION

# 13. Delete secrets
aws secretsmanager delete-secret \
    --secret-id jobboard/db-password \
    --force-delete-without-recovery \
    --region $AWS_REGION

aws secretsmanager delete-secret \
    --secret-id jobboard/jwt-secret \
    --force-delete-without-recovery \
    --region $AWS_REGION

# 14. Delete CloudWatch log group
aws logs delete-log-group \
    --log-group-name /ecs/jobboard \
    --region $AWS_REGION

# 15. Delete S3 bucket
aws s3 rm s3://$PIPELINE_BUCKET --recursive
aws s3 rb s3://$PIPELINE_BUCKET --region $AWS_REGION

# 16. Delete security groups
aws ec2 delete-security-group \
    --group-id $ECS_SG_ID \
    --region $AWS_REGION

aws ec2 delete-security-group \
    --group-id $RDS_SG_ID \
    --region $AWS_REGION

aws ec2 delete-security-group \
    --group-id $ALB_SG_ID \
    --region $AWS_REGION

# 17. Delete IAM roles (detach policies first)
aws iam delete-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name SecretsAndLogsAccess

aws iam detach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam delete-role --role-name ecsTaskExecutionRole

aws iam delete-role --role-name ecsTaskRole

aws iam delete-role-policy \
    --role-name CodeBuildServiceRole \
    --policy-name CodeBuildPolicy

aws iam delete-role --role-name CodeBuildServiceRole

aws iam detach-role-policy \
    --role-name CodeDeployServiceRole \
    --policy-arn arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS

aws iam delete-role --role-name CodeDeployServiceRole

aws iam delete-role-policy \
    --role-name CodePipelineServiceRole \
    --policy-name CodePipelinePolicy

aws iam delete-role --role-name CodePipelineServiceRole

# If you created a custom VPC, delete it
# (Skip if using default VPC)
# Delete subnets, route tables, internet gateway, and VPC
```

---

## Appendix

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| AWS_ACCOUNT_ID | Your AWS account ID | 123456789012 |
| AWS_REGION | AWS region | us-east-1 |
| VPC_ID | VPC identifier | vpc-abc123 |
| SUBNET_1 | First subnet ID | subnet-abc123 |
| SUBNET_2 | Second subnet ID | subnet-def456 |
| ECS_SG_ID | ECS security group | sg-abc123 |
| ALB_SG_ID | ALB security group | sg-def456 |
| RDS_SG_ID | RDS security group | sg-ghi789 |
| RDS_ENDPOINT | RDS endpoint | xxx.rds.amazonaws.com |
| DB_PASSWORD | Database password | (secure string) |
| JWT_SECRET | JWT secret key | (secure string) |

### File Structure

```
jobboard/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── package.json            # Backend dependencies
│   └── src/
│       └── app.js             # Backend application
├── frontend/
│   ├── Dockerfile              # Frontend container definition
│   ├── nginx.conf             # Nginx configuration
│   ├── package.json            # Frontend dependencies
│   └── src/
│       └── App.jsx            # Frontend application
├── .dockerignore              # Docker ignore patterns
├── appspec.yaml               # CodeDeploy configuration
├── buildspec.yml              # CodeBuild configuration
├── taskdef.json               # ECS task definition
├── aws-setup.md               # Detailed AWS setup guide
└── README.md                  # This file
```

### Useful AWS CLI Commands

```bash
# List all ECS clusters
aws ecs list-clusters --region $AWS_REGION

# List all RDS instances
aws rds describe-db-instances --region $AWS_REGION

# List all load balancers
aws elbv2 describe-load-balancers --region $AWS_REGION

# List all ECR repositories
aws ecr describe-repositories --region $AWS_REGION

# List all CodePipelines
aws codepipeline list-pipelines --region $AWS_REGION

# Get current AWS identity
aws sts get-caller-identity

# List all S3 buckets
aws s3 ls
```

### Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodeDeploy Documentation](https://docs.aws.amazon.com/codedeploy/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review AWS service health dashboard
3. Consult AWS documentation
4. Check GitHub issues/discussions

---

## Quick Start Checklist

- [ ] Install prerequisites (Git, Node.js, Docker, AWS CLI)
- [ ] Configure AWS CLI with credentials
- [ ] Create VPC and networking components
- [ ] Create security groups
- [ ] Create RDS database
- [ ] Store secrets in Secrets Manager
- [ ] Create ECR repositories
- [ ] Create IAM roles (including ECS Instance Role)
- [ ] Create CloudWatch log group
- [ ] Create Application Load Balancer
- [ ] Create ECS cluster with Container Insights enabled
- [ ] Create EC2 Launch Template with ECS-optimized Amazon Linux 2023
- [ ] Create Auto Scaling Group for ECS instances
- [ ] Update configuration files (taskdef.json)
- [ ] Register ECS task definition
- [ ] Create ECS service
- [ ] Create S3 bucket for pipeline artifacts
- [ ] Create CodeDeploy application
- [ ] Create CodeBuild project
- [ ] Create CodePipeline
- [ ] Push code to GitHub
- [ ] Monitor pipeline execution
- [ ] Verify deployment
- [ ] Test application
- [ ] Set up CloudWatch Dashboard
- [ ] Configure CloudWatch Alarms
- [ ] Subscribe to SNS notifications
- [ ] Enable auto-scaling policies

---

**Congratulations!** 🎉 You've successfully deployed your JobBoard application on AWS with a fully automated CI/CD pipeline!
