# IAM Role for AWS Step Functions
resource "aws_iam_role" "step_functions_role" {
  name = "${var.project_name}-sfn-saga-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "states.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_policy" "sfn_lambda_invoke" {
  name = "${var.project_name}-sfn-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sfn_policy_attach" {
  role       = aws_iam_role.step_functions_role.name
  policy_arn = aws_iam_policy.sfn_lambda_invoke.arn
}

# AWS Step Functions State Machine: Travel Itinerary Saga Orchestrator
resource "aws_sfn_state_machine" "booking_saga" {
  name     = "${var.project_name}-booking-saga"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = templatefile("${path.module}/../../backend/state-machine/booking-saga.asl.json", {
    ReserveHotelLambdaArn        = aws_lambda_function.reserve_hotel.arn
    BookCabLambdaArn             = aws_lambda_function.book_cab.arn
    CalculateFeesLambdaArn       = aws_lambda_function.calculate_fees.arn
    VerifyCryptoPaymentLambdaArn = aws_lambda_function.verify_crypto_payment.arn
    ConfirmBookingLambdaArn      = aws_lambda_function.confirm_booking.arn
    GenerateInvoiceLambdaArn     = aws_lambda_function.generate_invoice.arn
    CancelCabLambdaArn           = aws_lambda_function.cancel_cab.arn
    CancelHotelLambdaArn         = aws_lambda_function.cancel_hotel.arn
    RefundCryptoLambdaArn        = aws_lambda_function.refund_crypto.arn
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions_logs.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-step-functions-saga"
    Pattern     = "SagaCompensation"
  }
}
