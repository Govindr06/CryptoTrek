/**
 * Local Cloud Dev & Emulation Server
 * Emulates Amazon API Gateway, AWS Lambda, AWS Step Functions (Saga),
 * Amazon DynamoDB, Amazon RDS, Amazon ElastiCache (Redis), AWS KMS,
 * and Amazon S3 for development, local testing, and academic evaluation.
 */

const express = require("express");
const cors = require("cors");

// Import Lambda Handlers
const reserveHotelHandler = require("./handlers/saga/reserveHotel").handler;
const cancelHotelHandler = require("./handlers/saga/cancelHotel").handler;
const bookCabHandler = require("./handlers/saga/bookCab").handler;
const cancelCabHandler = require("./handlers/saga/cancelCab").handler;
const calculateFeesHandler = require("./handlers/saga/calculateFees").handler;
const verifyCryptoPaymentHandler = require("./handlers/saga/verifyCryptoPayment").handler;
const confirmBookingHandler = require("./handlers/saga/confirmBooking").handler;
const refundCryptoHandler = require("./handlers/saga/refundCrypto").handler;
const generateInvoiceHandler = require("./handlers/saga/generateInvoice").handler;
const inventoryHandler = require("./handlers/inventory").handler;
const cartHandler = require("./handlers/cart").handler;
const kmsSigner = require("./handlers/web3/kmsSigner");
const ec2NodeClient = require("./handlers/web3/ec2NodeClient");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-Memory Cloud Database Emulators
const cloudDatabases = {
  // Amazon RDS PostgreSQL
  rds: {
    bookings: [],
    hotel_reservations: [],
    cab_reservations: []
  },
  // Amazon DynamoDB (Table: TravelCarts)
  dynamoDb: {
    travelCarts: {}
  },
  // Amazon ElastiCache (Redis)
  elastiCacheRedis: {
    cacheHits: 42,
    cacheMisses: 3,
    keys: {}
  },
  // Amazon S3 (Bucket: crypto-voyage-invoices-prod)
  s3Invoices: {},
  // Amazon CloudWatch Logs & Metrics
  cloudWatchLogs: [],
  cloudWatchMetrics: {
    SuccessfulBookings: 0,
    FailedBookings: 0,
    SagaRollbacks: 0,
    EthVolumeProcessed: 0
  }
};

function logCloudWatch(service, message, level = "INFO") {
  const entry = {
    timestamp: new Date().toISOString(),
    service,
    level,
    message
  };
  cloudDatabases.cloudWatchLogs.unshift(entry);
  if (cloudDatabases.cloudWatchLogs.length > 100) cloudDatabases.cloudWatchLogs.pop();
  console.log(`[CloudWatch] [${service}] [${level}] ${message}`);
}

