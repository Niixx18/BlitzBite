import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  performSearch,
  selectSearchShops,
  selectSearchItems,
  selectSearchStatus,
  selectSearchError,
} from '../features/search/searchSlice';
import {
  addToCart,
  updateCartItem,
  removeCartItem,
  selectCartItems,
  fetchCart,
} from '../features/cart/cartSlice';
import StarRating from '../components/StarRating';
import { useCurrentUser } from '../hooks/useCurrentUser';

const TABS = ['All', 'Restaurants', 'Dishes'];
const SPICE_LEVELS = ['none', 'mild', 'medium', 'hot', 'extra-hot'];
const SPICE_COLORS = {
  none: 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10',
  mild: 'text-lime-600 border-lime-500/20 bg-lime-500/10',
  medium: 'text-amber-600 border-amber-500/20 bg-amber-500/10',
  hot: 'text-rose-600 border-rose-500/20 bg-rose-500/10',
  'extra-hot': 'text-red-700 border-red-500/20 bg-red-500/10',
};
const SPICE_ICONS = {
  none: 'local_pizza',
  mild: 'nature',
  medium: 'local_fire_department',
  hot: 'flame',
  'extra-hot': 'bolt',
};

// Smart Veg / Non-Veg detection helper
const isVegetarian = (item) => {
  const text = `${item.name} ${item.description || ''} ${item.category || ''}`.toLowerCase();
  const vegKeywords = [
    'veg', 'paneer', 'dal', 'margherita', 'salad', 'naan', 'rice', 'lassi', 
    'spring roll', 'french fry', 'fries', 'drink', 'fruit', 'garlic bread', 
    'cheese', 'truffle', 'mushroom', 'risotto', 'roti', 'paratha', 'gobi', 
    'aloo', 'chana', 'bhindi', 'kofta', 'malai'
  ];
  const nonVegKeywords = [
    'chicken', 'pepperoni', 'beef', 'mutton', 'pork', 'fish', 'meat', 'calamari', 
    'salami', 'diavola', 'egg', 'kebab', 'tikka', 'bacon', 'prawn', 'shrimp'
  ];

  if (nonVegKeywords.some(kw => text.includes(kw))) {
    return false;
  }
  if (vegKeywords.some(kw => text.includes(kw))) {
    return true;
  }
  return true;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useCurrentUser();

  const shops = useSelector(selectSearchShops);
  const items = useSelector(selectSearchItems);
  const status = useSelector(selectSearchStatus);
  const error = useSelector(selectSearchError);
  const cartItems = useSelector(selectCartItems);

  const q = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('All');
  const [searchInput, setSearchInput] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const [toast, setToast] = useState(null);

  if (prevQ !== q) {
    setPrevQ(q);
    setSearchInput(q);
  }

  // Filters state
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    isOpen: '',
    minPrice: '',
    maxPrice: '',
    spiceLevel: '',
    isAvailable: '',
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const runSearch = useCallback(() => {
    dispatch(performSearch({ q, ...filters }));
  }, [dispatch, q, filters]);

  useEffect(() => {
    if (q) runSearch();
  }, [q, filters, runSearch]);

  useEffect(() => {
    if (user?.id || user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = searchInput.trim();
    if (val) {
      setSearchParams({ q: val });
    }
  };

  const handleAddToCart = async (itemId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please sign in to add items to cart!', 'error');
      return;
    }
    try {
      await dispatch(addToCart({ itemId, quantity: 1 })).unwrap();
      showToast('Added to cart! 🛒');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    }
  };

  const handleUpdateQuantity = async (itemId, currentQty, increment) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please sign in to modify cart!', 'error');
      return;
    }
    const newQty = currentQty + increment;
    try {
      if (newQty <= 0) {
        await dispatch(removeCartItem(itemId)).unwrap();
        showToast('Removed from cart');
      } else {
        await dispatch(updateCartItem({ itemId, quantity: newQty })).unwrap();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  const updateFilter = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    setFilters({ category: '', city: '', isOpen: '', minPrice: '', maxPrice: '', spiceLevel: '', isAvailable: '' });
  };

  const totalResults = shops.length + items.length;
  const isLoading = status === 'loading';

  const tabCounts = {
    All: totalResults,
    Restaurants: shops.length,
    Dishes: items.length,
  };

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      {/* ── Toast notification ─────────────────────────── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-md font-bold text-sm text-white transition-all duration-300 animate-slide-in ${
          toast.type === 'error' ? 'bg-error' : 'bg-emerald-600'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Search Header ─────────────────────────────── */}
      <div className="border-b border-outline-variant/30 pb-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="flex items-center bg-surface-container-high border-2 border-transparent focus-within:border-primary focus-within:bg-white rounded-2xl p-1.5 pl-4 shadow-sm transition-all duration-200">
              <span className="material-symbols-outlined text-on-surface-variant/70 mr-3 select-none">search</span>
              <input
                id="search-page-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search restaurants, dishes..."
                className="flex-1 bg-transparent border-none outline-none text-on-surface font-medium text-sm md:text-base placeholder:text-on-surface-variant/40"
              />
              <button
                type="submit"
                className="bg-primary text-on-primary font-bold text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {q && (
            <p className="mt-4 text-xs font-semibold text-on-surface-variant/70">
              {isLoading ? (
                'Searching...'
              ) : (
                <>
                  Found {totalResults} {totalResults === 1 ? 'result' : 'results'} for{' '}
                  <span className="text-primary font-bold">&quot;{q}&quot;</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop flex flex-col md:flex-row gap-8 items-start">
        
        {/* ── Filter Sidebar ─────────────────────────────── */}
        <aside className="w-full md:w-64 shrink-0 bg-surface-container-lowest rounded-[24px] border border-outline-variant/30 p-6 shadow-sm md:sticky md:top-24 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
            <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-1.5 select-none">
              <span className="material-symbols-outlined text-base font-bold">tune</span>
              Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-primary font-bold text-xs hover:text-primary-container transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <FilterSection label="Category">
              <FilterInput
                id="filter-category"
                placeholder="e.g. Pizza, Burger"
                value={filters.category}
                onChange={(v) => updateFilter('category', v)}
              />
            </FilterSection>

            <FilterSection label="City">
              <FilterInput
                id="filter-city"
                placeholder="e.g. Patna, Mumbai"
                value={filters.city}
                onChange={(v) => updateFilter('city', v)}
              />
            </FilterSection>

            <FilterSection label="Restaurant Status">
              <select
                id="filter-isopen"
                value={filters.isOpen}
                onChange={(e) => updateFilter('isOpen', e.target.value)}
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-bold outline-none cursor-pointer transition-all"
              >
                <option value="">Any Status</option>
                <option value="true">Open Now</option>
                <option value="false">Closed</option>
              </select>
            </FilterSection>

            <FilterSection label="Price Range (₹)">
              <div className="flex gap-2">
                <FilterInput id="filter-min-price" placeholder="Min" value={filters.minPrice} onChange={(v) => updateFilter('minPrice', v)} type="number" />
                <FilterInput id="filter-max-price" placeholder="Max" value={filters.maxPrice} onChange={(v) => updateFilter('maxPrice', v)} type="number" />
              </div>
            </FilterSection>

            <FilterSection label="Spice Level">
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs text-on-surface-variant font-semibold cursor-pointer flex items-center gap-2">
                  <input
                    type="radio"
                    name="spice"
                    value=""
                    checked={filters.spiceLevel === ''}
                    onChange={() => updateFilter('spiceLevel', '')}
                    className="accent-primary w-3.5 h-3.5"
                  />
                  Any Spice
                </label>
                {SPICE_LEVELS.map((level) => (
                  <label key={level} className="text-xs text-on-surface-variant font-semibold cursor-pointer flex items-center gap-2">
                    <input
                      type="radio"
                      name="spice"
                      value={level}
                      checked={filters.spiceLevel === level}
                      onChange={() => updateFilter('spiceLevel', level)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="capitalize">{level === 'none' ? 'None 🟢' : level}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Availability">
              <select
                id="filter-available"
                value={filters.isAvailable}
                onChange={(e) => updateFilter('isAvailable', e.target.value)}
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-bold outline-none cursor-pointer transition-all"
              >
                <option value="">Any Availability</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </FilterSection>
          </div>
        </aside>

        {/* ── Main Results ─────────────────────────────── */}
        <section className="flex-1 w-full min-w-0 space-y-6">
          
          {/* Tab Selection */}
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-1 w-fit flex gap-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase()}`}
                onClick={() => setActiveTab(tab)}
                className={`font-sans text-xs px-5 py-2 rounded-xl font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {tab}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Skeletons while searching */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-[24px] bg-surface-container-high animate-pulse border border-outline-variant/20" />
              ))}
            </div>
          )}

          {/* Error fallback state */}
          {!isLoading && error && (
            <div className="text-center py-16 border border-outline-variant/30 rounded-[24px] bg-surface-container-lowest p-6 space-y-4">
              <span className="material-symbols-outlined text-6xl text-rose-500 font-light">warning_amber</span>
              <div>
                <p className="text-base font-extrabold text-on-surface">Something went wrong</p>
                <p className="text-xs text-on-surface-variant mt-1">{error}</p>
              </div>
              <button
                onClick={runSearch}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Empty initial state */}
          {!isLoading && !error && !q && (
            <div className="text-center py-20 border border-outline-variant/30 rounded-[24px] bg-surface-container-lowest p-6 space-y-3">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 font-light">search</span>
              <h3 className="text-lg font-black text-on-surface">Discover BlitzBite</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Type what you are craving in the search bar above to find restaurants and dishes near you.
              </p>
            </div>
          )}

          {/* Empty search results state */}
          {!isLoading && !error && q && totalResults === 0 && (
            <div className="text-center py-20 border border-outline-variant/30 rounded-[24px] bg-surface-container p-6 space-y-4">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 font-light">emoji_food_beverage</span>
              <div>
                <h3 className="text-lg font-black text-on-surface">No results found</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  We couldn't find matches for &quot;{q}&quot;. Try adjusting your filters.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Shop Results List */}
          {!isLoading && !error && (activeTab === 'All' || activeTab === 'Restaurants') && shops.length > 0 && (
            <section className="space-y-4">
              {activeTab === 'All' && (
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                  <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">Restaurants</h2>
                  <button
                    onClick={() => setActiveTab('Restaurants')}
                    className="text-primary font-bold text-xs hover:text-primary-container transition-colors cursor-pointer"
                  >
                    View All {shops.length} →
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'All' ? shops.slice(0, 3) : shops).map((shop) => (
                  <ShopResultCard key={shop._id} shop={shop} />
                ))}
              </div>
            </section>
          )}

          {/* Dish / Item Results List */}
          {!isLoading && !error && (activeTab === 'All' || activeTab === 'Dishes') && items.length > 0 && (
            <section className="space-y-4 pt-4">
              {activeTab === 'All' && (
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                  <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">Dishes</h2>
                  <button
                    onClick={() => setActiveTab('Dishes')}
                    className="text-primary font-bold text-xs hover:text-primary-container transition-colors cursor-pointer"
                  >
                    View All {items.length} →
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'All' ? items.slice(0, 6) : items).map((item) => {
                  const cartItem = cartItems.find((ci) => ci.item?._id === item._id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  return (
                    <ItemResultCard
                      key={item._id}
                      item={item}
                      quantityInCart={qty}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  );
                })}
              </div>
            </section>
          )}

        </section>
      </div>
    </div>
  );
}

// ─── Shop Result Card ──────────────────────────────────────────────────────
function ShopResultCard({ shop }) {
  return (
    <Link
      to={`/restaurant/${shop._id}`}
      className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/50 overflow-hidden shadow-sm transition-all duration-300 bento-hover hover:border-primary/30 flex flex-col h-full justify-between"
    >
      <div className="relative h-40 bg-surface-container-high shrink-0 overflow-hidden">
        {shop.featuredImage ? (
          <img
            src={shop.featuredImage}
            alt={shop.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-surface-container-high">
            🏪
          </div>
        )}
        <span className={`absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md border ${
          shop.isOpen ? 'bg-emerald-600/90 text-white border-emerald-500/30' : 'bg-rose-600/90 text-white border-rose-500/30'
        }`}>
          {shop.isOpen ? '● Open' : '● Closed'}
        </span>
        {shop.rating > 0 && (
          <span className="absolute top-3 right-3 bg-inverse-surface/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md border border-outline/25">
            ⭐ {shop.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-on-surface line-clamp-1 leading-snug">
            {shop.name}
          </h4>
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {shop.description || 'Quality meals delivered in blitz speed.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant/30 text-[10px]">
          <span className="bg-primary-container/10 text-primary font-bold px-2 py-0.5 rounded-md">
            {shop.category || 'Restaurant'}
          </span>
          {shop.location?.city && (
            <span className="text-on-surface-variant/75 font-semibold flex items-center gap-0.5">
              📍 {shop.location.city}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Item Result Card ──────────────────────────────────────────────────────
function ItemResultCard({ item, quantityInCart, onAddToCart, onUpdateQuantity }) {
  const [adding, setAdding] = useState(false);
  const isVeg = isVegetarian(item);
  const spiceColor = SPICE_COLORS[item.metadata?.spiceLevel] || SPICE_COLORS.none;
  const spiceIcon = SPICE_ICONS[item.metadata?.spiceLevel] || SPICE_ICONS.none;

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    await onAddToCart(item._id);
    setAdding(false);
  };

  return (
    <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/50 overflow-hidden shadow-sm transition-all duration-300 bento-hover hover:border-primary/30 flex flex-col h-full justify-between">
      
      {/* Image header */}
      <div className="relative h-40 bg-surface-container-high shrink-0 overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-surface-container-high">
            🍔
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-1 rounded-md tracking-wider">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Veg icon & Rating */}
        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
          <span
            className={`w-6 h-6 border flex items-center justify-center rounded-lg shadow-sm backdrop-blur-md ${
              isVeg 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
            }`}
            title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
          </span>

          {item.rating >= 4.5 && item.ratingCount > 5 && (
            <span className="bg-primary text-on-primary font-bold text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-0.5">
              ⭐ Bestseller
            </span>
          )}
        </div>

        {/* Spice level badge */}
        {item.metadata?.spiceLevel && item.metadata.spiceLevel !== 'none' && (
          <div className={`absolute top-3 right-3 border rounded-lg px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 backdrop-blur-md shadow-sm ${spiceColor}`}>
            <span className="material-symbols-outlined text-[10px]">{spiceIcon}</span>
            <span className="capitalize">{item.metadata.spiceLevel}</span>
          </div>
        )}
      </div>

      {/* Item info body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-on-surface line-clamp-1 leading-snug">
            {item.name}
          </h4>
          
          {item.shop?.name && (
            <Link to={`/restaurant/${item.shop._id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined text-xs select-none">storefront</span>
              <span>{item.shop.name}</span>
            </Link>
          )}

          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {item.description || 'Deliciously curated menu item.'}
          </p>
        </div>

        {/* Tags / Calories */}
        <div className="flex items-center gap-2 flex-wrap">
          <StarRating rating={item.rating} ratingCount={item.ratingCount} size="sm" />
          {item.metadata?.calories && (
            <span className="bg-surface-container text-on-surface-variant/80 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              🔥 {item.metadata.calories} Cal
            </span>
          )}
        </div>

        {/* Price & Action footer */}
        <div className="pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
          <span className="text-primary font-black text-sm md:text-base">
            ₹{item.price}
          </span>

          {quantityInCart > 0 ? (
            <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-lg p-0.5 shadow-sm shrink-0">
              <button
                onClick={() => onUpdateQuantity(item._id, quantityInCart, -1)}
                className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">remove</span>
              </button>
              <span className="font-bold text-xs w-5 text-center text-on-surface select-none">
                {quantityInCart}
              </span>
              <button
                onClick={() => onUpdateQuantity(item._id, quantityInCart, 1)}
                className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
          ) : (
            <button
              id={`add-to-cart-${item._id}`}
              onClick={handleAdd}
              disabled={!item.isAvailable || adding}
              className={`font-bold text-[10px] px-3.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1 shadow-sm ${
                item.isAvailable
                  ? 'bg-surface-container border-outline-variant text-primary hover:bg-primary hover:text-on-primary hover:border-primary active:scale-95'
                  : 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant/10 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xs font-bold">add</span>
                  <span>ADD</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Shared Layout Helpers ──────────────────────────────────────────────────
function FilterSection({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider select-none">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterInput({ id, placeholder, value, onChange, type = 'text' }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold placeholder:text-on-surface-variant/40 outline-none transition-all"
    />
  );
}
