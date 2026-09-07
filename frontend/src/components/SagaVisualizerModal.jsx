import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, 
  ExternalLink, FileDown, Layers, Terminal, AlertTriangle 
} from 'lucide-react';
import { Web3Service } from '../services/web3Service';

const SAGA_STEPS_FLOW = [
  { id: 'ReserveHotelTask', name: 'Reserve Hotel', service: 'AWS Lambda + RDS', desc: 'Acquiring room hold in PostgreSQL' },
  { id: 'BookCabTask', name: 'Book Cab', service: 'AWS Lambda + RDS', desc: 'Reserving airport VIP transfer' },
  { id: 'CalculateFeesTask', name: 'Calculate Extra Fees', service: 'AWS Lambda', desc: 'Computing platform fee & Sepolia gas' },
  { id: 'VerifyCryptoPaymentTask', name: 'Verify Crypto Payment', service: 'Amazon EC2 Node + AWS KMS', desc: 'Verifying on-chain tx & signing token' },
  { id: 'ConfirmBookingTask', name: 'Confirm Booking', service: 'Amazon RDS + DynamoDB', desc: 'Committing transaction & clearing cart' },
  { id: 'GenerateInvoiceTask', name: 'Generate S3 Invoice', service: 'Amazon S3 + CloudWatch', desc: 'Uploading invoice & emitting metrics' }
];

