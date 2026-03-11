import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount } = useCart();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navClass = `navbar ${scrolled || !isHome ? 'navbar--solid' : ''} ${mobileOpen ? 'navbar--mobile-open' : ''}`;

  return (
    <nav className={navClass} id="main-nav">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" id="nav-logo">
          <span className="navbar__logo-icon">🪷</span>
          <span className="navbar__logo-text">Mithila Mithas</span>
        </Link>

        <button
          className="navbar__hamburger"
          id="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
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
          <Link to="/cart" className="navbar__cart" id="nav-cart">
            <span className="material-icons-outlined">shopping_cart</span>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>
          <button className="btn btn-secondary btn-sm navbar__signin" id="nav-signin">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
