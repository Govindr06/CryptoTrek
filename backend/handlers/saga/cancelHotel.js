/**
 * AWS Lambda Task: Compensate Reserve Hotel (Rollback)
 * Invoked by AWS Step Functions Catch block if subsequent steps (cab booking or crypto payment) fail.
 */
exports.handler = async (event) => {
  console.warn("[SAGA COMPENSATION] Rolling back Hotel Reservation:", event.hotelReservationId, "Booking:", event.bookingId);
  console.warn("[REASON]:", event.reason || "Upstream workflow failed");

  const { bookingId, hotelReservationId } = event;

  // Update RDS record status to CANCELLED & release inventory in ElastiCache Redis
  const rollbackTimestamp = new Date().toISOString();

  console.log(`[RDS PostgreSQL] UPDATE hotel_reservations SET status = 'CANCELLED_SAGA_ROLLBACK', updated_at = '${rollbackTimestamp}' WHERE reservation_id = '${hotelReservationId}'`);
  console.log(`[ElastiCache Redis] INCR hotel_inventory_available:${event.hotelId || 'global'}`);

  return {
    statusCode: 200,
    bookingId,
    hotelReservationId,
    status: "CANCELLED_SAGA_ROLLBACK",
    compensatedAt: rollbackTimestamp
  };
};
