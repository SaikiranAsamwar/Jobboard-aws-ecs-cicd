variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "jobboard"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# RDS Configuration
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "jobboard"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# ECS Configuration
variable "ecs_instance_type" {
  description = "EC2 instance type for ECS cluster"
  type        = string
  default     = "t3.small"
}

variable "ecs_desired_capacity" {
  description = "Desired number of ECS instances"
  type        = number
  default     = 2
}

variable "ecs_max_size" {
  description = "Maximum number of ECS instances"
  type        = number
  default     = 4
}

variable "ecs_min_size" {
  description = "Minimum number of ECS instances"
  type        = number
  default     = 1
}

# Container Configuration
variable "backend_cpu" {
  description = "CPU units for backend container"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory for backend container in MB"
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "CPU units for frontend container"
  type        = number
  default     = 512
}

variable "frontend_memory" {
  description = "Memory for frontend container in MB"
  type        = number
  default     = 1024
}

variable "backend_port" {
  description = "Port for backend container"
  type        = number
  default     = 4000
}

variable "frontend_port" {
  description = "Port for frontend container"
  type        = number
  default     = 80
}
