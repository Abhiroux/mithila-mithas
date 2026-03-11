import { useState, useMemo } from 'react';
import FoodCard from '../components/FoodCard';
import { menuItems, categories } from '../data/menuData';
import './MenuPage.css';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const filteredItems = useMemo(() => {
    let items = [...menuItems];

    // Filter by category
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        items.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }

    return items;
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <main className="menu-page" id="menu-page">
      {/* Page Header */}
      <section className="menu-page__header">
        <div className="container">
          <h1 className="menu-page__title">Our Menu</h1>
          <p className="menu-page__subtitle">
            Discover the authentic flavors of Mithila — every item is handcrafted with love
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="menu-page__filters">
        <div className="container">
          <div className="menu-page__filters-inner">
            <div className="menu-page__categories">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`menu-page__cat-btn ${activeCategory === cat.id ? 'menu-page__cat-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                  id={`category-${cat.id}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="menu-page__controls">
              <div className="menu-page__search">
                <span className="material-icons-outlined">search</span>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="menu-search"
                />
              </div>

              <select
                className="menu-page__sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="menu-sort"
              >
                <option value="default">Sort By</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="menu-page__grid-section section">
        <div className="container">
          {filteredItems.length > 0 ? (
            <>
              <p className="menu-page__count">
                Showing <strong>{filteredItems.length}</strong> items
              </p>
              <div className="menu-page__grid">
                {filteredItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="animate-fade-in-up"
                    style={{ opacity: 0, animationDelay: `${i * 0.08}s` }}
                  >
                    <FoodCard item={item} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="menu-page__empty">
              <span className="material-icons-outlined" style={{ fontSize: '64px', color: 'var(--gray-300)' }}>
                search_off
              </span>
              <h3>No items found</h3>
              <p>Try adjusting your search or category filters</p>
              <button
                className="btn btn-ghost"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
