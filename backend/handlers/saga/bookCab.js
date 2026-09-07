/**
 * AWS Lambda Task: Book Cab
 * Step 2 in the Step Functions Saga workflow.
 * Reserves cab transfer in Amazon RDS.
 */
exports.handler = async (event) => {
  console.log("[SAGA STEP 2] Executing BookCab for Booking:", event.bookingId);

  const { bookingId, userId, cabId, pickupLocation, dropoffLocation, pickupTime, cabRateEth } = event;

  if (!bookingId || !cabId) {
    throw new Error("Missing required parameters for BookCab");
  }

  // Simulated RDS PostgreSQL insertion
  const cabBookingId = `CAB-RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const cabRecord = {
    cabBookingId,
    bookingId,
    userId,
    cabId,
    pickupLocation: pickupLocation || "Airport International Terminal",
    dropoffLocation: dropoffLocation || "Selected Hotel Destination",
    pickupTime: pickupTime || new Date().toISOString(),
    rateEth: cabRateEth,
    status: "RESERVED",
    createdAt: new Date().toISOString()
  };

  console.log("[RDS PostgreSQL] INSERT INTO cab_reservations:", JSON.stringify(cabRecord));

  return {
    statusCode: 200,
    cabBookingId,
    status: "RESERVED",
    cabDetails: cabRecord
  };
};
