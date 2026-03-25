import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';
import './OrderResultPages.css';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setOrder(data);
            useCartStore.getState().clearCart();
          }
        } catch (err) {
          console.error('Failed to fetch order:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <main className="order-result-page" id="order-success-page">
      <div className="container">
        <div className="order-result-card animate-scale-in">
          {/* Success Animation */}
          <div className="order-result-icon success">
            <span className="material-icons-outlined">check_circle</span>
          </div>
          
          <h1 className="order-result-title">Payment Successful! 🎉</h1>
          <p className="order-result-subtitle">
            Thank you{user ? `, ${user.name}` : ''}! Your order has been placed successfully.
          </p>

          {loading ? (
            <p className="order-result-loading">Loading order details...</p>
          ) : order ? (
            <div className="order-result-details">
              <div className="order-result-detail-row">
                <span className="detail-label">Order Number</span>
                <span className="detail-value highlight">#{order._id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="order-result-detail-row">
                <span className="detail-label">Amount Paid</span>
                <span className="detail-value">₹{order.totalPrice.toFixed(2)}</span>
              </div>
              {order.paymentResult?.razorpayPaymentId && (
                <div className="order-result-detail-row">
                  <span className="detail-label">Payment ID</span>
                  <span className="detail-value small">{order.paymentResult.razorpayPaymentId}</span>
                </div>
              )}
              <div className="order-result-detail-row">
                <span className="detail-label">Items</span>
                <span className="detail-value">{order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="order-result-detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className="status-badge success">{order.orderStatus?.toUpperCase() || 'PLACED'}</span>
                </span>
              </div>

              {/* Items list */}
              <div className="order-result-items">
                <h4>Items Ordered</h4>
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="result-item-row">
                    <span>{item.qty}× {item.name}</span>
                    <span>₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Shipping info */}
              <div className="order-result-shipping">
                <span className="material-icons-outlined" style={{ fontSize: '18px' }}>local_shipping</span>
                <div>
                  <strong>Shipping to:</strong>
                  <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                </div>
              </div>
            </div>
          ) : orderId ? (
            <p className="order-result-subtitle">Order ID: #{orderId.substring(0, 8).toUpperCase()}</p>
          ) : null}

          <div className="order-result-info">
            <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--saffron)' }}>mail</span>
            <p>A confirmation email has been sent to your registered email address.</p>
          </div>

          <div className="order-result-actions">
            <Link to="/orders" className="btn btn-primary btn-lg" id="view-orders-btn">
              <span className="material-icons-outlined">receipt_long</span>
              View My Orders
            </Link>
            <Link to="/menu" className="btn btn-ghost" id="continue-shopping-success">
              <span className="material-icons-outlined">restaurant_menu</span>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
