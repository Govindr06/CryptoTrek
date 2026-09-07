# Amazon DynamoDB Table for Cart & Session Management
resource "aws_dynamodb_table" "travel_carts" {
  name         = "${var.project_name}-travel-carts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-travel-carts-dynamodb"
    Description = "Fast ephemeral cart and session management with TTL"
  }
}
