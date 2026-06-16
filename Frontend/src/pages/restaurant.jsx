import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart as addToCartAction,
  fetchCart,
  updateCartItem,
  removeCartItem,
  selectCartItems
} from '../features/cart/cartSlice';
import StarRating from '../components/StarRating';
import { useCurrentUser } from '../hooks/useCurrentUser';

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

// Smart Veg / Non-Veg detection helper based on typical Indian restaurant keywords
const isVegetarian = (item) => {
  const text = `${item.name} ${item.description || ''} ${item.category || ''}`.toLowerCase();
  const vegKeywords = [
    'veg', 'paneer', 'dal', 'margherita', 'salad', 'naan', 'rice', 'lassi', 
    'spring roll', 'french fry', 'fries', 'drink', 'fruit', 'garlic bread', 
    'cheese', 'truffle', 'mushroom', 'risotto', 'roti', 'paratha', 'gobi', 
    'aloo', 'chana', 'bhindi', 'kofta', 'malai', 'kadhai paneer', 'shahi paneer'
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
  return true; // Default fallback to vegetarian
};

export default function Restaurant() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const cartItems = useSelector(selectCartItems);

  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Fetch shop details
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/${id}`);
        const data = await res.json();
        setShop(data.shop);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingShop(false);
      }
    };
    fetchShop();
  }, [id]);

  // Fetch menu items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/items?shop=${id}&t=${Date.now()}`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [id]);

  // Fetch cart on user authentication state
  useEffect(() => {
    if (user?.id || user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const handleAddToCart = async (itemId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please sign in to add items to cart!', 'error');
      return;
    }
    setAddingToCart(itemId);
    try {
      await dispatch(addToCartAction({ itemId, quantity: 1 })).unwrap();
      showToast('Added to cart! 🛒');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(null);
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

  const handleRate = async (itemId, ratingValue) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please sign in to rate items!', 'error');
      return;
    }
    setRatingLoading(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: ratingValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Rating failed', 'error');
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? {
                ...item,
                rating: data.rating,
                ratingCount: data.ratingCount,
                _userRating: data.userRating,
              }
            : item
        )
      );
      showToast(`You rated this ${ratingValue} ★ — Thanks!`);
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setRatingLoading(null);
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">restaurant</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading restaurant...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error_outline</span>
        <h1 className="text-2xl font-extrabold text-on-surface">Restaurant Not Found</h1>
        <p className="text-on-surface-variant mt-2 max-w-sm">
          We couldn't find the restaurant you are looking for. It may have been closed or removed.
        </p>
        <Link to="/" className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold shadow hover:bg-primary-container transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  // Categories derivation
  const categories = ['All', ...Array.from(new Set(items.map((item) => item.category || 'Other')))];
  
  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => (item.category || 'Other') === selectedCategory);

  // Group by category to show clear headers
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calculate totals for Cart
  const cartSubtotal = cartItems.reduce((sum, ci) => {
    const price = Number(ci.item?.price || 0);
    return sum + price * ci.quantity;
  }, 0);

  const cartTotalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

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

      <main className="max-w-7xl mx-auto w-full px-4 md:px-margin-desktop space-y-8">
        {/* 1. Restaurant Hero Banner */}
        <div className="w-full rounded-[24px] overflow-hidden relative shadow-sm border border-outline-variant/30 group bg-surface-container-high">
          <div className="h-64 md:h-80 w-full relative">
            <img
              src={shop.featuredImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"}
              alt={shop.name}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500 opacity-80"
            />
            <div className="absolute inset-0 bg-linear-to-t from-on-background/95 via-on-background/40 to-transparent"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider backdrop-blur-md border ${
                  shop.isOpen ? 'bg-emerald-600/90 text-white border-emerald-500/30' : 'bg-rose-600/90 text-white border-rose-500/30'
                }`}>
                  {shop.isOpen ? '● Open' : '● Closed'}
                </span>
                <span className="bg-surface/90 text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-md border border-outline/10 backdrop-blur-md">
                  {shop.category || 'Restaurant'}
                </span>
                <span className="bg-surface/90 text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-md border border-outline/10 backdrop-blur-md">
                  🚀 Fastest Delivery
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                {shop.name}
              </h1>
              <p className="text-sm text-outline-variant/90 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-bold text-white">{shop.rating > 0 ? shop.rating.toFixed(1) : 'No ratings yet'}</span>
                <span>•</span>
                <span>📍 {[shop.location?.street, shop.location?.city].filter(Boolean).join(', ')}</span>
                {shop.description && (
                  <>
                    <span>•</span>
                    <span className="italic text-white/80">{shop.description}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Outer Grid for Menu & Sidebar Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          
          {/* Left Column: Menu list */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 2. Sticky Categories Navigation */}
            <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md py-4 border-b border-outline-variant/30 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 items-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`font-sans text-xs px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high border border-outline-variant/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Skeletons while fetching items */}
            {loadingItems && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-[24px] bg-surface-container-high animate-pulse border border-outline-variant/20" />
                ))}
              </div>
            )}

            {/* Empty state for items */}
            {!loadingItems && items.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant border border-outline-variant/30 rounded-[24px] bg-surface-container">
                <span className="material-symbols-outlined text-6xl opacity-30">restaurant_menu</span>
                <p className="text-base font-bold mt-3 text-on-surface">No menu items found</p>
                <p className="text-xs text-on-surface-variant mt-1">Check back later or try another shop.</p>
              </div>
            )}

            {/* Render items categorized */}
            {!loadingItems && Object.entries(groupedItems).map(([category, categoryItems]) => (
              <section key={category} className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
                    {category}
                  </h2>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                    {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryItems.map((item) => {
                    const isVeg = isVegetarian(item);
                    const cartItem = cartItems.find((ci) => ci.item?._id === item._id);
                    const quantityInCart = cartItem ? cartItem.quantity : 0;
                    const spiceColor = SPICE_COLORS[item.metadata?.spiceLevel] || SPICE_COLORS.none;
                    const spiceIcon = SPICE_ICONS[item.metadata?.spiceLevel] || SPICE_ICONS.none;

                    return (
                      <div
                        key={item._id}
                        className={`bg-surface-container-lowest rounded-[24px] border border-outline-variant/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bento-hover hover:border-primary/30 flex flex-col justify-between ${
                          !item.isAvailable ? 'opacity-60 grayscale-10' : ''
                        }`}
                      >
                        {/* Image & Badges top container */}
                        <div className="relative h-48 bg-surface-container-high shrink-0 overflow-hidden border-b border-outline-variant/20">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-surface-container-high">
                              🍔
                            </div>
                          )}

                          {/* Non-available overlay */}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-md tracking-wider">
                                OUT OF STOCK
                              </span>
                            </div>
                          )}

                          {/* Veg/Non-veg tag top left */}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span
                              className={`w-6 h-6 border flex items-center justify-center rounded-lg shadow-sm backdrop-blur-md ${
                                isVeg 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                              }`}
                              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                            </span>

                            {/* Bestseller Badge */}
                            {item.rating >= 4.5 && item.ratingCount > 5 && (
                              <span className="bg-primary text-on-primary font-bold text-[9px] px-2 py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                Bestseller
                              </span>
                            )}
                          </div>

                          {/* Spice badge */}
                          {item.metadata?.spiceLevel && item.metadata.spiceLevel !== 'none' && (
                            <div className={`absolute top-3 right-3 border rounded-lg px-2 py-1 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-sm ${spiceColor}`}>
                              <span className="material-symbols-outlined text-[12px]">{spiceIcon}</span>
                              <span className="capitalize">{item.metadata.spiceLevel}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Info Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-base text-on-surface line-clamp-1 leading-snug">
                                {item.name}
                              </h3>
                              <span className="text-primary font-extrabold text-base whitespace-nowrap shrink-0">
                                ₹{item.price}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Calories / Rating Row */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <StarRating rating={item.rating} ratingCount={item.ratingCount} size="sm" />
                            {item.metadata?.calories && (
                              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-md border border-outline-variant/10">
                                🔥 {item.metadata.calories} Cal
                              </span>
                            )}
                          </div>

                          {/* Action footer */}
                          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                            {/* Interactive user rating toggler */}
                            <InteractiveRatingSection
                              item={item}
                              onRate={handleRate}
                              ratingLoading={ratingLoading === item._id}
                            />

                            {/* Add / Qty Control button */}
                            {quantityInCart > 0 ? (
                              <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl p-0.5 shadow-sm">
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, quantityInCart, -1)}
                                  className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-base">remove</span>
                                </button>
                                <span className="font-bold text-sm w-7 text-center text-on-surface select-none">
                                  {quantityInCart}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item._id, quantityInCart, 1)}
                                  disabled={!item.isAvailable}
                                  className="w-8 h-8 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(item._id)}
                                disabled={!item.isAvailable || addingToCart === item._id}
                                className={`font-bold text-xs px-5 py-2 rounded-xl transition-all duration-200 cursor-pointer border flex items-center justify-center gap-1.5 shadow-sm ${
                                  item.isAvailable
                                    ? 'bg-surface-container hover:bg-primary hover:text-on-primary hover:border-primary border-outline-variant text-primary active:scale-95'
                                    : 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant/10 cursor-not-allowed'
                                }`}
                              >
                                {addingToCart === item._id ? (
                                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                                    <span>ADD</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

          </div>

          {/* Right Column: Sticky Cart Sidebar (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-24 bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/30 p-6 flex flex-col max-h-[calc(100vh-120px)]">
              <h2 className="text-lg font-black text-on-surface mb-4 pb-4 border-b border-outline-variant/30 flex items-center justify-between">
                <span>Your Order</span>
                {cartTotalItems > 0 && (
                  <span className="bg-primary text-on-primary text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {cartTotalItems}
                  </span>
                )}
              </h2>

              {/* Cart List Scrollable Area */}
              <div className="flex-1 overflow-y-auto hide-scrollbar py-2 space-y-4">
                {!user ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 text-on-surface-variant/70 space-y-4">
                    <span className="material-symbols-outlined text-5xl opacity-40 font-light">account_circle</span>
                    <p className="text-xs leading-relaxed max-w-[200px]">
                      Please sign in to view and start adding items to your order.
                    </p>
                    <Link
                      to="/signin"
                      className="bg-primary text-on-primary font-bold text-xs px-5 py-2 rounded-full shadow-sm hover:bg-primary-container transition-all"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-on-surface-variant/70 space-y-3">
                    <span className="material-symbols-outlined text-5xl opacity-30 font-light">shopping_basket</span>
                    <p className="text-xs leading-relaxed max-w-[180px]">
                      Your order is empty.<br />Add delicious bites to get started.
                    </p>
                  </div>
                ) : (
                  cartItems.map((ci) => {
                    const isVeg = isVegetarian(ci.item);
                    return (
                      <div key={ci.item?._id} className="flex items-start justify-between gap-3 group">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 border flex items-center justify-center rounded-sm shrink-0 mt-0.5 ${
                              isVeg ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-on-surface leading-tight truncate">
                              {ci.item?.name}
                            </h4>
                            <div className="text-[11px] font-bold text-primary mt-0.5">
                              ₹{Number(ci.item?.price || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Incrementor controls */}
                        <div className="flex items-center bg-surface-container border border-outline-variant/40 rounded-lg p-0.5 shrink-0 shadow-sm">
                          <button
                            onClick={() => handleUpdateQuantity(ci.item?._id, ci.quantity, -1)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">remove</span>
                          </button>
                          <span className="font-bold text-xs w-5 text-center text-on-surface select-none">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(ci.item?._id, ci.quantity, 1)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cart Totals Summary and Checkout CTA */}
              {user && cartItems.length > 0 && (
                <div className="pt-4 border-t border-outline-variant/30 mt-auto bg-surface-container-lowest space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                      <span>Subtotal</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-600">FREE</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-extrabold text-on-surface pt-1 border-t border-outline-variant/10">
                      <span>Total</span>
                      <span>₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="w-full bg-primary-container text-white font-bold text-xs px-4 py-3.5 rounded-xl hover:bg-primary transition-all active:scale-[0.98] flex items-center justify-between shadow-md cursor-pointer group"
                  >
                    <span>Checkout Order</span>
                    <span className="flex items-center gap-1 font-extrabold">
                      ₹{cartSubtotal.toFixed(2)}
                      <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* 4. Floating Mobile Cart (Only shown on mobile when items are present) */}
      {user && cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-primary-container text-white rounded-xl shadow-lg p-3.5 flex items-center justify-between hover:bg-primary hover:border-primary border border-primary-container transition-all duration-200 active:scale-[0.97] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-primary font-extrabold w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm">
                {cartTotalItems}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs font-extrabold tracking-wide">View Cart</span>
                <span className="text-[10px] text-white/85 truncate max-w-[120px]">{shop.name}</span>
              </div>
            </div>
            <div className="text-sm font-black flex items-center gap-1.5">
              ₹{cartSubtotal.toFixed(2)}
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Interactive User Rating Section inside Item Card
function InteractiveRatingSection({ item, onRate, ratingLoading }) {
  const [showRating, setShowRating] = useState(false);
  const userRating = item._userRating || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowRating((v) => !v)}
        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1 ${
          showRating
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: userRating > 0 ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
        <span>{userRating > 0 ? `Rated: ${userRating}★` : 'Rate'}</span>
      </button>

      {showRating && (
        <>
          {/* Overlay to close rating dropdown when clicking outside */}
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowRating(false)} />
          
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg p-3 min-w-[170px] animate-slide-in">
            <p className="text-[10px] font-semibold text-on-surface-variant/80 mb-2">
              {userRating > 0 ? 'Update rating:' : 'Rate this item:'}
            </p>
            <div className="flex items-center justify-between gap-2">
              <StarRating
                interactive
                userRating={userRating}
                onRate={(val) => {
                  onRate(item._id, val);
                  setShowRating(false);
                }}
                loading={ratingLoading}
                size="md"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
