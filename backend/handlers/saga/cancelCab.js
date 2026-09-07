/**
 * AWS Lambda Task: Compensate Cab Booking (Rollback)
 * Invoked by AWS Step Functions Catch block if crypto payment fails.
 */
exports.handler = async (event) => {
  console.warn("[SAGA COMPENSATION] Rolling back Cab Booking:", event.cabBookingId, "Booking:", event.bookingId);
  console.warn("[REASON]:", event.reason || "Payment step failed");

  const { bookingId, cabBookingId } = event;
  const rollbackTimestamp = new Date().toISOString();

  console.log(`[RDS PostgreSQL] UPDATE cab_reservations SET status = 'CANCELLED_SAGA_ROLLBACK', updated_at = '${rollbackTimestamp}' WHERE cab_booking_id = '${cabBookingId}'`);

  return {
    statusCode: 200,
    bookingId,
    cabBookingId,
    status: "CANCELLED_SAGA_ROLLBACK",
    compensatedAt: rollbackTimestamp
  };
};