export default function SagaVisualizerModal({ isOpen, onClose, itinerary, wallet, user, onBookingSuccess, onRefreshWallet }) {
  const [executing, setExecuting] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executionResult, setExecutionResult] = useState(null);
  const [stepHistory, setStepHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setExecutionResult(null);
      setStepHistory([]);
      setErrorMsg(null);
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartBooking = async () => {
    setExecuting(true);
    setErrorMsg(null);
    setExecutionResult(null);

    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      let txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // If MetaMask is connected and not simulating failure, prompt real Sepolia ETH transaction!
      if (!simulateFailure && Web3Service.isMetaMaskInstalled() && wallet) {
        try {
          const web3Payment = await Web3Service.sendBookingPayment(itinerary.totalAmountEth, bookingId);
          txHash = web3Payment.txHash;
          if (onRefreshWallet) {
            await onRefreshWallet();
          }
        } catch (walletErr) {
          console.error("MetaMask payment error:", walletErr);
          setErrorMsg(walletErr.reason || walletErr.message || "MetaMask transaction was cancelled or failed");
          setExecuting(false);
          return; // Do NOT proceed to fake successful booking!
        }
      } else if (simulateFailure) {
        txHash = "0xFAIL_SIMULATION";
      }

      // Call the Step Functions Saga orchestrator backend
      const response = await fetch('/api/saga/execute-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          userId: user?.userSub || 'demo-traveler-cognito',
          itinerary,
          payment: {
            txHash,
            walletAddress: wallet?.address || '0xDemoTraveler'
          },
          simulateFailure
        })
      });

      const data = await response.json();

      if (response.ok) {
        setExecutionResult(data);
        setStepHistory(data.stepHistory || []);
        if (onRefreshWallet) {
          await onRefreshWallet();
        }
        if (onBookingSuccess) onBookingSuccess(data);
      } else {
        setExecutionResult(data);
        setStepHistory(data.stepHistory || []);
        setErrorMsg(data.errorMessage || "Saga workflow transaction failed");
      }

    } catch (err) {
      setErrorMsg("Step Functions execution error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const isSuccess = executionResult?.status === 'COMPLETED';
  const isRolledBack = executionResult?.status === 'FAILED_ROLLED_BACK';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 153, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} color="#ff9900" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AWS Step Functions Saga Orchestrator</h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Sequential Microservice Execution with Automated Compensating Rollbacks</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Itinerary Summary Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Selected Travel Package</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{itinerary.destination} • {itinerary.hotelName}</div>
            <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '2px' }}>
              📅 In: <strong>{itinerary.checkIn}</strong> • Out: <strong>{itinerary.checkOut}</strong> ({itinerary.nights || 1} Night{itinerary.nights > 1 ? 's' : ''})
            </div>
            <span style={{ fontSize: '0.78rem', color: '#818cf8', display: 'block', marginTop: '2px' }}>Includes {itinerary.cabName} Airport Cab</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Amount to Verify</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {parseFloat(itinerary.totalAmountEth).toFixed(5)} ETH
            </div>
            <span style={{ fontSize: '0.72rem', color: '#ff9900' }}>Ethereum Sepolia</span>
          </div>
        </div>

        {/* Demonstration Control: Saga Rollback Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.08)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#f87171" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f87171' }}>Simulate Payment Failure & Saga Rollback</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Simulate a reverted crypto transaction on Sepolia to test automated compensating rollbacks (CancelCab → CancelHotel → Refund).</div>
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input 
              type="checkbox" 
              checked={simulateFailure} 
              onChange={e => setSimulateFailure(e.target.checked)} 
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: simulateFailure ? '#ef4444' : '#374151',
              borderRadius: '24px', transition: '.3s'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '18px', width: '18px', left: simulateFailure ? '26px' : '3px', bottom: '3px',
                backgroundColor: 'white', borderRadius: '50%', transition: '.3s'
              }}></span>
            </span>
          </label>
        </div>

        {/* Live Execution Timeline / Step Tracker */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="#6366f1" />
            Saga State Machine Workflow
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SAGA_STEPS_FLOW.map((s, idx) => {
              // Determine status from stepHistory
              const historyItem = stepHistory.find(h => h.step === s.id);
              let statusBadge = (
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pending</span>
              );

              if (historyItem) {
                if (historyItem.status === 'SUCCESS') {
                  statusBadge = <span className="badge badge-success"><CheckCircle size={10} /> Complete</span>;
                } else if (historyItem.status === 'IN_PROGRESS') {
                  statusBadge = <span className="badge badge-aws"><RefreshCw size={10} className="spin" /> Running</span>;
                } else if (historyItem.status === 'FAILED') {
                  statusBadge = <span className="badge badge-danger">Failed</span>;
                }
              }

              return (
                <div 
                  key={s.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    background: historyItem ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                    border: historyItem?.status === 'SUCCESS' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1f2937', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.service} • {s.desc}</div>
                    </div>
                  </div>
                  {statusBadge}
                </div>
              );
            })}
          </div>
        </div>

        {/* Compensating Rollback Steps (If Failure Occurred) */}
        {isRolledBack && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px' }}>
            <h4 style={{ color: '#f87171', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <AlertCircle size={16} /> Automated Saga Compensation Rollback Executed:
            </h4>
            <ul style={{ fontSize: '0.82rem', color: '#fca5a5', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>CompensateCabBooking:</strong> Released VIP airport cab booking from Amazon RDS.</li>
              <li><strong>CompensateHotelReservation:</strong> Released room hold lock & incremented available inventory in ElastiCache Redis.</li>
              <li><strong>CompensateCryptoRefund:</strong> Broadcasted automated refund on Sepolia via Amazon EC2 Node & AWS KMS.</li>
            </ul>
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
              Refund Sepolia Tx: <code style={{ color: '#38bdf8' }}>{executionResult.refundDetails?.refundTxHash}</code>
            </div>
          </div>
        )}

        {/* Success Details & S3 Invoice Download */}
        {isSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ color: '#34d399', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={20} /> Booking Successfully Confirmed & Secured!
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '4px' }}>
                  Booking ID: <code style={{ color: '#c7d2fe' }}>{executionResult.bookingId}</code>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                  Sepolia Tx Hash: <code style={{ color: '#818cf8' }}>{executionResult.paymentDetails?.txHash.substring(0, 24)}...</code>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                  KMS Hardware Signature: <code style={{ color: '#ff9900' }}>{executionResult.paymentDetails?.kmsSignature.substring(0, 20)}...</code>
                </div>
              </div>

              <a 
                href={executionResult.invoiceUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary" 
                style={{ background: '#10b981', padding: '10px 16px', fontSize: '0.85rem' }}
              >
                <FileDown size={16} /> Download S3 Invoice
              </a>
            </div>
          </div>
        )}

        {/* Error Message display */}
        {errorMsg && !isRolledBack && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px', color: '#f87171', fontSize: '0.85rem' }}>
            ⚠️ <strong>Notice:</strong> {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px' }}>
            Close
          </button>

          {!isSuccess && !isRolledBack && (
            <button 
              onClick={handleStartBooking} 
              disabled={executing}
              className="btn-primary" 
              style={{ padding: '10px 24px' }}
            >
              {executing ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Executing AWS Step Functions Saga...
                </>
              ) : (
                <>
                  Confirm & Execute Booking
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
