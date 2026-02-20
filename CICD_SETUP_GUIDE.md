# Complete CI/CD Setup Guide - CodeCommit, CodeBuild, CodeDeploy & CodePipeline

This guide walks you through setting up a complete CI/CD pipeline for the JobBoard application using AWS CodeCommit, CodeBuild, CodeDeploy, and CodePipeline **after** deploying infrastructure with Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Part 1: Setup CodeCommit Repository](#part-1-setup-codecommit-repository)
4. [Part 2: Setup IAM Roles](#part-2-setup-iam-roles)
5. [Part 3: Setup CodeBuild Project](#part-3-setup-codebuild-project)
6. [Part 4: Setup CodeDeploy Application](#part-4-setup-codedeploy-application)
7. [Part 5: Setup S3 Bucket for Artifacts](#part-5-setup-s3-bucket-for-artifacts)
8. [Part 6: Setup CodePipeline](#part-6-setup-codepipeline)
9. [Part 7: Testing the Pipeline](#part-7-testing-the-pipeline)
10. [Part 8: Troubleshooting](#part-8-troubleshooting)
11. [Alternative: Using GitHub Instead of CodeCommit](#alternative-using-github-instead-of-codecommit)

---

## Prerequisites

Before starting, ensure you have:

✅ **Terraform infrastructure deployed** (VPC, ECS, RDS, ALB, ECR, etc.)
✅ **AWS CLI configured** with appropriate credentials
✅ **Git installed** on your local machine
✅ **Docker images** built and pushed to ECR at least once
✅ **Application tested** and working via ALB URL

**Get your Terraform outputs:**

```powershell
cd terraform
$AWS_REGION = terraform output -raw aws_region
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$ECR_BACKEND_REPO = terraform output -raw ecr_backend_repository_url
$ECR_FRONTEND_REPO = terraform output -raw ecr_frontend_repository_url
$ECS_CLUSTER = terraform output -raw ecs_cluster_name
$ECS_SERVICE = terraform output -raw ecs_service_name
cd ..
```

---

## Architecture Overview

```
Developer Push Code
         ↓
   CodeCommit/GitHub Repository
         ↓
   CodePipeline (Triggered)
         ↓
   ┌─────────────────────────┐
   │  Source Stage           │
   │  (CodeCommit/GitHub)    │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │  Build Stage            │
   │  (CodeBuild)            │
   │  - Build Docker images  │
   │  - Push to ECR          │
   │  - Create artifacts     │
   └───────────┬─────────────┘
               ↓
   ┌─────────────────────────┐
   │  Deploy Stage           │
   │  (CodeDeploy)           │
   │  - Blue/Green Deploy    │
   │  - Update ECS Service   │
   └───────────┬─────────────┘
               ↓
        ECS Service Running
               ↓
        Access via ALB
```

---

## Part 1: Setup CodeCommit Repository

### Option A: Using AWS Console

#### Step 1.1: Create CodeCommit Repository

1. **Open AWS Console** → Navigate to **CodeCommit**
2. Click **Create repository**
3. **Repository name**: `jobboard`
4. **Description**: `Job Board Application Repository`
5. Click **Create**

#### Step 1.2: Get Repository Clone URL

1. In the repository page, click **Clone URL**
2. Copy the **HTTPS URL** (e.g., `https://git-codecommit.us-east-1.amazonaws.com/v1/repos/jobboard`)

#### Step 1.3: Configure Git Credentials

**Method 1: Git Credentials Helper (Recommended for Windows)**

```powershell
# Configure Git to use AWS credential helper
git config --global credential.helper "!aws codecommit credential-helper $@"
git config --global credential.UseHttpPath true

# Verify configuration
git config --list | Select-String codecommit
```

**Method 2: HTTPS Git Credentials**

1. Go to **IAM** → **Users** → Select your user
2. Click **Security credentials** tab
3. Scroll to **HTTPS Git credentials for AWS CodeCommit**
4. Click **Generate credentials**
5. **Download credentials** (username and password)
6. Use these when prompted during git clone/push

#### Step 1.4: Push Your Code to CodeCommit

```powershell
# Navigate to your project directory
cd A:\Resume-Projects\jobboard

# Initialize git (if not already)
git init

# Add CodeCommit as remote
git remote add codecommit https://git-codecommit.us-east-1.amazonaws.com/v1/repos/jobboard

# Or if you already have a remote, update it
git remote set-url codecommit https://git-codecommit.us-east-1.amazonaws.com/v1/repos/jobboard

# Create .gitignore if not exists
if (-not (Test-Path .gitignore)) {
    @"
node_modules/
.env
*.log
.DS_Store
terraform/.terraform/
terraform/*.tfstate
terraform/*.tfstate.backup
terraform/.terraform.lock.hcl
"@ | Out-File -FilePath .gitignore -Encoding UTF8
}

# Add all files
git add .

# Commit
git commit -m "Initial commit - JobBoard application"

# Push to CodeCommit
git push codecommit main
# Or if your branch is master:
# git push codecommit master
```

### Option B: Using AWS CLI

```powershell
# Create repository
aws codecommit create-repository `
  --repository-name jobboard `
  --repository-description "Job Board Application Repository" `
  --region $AWS_REGION

# Get clone URL
$REPO_URL = (aws codecommit get-repository --repository-name jobboard --region $AWS_REGION --query 'repositoryMetadata.cloneUrlHttp' --output text)

Write-Host "Repository URL: $REPO_URL" -ForegroundColor Green

# Configure git and push (same as above)
git remote add codecommit $REPO_URL
git push codecommit main
```

---

## Part 2: Setup IAM Roles

You need three IAM roles for the CI/CD pipeline:

1. **CodeBuild Service Role** - Allows CodeBuild to access ECR, CloudWatch, S3
2. **CodeDeploy Service Role** - Allows CodeDeploy to manage ECS deployments
3. **CodePipeline Service Role** - Allows CodePipeline to orchestrate everything

### Step 2.1: Create CodeBuild Service Role

**Using AWS Console:**

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: CodeBuild
4. Click **Next**
5. **Attach policies**:
   - `AmazonEC2ContainerRegistryPowerUser`
   - `CloudWatchLogsFullAccess`
   - `AmazonS3FullAccess` (for artifacts)
6. Click **Next**
7. **Role name**: `CodeBuildServiceRole`
8. Click **Create role**

**After creation, add inline policy for ECR and Secrets Manager:**

1. Open the role `CodeBuildServiceRole`
2. Click **Add permissions** → **Create inline policy**
3. Switch to **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GitPull"
      ],
      "Resource": "*"
    }
  ]
}
```

4. **Policy name**: `CodeBuildAdditionalPermissions`
5. Click **Create policy**

**Using AWS CLI:**

```powershell
# Create trust policy
@"
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
"@ | Out-File -FilePath codebuild-trust-policy.json -Encoding UTF8

# Create role
aws iam create-role `
  --role-name CodeBuildServiceRole `
  --assume-role-policy-document file://codebuild-trust-policy.json `
  --region $AWS_REGION

# Attach managed policies
aws iam attach-role-policy `
  --role-name CodeBuildServiceRole `
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy `
  --role-name CodeBuildServiceRole `
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Create and attach inline policy
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:*",
        "logs:*",
        "s3:*",
        "codecommit:GitPull"
      ],
      "Resource": "*"
    }
  ]
}
"@ | Out-File -FilePath codebuild-policy.json -Encoding UTF8

aws iam put-role-policy `
  --role-name CodeBuildServiceRole `
  --policy-name CodeBuildAdditionalPermissions `
  --policy-document file://codebuild-policy.json
```

### Step 2.2: Create CodeDeploy Service Role

**Using AWS Console:**

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: CodeDeploy → **CodeDeploy - ECS**
4. Click **Next**
5. Managed policy `AWSCodeDeployRoleForECS` should be auto-selected
6. Click **Next**
7. **Role name**: `CodeDeployServiceRole`
8. Click **Create role**

**Using AWS CLI:**

```powershell
# Create trust policy
@"
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
"@ | Out-File -FilePath codedeploy-trust-policy.json -Encoding UTF8

# Create role
aws iam create-role `
  --role-name CodeDeployServiceRole `
  --assume-role-policy-document file://codedeploy-trust-policy.json

# Attach managed policy
aws iam attach-role-policy `
  --role-name CodeDeployServiceRole `
  --policy-arn arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS
```

### Step 2.3: Create CodePipeline Service Role

**Using AWS Console:**

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: CodePipeline
4. Click **Next**
5. **Attach policies**: (CodePipeline will auto-create needed policies)
6. Click **Next**
7. **Role name**: `CodePipelineServiceRole`
8. Click **Create role**

**After creation, add inline policy:**

1. Open role `CodePipelineServiceRole`
2. **Add inline policy** with JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GetBranch",
        "codecommit:GetCommit",
        "codecommit:GetUploadArchiveStatus",
        "codecommit:UploadArchive",
        "codecommit:CancelUploadArchive"
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
        "s3:*"
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
```

3. **Policy name**: `CodePipelinePermissions`
4. Click **Create policy**

**Using AWS CLI:**

```powershell
# Create trust policy
@"
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
"@ | Out-File -FilePath codepipeline-trust-policy.json -Encoding UTF8

# Create role
aws iam create-role `
  --role-name CodePipelineServiceRole `
  --assume-role-policy-document file://codepipeline-trust-policy.json

# Create and attach inline policy
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:*",
        "codebuild:*",
        "codedeploy:*",
        "ecs:*",
        "s3:*",
        "iam:PassRole",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
"@ | Out-File -FilePath codepipeline-policy.json -Encoding UTF8

aws iam put-role-policy `
  --role-name CodePipelineServiceRole `
  --policy-name CodePipelinePermissions `
  --policy-document file://codepipeline-policy.json
```

---

## Part 3: Setup CodeBuild Project

### Step 3.1: Create CodeBuild Project via AWS Console

1. Go to **AWS Console** → **CodeBuild** → **Build projects**
2. Click **Create build project**

**Project configuration:**
- **Project name**: `jobboard-build`
- **Description**: `Build Docker images for JobBoard application`

**Source:**
- **Source provider**: AWS CodeCommit
- **Repository**: `jobboard`
- **Reference type**: Branch
- **Branch**: `main` (or `master` depending on your branch name)

**Environment:**
- **Environment image**: Managed image
- **Operating system**: Amazon Linux 2
- **Runtime(s)**: Standard
- **Image**: `aws/codebuild/amazonlinux2-x86_64-standard:5.0` (latest)
- **Image version**: Always use the latest image
- **Environment type**: Linux
- ✅ **Privileged** (MUST check this - required for Docker builds)
- **Service role**: Existing service role → `CodeBuildServiceRole`

**Environment variables** (Add these):

| Name | Value | Type |
|------|-------|------|
| AWS_DEFAULT_REGION | us-east-1 | Plaintext |
| AWS_ACCOUNT_ID | (your account ID) | Plaintext |
| IMAGE_REPO_NAME_BACKEND | jobboard-backend | Plaintext |
| IMAGE_REPO_NAME_FRONTEND | jobboard-frontend | Plaintext |

**Buildspec:**
- **Build specifications**: Use a buildspec file
- **Buildspec name**: `buildspec.yml` (default)

**Artifacts:**
- **Type**: Amazon S3
- **Bucket name**: (will create in Part 5) - Leave for now, we'll update later
- **Name**: `build-output.zip`
- **Artifacts packaging**: Zip

**Logs:**
- ✅ **CloudWatch logs**
- **Group name**: `/aws/codebuild/jobboard-build`
- **Stream name**: (leave blank)

3. Click **Create build project**

### Step 3.2: Create CodeBuild Project via AWS CLI

```powershell
# Get role ARN
$CODEBUILD_ROLE_ARN = (aws iam get-role --role-name CodeBuildServiceRole --query 'Role.Arn' --output text)

# Create CodeBuild project
@"
{
  "name": "jobboard-build",
  "description": "Build Docker images for JobBoard application",
  "source": {
    "type": "CODECOMMIT",
    "location": "https://git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/jobboard",
    "buildspec": "buildspec.yml"
  },
  "artifacts": {
    "type": "NO_ARTIFACTS"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true,
    "environmentVariables": [
      {
        "name": "AWS_DEFAULT_REGION",
        "value": "$AWS_REGION",
        "type": "PLAINTEXT"
      },
      {
        "name": "AWS_ACCOUNT_ID",
        "value": "$AWS_ACCOUNT_ID",
        "type": "PLAINTEXT"
      },
      {
        "name": "IMAGE_REPO_NAME_BACKEND",
        "value": "jobboard-backend",
        "type": "PLAINTEXT"
      },
      {
        "name": "IMAGE_REPO_NAME_FRONTEND",
        "value": "jobboard-frontend",
        "type": "PLAINTEXT"
      }
    ]
  },
  "serviceRole": "$CODEBUILD_ROLE_ARN",
  "logsConfig": {
    "cloudWatchLogs": {
      "status": "ENABLED",
      "groupName": "/aws/codebuild/jobboard-build"
    }
  }
}
"@ | Out-File -FilePath codebuild-project.json -Encoding UTF8

aws codebuild create-project --cli-input-json file://codebuild-project.json --region $AWS_REGION
```

### Step 3.3: Test CodeBuild Project (Optional)

```powershell
# Start a build manually to test
aws codebuild start-build `
  --project-name jobboard-build `
  --region $AWS_REGION

# Get build status
$BUILD_ID = (aws codebuild list-builds-for-project --project-name jobboard-build --region $AWS_REGION --query 'ids[0]' --output text)

aws codebuild batch-get-builds `
  --ids $BUILD_ID `
  --region $AWS_REGION `
  --query 'builds[0].{Status:buildStatus,Phase:currentPhase}'

# View logs
aws logs tail /aws/codebuild/jobboard-build --follow --region $AWS_REGION
```

---

## Part 4: Setup CodeDeploy Application

CodeDeploy manages the Blue/Green deployment for ECS services.

### Step 4.1: Create CodeDeploy Application via AWS Console

1. Go to **AWS Console** → **CodeDeploy** → **Applications**
2. Click **Create application**

**Application configuration:**
- **Application name**: `jobboard-app`
- **Compute platform**: Amazon ECS
3. Click **Create application**

### Step 4.2: Create Deployment Group

1. In the application page, click **Create deployment group**

**Deployment group settings:**
- **Deployment group name**: `jobboard-deployment-group`
- **Service role**: `CodeDeployServiceRole` (select from dropdown)

**Environment configuration:**
- **Amazon ECS cluster name**: `jobboard-cluster`
- **Amazon ECS service name**: `jobboard-service`

**Load balancer:**
- **Load balancer type**: Application Load Balancer or Network Load Balancer
- **Production listener**: Select your ALB listener (HTTP:80)
- **Test listener (optional)**: Leave empty for now
- **Target group 1 name**: Select `jobboard-frontend-tg`
- **Target group 2 name**: Select `jobboard-backend-tg`

**Deploy settings:**
- **Traffic rerouting**: 
  - ✅ Reroute traffic immediately
  - Original revision termination: 5 minutes (default)
  
**Deployment configuration:**
- **Deployment config**: `CodeDeployDefault.ECSAllAtOnce`

**Advanced (optional):**
- CloudWatch alarms: Skip for now
- Automatic rollback: Enable on deployment failure

2. Click **Create deployment group**

### Step 4.3: Create CodeDeploy via AWS CLI

```powershell
# Get service role ARN
$CODEDEPLOY_ROLE_ARN = (aws iam get-role --role-name CodeDeployServiceRole --query 'Role.Arn' --output text)

# Create application
aws deploy create-application `
  --application-name jobboard-app `
  --compute-platform ECS `
  --region $AWS_REGION

# Get ALB listener ARN
$LISTENER_ARN = (aws elbv2 describe-listeners `
  --query "Listeners[?Port==\`80\`].ListenerArn" `
  --region $AWS_REGION `
  --output text | Select-Object -First 1)

# Get target group ARNs
$FRONTEND_TG_ARN = (aws elbv2 describe-target-groups `
  --names jobboard-frontend-tg `
  --query 'TargetGroups[0].TargetGroupArn' `
  --output text `
  --region $AWS_REGION)

$BACKEND_TG_ARN = (aws elbv2 describe-target-groups `
  --names jobboard-backend-tg `
  --query 'TargetGroups[0].TargetGroupArn' `
  --output text `
  --region $AWS_REGION)

# Create deployment group configuration
@"
{
  "applicationName": "jobboard-app",
  "deploymentGroupName": "jobboard-deployment-group",
  "deploymentConfigName": "CodeDeployDefault.ECSAllAtOnce",
  "serviceRoleArn": "$CODEDEPLOY_ROLE_ARN",
  "ecsServices": [
    {
      "serviceName": "jobboard-service",
      "clusterName": "jobboard-cluster"
    }
  ],
  "loadBalancerInfo": {
    "targetGroupPairInfoList": [
      {
        "targetGroups": [
          {
            "name": "jobboard-frontend-tg"
          },
          {
            "name": "jobboard-backend-tg"
          }
        ],
        "prodTrafficRoute": {
          "listenerArns": ["$LISTENER_ARN"]
        }
      }
    ]
  },
  "blueGreenDeploymentConfiguration": {
    "terminateBlueInstancesOnDeploymentSuccess": {
      "action": "TERMINATE",
      "terminationWaitTimeInMinutes": 5
    },
    "deploymentReadyOption": {
      "actionOnTimeout": "CONTINUE_DEPLOYMENT"
    }
  },
  "deploymentStyle": {
    "deploymentType": "BLUE_GREEN",
    "deploymentOption": "WITH_TRAFFIC_CONTROL"
  }
}
"@ | Out-File -FilePath codedeploy-deployment-group.json -Encoding UTF8

aws deploy create-deployment-group `
  --cli-input-json file://codedeploy-deployment-group.json `
  --region $AWS_REGION
```

---

## Part 5: Setup S3 Bucket for Artifacts

CodePipeline needs an S3 bucket to store artifacts between stages.

### Step 5.1: Create S3 Bucket via AWS Console

1. Go to **S3** → **Create bucket**
2. **Bucket name**: `jobboard-pipeline-artifacts-<random-number>` (must be globally unique)
   - Example: `jobboard-pipeline-artifacts-12345`
3. **Region**: Same as your infrastructure (e.g., us-east-1)
4. **Block Public Access**: Keep all checked (default)
5. **Versioning**: Enable
6. **Encryption**: Enable (SSE-S3)
7. Click **Create bucket**

### Step 5.2: Create S3 Bucket via AWS CLI

```powershell
# Generate unique bucket name
$RANDOM_ID = Get-Random -Maximum 99999
$ARTIFACT_BUCKET = "jobboard-pipeline-artifacts-$RANDOM_ID"

# Create bucket
aws s3 mb "s3://$ARTIFACT_BUCKET" --region $AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning `
  --bucket $ARTIFACT_BUCKET `
  --versioning-configuration Status=Enabled `
  --region $AWS_REGION

# Enable encryption
aws s3api put-bucket-encryption `
  --bucket $ARTIFACT_BUCKET `
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' `
  --region $AWS_REGION

Write-Host "Artifact bucket created: $ARTIFACT_BUCKET" -ForegroundColor Green
```

---

## Part 6: Setup CodePipeline

Now we'll create the complete CI/CD pipeline that orchestrates everything.

### Step 6.1: Update Task Definition and AppSpec Files

First, make sure your `taskdef.json` and `appspec.yaml` are properly configured:

**Verify taskdef.json has placeholders:**

```powershell
# Check if placeholders exist
Get-Content taskdef.json | Select-String "<TASK_DEFINITION>|<IMAGE>|<AWS_ACCOUNT_ID>"
```

**Verify appspec.yaml:**

```powershell
Get-Content appspec.yaml
```

It should look like:
```yaml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: <TASK_DEFINITION>
        LoadBalancerInfo:
          ContainerName: "frontend"
          ContainerPort: 80
```

### Step 6.2: Create CodePipeline via AWS Console

1. Go to **CodePipeline** → **Pipelines** → **Create pipeline**

**Pipeline settings:**
- **Pipeline name**: `jobboard-pipeline`
- **Service role**: Existing service role → `CodePipelineServiceRole`
- **Artifact store**: Custom location
  - **Bucket**: Select your artifact bucket (e.g., `jobboard-pipeline-artifacts-12345`)
- Click **Next**

**Source stage:**
- **Source provider**: AWS CodeCommit
- **Repository name**: `jobboard`
- **Branch name**: `main` (or `master`)
- **Change detection options**: Amazon CloudWatch Events (recommended)
- **Output artifact format**: CodePipeline default
- Click **Next**

**Build stage:**
- **Build provider**: AWS CodeBuild
- **Region**: Your region (e.g., us-east-1)
- **Project name**: `jobboard-build`
- **Build type**: Single build
- Click **Next**

**Deploy stage:**
- **Deploy provider**: Amazon ECS (Blue/Green)
- **Region**: Your region
- **Application name**: `jobboard-app`
- **Deployment group**: `jobboard-deployment-group`
- **Amazon ECS task definition**: 
  - Click **BuildArtifact**
  - File name: `taskdef.json`
- **AWS CodeDeploy AppSpec file**:
  - Click **BuildArtifact**
  - File name: `appspec.yaml`
- **Input artifacts**: BuildArtifact
- Click **Next**

**Review:**
- Review all settings
- Click **Create pipeline**

The pipeline will start automatically!

### Step 6.3: Create CodePipeline via AWS CLI

```powershell
# Get role ARN
$PIPELINE_ROLE_ARN = (aws iam get-role --role-name CodePipelineServiceRole --query 'Role.Arn' --output text)

# Create pipeline configuration
@"
{
  "pipeline": {
    "name": "jobboard-pipeline",
    "roleArn": "$PIPELINE_ROLE_ARN",
    "artifactStore": {
      "type": "S3",
      "location": "$ARTIFACT_BUCKET"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "SourceAction",
            "actionTypeId": {
              "category": "Source",
              "owner": "AWS",
              "provider": "CodeCommit",
              "version": "1"
            },
            "configuration": {
              "RepositoryName": "jobboard",
              "BranchName": "main",
              "PollForSourceChanges": "false"
            },
            "outputArtifacts": [
              {
                "name": "SourceArtifact"
              }
            ]
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildAction",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "jobboard-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceArtifact"
              }
            ],
            "outputArtifacts": [
              {
                "name": "BuildArtifact"
              }
            ]
          }
        ]
      },
      {
        "name": "Deploy",
        "actions": [
          {
            "name": "DeployAction",
            "actionTypeId": {
              "category": "Deploy",
              "owner": "AWS",
              "provider": "CodeDeployToECS",
              "version": "1"
            },
            "configuration": {
              "ApplicationName": "jobboard-app",
              "DeploymentGroupName": "jobboard-deployment-group",
              "TaskDefinitionTemplateArtifact": "BuildArtifact",
              "TaskDefinitionTemplatePath": "taskdef.json",
              "AppSpecTemplateArtifact": "BuildArtifact",
              "AppSpecTemplatePath": "appspec.yaml",
              "Image1ArtifactName": "BuildArtifact",
              "Image1ContainerName": "IMAGE1_NAME"
            },
            "inputArtifacts": [
              {
                "name": "BuildArtifact"
              }
            ]
          }
        ]
      }
    ]
  }
}
"@ | Out-File -FilePath pipeline-config.json -Encoding UTF8

