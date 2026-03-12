import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
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
            <a href="/profile" className="active">
              <span className="material-icons-outlined">person</span>
              My Profile
            </a>
            <a href="/orders">
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
                  disabled // Email usually can't be changed easily without verification
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
          </div>
        </div>
      </div>
    </main>
  );
}
