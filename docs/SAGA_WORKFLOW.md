# Distributed Workflow & Saga Pattern Specification

## 1. Context & Business Problem
A travel itinerary represents a complex composite transaction consisting of:
1. Reserving a room at a hotel.
2. Reserving a VIP airport transfer cab.
3. Calculating platform protocol fees and dynamic network gas.
4. Verifying a cryptocurrency payment on the Ethereum Sepolia blockchain.
5. Committing confirmed records to a relational database (Amazon RDS).
6. Generating an immutable tax invoice stored in Amazon S3.

Because hotel reservations and cab bookings involve distinct third-party suppliers, and cryptocurrency payments can fail (e.g., wallet out-of-gas, network congestion, user cancellation, transaction reverts), a traditional ACID transaction cannot span these heterogeneous distributed systems.

---

## 2. The Saga Pattern Solution
**CryptoVoyage** implements an **Orchestration-based Saga** using **AWS Step Functions**. In an orchestration-based Saga, a central coordinator (the Step Functions State Machine) tells the participating Lambda microservices what local transactions to execute.

### Saga Workflow States

| State | Action Type | Lambda Function | Target System | Compensating Action |
|---|---|---|---|---|
| **ReserveHotelTask** | Forward | `reserveHotel.js` | Amazon RDS & ElastiCache | `cancelHotel.js` |
| **BookCabTask** | Forward | `bookCab.js` | Amazon RDS | `cancelCab.js` |
| **CalculateFeesTask** | Forward | `calculateFees.js` | AWS Lambda | None (stateless) |
| **VerifyCryptoPaymentTask**| Forward | `verifyCryptoPayment.js` | EC2 Sepolia Node & KMS | Automated Rollback Trigger |
| **ConfirmBookingTask** | Pivot | `confirmBooking.js` | Amazon RDS & DynamoDB | Point of No Return |
| **GenerateInvoiceTask**| Post-Pivot | `generateInvoice.js` | Amazon S3 & CloudWatch | Retry policy |

---

## 3. Compensation & Rollback Mechanics

If `VerifyCryptoPaymentTask` encounters an error (reverted transaction, wrong ETH amount, or timeout), AWS Step Functions catches the `PaymentFailedException` and branches into the compensation sub-graph:

```
[VerifyCryptoPaymentTask] -> FAILED
        │
        ▼
[CompensateCabBooking] (Invokes CancelCab Lambda)
        │
        ▼
[CompensateHotelReservation] (Invokes CancelHotel Lambda & restores Redis inventory)
        │
        ▼
[CompensateSmartContractRefund] (Calls smart contract refundBooking via EC2/KMS)
        │
        ▼
[SagaExecutionFailed] (End state: Zero orphaned reservations)
```

### Idempotency & Consistency
All compensating transactions are implemented to be **strictly idempotent**:
- If `cancelHotel.js` is invoked multiple times with the same `hotelReservationId`, it returns the same cancelled status without corrupting the database.
- Database records in Amazon RDS store state transitions: `HOLD_PLACED` -> `CANCELLED_SAGA_ROLLBACK`.
