# Amazon RDS PostgreSQL for Persistent Structured Booking Records
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-rds-subnets"
  subnet_ids = ["subnet-0a1b2c3d4e5f60001", "subnet-0a1b2c3d4e5f60002"] # Replace with VPC Subnet IDs

  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow inbound PostgreSQL traffic from Lambda security group"

  ingress {
    from_port       = 5432
    to_port         = 5432
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

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-rds-postgres"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = "db.t4g.medium"
  db_name                = "cryptovoyagedb"
  username               = "cloudadmin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  multi_az               = true
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.payment_crypto_key.arn

  tags = {
    Name = "${var.project_name}-rds-postgres"
  }
}
