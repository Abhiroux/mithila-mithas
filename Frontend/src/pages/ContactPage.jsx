import { useState } from 'react';
import './ContactPage.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="contact-page" id="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__overlay"></div>
        <div className="contact-hero__content container">
          <h1 className="contact-hero__title animate-fade-in-up">Get in Touch</h1>
          <p className="contact-hero__subtitle animate-fade-in-up delay-1">
            We'd love to hear from you. Drop us a message!
          </p>
        </div>
      </section>

      <section className="contact-content section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              <h2>Contact Information</h2>
              <p className="contact-info__desc">
                Have questions about our products or need help with an order? Reach out — we're here for you.
              </p>

              <div className="contact-info__items">
                {[
                  { icon: 'location_on', title: 'Visit Us', detail: 'Darbhanga, Bihar, India - 846004' },
                  { icon: 'phone', title: 'Call Us', detail: '+91 98765 43210' },
                  { icon: 'email', title: 'Email Us', detail: 'hello@mithilamithas.com' },
                  { icon: 'schedule', title: 'Working Hours', detail: 'Mon - Sat: 9AM - 8PM' },
                ].map((item, i) => (
                  <div key={i} className="contact-info__item">
                    <div className="contact-info__icon">
                      <span className="material-icons-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <p className="contact-info__item-title">{item.title}</p>
                      <p className="contact-info__item-detail">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="contact-info__socials">
                <a href="#" className="contact-social-btn" aria-label="Facebook">
                  <span className="material-icons-outlined">share</span>
                </a>
                <a href="#" className="contact-social-btn" aria-label="Instagram">
                  <span className="material-icons-outlined">photo_camera</span>
                </a>
                <a href="#" className="contact-social-btn" aria-label="Twitter">
                  <span className="material-icons-outlined">tag</span>
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
              <h2>Send a Message</h2>

              <div className="contact-form__row">
                <div className="contact-form__group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="contact-form__group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="contact-form__group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div className="contact-form__group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us more..."
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-lg contact-form__submit" id="contact-submit">
                <span className="material-icons-outlined">send</span>
                Send Message
              </button>

              {submitted && (
                <div className="contact-form__success animate-scale-in">
                  <span className="material-icons-outlined">check_circle</span>
                  Thank you! We'll get back to you within 24 hours.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