# Create pipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline-config.json --region $AWS_REGION

# Create CloudWatch Events rule for automatic triggering
$REPO_ARN = "arn:aws:codecommit:${AWS_REGION}:${AWS_ACCOUNT_ID}:jobboard"
$PIPELINE_ARN = "arn:aws:codepipeline:${AWS_REGION}:${AWS_ACCOUNT_ID}:jobboard-pipeline"

@"
{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "resources": ["$REPO_ARN"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "referenceType": ["branch"],
    "referenceName": ["main"]
  }
}
"@ | Out-File -FilePath event-pattern.json -Encoding UTF8

aws events put-rule `
  --name jobboard-codecommit-trigger `
  --event-pattern file://event-pattern.json `
  --state ENABLED `
  --region $AWS_REGION

aws events put-targets `
  --rule jobboard-codecommit-trigger `
  --targets "Id=1,Arn=$PIPELINE_ARN,RoleArn=$PIPELINE_ROLE_ARN" `
  --region $AWS_REGION
```

---

## Part 7: Testing the Pipeline

### Step 7.1: Monitor Pipeline Execution

**Via AWS Console:**

1. Go to **CodePipeline** → **Pipelines** → **jobboard-pipeline**
2. You'll see three stages:
   - **Source** (Green = Success)
   - **Build** (In progress / Blue)
   - **Deploy** (Waiting)

3. Click on **Details** in each stage to see logs

**Via AWS CLI:**

```powershell
# Get pipeline status
aws codepipeline get-pipeline-state `
  --name jobboard-pipeline `
  --region $AWS_REGION

