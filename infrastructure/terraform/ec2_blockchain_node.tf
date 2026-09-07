# Amazon EC2 Instance for Dedicated Ethereum Sepolia Blockchain Node
resource "aws_security_group" "ec2_node_sg" {
  name        = "${var.project_name}-ec2-node-sg"
  description = "Security group for Ethereum Sepolia blockchain node"

  ingress {
    description = "P2P Blockchain discovery & sync"
    from_port   = 30303
    to_port     = 30303
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "P2P UDP discovery"
    from_port   = 30303
    to_port     = 30303
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "JSON-RPC from Lambda microservices"
    from_port       = 8545
    to_port         = 8545
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-node-sg"
  }
}

resource "aws_iam_role" "ec2_node_role" {
  name = "${var.project_name}-ec2-blockchain-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_node_profile" {
  name = "${var.project_name}-ec2-node-profile"
  role = aws_iam_role.ec2_node_role.name
}

resource "aws_instance" "blockchain_node" {
  ami                  = "ami-0c7217cdde317cfec" # Amazon Linux 2023
  instance_type        = "t3.xlarge"
  iam_instance_profile = aws_iam_instance_profile.ec2_node_profile.name
  vpc_security_group_ids = [aws_security_group.ec2_node_sg.id]

  root_block_device {
    volume_size = 200
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = aws_kms_key.payment_crypto_key.arn
  }

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker

              # Run Ethereum Go-Ethereum (Geth) Execution Client connected to Sepolia Testnet
              docker run -d --name sepolia-node \
                --restart always \
                -p 8545:8545 -p 30303:30303 -p 30303:30303/udp \
                ethereum/client-go:v1.13.14 \
                --sepolia \
                --http --http.addr "0.0.0.0" --http.port 8545 \
                --http.api "eth,net,web3" \
                --http.corsdomain "*"
              EOF

  tags = {
    Name = "${var.project_name}-sepolia-blockchain-node"
    Role = "LedgerVerification"
  }
}
