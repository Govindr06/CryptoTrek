/**
 * AWS Lambda Task: Calculate Extra Fees & Gas Estimate
 * Step 3 in the Step Functions Saga workflow.
 */
exports.handler = async (event) => {
  console.log("[SAGA STEP 3] Calculating Platform Fees & Gas for Booking:", event.bookingId);

  const hotelRate = parseFloat(event.hotelRateEth || "0");
  const cabRate = parseFloat(event.cabRateEth || "0");
  const subtotalEth = hotelRate + cabRate;

  // 2.5% platform protocol fee
  const platformFeeEth = (subtotalEth * 0.025).toFixed(5);
  
  // Approximate Sepolia gas fee (21000 base + contract execution ~ 65000 gas @ 15 gwei)
  const estimatedGasWei = "975000000000000"; // ~0.000975 ETH
  const totalAmountEth = (subtotalEth + parseFloat(platformFeeEth)).toFixed(5);

  return {
    statusCode: 200,
    bookingId: event.bookingId,
    subtotalEth: subtotalEth.toFixed(5),
    platformFeeEth,
    estimatedGasWei,
    totalAmountEth,
    currency: "ETH",
    network: "Ethereum Sepolia (ChainId: 11155111)"
  };
};