# Watch build logs
aws logs tail /aws/codebuild/jobboard-build --follow --region $AWS_REGION

# Watch ECS deployment
aws ecs describe-services `
  --cluster jobboard-cluster `
  --services jobboard-service `
  --region $AWS_REGION `
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Deployments:deployments}'
```

### Step 7.2: Test Code Changes Trigger Pipeline

Make a simple change to test the pipeline:

```powershell
# Make a change to README
"# Updated on $(Get-Date)" | Add-Content README.md

# Commit and push
git add README.md
git commit -m "Test pipeline trigger"
git push codecommit main
```

**Watch the pipeline automatically start:**

```powershell
# Check pipeline execution
aws codepipeline list-pipeline-executions `
  --pipeline-name jobboard-pipeline `
  --region $AWS_REGION

# Get latest execution status
$EXECUTION_ID = (aws codepipeline list-pipeline-executions --pipeline-name jobboard-pipeline --region $AWS_REGION --query 'pipelineExecutionSummaries[0].pipelineExecutionId' --output text)

aws codepipeline get-pipeline-execution `
  --pipeline-name jobboard-pipeline `
  --pipeline-execution-id $EXECUTION_ID `
  --region $AWS_REGION
```

### Step 7.3: Verify Deployment

After pipeline completes (15-20 minutes):

