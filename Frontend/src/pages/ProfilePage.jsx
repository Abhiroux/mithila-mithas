import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/Checkout/AddressForm';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateProfile, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabFromUrl = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'addresses' ? 'addresses' : 'profile'); // 'profile', 'addresses'
  const [showNewForm, setShowNewForm] = useState(false);
  
  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  // Fetch addresses directly from API for reliability
  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/addresses', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      fetchAddresses();
    }
  }, [user, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (password && password !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    const updates = { name, email, phone, password: password || undefined };
    const res = await updateProfile(updates);
    
    if (res.success) {
      setIsError(false);
      setMessage('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } else {
      setIsError(true);
      setMessage(res.error);
    }
    
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddressSubmit = async (newAddress) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAddress)
      });
      
      const updatedAddresses = await res.json();
      if (!res.ok) throw new Error(updatedAddresses.message || 'Failed to add address');
      
      // Update local address state with the fresh list from server
      setAddresses(updatedAddresses);
      setShowNewForm(false);
      // Also refresh user in AuthContext so other pages (like Checkout) get fresh addresses
      refreshUser();
    } catch (err) {
      alert(err.message);
    }
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
            <button 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              <span className="material-icons-outlined">person</span>
              My Profile
            </button>
            <button 
              className={activeTab === 'addresses' ? 'active' : ''} 
              onClick={() => setActiveTab('addresses')}
            >
              <span className="material-icons-outlined">home</span>
              My Addresses
            </button>
            <Link to="/orders">
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
            
            {activeTab === 'profile' && (
              <>
                <div className="profile-card__header">
                  <h2>Account Details</h2>
                  <p>Update your personal information and password</p>
                </div>

                {message && (
                  <div className={`profile-message ${isError ? 'error' : 'success'}`}>
                    {message}
                  </div>
                )}

                <form className="profile-form" onSubmit={submitHandler}>
                  <div className="profile-form__row">
                    <div className="profile-form__group">
                      <label htmlFor="name">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="profile-form__group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="profile-form__group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      disabled
                      className="disabled-input"
                    />
                  </div>

                  <div className="profile-form__divider">
                    <span>Update Password</span>
                  </div>

                  <div className="profile-form__row">
                    <div className="profile-form__group">
                      <label htmlFor="password">New Password</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                    <div className="profile-form__group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary profile-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </form>
              </>
            )}

            {activeTab === 'addresses' && (
              <>
                <div className="profile-card__header">
                  <h2>My Addresses</h2>
                  <p>Manage your delivery locations</p>
                </div>
                
                <div className="profile-addresses-wrapper">
                  {addressLoading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading addresses...</p>
                  ) : !showNewForm && addresses.length === 0 ? (
                      <div className="empty-state" style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                         <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)' }}>location_off</span>
                         <h3 style={{ margin: '16px 0 8px' }}>No address saved</h3>
                         <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
                            <span className="material-icons-outlined" style={{ marginRight: '8px', fontSize: '18px' }}>add</span>
                            Add Address
                         </button>
                      </div>
                  ) : !showNewForm && addresses.length > 0 ? (
                      <>
                         <div className="saved-addresses-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                           {addresses.map(addr => (
                              <div key={addr._id} className="address-display-card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="addr-label" style={{ background: 'var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{addr.label}</span>
                                    {addr.isDefault && <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>Default</span>}
                                </div>
                                <p style={{ margin: '8px 0 4px', fontWeight: '500', color: 'var(--text-dark)' }}>{addr.name || user.name}</p>
                                <p style={{ margin: '0 0 4px', color: 'var(--text-muted)' }}>{addr.street}</p>
                                <p style={{ margin: '0 0 4px', color: 'var(--text-muted)' }}>{addr.city}, {addr.state} {addr.pincode}</p>
                                {addr.phone && <p style={{ margin: '0', fontSize: '0.9rem' }}>📞 {addr.phone}</p>}
                              </div>
                           ))}
                         </div>
                         <button className="btn btn-outline" onClick={() => setShowNewForm(true)}>
                            <span className="material-icons-outlined" style={{ marginRight: '8px', fontSize: '18px' }}>add</span>
                            Add New Address
                         </button>
                      </>
                  ) : (
                      <div className="add-new-address-section">
                         {addresses.length > 0 && (
                             <button className="btn btn-ghost" style={{ marginBottom: '16px', padding: 0 }} onClick={() => setShowNewForm(false)}>
                                &larr; Back to Addresses
                             </button>
                         )}
                         <h3 style={{ marginBottom: '16px' }}>Add a New Address</h3>
                         <AddressForm onAddressSubmit={(addr) => { handleAddressSubmit(addr); setShowNewForm(false); }} />
                      </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
