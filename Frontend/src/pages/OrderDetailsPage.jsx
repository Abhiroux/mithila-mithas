import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OrderDetailsPage.css';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
          credentials: 'include'
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch order');
        
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrderDetails();
  }, [id, user]);

  if (loading) return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div className="container" style={{ padding: '60px 0', color: 'red' }}>Error: {error}</div>;
  if (!order) return <div className="container" style={{ padding: '60px 0' }}>Order not found</div>;

  const timelineSteps = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
  // Track which timeline steps have actually occurred based on history
  const orderStatus = order?.orderStatus?.toUpperCase() || 'PENDING';
  const historyStatuses = order?.timeline?.map(t => t?.status) || [orderStatus];
  const currentStatusIndex = timelineSteps.indexOf(orderStatus);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <main className="order-details-page container section">
      <div style={{ marginBottom: '24px' }}>
         <Link to="/orders" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons-outlined">arrow_back</span>
            Back to Orders
         </Link>
      </div>
      
      <div className="order-details-header">
        <div>
          <h1 style={{ fontSize: '24px', margin: 0, color: 'var(--primary-dark)' }}>Order #{order?._id?.substring(0, 8).toUpperCase() || 'Unknown'}</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--gray-600)' }}>
             Placed on {formatDate(order?.createdAt)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-dark)', fontWeight: '800' }}>
             <span style={{ fontSize: '18px', marginRight: '4px', verticalAlign: 'middle', fontWeight: '400' }}>₹</span>
             {Number(order?.totalPrice || 0).toFixed(2)}
           </h2>
           <span className="badge" style={{ marginTop: '8px', display: 'inline-block', backgroundColor: 'var(--primary-color)', color: 'white' }}>
             {orderStatus}
           </span>
        </div>
      </div>

      <div className="order-timeline-card">
        <h3 style={{ marginBottom: '24px', color: 'var(--text-dark)' }}>Tracking Timeline</h3>
        <div className="timeline-container">
          {timelineSteps.map((step, index) => {
            const isCompleted = historyStatuses.includes(step) || index <= currentStatusIndex;
            const isCurrent = orderStatus === step;
            
            // Find specific date if it exists 
            const timelineEvent = order?.timeline?.find(t => t?.status === step);
            
            return (
              <div key={step} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                 <div className="timeline-icon">
                    <span className="material-icons-outlined">
                      {step === 'PENDING' ? 'shopping_cart' : 
                       step === 'CONFIRMED' ? 'verified' : 
                       step === 'PACKED' ? 'inventory_2' : 
                       step === 'SHIPPED' ? 'local_shipping' : 'home'}
                    </span>
                 </div>
                 <div className="timeline-content">
                    <h4>{step}</h4>
                    {isCompleted && timelineEvent && timelineEvent.date && (
                      <p className="timeline-date">
                         {formatDate(timelineEvent.date)}
                      </p>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="order-details-grid">
         <div className="order-products-card">
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Items Summary</h3>
           {(order?.orderItems || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx !== (order?.orderItems?.length || 0) - 1 ? '1px dashed var(--gray-200)' : 'none' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--cream-light)' }}>
                       <img src={item?.image || ''} alt={item?.name || 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{item?.name || 'Unknown Item'}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>Qty: {item?.qty || 1}</span>
                    </div>
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                   <span style={{ fontSize: '0.9rem', marginRight: '2px' }}>₹</span>{Number((item?.price || 0) * (item?.qty || 1)).toFixed(2)}
                </div>
              </div>
           ))}
         </div>

         <div className="order-info-card">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Shipping Address</h3>
              <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-dark)' }}>
                 <strong>{user?.name || order?.user?.name || 'Customer'}</strong><br/>
                 {order?.shippingAddress?.street || 'No Street Provided'}<br/>
                 {order?.shippingAddress?.city || 'No City'}, {order?.shippingAddress?.state || 'No State'} - {order?.shippingAddress?.pincode || 'No Pincode'}<br/>
                 Phone: {order?.shippingAddress?.phone || 'Not Provided'}
              </p>
            </div>
            
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Payment Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--gray-600)' }}>
                 <span>Subtotal</span>
                 <span><span style={{ fontSize: '0.85rem' }}>₹</span>{Number(order?.itemsPrice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--gray-600)' }}>
                 <span>GST (5%)</span>
                 <span><span style={{ fontSize: '0.85rem' }}>₹</span>{Number(order?.taxPrice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--gray-600)' }}>
                 <span>Delivery Fee</span>
                 <span>{order?.shippingPrice === 0 ? 'FREE' : <><span style={{ fontSize: '0.85rem' }}>₹</span>{Number(order?.shippingPrice || 0).toFixed(2)}</>}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                 <span>Total</span>
                 <span style={{ color: 'var(--primary-dark)' }}><span style={{ fontSize: '0.9rem', marginRight: '2px' }}>₹</span>{Number(order?.totalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
         </div>
      </div>
    </main>
  );
}
