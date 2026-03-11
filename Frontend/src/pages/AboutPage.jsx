import { useEffect, useRef, useState } from 'react';
import './AboutPage.css';

function Counter({ end, label, suffix = '+' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const steps = 60;
    const stepValue = end / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [visible, end]);

  return (
    <div className="counter" ref={ref}>
      <span className="counter__number">{count}{suffix}</span>
      <span className="counter__label">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="about-page" id="about-page">
      {/* Hero Banner */}
      <section className="about-hero" id="about-hero">
        <div className="about-hero__overlay"></div>
        <div className="about-hero__content container">
          <span className="about-hero__tag animate-fade-in-up">Since 2020</span>
          <h1 className="about-hero__title animate-fade-in-up delay-1">Our Story</h1>
          <p className="about-hero__subtitle animate-fade-in-up delay-2">
            A journey from the heart of Mithila to your home
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story section" id="about-story">
        <div className="container">
          <div className="about-story__grid">
            <div className="about-story__image-wrap">
              <img src="/images/thekua.png" alt="Traditional sweet making" className="about-story__image" />
              <div className="about-story__image-accent"></div>
            </div>
            <div className="about-story__text">
              <h2>Born in the Heart of <span style={{ color: 'var(--maroon)' }}>Mithila</span></h2>
              <p>
                Our journey began with a simple yet powerful mission: to bring the authentic, 
                unmatched flavors of Bihar's rich culinary heritage to every doorstep across India.
              </p>
              <p>
                Each sweet and snack is crafted using time-honored recipes passed down through 
                generations — from our great-grandmothers' kitchens to your dining table. We 
                believe that every bite should carry the warmth, tradition, and love that defines 
                Mithila culture.
              </p>
              <p>
                What started as a small home kitchen venture has now grown into a beloved brand, 
                serving thousands of customers who share our passion for authentic, homemade 
                Mithila delicacies.
              </p>
              <div className="about-story__signature">
                <span>— The Mithila Mithas Family</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values section" id="about-values">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <p className="section-subtitle">The pillars that guide everything we do</p>
          <div className="about-values__grid">
            {[
              { icon: 'auto_stories', title: 'Heritage Recipes', desc: 'Every recipe comes from the kitchens of Mithila, passed down through generations with love.' },
              { icon: 'spa', title: 'Pure Ingredients', desc: 'No preservatives, no shortcuts. Just pure ghee, fresh jaggery, and natural ingredients.' },
              { icon: 'volunteer_activism', title: 'Handcrafted with Love', desc: 'Made by skilled artisans who have been perfecting their craft for decades.' },
              { icon: 'agriculture', title: 'Farm to Table', desc: 'We source our ingredients directly from local farmers, ensuring freshness and quality.' },
            ].map((v, i) => (
              <div key={i} className="about-value-card">
                <div className="about-value-card__icon">
                  <span className="material-icons-outlined">{v.icon}</span>
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats" id="about-stats">
        <div className="container">
          <div className="about-stats__grid">
            <Counter end={10000} label="Happy Customers" />
            <Counter end={25} label="Traditional Recipes" />
            <Counter end={50} label="Cities Served" />
            <Counter end={100} label="Customer Satisfaction" suffix="%" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta section" id="about-cta">
        <div className="container">
          <div className="about-cta__inner">
            <h2>Experience the Taste of Tradition</h2>
            <p>Join thousands of customers who have rediscovered the authentic flavors of Mithila</p>
            <a href="/menu" className="btn btn-primary btn-lg">
              <span className="material-icons-outlined">restaurant_menu</span>
              Explore Our Menu
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
