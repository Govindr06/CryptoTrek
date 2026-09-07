import React, { useState, useEffect } from 'react';
import { MapPin, Hotel, Car, Calendar, Users, Zap, Check, ArrowRight, Database } from 'lucide-react';

export default function ItineraryBuilder({ onAddToCart, onInitiateCheckout }) {
  const [destinations, setDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedCab, setSelectedCab] = useState(null);
  const [checkIn, setCheckIn] = useState('2026-10-15');
  const [checkOut, setCheckOut] = useState('2026-10-20');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(true);
  const [cacheSource, setCacheSource] = useState('ElastiCache Redis');

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch('/api/inventory');
        const data = await res.json();
        setDestinations(data.destinations || []);
        if (data.destinations && data.destinations.length > 0) {
          const first = data.destinations[0];
          setSelectedDest(first);
          setSelectedHotel(first.hotels[0]);
          setSelectedCab(first.cabs[0]);
        }
        setCacheSource(data.source || 'ElastiCache Redis');
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const handleDestChange = (dest) => {
    setSelectedDest(dest);
    setSelectedHotel(dest.hotels[0]);
    setSelectedCab(dest.cabs[0]);
  };

  // Calculate pricing
  const hotelPrice = selectedHotel ? parseFloat(selectedHotel.priceEth) : 0;
  const cabPrice = selectedCab ? parseFloat(selectedCab.priceEth) : 0;
  const subtotal = hotelPrice + cabPrice;
  const platformFee = (subtotal * 0.025).toFixed(4);
  const totalEth = (subtotal + parseFloat(platformFee)).toFixed(4);
  const totalUsd = selectedHotel && selectedCab ? (selectedHotel.priceUsd + selectedCab.priceUsd) : 0;

  const currentItinerary = {
    destination: selectedDest ? selectedDest.city : '',
    hotelId: selectedHotel ? selectedHotel.id : '',
    hotelName: selectedHotel ? selectedHotel.name : '',
    hotelRateEth: selectedHotel ? selectedHotel.priceEth : '0',
    hotelRateUsd: selectedHotel ? selectedHotel.priceUsd : 0,
    cabId: selectedCab ? selectedCab.id : '',
    cabName: selectedCab ? selectedCab.model : '',
    cabRateEth: selectedCab ? selectedCab.priceEth : '0',
    cabRateUsd: selectedCab ? selectedCab.priceUsd : 0,
    checkIn,
    checkOut,
    guests,
    pickupLocation: 'Airport International Terminal',
    dropoffLocation: selectedHotel ? selectedHotel.name : 'Destination Hotel',
    pickupTime: `${checkIn} 14:00:00`,
    totalAmountEth: totalEth,
    totalAmountUsd: totalUsd
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px' }}>Fetching live hotel & cab inventory from Amazon ElastiCache (Redis)...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-sepolia">Web3 Crypto Escrow</span>
              <span className="badge badge-aws">AWS Step Functions Saga</span>
              <span className="badge badge-success">
                <Database size={12} /> {cacheSource} (0.8ms latency)
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Design Your Crypto Travel Itinerary
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', fontSize: '0.98rem' }}>
              Book luxury hotels and VIP airport cabs globally using <strong>Ethereum Sepolia Testnet</strong>. 
              Orchestrated with automated rollbacks on AWS Step Functions to protect your digital assets.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="glass-panel" style={{ padding: '14px 20px', background: 'rgba(255, 255, 255, 0.03)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Live Conversion Rate</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>1 ETH ≈ $3,420 USD</div>
            <span style={{ fontSize: '0.7rem', color: '#ff9900' }}>Cached in ElastiCache Redis</span>
          </div>
        </div>
      </div>

      {/* Destination Tabs */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '10px', fontWeight: 600 }}>
          SELECT DESTINATION
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {destinations.map(d => (
            <button
              key={d.destinationId}
              onClick={() => handleDestChange(d)}
              className={selectedDest?.destinationId === d.destinationId ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 20px', fontSize: '0.95rem' }}
            >
              <MapPin size={16} />
              {d.city}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Hotels, Cabs, and Live Itinerary Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Step A: Hotel Selection */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hotel size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>1. Select Hotel</h3>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Inventory held via RDS lock</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedDest?.hotels.map(h => {
              const isSelected = selectedHotel?.id === h.id;
              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHotel(h)}
                  className={`selectable-card ${isSelected ? 'selected' : ''}`}
                  style={{ borderRadius: '12px', overflow: 'hidden', padding: '14px' }}
                >
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <img 
                      src={h.image} 
                      alt={h.name} 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{h.name}</h4>
                        {isSelected && <Check size={16} color="#6366f1" />}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '2px' }}>★ {h.rating} / 5.0</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{h.roomsAvailable} rooms left</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#c7d2fe', fontFamily: 'var(--font-mono)' }}>{h.priceEth} ETH</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>(${h.priceUsd})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dates & Guests */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Calendar size={12} /> Check-In
              </label>
              <input 
                type="date" 
                value={checkIn} 
                onChange={e => setCheckIn(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Users size={12} /> Guests
              </label>
              <select 
                value={guests} 
                onChange={e => setGuests(Number(e.target.value))}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
              >
                <option value={1} style={{ background: '#111827' }}>1 Traveler</option>
                <option value={2} style={{ background: '#111827' }}>2 Travelers</option>
                <option value={4} style={{ background: '#111827' }}>4 Travelers (Suite)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step B: Cab Selection */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={18} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>2. Select Airport Cab</h3>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Airport to hotel direct transfer</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedDest?.cabs.map(c => {
              const isSelected = selectedCab?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCab(c)}
                  className={`selectable-card ${isSelected ? 'selected' : ''}`}
                  style={{ borderRadius: '12px', padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{c.model}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Zap size={12} color="#fbbf24" /> ETA: {c.etaMinutes} mins from flight arrival
                      </span>
                    </div>
                    {isSelected && <Check size={16} color="#6366f1" />}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Fixed-rate airport transfer</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#c7d2fe', fontFamily: 'var(--font-mono)' }}>{c.priceEth} ETH</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>(${c.priceUsd})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#9ca3af' }}>
            ✈️ <strong>Pickup:</strong> Airport Arrivals Terminal <br />
            🏨 <strong>Dropoff:</strong> {selectedHotel ? selectedHotel.name : 'Hotel'}
          </div>
        </div>

        {/* Step C: Live Itinerary Calculation & Checkout */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>3. Itinerary Breakdown</h3>
              <span className="badge badge-aws">AWS Step Functions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                <span>Hotel ({selectedHotel?.name.substring(0, 18)}...)</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{hotelPrice} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                <span>Airport Cab Transfer</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{cabPrice} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                <span>Platform Protocol Fee (2.5%)</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{platformFee} ETH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                <span>Sepolia Gas Fee (Est.)</span>
                <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>~0.0009 ETH</span>
              </div>

              <div style={{ margin: '14px 0', borderTop: '1px dashed var(--border-color)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Itinerary</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af' }}>~${totalUsd} USD</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                    {totalEth} ETH
                  </span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#ff9900' }}>Sepolia Network</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => onInitiateCheckout(currentItinerary)} 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
            >
              Pay with MetaMask & Launch Saga
              <ArrowRight size={18} />
            </button>

            <button 
              onClick={() => onAddToCart(currentItinerary)} 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
            >
              Save to DynamoDB Cart (with TTL)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
