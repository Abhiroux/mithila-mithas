import { useState } from 'react';
import { useCart } from '../context/CartContext';
import './FoodCard.css';

export default function FoodCard({ item }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleAdd = () => {
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="material-icons-outlined star-filled">star</span>
      );
    }
    if (hasHalf) {
      stars.push(
        <span key="half" className="material-icons-outlined star-filled">star_half</span>
      );
    }
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(
        <span key={`empty-${i}`} className="material-icons-outlined star-empty">star_outline</span>
      );
    }
    return stars;
  };

  return (
    <div className="food-card" id={`food-card-${item.id}`}>
      <div className="food-card__image-wrap">
        <img src={item.image} alt={item.name} className="food-card__image" loading="lazy" />
        {item.badge && (
          <span className="food-card__badge">{item.badge}</span>
        )}
        <button
          className={`food-card__wishlist ${liked ? 'food-card__wishlist--active' : ''}`}
          onClick={() => setLiked(!liked)}
          aria-label="Add to wishlist"
          id={`wishlist-${item.id}`}
        >
          <span className="material-icons-outlined">
            {liked ? 'favorite' : 'favorite_border'}
          </span>
        </button>
        {item.isVeg && (
          <span className="food-card__veg-badge">
            <span className="food-card__veg-dot"></span>
          </span>
        )}
      </div>

      <div className="food-card__content">
        <div className="food-card__header">
          <h3 className="food-card__name">{item.name}</h3>
          <span className="food-card__weight">{item.weight}</span>
        </div>

        <p className="food-card__desc">{item.description}</p>

        <div className="food-card__rating">
          <div className="stars">
            {renderStars(item.rating)}
          </div>
          <span className="food-card__reviews">({item.reviews})</span>
        </div>

        <div className="food-card__footer">
          <span className="food-card__price">₹{item.price}</span>
          <button
            className={`btn btn-secondary btn-sm food-card__add ${added ? 'food-card__add--added' : ''}`}
            onClick={handleAdd}
            id={`add-to-cart-${item.id}`}
          >
            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>
              {added ? 'check' : 'add_shopping_cart'}
            </span>
            {added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
