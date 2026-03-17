import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';
import AddressForm from '../components/Checkout/AddressForm';
import OrderSummarySidebar from '../components/Checkout/OrderSummarySidebar';
import './CheckoutPage.css';

// Utility to load Razorpay script
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { cartItems, getTotals } = useCartStore();
  const { cartCount, subtotal, deliveryFee, gst, total } = getTotals();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showNewForm, setShowNewForm] = useState(false);
  const [editAddressData, setEditAddressData] = useState(null);
  const [selectedSavedId, setSelectedSavedId] = useState(null);

  // Step 1: Address Selection
  const handleAddressSubmit = (address) => {
    setSelectedAddress(address);
    setStep(2);
  };

  // Step 2 & 3: Place Order and Pay (Razorpay handled in context usually, but we move it here)
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setErrorMsg('Please select an address');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');

      // Create Order in Backend
      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderItems: cartItems.map(item => ({
            name: item.name,
            qty: item.quantity,
            image: item.image,
            price: item.price,
            product: String(item.product || item.id).padStart(24, '0') 
          })),
          shippingAddress: selectedAddress,
          paymentMethod: 'razorpay',
          itemsPrice: subtotal,
          taxPrice: gst,
          shippingPrice: deliveryFee,
          totalPrice: total,
          discount: 0
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

      // Load Razorpay Script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) throw new Error('Razorpay SDK failed to load');
      
      const rzpRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId: orderData._id })
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error('Error creating Razorpay order');

      const keyRes = await fetch('http://localhost:5000/api/payments/key', {
        credentials: 'include'
      });
      const { key } = await keyRes.json();

      const options = {
        key: key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Mithila Mithas',
        description: 'Authentic Sweets & Snacks',
        order_id: rzpData.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData._id
              })
            });

            if (verifyRes.ok) {
              useCartStore.getState().clearCart();
              navigate('/orders'); 
            } else {
              setErrorMsg('Payment verification failed');
            }
          } catch (err) {
            setErrorMsg('Payment verification error: ' + err.message);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: selectedAddress.phone || user.phone || ''
        },
        theme: {
          color: '#8b1a3a'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if(!user) {
     return <div className="checkout-page container"><h2>Please <Link to="/login?redirect=/checkout">login</Link> to checkout</h2></div>
  }

  if (cartItems.length === 0) {
      navigate('/cart');
      return null;
  }

  return (
    <main className="checkout-page section" id="checkout-page">
      <div className="container checkout-container">
        
        <div className="checkout-steps">
           <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
               1. Shipping Address
           </div>
           <div className={`step ${step === 2 ? 'active' : ''}`}>
               2. Review & Pay
           </div>
        </div>

        <div className="checkout-content">
          <div className="checkout-main">
            {step === 1 && (
              <div className="checkout-step-content">
                <h2>Select Shipping Address</h2>
                {user?.addresses?.length > 0 && !showNewForm && !editAddressData ? (
                  <div className="saved-addresses-list">
                    {user.addresses.map((addr) => (
                       <label key={addr._id} className={`saved-address-card ${selectedSavedId === addr._id ? 'selected' : ''}`}>
                         <input 
                           type="radio" 
                           name="savedAddress" 
                           value={addr._id} 
                           checked={selectedSavedId === addr._id || (!selectedSavedId && addr.isDefault)}
                           onChange={() => setSelectedSavedId(addr._id)}
                         />
                         <div className="addr-details" style={{ width: '100%' }}>
                            <span className="addr-label">{addr.label}</span>
                            <p style={{ fontWeight: '500', color: 'var(--text-dark)', margin: '4px 0' }}>{addr.name || user.name}</p>
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.pincode}</p>
                         </div>
                       </label>
                    ))}
                    <button className="btn btn-primary mt-2" onClick={() => {
                        const addrToSubmit = user.addresses.find(a => a._id === selectedSavedId) || user.addresses.find(a => a.isDefault) || user.addresses[0];
                        if(addrToSubmit) handleAddressSubmit(addrToSubmit);
                    }}>Deliver Here</button>
                    <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => setShowNewForm(true)}>+ Add New Address</button>
                  </div>
                ) : user?.addresses?.length === 0 && !showNewForm && !editAddressData ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)' }}>location_off</span>
                      <h3 style={{ margin: '16px 0 8px' }}>No address saved</h3>
                      <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
                         <span className="material-icons-outlined" style={{ marginRight: '8px' }}>add</span>
                         Add Address
                      </button>
                  </div>
                ) : (
                  <div>
                    {user?.addresses?.length > 0 && (
                        <button className="btn btn-ghost" style={{ marginBottom: '16px', padding: 0 }} onClick={() => { setShowNewForm(false); setEditAddressData(null); }}>
                           &larr; Back to Saved Addresses
                        </button>
                    )}
                    <h3 style={{ marginBottom: '16px' }}>{editAddressData ? 'Edit Address' : 'Add a New Address'}</h3>
                    <AddressForm 
                        initialData={editAddressData}
                        onAddressSubmit={(addr) => { 
                           handleAddressSubmit(addr); 
                           setShowNewForm(false); 
                           setEditAddressData(null);
                        }} 
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="checkout-step-content review-step">
                <h2>Review Your Order</h2>
                <div className="review-address-box">
                    <h4>Shipping to: {selectedAddress.label || 'Address'}</h4>
                    <p style={{ fontWeight: '500', color: 'var(--charcoal)' }}>{selectedAddress.name || user.name}</p>
                    <p>{selectedAddress.street}</p>
                    <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                       <button className="btn btn-outline btn-sm" onClick={() => {
                          setStep(1); setShowNewForm(false); setEditAddressData(null);
                       }}>Change Another Address</button>
                       <button className="btn btn-ghost btn-sm" style={{ padding: '8px' }} onClick={() => {
                          setStep(1); setEditAddressData(selectedAddress); setShowNewForm(true);
                       }}>Edit this Address</button>
                    </div>
                </div>

                {errorMsg && <div className="error-box">{errorMsg}</div>}
                
                <button 
                  className="btn btn-primary btn-lg mt-4 w-100" 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Payment...' : `Pay ₹${total}`}
                </button>
              </div>
            )}
          </div>

          <OrderSummarySidebar 
             cartItems={cartItems} 
             subtotal={subtotal}
             gst={gst}
             deliveryFee={deliveryFee}
             total={total}
             cartCount={cartCount}
          />
        </div>

      </div>
    </main>
  );
}