```powershell
# Get ALB URL
cd terraform
$ALB_URL = terraform output -raw alb_url
cd ..

# Test application
Start-Process $ALB_URL

# Or via PowerShell
Invoke-WebRequest -Uri $ALB_URL
Invoke-WebRequest -Uri "$ALB_URL/api/health"
```

### Step 7.4: View Deployment History

```powershell
# List CodeDeploy deployments
aws deploy list-deployments `
  --application-name jobboard-app `
  --deployment-group-name jobboard-deployment-group `
  --region $AWS_REGION

# Get deployment details
$DEPLOYMENT_ID = (aws deploy list-deployments --application-name jobboard-app --deployment-group-name jobboard-deployment-group --region $AWS_REGION --query 'deployments[0]' --output text)

aws deploy get-deployment `
  --deployment-id $DEPLOYMENT_ID `
  --region $AWS_REGION
```

---

## Part 8: Troubleshooting

### Issue 1: CodeBuild Fails - "Docker daemon not running"

**Solution:** Ensure **Privileged mode** is enabled in CodeBuild

```powershell
aws codebuild update-project `
  --name jobboard-build `
  --environment privilegedMode=true `
  --region $AWS_REGION
```

### Issue 2: CodeBuild Fails - ECR Push Permission Denied

**Check IAM role permissions:**

