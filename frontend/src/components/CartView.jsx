import React from 'react';
import { ShoppingBag, Trash2, ArrowRight, Clock, ShieldCheck, Database } from 'lucide-react';

export default function CartView({ cart, onRemoveItem, onCheckout, onClearCart }) {
  const items = cart?.items || [];
  const totalEth = items.reduce((acc, item) => acc + parseFloat(item.totalAmountEth || 0), 0).toFixed(4);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-aws">
              <Database size={12} /> Amazon DynamoDB Table: TravelCarts
            </span>
            <span className="badge badge-sepolia">
              <Clock size={12} /> Auto TTL Expiry: 1 Hour
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Active Travel Cart</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Your in-flight itinerary is backed by Amazon DynamoDB for sub-millisecond session recovery across devices.
          </p>
        </div>

        {items.length > 0 && (
          <button onClick={onClearCart} className="btn-danger" style={{ fontSize: '0.85rem' }}>
            <Trash2 size={14} /> Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <ShoppingBag size={48} color="#4b5563" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>Your Cart is Empty</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
            Explore our curated destinations, select your luxury hotel and airport VIP cab, and save to your DynamoDB cart.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#ff9900', fontWeight: 600 }}>DESTINATION</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{item.destination}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                      🏨 {item.hotelName} ({item.hotelRateEth} ETH)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '2px' }}>
                      🚖 {item.cabName} ({item.cabRateEth} ETH)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '6px' }}>
                      Dates: {item.checkIn} → {item.checkOut} ({item.guests} Guests)
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {item.totalAmountEth} ETH
                    </div>
                    <button 
                      onClick={() => onRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Cart Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#9ca3af' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Itinerary Items</span>
                <span style={{ color: '#fff' }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DynamoDB State</span>
                <span style={{ color: '#10b981' }}>Synchronized</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Gas (Sepolia)</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>~0.00095 ETH</span>
              </div>

              <div style={{ margin: '14px 0', borderTop: '1px dashed var(--border-color)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Total Amount</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  {totalEth} ETH
                </span>
              </div>
            </div>

            <button 
              onClick={() => onCheckout(items[0])} 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '20px' }}
            >
              Checkout via AWS Step Functions
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
