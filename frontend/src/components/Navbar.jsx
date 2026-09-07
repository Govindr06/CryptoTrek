import React from 'react';
import { Plane, Compass, ShoppingBag, FileText, User, ShieldCheck } from 'lucide-react';
import MetaMaskConnect from './MetaMaskConnect';

export default function Navbar({ activeTab, setActiveTab, wallet, setWallet, user, onOpenAuth, cartItemCount }) {
  return (
    <nav className="glass-nav">
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Brand & AWS Architecture Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            onClick={() => setActiveTab('itinerary')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CryptoVoyage
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#ff9900', fontWeight: 600, letterSpacing: '0.05em' }}>
                POWERED BY AWS SERVERLESS & SEPOLIA
              </span>
            </div>
          </div>

          <div style={{ display: 'none', mdDisplay: 'flex', gap: '8px' }}>
            <span className="badge badge-aws" title="Amazon Route 53 DNS Routing Active">Route 53</span>
            <span className="badge badge-aws" title="Amazon CloudFront Global Edge CDN Active">CloudFront</span>
            <span className="badge badge-aws" title="Amazon Cognito User Authentication Active">Cognito</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('itinerary')}
            className={activeTab === 'itinerary' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <Compass size={16} /> Explore Trips
          </button>

          <button 
            onClick={() => setActiveTab('cart')}
            className={activeTab === 'cart' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem', position: 'relative' }}
          >
            <ShoppingBag size={16} />
            DynamoDB Cart
            {cartItemCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-4px', 
                right: '-4px', 
                background: '#ff9900', 
                color: '#000', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.7rem', 
                fontWeight: 800 
              }}>
                {cartItemCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('invoices')}
            className={activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <FileText size={16} /> S3 Invoices
          </button>
        </div>

        {/* Auth & Web3 Connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div 
              onClick={onOpenAuth}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 12px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '10px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)'
              }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</span>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
              <User size={15} /> Cognito Login
            </button>
          )}

          <MetaMaskConnect wallet={wallet} setWallet={setWallet} />
        </div>

      </div>
    </nav>
  );
}
