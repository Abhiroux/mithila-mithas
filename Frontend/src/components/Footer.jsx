import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer__inner container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <h3 className="footer__logo">
              <span>🪷</span> Mithila Mithas
            </h3>
            <p className="footer__desc">
              Bringing the authentic flavors of Mithila to your doorstep. Every sweet tells a story of tradition, love, and the rich culinary heritage of Bihar.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social" aria-label="Facebook" id="footer-facebook">
                <span className="material-icons-outlined">share</span>
              </a>
              <a href="#" className="footer__social" aria-label="Instagram" id="footer-instagram">
                <span className="material-icons-outlined">photo_camera</span>
              </a>
              <a href="#" className="footer__social" aria-label="Twitter" id="footer-twitter">
                <span className="material-icons-outlined">tag</span>
              </a>
              <a href="#" className="footer__social" aria-label="Email" id="footer-email">
                <span className="material-icons-outlined">mail</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__col-title">Quick Links</h4>
            <Link to="/" className="footer__link">Home</Link>
            <Link to="/menu" className="footer__link">Our Menu</Link>
            <Link to="/about" className="footer__link">About Us</Link>
            <Link to="/contact" className="footer__link">Contact</Link>
          </div>

          {/* Categories */}
          <div className="footer__col">
            <h4 className="footer__col-title">Categories</h4>
            <Link to="/menu?category=sweets" className="footer__link">Sweets</Link>
            <Link to="/menu?category=snacks" className="footer__link">Snacks</Link>
            <Link to="/menu?category=beverages" className="footer__link">Beverages</Link>
            <Link to="/menu?category=combos" className="footer__link">Combos</Link>
          </div>

          {/* Customer Support */}
          <div className="footer__col">
            <h4 className="footer__col-title">Customer Support</h4>
            <a href="#" className="footer__link">FAQ</a>
            <a href="#" className="footer__link">Shipping Policy</a>
            <a href="#" className="footer__link">Return Policy</a>
            <a href="#" className="footer__link">Privacy Policy</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Mithila Mithas. All rights reserved. Crafted with ❤️ in Bihar.</p>
        </div>
      </div>
    </footer>
  );
}
