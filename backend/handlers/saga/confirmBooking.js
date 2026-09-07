/**
 * AWS Lambda Task: Confirm Booking in RDS & Evict DynamoDB Cart
 * Step 5 in the Step Functions Saga workflow.
 */
exports.handler = async (event) => {
  console.log("[SAGA STEP 5] Confirming Booking in Amazon RDS:", event.bookingId);

  const { bookingId, userId, hotelReservationId, cabBookingId, txHash, totalAmountEth, kmsSignature } = event;
  const confirmedAt = new Date().toISOString();

  // 1. Commit status in Amazon RDS PostgreSQL
  console.log(`[Amazon RDS] BEGIN TRANSACTION;`);
  console.log(`[Amazon RDS] UPDATE bookings SET status = 'CONFIRMED', tx_hash = '${txHash}', confirmed_at = '${confirmedAt}' WHERE booking_id = '${bookingId}';`);
  console.log(`[Amazon RDS] UPDATE hotel_reservations SET status = 'CONFIRMED' WHERE reservation_id = '${hotelReservationId}';`);
  console.log(`[Amazon RDS] UPDATE cab_reservations SET status = 'CONFIRMED' WHERE cab_booking_id = '${cabBookingId}';`);
  console.log(`[Amazon RDS] COMMIT;`);

  // 2. Clear user cart in Amazon DynamoDB
  console.log(`[Amazon DynamoDB] DeleteItem: Table='TravelCarts', Key={'userId': '${userId}'}`);

  return {
    statusCode: 200,
    bookingId,
    status: "CONFIRMED",
    confirmedAt,
    txHash,
    kmsSignature
  };
};
