variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name identifier"
  type        = string
  default     = "cryptovoyage"
}

variable "domain_name" {
  description = "Custom domain name registered in Amazon Route 53"
  type        = string
  default     = "cryptovoyage.travel"
}

variable "db_password" {
  description = "Password for Amazon RDS PostgreSQL administrator"
  type        = string
  default     = "CryptoVoyageSecurePassword2026!"
  sensitive   = true
}

variable "ethereum_network" {
  description = "Target Ethereum blockchain network"
  type        = string
  default     = "sepolia"
}
