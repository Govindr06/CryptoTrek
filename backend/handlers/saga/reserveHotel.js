/**
 * AWS Lambda Task: Reserve Hotel
 * Step 1 in the Step Functions Saga workflow.
 * Holds room inventory in Amazon RDS / ElastiCache with a temporary TTL hold.
 */
exports.handler = async (event) => {
  console.log("[SAGA STEP 1] Executing ReserveHotel for Booking:", event.bookingId);

  const { bookingId, userId, hotelId, checkIn, checkOut, guests, hotelRateEth } = event;

  if (!bookingId || !hotelId) {
    throw new Error("Missing required parameters for ReserveHotel");
  }

  // Simulated RDS PostgreSQL row insertion & lock hold
  const reservationId = `HTL-RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute hold

  const reservationRecord = {
    reservationId,
    bookingId,
    userId,
    hotelId,
    checkIn,
    checkOut,
    guests: guests || 1,
    rateEth: hotelRateEth,
    status: "HOLD_PLACED",
    expiresAt,
    createdAt: new Date().toISOString()
  };

  console.log("[RDS PostgreSQL] INSERT INTO hotel_reservations:", JSON.stringify(reservationRecord));

  return {
    statusCode: 200,
    reservationId,
    status: "HOLD_PLACED",
    expiresAt,
    hotelDetails: reservationRecord
  };
};
