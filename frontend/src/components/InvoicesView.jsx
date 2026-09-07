import React from 'react';
import { FileText, Download, ExternalLink, ShieldCheck, Hash, Calendar } from 'lucide-react';

export default function InvoicesView({ bookings }) {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-aws">Amazon S3 Storage</span>
            <span className="badge badge-sepolia">Verified On-Chain</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Confirmed Itineraries & S3 Invoices</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            All booking invoices are cryptographically signed via AWS KMS and permanently stored in encrypted Amazon S3 buckets.
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <FileText size={48} color="#4b5563" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>No Invoices Yet</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
            When you complete an itinerary booking using Sepolia ETH and AWS Step Functions, your verified S3 tax invoice will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((b, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-success">
                      <ShieldCheck size={12} /> CONFIRMED IN RDS
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                      Booking ID: {b.bookingId}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {b.itinerary?.destination} ({b.itinerary?.hotelName})
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#9ca3af', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c7d2fe' }}>
                      <Calendar size={14} color="#6366f1" /> In: <strong>{b.itinerary?.checkIn}</strong> • Out: <strong>{b.itinerary?.checkOut}</strong> ({b.itinerary?.nights || 1} Night{b.itinerary?.nights > 1 ? 's' : ''})
                    </span>
                    <span>•</span>
                    <span>Cab: {b.itinerary?.cabName}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                    {parseFloat(b.itinerary?.totalAmountEth || 0).toFixed(5)} ETH
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Paid via MetaMask Sepolia</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  <span>Sepolia Tx: </span>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${b.payment?.txHash || b.paymentDetails?.txHash}`}
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#6366f1', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                  >
                    {(b.payment?.txHash || b.paymentDetails?.txHash || '0xSepoliaTransaction').substring(0, 26)}...
                    <ExternalLink size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </a>
                </div>

                <a 
                  href={b.invoiceUrl || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  <Download size={14} /> Download S3 JSON Invoice
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
