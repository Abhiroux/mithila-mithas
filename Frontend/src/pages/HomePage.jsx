import { Link } from 'react-router-dom';
import FoodCard from '../components/FoodCard';
import { menuItems, testimonials } from '../data/menuData';
import './HomePage.css';

export default function HomePage() {
  const featured = menuItems.filter(item => item.badge === 'Bestseller' || item.badge === 'Premium').slice(0, 4);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i} className="material-icons-outlined" style={{ fontSize: '14px', color: 'var(--gold)' }}>star</span>);
    }
    return stars;
  };

  return (
    <main className="home" id="home-page">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero__bg">
          <img src="/images/hero-banner.png" alt="Mithila Mithas Sweets" className="hero__bg-img" />
          <div className="hero__overlay"></div>
        </div>
        <div className="hero__content container">
          <span className="hero__tag animate-fade-in-up">✨ Authentic Mithila Flavors</span>
          <h1 className="hero__title animate-fade-in-up delay-1">
            Mithila <span className="hero__title-accent">Mithas</span>
          </h1>
          <p className="hero__subtitle animate-fade-in-up delay-2">
            Authentic Mithila Delicacies, Delivered to Your Doorstep
          </p>
          <div className="hero__actions animate-fade-in-up delay-3">
            <Link to="/menu" className="btn btn-primary btn-lg" id="hero-order-btn">
              <span className="material-icons-outlined">restaurant_menu</span>
              Order Now
            </Link>
            <Link to="/menu" className="btn btn-outline btn-lg" id="hero-explore-btn">
              Explore Menu
            </Link>
          </div>
          <div className="hero__stats animate-fade-in-up delay-4">
            <div className="hero__stat">
              <span className="hero__stat-number">10K+</span>
              <span className="hero__stat-label">Happy Customers</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-number">25+</span>
              <span className="hero__stat-label">Traditional Recipes</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-number">50+</span>
              <span className="hero__stat-label">Cities Served</span>
            </div>
          </div>
        </div>
        <div className="hero__scroll-indicator">
          <span className="material-icons-outlined">expand_more</span>
        </div>
      </section>

      {/* Featured */}
      <section className="featured section" id="featured-section">
        <div className="container">
          <h2 className="section-title">Our Signature Delights</h2>
          <p className="section-subtitle">Handcrafted with love, using time-honored recipes passed down through generations</p>
          <div className="featured__grid">
            {featured.map((item, i) => (
              <div key={item.id} className={`animate-fade-in-up delay-${i + 1}`} style={{ opacity: 0 }}>
                <FoodCard item={item} />
              </div>
            ))}
          </div>
          <div className="featured__cta">
            <Link to="/menu" className="btn btn-ghost btn-lg" id="view-all-menu">
              View Full Menu
              <span className="material-icons-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why section" id="why-section">
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">We pour our heart into every sweet we make</p>
          <div className="why__grid">
            {[
              { icon: 'verified', title: '100% Authentic', desc: 'Every recipe is sourced directly from the kitchens of Mithila. No shortcuts, no compromises.' },
              { icon: 'eco', title: 'Pure Ingredients', desc: 'We use only the finest natural ingredients — pure ghee, organic jaggery, and fresh farm produce.' },
              { icon: 'local_shipping', title: 'Fast Delivery', desc: 'Fresh sweets delivered to your doorstep in secure packaging. Pan-India delivery available.' },
              { icon: 'favorite', title: 'Made with Love', desc: 'Every sweet is handcrafted by skilled artisans who have been perfecting their craft for decades.' },
            ].map((item, i) => (
              <div key={i} className={`why__card animate-fade-in-up delay-${i + 1}`} style={{ opacity: 0 }}>
                <div className="why__card-icon">
                  <span className="material-icons-outlined">{item.icon}</span>
                </div>
                <h3 className="why__card-title">{item.title}</h3>
                <p className="why__card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials section" id="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">Real stories from real food lovers</p>
          <div className="testimonials__grid">
            {testimonials.map((t, i) => (
              <div key={t.id} className={`testimonial__card animate-fade-in-up delay-${i + 1}`} style={{ opacity: 0 }}>
                <div className="testimonial__quote">
                  <span className="material-icons-outlined">format_quote</span>
                </div>
                <p className="testimonial__text">{t.text}</p>
                <div className="testimonial__stars">
                  {renderStars(t.rating)}
                </div>
                <div className="testimonial__author">
                  <div className="testimonial__avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="testimonial__name">{t.name}</p>
                    <p className="testimonial__location">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner" id="cta-section">
        <div className="container">
          <div className="cta-banner__inner">
            <div className="cta-banner__text">
              <h2>Ready to taste the tradition?</h2>
              <p>Order now and get <strong>free delivery</strong> on your first order above ₹500</p>
            </div>
            <Link to="/menu" className="btn btn-primary btn-lg" id="cta-order-btn">
              Order Now
              <span className="material-icons-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
