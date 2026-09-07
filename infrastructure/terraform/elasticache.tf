# Amazon ElastiCache (Redis) for In-Memory Hotel Availability & Rate Caching
resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "${var.project_name}-redis-subnets"
  subnet_ids = ["subnet-0a1b2c3d4e5f60001", "subnet-0a1b2c3d4e5f60002"]
}

resource "aws_security_group" "redis_sg" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for ElastiCache Redis cluster"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.project_name}-redis-cache"
  description                   = "Redis cluster for frequently searched hotel availability and crypto exchange rates"
  node_type                     = "cache.t4g.small"
  num_cache_clusters            = 2
  port                          = 6379
  parameter_group_name          = "default.redis7"
  subnet_group_name             = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids            = [aws_security_group.redis_sg.id]
  automatic_failover_enabled    = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  kms_key_id                    = aws_kms_key.payment_crypto_key.arn

  tags = {
    Name = "${var.project_name}-elasticache-redis"
  }
}
