# Ethereum Sepolia Testnet & MetaMask Guide

This guide outlines how to configure MetaMask, obtain free test ETH, and interact with the **CryptoVoyage** smart contracts without spending real money.

---

## 1. Network Configuration

The platform operates on the **Ethereum Sepolia Testnet** (Chain ID `11155111`).

| Parameter | Value |
|---|---|
| **Network Name** | Ethereum Sepolia Testnet |
| **RPC URL** | `https://rpc.sepolia.org` or `https://ethereum-sepolia-rpc.publicnode.com` |
| **Chain ID** | `11155111` (`0xaa36a7` hex) |
| **Currency Symbol** | `ETH` |
| **Block Explorer URL** | `https://sepolia.etherscan.io` |

> **Note**: In CryptoVoyage, clicking the **"Switch to Sepolia"** button in the header will automatically prompt MetaMask to add and switch to this network with one click!

---

## 2. Free Sepolia Test ETH Faucets

To execute simulated bookings and smart contract payments, acquire free test ETH from any of these official faucets:

1. **Google Cloud Web3 Faucet**:
   - URL: `https://cloud.google.com/application/web3/faucet/ethereum/sepolia`
   - Gives 0.05 Sepolia ETH daily with a Google account.
2. **Alchemy Sepolia PoW Faucet**:
   - URL: `https://sepoliafaucet.com/`
   - Instant distribution via mining proof-of-work or free Alchemy sign-in.
3. **QuickNode Sepolia Faucet**:
   - URL: `https://faucet.quicknode.com/ethereum/sepolia`

---

## 3. Smart Contract Deployment Details

The Solidity escrow contract `TravelBookingEscrow.sol` handles traveler deposits, merchant payouts, and automated refunds upon Step Functions Saga rollbacks.

- **Contract Location**: `contracts/TravelBookingEscrow.sol`
- **Solidity Version**: `^0.8.20`
- **Simulated Test Address on Sepolia**: `0x35B9A4753F81c4DeA96bDeFF3A44FDe5E6D4B752`