// -------------------------------------------------------------
// Amazon Route 53 & API Gateway Health Check
// -------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    routedVia: "Amazon Route 53 (Latency Routing)",
    cdnEdge: "Amazon CloudFront (Edge Location: BOM51-P1)",
    apiGateway: "Amazon API Gateway REST v2",
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// Amazon Cognito Auth Simulation
// -------------------------------------------------------------
app.post("/api/auth/cognito", (req, res) => {
  const { email, username } = req.body;
  const userSub = `cognito-sub-${Math.random().toString(36).substring(2, 10)}`;
  const idToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.aws.cognito.${Buffer.from(JSON.stringify({
    sub: userSub,
    email: email || "traveler@web3travel.io",
    username: username || "crypto_nomad",
    iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CryptoVoyagePool",
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64")}.SIMULATED_SIGNATURE`;

  logCloudWatch("Amazon Cognito", `User authenticated successfully: ${username || email}`);

  res.json({
    userPoolId: "us-east-1_CryptoVoyagePool",
    userSub,
    username: username || "crypto_nomad",
    email: email || "traveler@web3travel.io",
    idToken,
    expiresIn: 3600
  });
});

// -------------------------------------------------------------
// Amazon ElastiCache (Redis) & Inventory
// -------------------------------------------------------------
app.get("/api/inventory", async (req, res) => {
  const city = req.query.city || "";
  logCloudWatch("Amazon ElastiCache", `Querying hotel & cab availability for destination: '${city || 'ALL'}'`);
  const response = await inventoryHandler({ queryStringParameters: { city } });
  cloudDatabases.elastiCacheRedis.cacheHits += 1;
  res.status(response.statusCode).set(response.headers).send(response.body);
});

// -------------------------------------------------------------
// Amazon DynamoDB: Cart & Session Management
// -------------------------------------------------------------
app.get("/api/cart", async (req, res) => {
  const userId = req.query.userId || "demo-user-1";
  logCloudWatch("Amazon DynamoDB", `GetItem from Table 'TravelCarts' for partition key: ${userId}`);
  const existing = cloudDatabases.dynamoDb.travelCarts[userId] || { items: [], totalEth: "0.00" };
  res.json({ userId, cart: existing, ttl: Math.floor(Date.now() / 1000) + 3600 });
});

app.post("/api/cart", async (req, res) => {
  const { userId, cart } = req.body;
  const uid = userId || "demo-user-1";
  cloudDatabases.dynamoDb.travelCarts[uid] = cart;
  logCloudWatch("Amazon DynamoDB", `PutItem into Table 'TravelCarts' for ${uid}. Item count: ${cart.items ? cart.items.length : 0}`);
  res.json({ success: true, message: "Cart saved to DynamoDB with 1hr TTL", cart });
});

// -------------------------------------------------------------
// AWS Step Functions: Saga Workflow Orchestrator
// -------------------------------------------------------------
app.post("/api/saga/execute-booking", async (req, res) => {
  const { bookingId, userId, itinerary, payment, simulateFailure } = req.body;

  const executionArn = `arn:aws:states:us-east-1:123456789012:execution:CryptoVoyageSaga:${bookingId}`;
  logCloudWatch("AWS Step Functions", `Starting Saga Execution: ${executionArn}`);

  const stepHistory = [];
  const addStep = (stepName, status, details) => {
    stepHistory.push({
      step: stepName,
      status, // "SUCCESS" | "FAILED" | "COMPENSATING" | "ROLLED_BACK"
      timestamp: new Date().toISOString(),
      details
    });
  };

  try {
    // -----------------------------------------
    // STEP 1: Reserve Hotel (Lambda)
    // -----------------------------------------
    addStep("ReserveHotelTask", "IN_PROGRESS", "Holding room inventory in RDS & ElastiCache");
    const hotelResult = await reserveHotelHandler({
      bookingId,
      userId,
      hotelId: itinerary.hotelId,
      checkIn: itinerary.checkIn,
      checkOut: itinerary.checkOut,
      guests: itinerary.guests,
      hotelRateEth: itinerary.hotelRateEth
    });
    cloudDatabases.rds.hotel_reservations.push(hotelResult.hotelDetails);
    addStep("ReserveHotelTask", "SUCCESS", `Reservation held with ID: ${hotelResult.reservationId}`);
    logCloudWatch("AWS Lambda [ReserveHotel]", `Hotel held successfully: ${hotelResult.reservationId}`);

    // -----------------------------------------
    // STEP 2: Book Cab (Lambda)
    // -----------------------------------------
    addStep("BookCabTask", "IN_PROGRESS", "Reserving airport transfer cab in RDS");
    const cabResult = await bookCabHandler({
      bookingId,
      userId,
      cabId: itinerary.cabId,
      pickupLocation: itinerary.pickupLocation,
      dropoffLocation: itinerary.dropoffLocation,
      pickupTime: itinerary.pickupTime,
      cabRateEth: itinerary.cabRateEth
    });
    cloudDatabases.rds.cab_reservations.push(cabResult.cabDetails);
    addStep("BookCabTask", "SUCCESS", `Cab reserved with ID: ${cabResult.cabBookingId}`);
    logCloudWatch("AWS Lambda [BookCab]", `Cab reserved successfully: ${cabResult.cabBookingId}`);

    // -----------------------------------------
    // STEP 3: Calculate Extra Fees & Gas
    // -----------------------------------------
    addStep("CalculateFeesTask", "IN_PROGRESS", "Computing 2.5% protocol fee and network gas");
    const feeResult = await calculateFeesHandler({
      bookingId,
      hotelRateEth: itinerary.hotelRateEth,
      cabRateEth: itinerary.cabRateEth
    });
    addStep("CalculateFeesTask", "SUCCESS", `Total computed: ${feeResult.totalAmountEth} ETH (incl. gas & fee)`);
    logCloudWatch("AWS Lambda [CalculateFees]", `Total calculated: ${feeResult.totalAmountEth} ETH`);

    // -----------------------------------------
    // STEP 4: Verify Crypto Payment (Sepolia / EC2 / KMS)
    // -----------------------------------------
    addStep("VerifyCryptoPaymentTask", "IN_PROGRESS", "Verifying Sepolia Blockchain ledger via EC2 Node & KMS");
    
    // Check if failure is simulated or genuine
    if (simulateFailure === true || (payment && payment.txHash === "0xFAIL_SIMULATION")) {
      throw new Error("Simulated Crypto Payment Failure: Transaction reverted on Sepolia or Gas Limit Exceeded");
    }

    const paymentResult = await verifyCryptoPaymentHandler({
      bookingId,
      userId,
      txHash: (payment && payment.txHash) || `0x${require("crypto").randomBytes(32).toString("hex")}`,
      expectedAmountEth: feeResult.totalAmountEth,
      walletAddress: (payment && payment.walletAddress) || "0xTravelerMetaMask",
      escrowContractAddress: "0x35b9A4753f81c4DEa96bdeff3a44fdE5E6D4b752"
    });
    addStep("VerifyCryptoPaymentTask", "SUCCESS", `Payment confirmed on Sepolia Block #${paymentResult.blockNumber}. Signed with AWS KMS.`);
    logCloudWatch("AWS Lambda [VerifyCryptoPayment]", `Verified Sepolia tx: ${paymentResult.txHash} with KMS Key`);

    // -----------------------------------------
    // STEP 5: Confirm Booking in Amazon RDS & Evict DynamoDB
    // -----------------------------------------
    addStep("ConfirmBookingTask", "IN_PROGRESS", "Committing ACID transaction to RDS & clearing DynamoDB Cart");
    const confirmResult = await confirmBookingHandler({
      bookingId,
      userId,
      hotelReservationId: hotelResult.reservationId,
      cabBookingId: cabResult.cabBookingId,
      txHash: paymentResult.txHash,
      totalAmountEth: feeResult.totalAmountEth,
      kmsSignature: paymentResult.kmsSignature
    });
    delete cloudDatabases.dynamoDb.travelCarts[userId];
    addStep("ConfirmBookingTask", "SUCCESS", "RDS status updated to CONFIRMED. DynamoDB cart cleared.");
    logCloudWatch("Amazon RDS", `ACID transaction committed for booking ${bookingId}`);

    // -----------------------------------------
    // STEP 6: Generate Invoice to Amazon S3 & CloudWatch Metrics
    // -----------------------------------------
    addStep("GenerateInvoiceTask", "IN_PROGRESS", "Generating encrypted invoice and uploading to Amazon S3");
    const invoiceResult = await generateInvoiceHandler({
      bookingId,
      userId,
      itinerary,
      fees: feeResult,
      payment: paymentResult,
      txHash: paymentResult.txHash
    });
    cloudDatabases.s3Invoices[bookingId] = invoiceResult.invoiceSummary;
    cloudDatabases.cloudWatchMetrics.SuccessfulBookings += 1;
    cloudDatabases.cloudWatchMetrics.EthVolumeProcessed += parseFloat(feeResult.totalAmountEth);
    addStep("GenerateInvoiceTask", "SUCCESS", `Invoice saved to Amazon S3: ${invoiceResult.s3Key}`);
    logCloudWatch("Amazon S3", `Stored invoice object: ${invoiceResult.s3Key}`);

    // Complete Booking
    const finalRecord = {
      bookingId,
      userId,
      status: "CONFIRMED",
      itinerary,
      payment: paymentResult,
      invoice: invoiceResult,
      completedAt: new Date().toISOString()
    };
    cloudDatabases.rds.bookings.push(finalRecord);

    return res.json({
      executionArn,
      status: "COMPLETED",
      bookingId,
      stepHistory,
      invoiceUrl: invoiceResult.presignedUrl,
      invoiceSummary: invoiceResult.invoiceSummary,
      paymentDetails: paymentResult
    });

  } catch (error) {
    // -------------------------------------------------------------
    // SAGA ROLLBACK & COMPENSATION EXECUTION
    // -------------------------------------------------------------
    logCloudWatch("AWS Step Functions", `SAGA FAILURE DETECTED: ${error.message}. Triggering automated compensation.`, "ERROR");
    cloudDatabases.cloudWatchMetrics.FailedBookings += 1;
    cloudDatabases.cloudWatchMetrics.SagaRollbacks += 1;

    addStep("SagaPaymentFailureTrigger", "TRIGGERED", `Error: ${error.message}`);

    // Rollback Step 1: Cancel Cab
    addStep("CompensateCabBooking", "IN_PROGRESS", "Invoking CancelCab compensating Lambda");
    const cabCancelResult = await cancelCabHandler({
      bookingId,
      cabBookingId: "CAB-IN-PROGRESS",
      reason: error.message
    });
    addStep("CompensateCabBooking", "ROLLED_BACK", "Cab reservation cancelled in Amazon RDS");

    // Rollback Step 2: Cancel Hotel
    addStep("CompensateHotelReservation", "IN_PROGRESS", "Invoking CancelHotel compensating Lambda & releasing ElastiCache hold");
    const hotelCancelResult = await cancelHotelHandler({
      bookingId,
      hotelReservationId: "HTL-IN-PROGRESS",
      reason: error.message
    });
    addStep("CompensateHotelReservation", "ROLLED_BACK", "Hotel reservation cancelled and inventory restored");

    // Rollback Step 3: Refund Smart Contract
    addStep("CompensateCryptoRefund", "IN_PROGRESS", "Triggering smart contract refund on Sepolia via EC2 Node & KMS");
    const refundResult = await refundCryptoHandler({
      bookingId,
      reason: error.message
    });
    addStep("CompensateCryptoRefund", "ROLLED_BACK", `Refunded to MetaMask wallet. Sepolia Tx: ${refundResult.refundTxHash}`);

    return res.status(400).json({
      executionArn,
      status: "FAILED_ROLLED_BACK",
      bookingId,
      errorMessage: error.message,
      stepHistory,
      refundDetails: refundResult
    });
  }
});

// -------------------------------------------------------------
// Amazon S3: Get Invoice
// -------------------------------------------------------------
app.get("/api/invoices/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const invoice = cloudDatabases.s3Invoices[bookingId];
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found in S3 bucket" });
  }
  res.json({
    s3Bucket: "crypto-voyage-invoices-prod",
    s3Key: `invoices/${invoice.userId}/${bookingId}-invoice.json`,
    invoice
  });
});

// -------------------------------------------------------------
// Amazon EC2 Blockchain Node Status
// -------------------------------------------------------------
app.get("/api/node/status", async (req, res) => {
  const block = await ec2NodeClient.getLatestBlock();
  res.json({
    instanceId: "i-0987fec2blockchainnode",
    instanceType: "t3.xlarge",
    client: "Geth / Go-Ethereum v1.13.14 (Sepolia Execution Node)",
    status: "SYNCED",
    peerCount: 38,
    latestBlock: block.blockNumber,
    chain: "Ethereum Sepolia (ChainId: 11155111)",
    kmsProtected: true,
    securityGroup: "sg-01a2b3c4-ec2-node-sepolia"
  });
});

// -------------------------------------------------------------
// Amazon CloudWatch Telemetry & Metrics
// -------------------------------------------------------------
app.get("/api/cloudwatch/telemetry", (req, res) => {
  res.json({
    metrics: cloudDatabases.cloudWatchMetrics,
    recentLogs: cloudDatabases.cloudWatchLogs.slice(0, 20),
    services: {
      route53: { status: "ACTIVE", healthCheck: "PASSING" },
      cloudFront: { status: "DEPLOYED", distributionId: "E1A2B3C4D5E6F7" },
      cognito: { status: "ACTIVE", userPool: "us-east-1_CryptoVoyagePool" },
      apiGateway: { status: "ACTIVE", latencyAvgMs: 14.2 },
      lambdaFunctionsCount: 9,
      stepFunctionsSaga: { status: "READY", stateMachine: "CryptoVoyageSaga" },
      dynamoDb: { status: "ACTIVE", table: "TravelCarts", readCapacity: "OnDemand" },
      rdsPostgres: { status: "AVAILABLE", engine: "PostgreSQL 16.2", multiAz: true },
      elastiCacheRedis: { status: "AVAILABLE", nodeType: "cache.t4g.medium", hits: cloudDatabases.elastiCacheRedis.cacheHits },
      kms: { status: "ENABLED", keyArn: "arn:aws:kms:us-east-1:123456789012:key/crypto-voyage-payment-key" },
      s3: { status: "ACTIVE", bucket: "crypto-voyage-invoices-prod" },
      ec2Node: { status: "RUNNING", network: "Sepolia Testnet" }
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CryptoVoyage Cloud & Web3 Backend Server`);
  console.log(`🌐 Emulating AWS API Gateway, Lambda, Step Functions Saga,`);
  console.log(`   DynamoDB, RDS PostgreSQL, ElastiCache Redis, KMS, S3,`);
  console.log(`   CloudWatch, and Amazon EC2 Sepolia Node.`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
