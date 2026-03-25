import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderResultPages.css';

// Utility to load Razorpay script
const loadScript = (src) => {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve(true);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function OrderFailurePage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const errorMessage = searchParams.get('error') || 'Payment could not be completed';
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRetryPayment = async () => {
    if (!orderId) {
      navigate('/cart');
      return;
    }

    try {
      // Load Razorpay Script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Check your internet connection.');
        return;
      }

      const rzpRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId })
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
        description: 'Retry Payment - Authentic Sweets & Snacks',
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
                orderId: orderId
              })
            });

            if (verifyRes.ok) {
              navigate(`/order-success?orderId=${orderId}`);
            } else {
              alert('Payment verification failed. Please try again.');
            }
          } catch (err) {
            alert('Payment verification error: ' + err.message);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#8b1a3a'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert('Failed to initiate payment: ' + err.message);
    }
  };

  return (
    <main className="order-result-page" id="order-failure-page">
      <div className="container">
        <div className="order-result-card animate-scale-in">
          {/* Failure Animation */}
          <div className="order-result-icon failure">
            <span className="material-icons-outlined">cancel</span>
          </div>
          
          <h1 className="order-result-title failure-title">Payment Failed</h1>
          <p className="order-result-subtitle">
            {errorMessage}. Don't worry — your order has been saved and you can retry the payment.
          </p>

          {orderId && (
            <div className="order-result-details" style={{ marginBottom: '24px' }}>
              <div className="order-result-detail-row">
                <span className="detail-label">Order Number</span>
                <span className="detail-value highlight">#{orderId.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>
          )}

          <div className="order-result-info warning">
            <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--warning)' }}>info</span>
            <p>No money has been deducted from your account. If any amount was debited, it will be refunded within 5-7 business days.</p>
          </div>

          <div className="order-result-actions">
            {orderId && (
              <button onClick={handleRetryPayment} className="btn btn-primary btn-lg" id="retry-payment-btn">
                <span className="material-icons-outlined">refresh</span>
                Retry Payment
              </button>
            )}
            <Link to="/orders" className="btn btn-ghost" id="view-orders-failure">
              <span className="material-icons-outlined">receipt_long</span>
              View My Orders
            </Link>
            <Link to="/menu" className="btn btn-ghost" id="back-to-menu-failure" style={{ marginTop: '8px' }}>
              <span className="material-icons-outlined">restaurant_menu</span>
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
