import React, { useState } from 'react';
import { Wallet, ExternalLink, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Web3Service, FAUCETS } from '../services/web3Service';

export default function MetaMaskConnect({ wallet, setWallet }) {
  const [loading, setLoading] = useState(false);
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Web3Service.connectWallet();
      setWallet(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSepolia = async () => {
    try {
      await Web3Service.switchToSepolia();
      const data = await Web3Service.connectWallet();
      setWallet(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {wallet ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {wallet.isSepolia ? (
            <span className="badge badge-sepolia" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'inline-block' }}></span>
              Sepolia Testnet
            </span>
          ) : (
            <button 
              onClick={handleSwitchToSepolia} 
              className="badge badge-danger" 
              style={{ cursor: 'pointer', border: 'none' }}
              title="Click to switch MetaMask to Ethereum Sepolia"
            >
              <AlertTriangle size={12} /> Switch to Sepolia
            </button>
          )}

          <button 
            onClick={() => setShowFaucetModal(true)} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            title="Get free Sepolia test ETH for booking transactions"
          >
            Faucet: {wallet.balanceEth} ETH
          </button>

          <div 
            className="glass-panel" 
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.85rem', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-active)'
            }}
          >
            <Wallet size={14} color="#6366f1" />
            {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
          </div>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={loading} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Wallet size={16} />
          {loading ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}

      {/* Sepolia Faucets Modal */}
      {showFaucetModal && (
        <div className="modal-overlay" onClick={() => setShowFaucetModal(false)}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="#10b981" />
                Ethereum Sepolia Testnet Faucets
              </h3>
              <button onClick={() => setShowFaucetModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              To test the booking workflows and real-time crypto payments without spending real money, request free <strong>Sepolia Test ETH</strong> from any of the public faucets below:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {FAUCETS.map((f, i) => (
                <a 
                  key={i} 
                  href={f.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="selectable-card"
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    textDecoration: 'none', 
                    color: 'var(--text-primary)',
                    background: 'rgba(255, 255, 255, 0.03)' 
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.name}</span>
                  <ExternalLink size={16} color="#6366f1" />
                </a>
              ))}
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.8rem', color: '#c7d2fe' }}>
              💡 <strong>Note:</strong> Once claimed, your MetaMask balance will update automatically. You can simulate bookings on the Ethereum Sepolia Testnet instantly!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
