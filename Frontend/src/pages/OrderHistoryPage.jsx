import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css'; // Reusing profile layout

export default function OrderHistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/orders/myorders?page=${page}`, {
          credentials: 'include'
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        
        setOrders(data.orders);
        setPages(data.pages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate, page]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <main className="profile-page container">
      <div className="profile-layout">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-sidebar__user">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <nav className="profile-nav">
            <Link to="/profile">
              <span className="material-icons-outlined">person</span>
              My Profile
            </Link>
            <Link to="/profile?tab=addresses">
              <span className="material-icons-outlined">home</span>
              My Addresses
            </Link>
            <Link to="/orders" className="active">
              <span className="material-icons-outlined">shopping_bag</span>
              Order History
            </Link>
            <button onClick={handleLogout} className="profile-nav__logout">
              <span className="material-icons-outlined">logout</span>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-card__header">
              <h2>My Orders</h2>
              <p>View your past purchases and track current orders</p>
            </div>

            {loading ? (
              <p>Loading orders...</p>
            ) : error ? (
              <div className="profile-message error">{error}</div>
            ) : (orders || []).length === 0 ? (
              <div className="empty-state">
                <span className="material-icons-outlined" style={{fontSize: '64px', color: 'var(--gray-300)'}}>receipt_long</span>
                <h3>No Orders Yet</h3>
                <p>Looks like you haven't made any purchases yet.</p>
                <a href="/menu" className="btn btn-primary" style={{marginTop: 'var(--space-md)'}}>Browse Menu</a>
              </div>
            ) : (
              <>
                <div className="orders-list">
                  {orders.map((order) => (
                    <div key={order._id} className="order-card" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px', padding: '16px', backgroundColor: 'var(--white)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                        <div>
                          <strong>Order #{order._id.substring(0, 8).toUpperCase()}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                             Placed on {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong>₹{order.totalPrice.toFixed(2)}</strong>
                          <div style={{ marginTop: '4px' }}>
                            <span className={`badge badge-${order.orderStatus === 'DELIVERED' ? 'success' : 'warning'}`}>
                              {order.orderStatus.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ marginTop: '12px' }}>
                             <Link to={`/order/${order._id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                View Details
                             </Link>
                          </div>
                        </div>
                      </div>
                      
                      <div className="order-items" style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Items Wrapped:</strong>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: '8px 0', fontSize: '0.9rem' }}>
                          {(order.orderItems || []).map((item, idx) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx !== (order.orderItems?.length || 0) - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                              <span>{item.qty}x {item.name}</span>
                              <span>₹{(item.price * item.qty).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="order-shipping" style={{ fontSize: '0.85rem', color: 'var(--gray-600)', backgroundColor: 'var(--cream-light)', padding: '10px', borderLeft: '3px solid var(--primary-color)', borderRadius: '4px' }}>
                         <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-dark)' }}>🚚 Shipped to:</strong> 
                         {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-outline btn-sm"
                      style={{ opacity: page === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '0.85rem' }}>Page {page} of {pages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="btn btn-outline btn-sm"
                      style={{ opacity: page === pages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
