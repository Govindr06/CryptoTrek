import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ItineraryBuilder from './components/ItineraryBuilder';
import CartView from './components/CartView';
import InvoicesView from './components/InvoicesView';
import CognitoAuthModal from './components/CognitoAuthModal';
import SagaVisualizerModal from './components/SagaVisualizerModal';
import { Web3Service } from './services/web3Service';

export default function App() {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [bookings, setBookings] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSagaOpen, setIsSagaOpen] = useState(false);
  const [checkoutItinerary, setCheckoutItinerary] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // EIP-1193 listener for account and network changes
  useEffect(() => {
    if (Web3Service.isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          Web3Service.connectWallet().then(setWallet).catch(console.error);
        } else {
          setWallet(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    // Fetch initial cart from DynamoDB
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (data && data.cart) setCart(data.cart);
      })
      .catch(console.error);
  }, []);

  const handleAddToCart = async (itinerary) => {
    const updatedItems = [...(cart.items || []), itinerary];
    const updatedCart = { items: updatedItems };
    setCart(updatedCart);
    showToast(`Added ${itinerary.destination} to Amazon DynamoDB cart!`);

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userSub || 'demo-user-1', cart: updatedCart })
      });
    } catch (err) {
      console.error('Failed to sync cart with DynamoDB:', err);
    }
  };

  const handleRemoveCartItem = async (index) => {
    const updatedItems = cart.items.filter((_, i) => i !== index);
    const updatedCart = { items: updatedItems };
    setCart(updatedCart);

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userSub || 'demo-user-1', cart: updatedCart })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCart = async () => {
    setCart({ items: [] });
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userSub || 'demo-user-1', cart: { items: [] } })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiateCheckout = (itinerary) => {
    setCheckoutItinerary(itinerary);
    setIsSagaOpen(true);
  };

  const handleBookingSuccess = (bookingData) => {
    setBookings(prev => [bookingData, ...prev]);
    showToast(`Booking ${bookingData.bookingId} confirmed! S3 invoice ready.`);
    // Automatically clear cart item if matching
    handleClearCart();
  };

  const refreshWalletBalance = async () => {
    if (wallet?.address) {
      const bal = await Web3Service.getBalance(wallet.address);
      setWallet(prev => (prev ? { ...prev, balanceEth: bal } : null));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: '#1e1b4b',
          color: '#e0e7ff',
          padding: '12px 20px',
          borderRadius: '10px',
          border: '1px solid #6366f1',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          ✨ {toastMessage}
        </div>
      )}

      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        wallet={wallet}
        setWallet={setWallet}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        cartItemCount={cart.items?.length || 0}
      />

      {/* Tab Contents */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {activeTab === 'itinerary' && (
          <ItineraryBuilder 
            onAddToCart={handleAddToCart}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}

        {activeTab === 'cart' && (
          <CartView 
            cart={cart}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={handleInitiateCheckout}
            onClearCart={handleClearCart}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView bookings={bookings} />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px 20px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', background: 'rgba(11, 15, 25, 0.7)' }}>
        <p>
          CryptoVoyage Cloud Project • Integrated with Amazon Route 53, CloudFront, Cognito, API Gateway, AWS Lambda, Step Functions (Saga), RDS, DynamoDB, ElastiCache, EC2, KMS & S3.
        </p>
        <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ff9900' }}>
          Ethereum Sepolia Testnet (Chain ID 11155111) • Free Faucet Compatible
        </p>
      </footer>

      {/* Cognito Auth Modal */}
      <CognitoAuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        setUser={setUser}
      />

      {/* AWS Step Functions Saga Visualizer Modal */}
      {checkoutItinerary && (
        <SagaVisualizerModal 
          isOpen={isSagaOpen}
          onClose={() => setIsSagaOpen(false)}
          itinerary={checkoutItinerary}
          wallet={wallet}
          user={user}
          onBookingSuccess={handleBookingSuccess}
          onRefreshWallet={refreshWalletBalance}
        />
      )}

    </div>
  );
}
