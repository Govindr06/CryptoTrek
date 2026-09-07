# AWS Key Management Service (KMS) & Payment Cryptography Key
resource "aws_kms_key" "payment_crypto_key" {
  description             = "KMS Customer Managed Key for securing digital wallets, signing payment receipts, and encrypting DBs"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root IAM Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::123456789012:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda and Step Functions Cryptographic Signing"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_exec.arn
        }
        Action = [
          "kms:Sign",
          "kms:Verify",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-kms-payment-crypto-key"
  }
}

resource "aws_kms_alias" "payment_crypto_alias" {
  name          = "alias/${var.project_name}-payment-signer"
  target_key_id = aws_kms_key.payment_crypto_key.key_id
}
