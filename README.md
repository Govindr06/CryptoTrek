# ✈️ CryptoVoyage: Enterprise Web3 Travel Itinerary Platform on AWS

[![AWS Architecture](https://img.shields.io/badge/AWS-Serverless%20Architecture-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![Ethereum Sepolia](https://img.shields.io/badge/Blockchain-Ethereum%20Sepolia-627EEA?logo=ethereum)](https://sepolia.etherscan.io/)
[![Saga Pattern](https://img.shields.io/badge/Step%20Functions-Saga%20Pattern-blue)](https://aws.amazon.com/step-functions/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform%20%26%20CloudFormation-7B42BC?logo=terraform)](https://www.terraform.io/)

A full-stack, enterprise-grade cryptocurrency travel itinerary booking platform engineered with a serverless cloud architecture on **Amazon Web Services (AWS)** and integrated with the **Ethereum Sepolia Testnet**.

The platform is designed to handle high-concurrency travel bookings, real-time cryptocurrency payments with zero financial risk (using free test ETH), and complex multi-dependency workflows using the **Saga Pattern** for automated rollbacks.

---

## 🏛️ Comprehensive AWS Cloud Architecture (12 Core Services)

| AWS Service | Category | Architectural Role in Platform |
|---|---|---|
| **Amazon Route 53** | Networking & DNS | Latency-based global domain routing and continuous health check monitoring. |
| **Amazon CloudFront** | Edge CDN | Global edge distribution terminating SSL/TLS, protecting against DDoS, and caching static assets. |
| **Amazon Cognito** | Security & Identity | User registration, authentication, JWT tokens, and API authorization. |
| **Amazon API Gateway** | API Management | REST API gateway with Cognito authorizers, request validation, and throttling. |
| **AWS Lambda** | Serverless Compute | Microservices handling cart, search, fee calculations, and Saga execution steps. |
| **AWS Step Functions** | Workflow Orchestration | Implements the **Saga Pattern** to coordinate sequential bookings and execute automated compensating rollbacks if crypto payments fail. |
| **Amazon RDS (PostgreSQL)** | Relational Database | Multi-AZ ACID storage for confirmed bookings, traveler profiles, and payment receipts. |
| **Amazon DynamoDB** | NoSQL Database | Sub-millisecond key-value storage for active shopping carts and sessions with automated 1-hour TTL expiration. |
| **Amazon ElastiCache (Redis)** | In-Memory Cache | High-speed cache for frequently searched hotel room availability and live crypto exchange rates (<2ms latency). |
| **Amazon EC2 (Blockchain Node)** | Compute & Web3 | Dedicated instance hosting an Ethereum Sepolia Geth execution node to independently verify transaction receipts on the ledger. |
| **AWS KMS & Payment Cryptography** | Security & Cryptography | FIPS 140-2 Level 3 HSM Customer Managed Keys for signing payment receipts and securing digital wallets. |
| **Amazon S3 & CloudWatch** | Storage & Observability | **S3**: SSE-KMS encrypted bucket for immutable PDF/JSON booking invoices.<br>**CloudWatch**: Centralized logging, execution telemetry, and payment failure alarms. |

---

## 🔁 Distributed Saga Workflow & Rollback Logic

When a traveler initiates a booking:
1. **`ReserveHotelTask`**: Locks room inventory in Amazon RDS and flags reservation in ElastiCache.
2. **`BookCabTask`**: Books VIP airport pickup transfer in Amazon RDS.
3. **`CalculateExtraFeesTask`**: Computes platform protocol fee (2.5%) and estimated Sepolia network gas.
4. **`VerifyCryptoPaymentTask`**: Verifies the transaction on the Ethereum Sepolia ledger via the EC2 node and signs a verification token using AWS KMS.
5. **`ConfirmBookingTask`**: Commits the ACID transaction in Amazon RDS and clears the user's cart in Amazon DynamoDB.
6. **`GenerateInvoiceTask`**: Creates an encrypted tax invoice in Amazon S3 and emits metrics to Amazon CloudWatch.

### Automated Compensating Rollback (Failure Path):
If a payment fails, reverts, or times out on Sepolia, Step Functions catches the error and executes the compensating tasks in reverse order:
- ⚡ **`CancelCabBooking`**: Cancels cab reservation in Amazon RDS.
- ⚡ **`CancelHotelReservation`**: Releases hotel room hold and restores inventory in ElastiCache Redis.
- ⚡ **`RefundCrypto`**: Triggers a smart contract refund back to the traveler's MetaMask address.

---

## 🚀 Quickstart & Local Demonstration

You can run the entire platform locally with zero cloud costs using our built-in local cloud emulator:

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```
- **Web App (Vite)**: `http://localhost:3000`
- **Cloud Backend API**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/health`
- **CloudWatch Telemetry**: `http://localhost:5001/api/cloudwatch/telemetry`

---

## 🦊 Web3 & MetaMask Sepolia Setup (Free Test ETH)

1. Open your browser with the **MetaMask** extension installed.
2. Click **Connect MetaMask** in the navbar.
3. If not on Sepolia, click **Switch to Sepolia** (the app automatically adds and switches the chain via EIP-1193).
4. Click **Faucet** in the header to get free Sepolia ETH from the official faucets:
   - [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
5. Build an itinerary, test both the **Happy Path** (payment confirmed) and **Saga Rollback Simulation** (failure and compensation).

---

## 📦 Infrastructure as Code (IaC)

Complete deployment templates are included in `infrastructure/`:
- **Terraform**: Located in `infrastructure/terraform/` (`main.tf`, `route53_cloudfront_s3.tf`, `cognito.tf`, `step_functions.tf`, `rds.tf`, `dynamodb.tf`, `elasticache.tf`, `ec2_blockchain_node.tf`, `kms.tf`, `cloudwatch.tf`).
- **AWS CloudFormation**: Located in `infrastructure/cloudformation/travel-platform-stack.yaml`.

---

## 📚 Project Documentation

- [Detailed Architecture & Design Report (Mermaid Diagrams)](docs/ARCHITECTURE.md)
- [Saga Pattern State Machine Specification](docs/SAGA_WORKFLOW.md)
- [Ethereum Sepolia Testnet & MetaMask Guide](docs/SEPOLIA_METAMASK_GUIDE.md)
