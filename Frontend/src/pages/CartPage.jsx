import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import { useAuth } from '../context/AuthContext';
import './CartPage.css';

// Utility to load Razorpay script (removed, now in CheckoutPage)

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotals
  } = useCartStore();
  
  const { cartCount, subtotal, deliveryFee, gst, total } = getTotals();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const finalTotal = Math.round((total - discount) * 100) / 100;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'mithila10') {
      setPromoApplied(true);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart-page" id="cart-page">
        <section className="cart-page__header">
          <div className="container">
            <h1 className="cart-page__title">Your Cart</h1>
          </div>
        </section>
        <section className="cart-page__empty section">
          <div className="container">
            <div className="cart-empty">
              <span className="material-icons-outlined cart-empty__icon">shopping_cart</span>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any delicious items yet!</p>
              <Link to="/menu" className="btn btn-primary btn-lg" id="cart-browse-btn">
                <span className="material-icons-outlined">restaurant_menu</span>
                Browse Menu
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page" id="cart-page">
      <section className="cart-page__header">
        <div className="container">
          <h1 className="cart-page__title">Your Cart</h1>
          <p className="cart-page__subtitle">{cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
        </div>
      </section>

      <section className="cart-page__content section">
        <div className="container">
          <div className="cart-page__layout">
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => {
                const itemKey = item.product || item._id || item.name;
                return (
                <div key={itemKey} className="cart-item animate-fade-in" id={`cart-item-${itemKey}`}>
                  <img src={item.image} alt={item.name} className="cart-item__image" />
                  <div className="cart-item__info">
                    <h3 className="cart-item__name">{item.name}</h3>
                    <p className="cart-item__weight">{item.weight}</p>
                    <p className="cart-item__unit-price">₹{item.price} each</p>
                  </div>
                  <div className="cart-item__quantity">
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                      id={`qty-dec-${itemKey}`}
                    >
                      <span className="material-icons-outlined">remove</span>
                    </button>
                    <span className="cart-item__qty-value">{item.quantity}</span>
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                      id={`qty-inc-${itemKey}`}
                    >
                      <span className="material-icons-outlined">add</span>
                    </button>
                  </div>
                  <p className="cart-item__total">₹{item.price * item.quantity}</p>
                  <button
                    className="cart-item__remove"
                    onClick={() => removeFromCart(itemKey)}
                    aria-label="Remove item"
                    id={`remove-${itemKey}`}
                  >
                    <span className="material-icons-outlined">delete_outline</span>
                  </button>
                </div>
                );
              })}

              {/* Promo Code */}
              <div className="cart-promo">
                <div className="cart-promo__input-wrap">
                  <span className="material-icons-outlined">local_offer</span>
                  <input
                    type="text"
                    placeholder='Try "MITHILA10" for 10% off'
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="cart-promo__input"
                    id="promo-input"
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyPromo}
                  id="apply-promo-btn"
                >
                  Apply
                </button>
              </div>
              {promoApplied && (
                <p className="cart-promo__success">
                  <span className="material-icons-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  Coupon "MITHILA10" applied! 10% discount added.
                </p>
              )}

              <Link to="/menu" className="cart-continue" id="continue-shopping">
                <span className="material-icons-outlined">arrow_back</span>
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="order-summary" id="order-summary">
              <h2 className="order-summary__title">Order Summary</h2>

              <div className="order-summary__rows">
                <div className="order-summary__row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="order-summary__row">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'order-summary__free' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="order-summary__row">
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                {promoApplied && (
                  <div className="order-summary__row order-summary__row--discount">
                    <span>Discount (10%)</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
              </div>

              <div className="order-summary__divider"></div>

              <div className="order-summary__total">
                <span>Total</span>
                <span>₹{finalTotal}</span>
              </div>

              {deliveryFee === 0 && (
                <p className="order-summary__savings">
                  <span className="material-icons-outlined" style={{ fontSize: '14px' }}>celebration</span>
                  You're saving ₹49 on delivery!
                </p>
              )}

              {errorMsg && <div style={{color: 'var(--error)', fontSize: '0.9rem', marginBottom: 'var(--space-md)'}}>{errorMsg}</div>}

              <button 
                className="btn btn-primary btn-lg order-summary__checkout" 
                id="checkout-btn"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                <span className="material-icons-outlined">lock</span>
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <div className="order-summary__trust">
                <span className="material-icons-outlined" style={{ fontSize: '16px', color: 'var(--gold)' }}>verified_user</span>
                <span>Secure checkout · 100% Safe</span>
              </div>

              <div className="order-summary__payments">
                <span>UPI</span>
                <span>Cards</span>
                <span>Net Banking</span>
                <span>COD</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
