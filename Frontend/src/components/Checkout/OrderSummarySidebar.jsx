export default function OrderSummarySidebar({ 
  cartItems, 
  subtotal, 
  gst, 
  deliveryFee, 
  total, 
  cartCount 
}) {
  return (
    <div className="checkout-sidebar">
      <div className="order-summary-box">
        <h3>Order Summary ({cartCount} items)</h3>
        
        <div className="checkout-cart-items scrollable-items">
          {cartItems.map((item) => (
            <div key={item.product || item.id} className="checkout-mini-item">
              <div className="mini-item-img-wrap">
                <img src={item.image} alt={item.name} />
                <span className="mini-item-qty">{item.quantity}</span>
              </div>
              <div className="mini-item-info">
                <span className="mini-item-name">{item.name}</span>
                <span className="mini-item-price">₹{item.price * item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary__rows mt-4">
          <div className="order-summary__row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="order-summary__row">
            <span>Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-success' : ''}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>
          <div className="order-summary__row">
            <span>GST (5%)</span>
            <span>₹{gst}</span>
          </div>
        </div>

        <div className="order-summary__divider"></div>

        <div className="order-summary__total">
          <span>Total</span>
          <span className="total-highlight">₹{total}</span>
        </div>
      </div>
    </div>
  );
}
