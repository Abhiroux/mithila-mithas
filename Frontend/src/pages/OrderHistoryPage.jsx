import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css'; // Reusing profile layout

export default function OrderHistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders/myorders', {
          credentials: 'include'
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
        
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

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
            <a href="/profile">
              <span className="material-icons-outlined">person</span>
              My Profile
            </a>
            <a href="/orders" className="active">
              <span className="material-icons-outlined">shopping_bag</span>
              Order History
            </a>
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
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons-outlined" style={{fontSize: '64px', color: 'var(--gray-300)'}}>receipt_long</span>
                <h3>No Orders Yet</h3>
                <p>Looks like you haven't made any purchases yet.</p>
                <a href="/menu" className="btn btn-primary" style={{marginTop: 'var(--space-md)'}}>Browse Menu</a>
              </div>
            ) : (
              <div className="orders-list">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>DATE</th>
                      <th>TOTAL</th>
                      <th>PAID</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order._id.substring(0, 10)}...</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>₹{order.totalPrice.toFixed(2)}</td>
                        <td>
                          {order.isPaid ? (
                            <span className="badge badge-success">
                              {new Date(order.paidAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="badge badge-danger">Not Paid</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${order.orderStatus === 'delivered' ? 'success' : 'warning'}`}>
                            {order.orderStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