```powershell
# Verify CodeBuild role has ECR permissions
aws iam get-role-policy `
  --role-name CodeBuildServiceRole `
  --policy-name CodeBuildAdditionalPermissions
```

**Add ECR permissions if missing:**

```powershell
@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:*",
      "Resource": "*"
    }
  ]
}
"@ | Out-File -FilePath ecr-policy.json -Encoding UTF8

aws iam put-role-policy `
  --role-name CodeBuildServiceRole `
  --policy-name ECRAccess `
  --policy-document file://ecr-policy.json
```

### Issue 3: CodeDeploy Fails - Target Group Health Check

**Check target health:**

```powershell
$FRONTEND_TG_ARN = (aws elbv2 describe-target-groups --names jobboard-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text --region $AWS_REGION)

aws elbv2 describe-target-health `
  --target-group-arn $FRONTEND_TG_ARN `
  --region $AWS_REGION
```

**Common fixes:**
- Verify security groups allow traffic between ALB and ECS
- Check container health endpoint responds correctly
- Verify task definition port mappings are correct

### Issue 4: Pipeline Doesn't Auto-Trigger

**Check CloudWatch Events rule:**

```powershell
aws events describe-rule `
  --name jobboard-codecommit-trigger `
  --region $AWS_REGION

aws events list-targets-by-rule `
  --rule jobboard-codecommit-trigger `
  --region $AWS_REGION
