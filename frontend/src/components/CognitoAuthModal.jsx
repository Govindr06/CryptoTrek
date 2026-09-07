import React, { useState } from 'react';
import { Shield, Key, Mail, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export default function CognitoAuthModal({ isOpen, onClose, user, setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('traveler@web3travel.io');
  const [username, setUsername] = useState('crypto_nomad');
  const [password, setPassword] = useState('TravelerPass2026!');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/auth/cognito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const data = await res.json();
      setUser(data);
      setMsg('Authenticated successfully via Amazon Cognito User Pool!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setMsg('Authentication error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 153, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#ff9900" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Amazon Cognito Auth</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {user ? (
          <div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                <CheckCircle2 size={18} /> Active Cognito JWT Session
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>User Sub: <code style={{ color: '#c7d2fe' }}>{user.userSub}</code></p>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Email: <code style={{ color: '#c7d2fe' }}>{user.email}</code></p>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Pool ID: <code style={{ color: '#ff9900' }}>{user.userPoolId}</code></p>
            </div>

            <button onClick={handleLogout} className="btn-danger" style={{ width: '100%' }}>
              Sign Out from Cognito
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={() => setIsSignUp(false)} 
                className={!isSignUp ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                onClick={() => setIsSignUp(true)} 
                className={isSignUp ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              >
                Create Account
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px' }}>Password (Cognito Enforced Policy)</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }}
                required
              />
            </div>

            {msg && (
              <div style={{ fontSize: '0.85rem', color: msg.includes('error') ? '#f87171' : '#34d399', marginBottom: '14px' }}>
                {msg}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? "Authenticating..." : (isSignUp ? "Register in Cognito Pool" : "Sign In with Cognito")}
              <ArrowRight size={16} />
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', marginTop: '12px' }}>
              Secured with Amazon Cognito User Pools, JWT Tokens & AWS IAM
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
