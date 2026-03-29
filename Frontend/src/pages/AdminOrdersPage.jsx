import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Pagination State
  const [status, setStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, status, page]); // Dependencies that trigger immediate fetch

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('status', status);
      if (searchTerm) params.append('search', searchTerm);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`http://localhost:5000/api/orders?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to load orders');
      
      setOrders(data.orders);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

    setProcessingId(orderId);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
           status: newStatus,
           description: `Admin updated status to ${newStatus}` 
        }),
        credentials: 'include'
      });
      const updatedOrder = await res.json();
      
      if (!res.ok) throw new Error(updatedOrder.message || 'Failed to update order');
      
      setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <main className="admin-page section" style={{ minHeight: '80vh', backgroundColor: 'var(--cream-bg)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ marginBottom: '8px', color: 'var(--primary-dark)' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--gray-600)', margin: 0 }}>Manage customer orders and dispatch statuses</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--maroon)' }}>{total}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Total Orders</div>
          </div>
        </div>
        
        <div className="admin-orders-container">
          {/* Filters Bar */}
          <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
            <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-600)' }}>Search Orders</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="ID, Name, or Email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-600)' }}>From Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--gray-600)' }}>To Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--gray-200)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}>Apply</button>
                <button 
                  type="button" 
                  onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setStatus('ALL'); setPage(1); }} 
                  className="btn btn-outline" 
                  style={{ color: 'var(--maroon)', borderColor: 'var(--maroon)', padding: '10px' }}
                >
                  Reset
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px', borderTop: '1px solid var(--gray-100)', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
               {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(f => (
                 <button 
                   key={f}
                   onClick={() => { setStatus(f); setPage(1); }}
                   className={`btn ${status === f ? 'btn-primary' : 'btn-outline'}`}
                   style={{ 
                     padding: '6px 14px', 
                     fontSize: '0.75rem', 
                     backgroundColor: status === f ? 'var(--maroon)' : 'transparent',
                     borderColor: 'var(--maroon)',
                     color: status === f ? 'white' : 'var(--maroon)' 
                   }}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>
          
          {error && <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#B91C1C', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
          
          <div className="table-responsive" style={{ backgroundColor: 'var(--white)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', overflow: 'hidden', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                 <div style={{ color: 'var(--maroon)', fontWeight: 'bold' }}>Loading...</div>
              </div>
            )}
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--cream-light)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Order ID</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Customer</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Date</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Total</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Payment</th>
                  <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>Status Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading ? (
                  <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No orders found matching your criteria.</td></tr>
                ) : orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '0.9rem' }}>#{order._id.substring(0, 8).toUpperCase()}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-dark)' }}>{order.user?.name || 'Guest'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{order.user?.email}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                       {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>₹{order.totalPrice.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}>
                       <span style={{ 
                         padding: '4px 8px', 
                         borderRadius: '4px', 
                         fontSize: '0.7rem', 
                         fontWeight: 'bold',
                         backgroundColor: order.isPaid ? 'rgba(45, 139, 85, 0.1)' : 'rgba(224, 160, 32, 0.1)',
                         color: order.isPaid ? 'var(--success)' : 'var(--warning)'
                       }}>
                          {order.isPaid ? 'PAID' : 'UNPAID'}
                       </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={order.orderStatus.toUpperCase()} 
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={processingId === order._id}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'white',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      >
                        {['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(s => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline"
                style={{ padding: '8px 16px', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Page <strong>{page}</strong> of {pages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn btn-outline"
                style={{ padding: '8px 16px', opacity: page === pages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