```

**Manually trigger pipeline:**

```powershell
aws codepipeline start-pipeline-execution `
  --name jobboard-pipeline `
  --region $AWS_REGION
```

### Issue 5: Task Definition Update Fails

**Verify taskdef.json placeholders are replaced:**

```powershell
# Check buildspec.yml post_build section creates correct artifacts
# Verify imagedefinitions.json is created

# Manual deployment test
aws ecs update-service `
  --cluster jobboard-cluster `
  --service jobboard-service `
  --force-new-deployment `
  --region $AWS_REGION
```

---

## Alternative: Using GitHub Instead of CodeCommit

If you prefer GitHub over CodeCommit:

### Step A1: Create GitHub Connection

1. Go to **AWS Console** → **Developer Tools** → **Connections**
2. Click **Create connection**
3. **Provider**: GitHub
4. **Connection name**: `github-connection`
5. Click **Connect to GitHub**
6. Authorize AWS
7. Install AWS Connector on your GitHub account
8. Select repositories or all repositories
9. Click **Connect**

### Step A2: Push Code to GitHub

```powershell
# Create GitHub repository (via GitHub website)
# Then push code:

git remote add origin https://github.com/YOUR_USERNAME/jobboard.git
git branch -M main
git push -u origin main
```

### Step A3: Modify Pipeline Source Stage

When creating CodePipeline in **Step 6.2**, use these settings for Source stage:

**Source stage:**
- **Source provider**: GitHub (Version 2)
- **Connection**: Select your GitHub connection
- **Repository name**: `YOUR_USERNAME/jobboard`
- **Branch name**: `main`
- **Output artifact format**: CodePipeline default
- **Change detection**: Start the pipeline on source code change

Everything else remains the same!

### Step A4: GitHub Webhook Auto-Configuration

GitHub connections automatically create webhooks. Verify in GitHub:

1. Go to your repository → **Settings** → **Webhooks**
2. You should see AWS CodePipeline webhook
3. Payload URL should point to AWS

---

## Summary Checklist

After completing this guide, you should have:

✅ **CodeCommit/GitHub repository** with your code
✅ **IAM Roles** for CodeBuild, CodeDeploy, and CodePipeline
✅ **CodeBuild project** that builds Docker images
✅ **CodeDeploy application** with deployment group
✅ **S3 bucket** for pipeline artifacts
✅ **CodePipeline** orchestrating the entire flow
✅ **Automated deployments** on every code push
✅ **Blue/Green deployments** for zero downtime
✅ **CloudWatch logs** for monitoring

---

## Next Steps

1. **Set up notifications**: Add SNS topic for pipeline status notifications
2. **Add approval stage**: Manual approval before production deployment
3. **Add test stage**: Run automated tests after build
4. **Configure alarms**: CloudWatch alarms for deployment failures
5. **Cost optimization**: Use CodeBuild compute optimization

---

## Useful Commands Reference

```powershell
# View pipeline status
aws codepipeline get-pipeline-state --name jobboard-pipeline --region us-east-1

# Start pipeline manually
aws codepipeline start-pipeline-execution --name jobboard-pipeline --region us-east-1

# View build logs
aws logs tail /aws/codebuild/jobboard-build --follow --region us-east-1

# List deployments
aws deploy list-deployments --application-name jobboard-app --region us-east-1

# Get ECS service status
aws ecs describe-services --cluster jobboard-cluster --services jobboard-service --region us-east-1

# Force new ECS deployment
aws ecs update-service --cluster jobboard-cluster --service jobboard-service --force-new-deployment --region us-east-1
```

---

**Congratulations! 🎉** Your complete CI/CD pipeline is now set up. Every code push will automatically build, test, and deploy your application with zero downtime!
