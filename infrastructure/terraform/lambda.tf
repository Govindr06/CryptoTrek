# Security Group for Lambda Functions
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security Group for Lambda Functions accessing RDS, Redis, and EC2 node"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_cloud_policy" {
  name = "${var.project_name}-lambda-cloud-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.travel_carts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.invoices_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Sign",
          "kms:Verify",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.payment_crypto_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_cloud_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Package Backend Code Archive
data "archive_file" "backend_payload" {
  type        = "zip"
  source_dir  = "${path.module}/../../backend"
  output_path = "${path.module}/lambda_payload.zip"
  excludes    = ["node_modules", "package-lock.json", "lambda_payload.zip"]
}

# Lambda Microservices for Saga Workflow
resource "aws_lambda_function" "reserve_hotel" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-reserve-hotel"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/reserveHotel.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "cancel_hotel" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-cancel-hotel"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/cancelHotel.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "book_cab" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-book-cab"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/bookCab.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "cancel_cab" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-cancel-cab"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/cancelCab.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "calculate_fees" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-calculate-fees"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/calculateFees.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "verify_crypto_payment" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-verify-crypto-payment"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/verifyCryptoPayment.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 45

  environment {
    variables = {
      KMS_KEY_ID = aws_kms_key.payment_crypto_key.arn
    }
  }
}

resource "aws_lambda_function" "confirm_booking" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-confirm-booking"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/confirmBooking.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "refund_crypto" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-refund-crypto"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/refundCrypto.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "generate_invoice" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-generate-invoice"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/saga/generateInvoice.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30

  environment {
    variables = {
      INVOICES_BUCKET_NAME = aws_s3_bucket.invoices_bucket.id
    }
  }
}

resource "aws_lambda_function" "inventory_api" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-inventory-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/inventory.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}

resource "aws_lambda_function" "cart_api" {
  filename         = data.archive_file.backend_payload.output_path
  function_name    = "${var.project_name}-cart-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handlers/cart.handler"
  source_code_hash = data.archive_file.backend_payload.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
}
