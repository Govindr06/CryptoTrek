output "route53_nameservers" {
  description = "Amazon Route 53 Hosted Zone Name Servers"
  value       = aws_route53_zone.primary.name_servers
}

output "cloudfront_domain_name" {
  description = "Amazon CloudFront CDN Distribution Endpoint"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cognito_user_pool_id" {
  description = "Amazon Cognito User Pool ID"
  value       = aws_cognito_user_pool.pool.id
}

output "cognito_client_id" {
  description = "Amazon Cognito Application Client ID"
  value       = aws_cognito_user_pool_client.client.id
}

output "api_gateway_url" {
  description = "Amazon API Gateway Production Invoke URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "step_functions_saga_arn" {
  description = "AWS Step Functions Saga State Machine ARN"
  value       = aws_sfn_state_machine.booking_saga.arn
}

output "dynamodb_table_name" {
  description = "Amazon DynamoDB Cart Table Name"
  value       = aws_dynamodb_table.travel_carts.name
}

output "rds_endpoint" {
  description = "Amazon RDS PostgreSQL Primary Endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "elasticache_redis_endpoint" {
  description = "Amazon ElastiCache Redis Primary Endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "kms_key_arn" {
  description = "AWS KMS Payment Cryptography Key ARN"
  value       = aws_kms_key.payment_crypto_key.arn
}

output "s3_invoices_bucket" {
  description = "Amazon S3 Invoices Bucket"
  value       = aws_s3_bucket.invoices_bucket.bucket
}

output "ec2_blockchain_node_ip" {
  description = "Amazon EC2 Ethereum Sepolia Node Public IP"
  value       = aws_instance.blockchain_node.public_ip
}
