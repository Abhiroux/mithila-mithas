import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { getTotals } = useCartStore();
  const { cartCount } = getTotals();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navClass = `navbar ${isScrolled || !isHome ? 'navbar--solid' : ''} ${isMobileMenuOpen ? 'navbar--mobile-open' : ''}`;

  return (
    <nav className={navClass} id="main-nav">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" id="nav-logo">
          <span className="navbar__logo-icon">🪷</span>
          <span className="navbar__logo-text">Mithila Mithas</span>
        </Link>

        <button
          className="navbar__hamburger" // Keeping original class for consistency, but using new state
          id="nav-hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="navbar__links">
          {[
            { to: '/', label: 'Home' },
            { to: '/menu', label: 'Menu' },
            { to: '/about', label: 'About' },
            { to: '/contact', label: 'Contact' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
              id={`nav-link-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          <Link to="/cart" className="nav-icon-link" aria-label="Cart">
            <span className="material-icons-outlined">shopping_cart</span>
            {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
          </Link>
          
          {user ? (
            <div className="nav-user-dropdown-container">
              <Link to="/profile" className="nav-icon-link" aria-label="Profile">
                <span className="material-icons-outlined">person</span>
              </Link>
              <div className="nav-user-dropdown">
                <div className="dropdown-header">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <Link to="/profile">My Profile</Link>
                <Link to="/orders">Order History</Link>
                {user.role === 'admin' && (
                   <Link to="/admin/orders" style={{ color: 'var(--primary-dark)', fontWeight: '600' }}>Admin Dashboard</Link>
                )}
                <button onClick={logout}>Logout</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary nav-login-btn">
              Sign In
            </Link>
          )}

          {/* The diff snippet included a mobile-menu-toggle button, but the original already has a hamburger.
              Assuming the original hamburger is sufficient for mobile menu toggling.
              If a separate button is intended, it would need a new design and placement.
              For now, I'll keep the existing hamburger and its functionality. */}
        </div>
      </div>
    </nav>
  );
}
