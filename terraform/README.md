# Terraform Quick Reference

## Common Commands

### Initialize Terraform
```bash
terraform init
```

### Validate Configuration
```bash
terraform validate
```

### Format Terraform Files
```bash
terraform fmt -recursive
```

### Plan Deployment
```bash
terraform plan
```

### Apply Configuration
```bash
terraform apply
# or auto-approve
terraform apply -auto-approve
```

### Destroy Infrastructure
```bash
terraform destroy
```

### Show Current State
```bash
terraform show
```

### List Resources
```bash
terraform state list
```

### View Outputs
```bash
# All outputs
terraform output

# Specific output
terraform output alb_dns_name

# Output in raw format (no quotes)
terraform output -raw alb_dns_name
```

### Refresh State
```bash
terraform refresh
```

### Import Existing Resource
```bash
terraform import <resource_type>.<resource_name> <resource_id>
```

## Terraform File Structure

```
terraform/
├── provider.tf          # Provider configuration (AWS)
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── vpc.tf              # VPC and networking resources
├── security_groups.tf  # Security group configurations
├── iam.tf              # IAM roles and policies
├── ecr.tf              # ECR repositories
├── secrets.tf          # Secrets Manager resources
├── rds.tf              # RDS database
├── cloudwatch.tf       # CloudWatch log groups
├── alb.tf              # Application Load Balancer
└── ecs.tf              # ECS cluster, service, and task definitions
```

## Resource Overview

### Created Resources

- **VPC**: 1 VPC with DNS support
- **Subnets**: 2 public + 2 private subnets across 2 AZs
- **Internet Gateway**: 1 IGW for public internet access
- **NAT Gateway**: 1 NAT Gateway for private subnet internet access
- **Route Tables**: 2 route tables (public, private)
- **Security Groups**: 3 security groups (ALB, ECS instances, RDS)
- **IAM Roles**: 3 roles (task execution, task, instance)
- **ECR Repositories**: 2 repositories (backend, frontend)
- **Secrets Manager**: 2 secrets (DB password, JWT secret)
- **RDS**: 1 PostgreSQL instance
- **ECS**: 1 cluster with auto-scaling group
- **ALB**: 1 Application Load Balancer with 2 target groups
- **CloudWatch**: 1 log group

**Total Resources**: ~45 resources

## Variables

### Required Variables
None - all have defaults

### Optional Variables (with defaults)
- `aws_region` (default: us-east-1)
- `environment` (default: prod)
- `project_name` (default: jobboard)
- `vpc_cidr` (default: 10.0.0.0/16)
- `db_instance_class` (default: db.t3.micro)
- `ecs_instance_type` (default: t3.small)
- `ecs_desired_capacity` (default: 2)

### Override Variables

Create `terraform.tfvars`:
```hcl
aws_region = "us-west-2"
environment = "staging"
ecs_desired_capacity = 1
```

## Outputs

- `vpc_id` - VPC identifier
- `alb_dns_name` - Load balancer DNS name
- `alb_url` - Application URL
- `rds_endpoint` - Database endpoint
- `ecr_backend_repository_url` - Backend ECR URL
- `ecr_frontend_repository_url` - Frontend ECR URL
- `ecs_cluster_name` - ECS cluster name
- `ecs_service_name` - ECS service name

## Troubleshooting

### Clear Terraform Cache
```bash
rm -rf .terraform .terraform.lock.hcl
terraform init
```

### View Detailed Logs
```bash
TF_LOG=DEBUG terraform apply
```

### Target Specific Resource
```bash
terraform apply -target=aws_ecs_service.main
```

### Taint Resource (Force Recreate)
```bash
terraform taint aws_ecs_service.main
terraform apply
```
