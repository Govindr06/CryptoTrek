# Amazon CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "step_functions_logs" {
  name              = "/aws/vendedlogs/states/${var.project_name}-saga"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "apigw_logs" {
  name              = "/aws/apigateway/${var.project_name}-access-logs"
  retention_in_days = 30
}

# CloudWatch Alarm: Crypto Payment Verification Failures
resource "aws_cloudwatch_metric_alarm" "payment_failure_alarm" {
  alarm_name          = "${var.project_name}-PaymentVerificationFailures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedBookings"
  namespace           = "CryptoVoyage/Platform"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Triggers when more than 3 crypto payment verifications fail within 5 minutes"
}

# CloudWatch Dashboard for Full-Stack Monitoring
resource "aws_cloudwatch_dashboard" "main_dashboard" {
  dashboard_name = "${var.project_name}-Production-Overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["CryptoVoyage/Platform", "SuccessfulBookings", { stat = "Sum", color = "#2ca02c" }],
            [".", "FailedBookings", { stat = "Sum", color = "#d62728" }],
            [".", "SagaRollbacks", { stat = "Sum", color = "#ff7f0e" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Saga Workflow Execution & Rollback Telemetry"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.postgres.identifier],
            ["AWS/ElastiCache", "CacheHitRate", "ReplicationGroupId", aws_elasticache_replication_group.redis.id]
          ]
          view    = "timeSeries"
          region  = var.aws_region
          title   = "RDS Database & ElastiCache Performance"
        }
      }
    ]
  })
}
