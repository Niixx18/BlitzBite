import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { clearCartState } from '../features/cart/cartSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';
import StatCard from '../components/dashboard/StatCard';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import Toast, { useToast } from '../components/dashboard/Toast';
import { SkeletonRow } from '../components/dashboard/SkeletonCard';
import OrderCard from '../components/OrderCard';
import ProfileCard from '../components/ProfileCard';

/* ─── Helpers ─────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 21 || h < 5) return { text: 'Good night', emoji: '🌙' };
  if (h < 12)            return { text: 'Good morning', emoji: '☀️' };
  if (h < 17)            return { text: 'Good afternoon', emoji: '🌤️' };
  return                        { text: 'Good evening', emoji: '🌆' };
}

const STATUS_COLOR = {
  placed: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  accepted: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
  preparing: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
  'out-for-delivery': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
  delivered: 'bg-green-500/10 border-green-500/30 text-green-700',
  cancelled: 'bg-rose-500/10 border-rose-500/30 text-rose-700',
};

const STATUS_ICON = {
  placed: 'receipt_long',
  accepted: 'check_circle',
  preparing: 'restaurant',
  'out-for-delivery': 'local_shipping',
  delivered: 'done_all',
  cancelled: 'cancel',
};

/* ─── Sub-components ───────────────────────────────────── */
function ActiveOrderBanner({ order }) {
  const statusClass = STATUS_COLOR[order.orderStatus] || 'bg-surface-container/60 border-outline-variant/20 text-on-surface';
  const icon = STATUS_ICON[order.orderStatus] || 'receipt_long';
  const isActive = !['delivered', 'cancelled'].includes(order.orderStatus);

  return (
    <div className="dashboard-card p-4 flex items-center gap-4 animate-fade-in-up">
      {/* Status icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusClass}`}>
        <span className="material-symbols-outlined text-xl select-none">{icon}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-extrabold text-sm text-on-surface">
            Order #{order._id.slice(-6).toUpperCase()}
          </p>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${statusClass}`}>
            {order.orderStatus.replace(/-/g, ' ')}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant/70 mt-0.5 truncate">
          {order.items?.map(i => i.name).join(', ')}
        </p>
        <p className="text-xs font-bold text-primary mt-0.5">₹{order.totalAmount?.toFixed(2)}</p>
      </div>
      {/* Action */}
      {isActive ? (
        <Link
          to={`/orders/${order._id}/track`}
          className="shrink-0 flex items-center gap-1 bg-primary text-on-primary font-bold text-xs px-3 py-2 rounded-xl shadow-sm hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-sm">explore</span>
          <span className="hidden sm:inline">Track</span>
        </Link>
      ) : (
        <Link
          to="/orders"
          className="shrink-0 text-xs font-bold text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          Details →
        </Link>
      )}
    </div>
  );
}

function FavoriteShopCard({ shop }) {
  return (
    <Link
      to={`/restaurant/${shop._id}`}
      className="dashboard-card flex-shrink-0 w-44 overflow-hidden block group"
    >
      <div className="h-24 bg-surface-container flex items-center justify-center overflow-hidden">
        {shop.image ? (
          <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 select-none font-light">
            storefront
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-extrabold text-xs text-on-surface truncate">{shop.name}</p>
        <p className="text-[10px] font-semibold text-on-surface-variant/60 mt-0.5 truncate">{shop.category}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500' : 'bg-rose-400'}`} />
          <span className="text-[10px] font-bold text-on-surface-variant/70">
            {shop.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ProfileCard is now imported from components

/* ─── Owner Shop Card ──────────────────────────────────── */
function OwnerShopCard({ shop }) {
  return (
    <div className="dashboard-card p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-xl text-primary select-none">storefront</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-extrabold text-sm text-on-surface truncate">{shop.name}</p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
            shop.isOpen
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
          }`}>
            {shop.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="text-[10px] font-semibold text-on-surface-variant/60 mt-0.5">{shop.category}</p>
        <p className="text-xs text-on-surface-variant/70 mt-1 line-clamp-1">{shop.description || 'No description'}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Link
            to={`/shop/${shop._id}/add-food`}
            className="flex items-center gap-1 text-[10px] font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            Add Item
          </Link>
          <Link
            to="/owner-dashboard"
            className="flex items-center gap-1 text-[10px] font-bold bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-3 py-1.5 rounded-lg transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-xs">tune</span>
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────── */
export default function UserDashboard() {
  const { user, loading, error } = useCurrentUser();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast, showToast, clearToast } = useToast();

  const [favoriteShops, setFavoriteShops] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const [ownedShops, setOwnedShops] = useState([]);
  const [loadingOwnedShops, setLoadingOwnedShops] = useState(false);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [shopForm, setShopForm] = useState({
    name: '', description: '', category: 'Indian',
    street: '', city: '', state: '', zipCode: ''
  });

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const locationName = localStorage.getItem('user_location') || 'Your Location';

  /* ── Fetch orders ── */
  useEffect(() => {
    if (!(user?.id || user?._id)) return;
    setLoadingOrders(true);
    const token = localStorage.getItem('token');
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  /* ── Fetch favorites ── */
  useEffect(() => {
    if (!user?.favoriteRestaurants?.length) return;
    setLoadingFavorites(true);
    const token = localStorage.getItem('token');
    Promise.all(
      user.favoriteRestaurants.map(id =>
        fetch(`/api/shops/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          .then(r => r.ok ? r.json().then(d => d.shop) : null)
          .catch(() => null)
      )
    )
      .then(results => setFavoriteShops(results.filter(Boolean)))
      .finally(() => setLoadingFavorites(false));
  }, [user]);

  /* ── Fetch owned shops ── */
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId || user?.userType !== 'restaurant') return;
    setLoadingOwnedShops(true);
    const token = localStorage.getItem('token');
    fetch(`/api/shops?owner=${userId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setOwnedShops(d.shops || []))
      .catch(() => {})
      .finally(() => setLoadingOwnedShops(false));
  }, [user]);

  /* ── Shop form handlers (identical to original) ── */
  const handleShopFormChange = (e) => {
    const { name, value } = e.target;
    setShopForm(cur => ({ ...cur, [name]: value }));
  };

  const createShop = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setShopError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: shopForm.name, description: shopForm.description, category: shopForm.category,
          location: { street: shopForm.street, city: shopForm.city, state: shopForm.state, zipCode: shopForm.zipCode }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create shop');
      setOwnedShops(cur => [data.shop, ...cur]);
      setShopForm({ name: '', description: '', category: 'Indian', street: '', city: '', state: '', zipCode: '' });
      setShowCreateShop(false);
      showToast('Shop created successfully!', 'success');
    } catch (err) {
      setShopError(err.message);
      showToast(err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCartState());
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    sessionStorage.removeItem('cart');
    navigate('/signin');
  };

  /* ── Search ── */
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setSearchValue(''); }
  };

  /* ── Derived data ── */
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus));
  const recentOrders = orders.slice(0, 5);
  const totalOrders = orders.length;

  /* ── Guards ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">local_dining</span>
        <p className="text-sm font-bold text-on-surface-variant">Loading your dashboard…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 font-light select-none">lock</span>
        <h2 className="text-2xl font-black text-on-surface">Sign in to continue</h2>
        <p className="text-sm text-on-surface-variant/70">Access your orders, favourites, and more.</p>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pt-20 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-16 space-y-8">

        {/* ── Hero Greeting Banner ────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary to-primary-container p-6 md:p-8 shadow-lg">
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            {/* Text */}
            <div className="flex-1">
              <p className="text-on-primary/70 text-xs font-semibold uppercase tracking-widest mb-1">
                {getGreeting().text} {getGreeting().emoji}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-on-primary leading-tight">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-sm text-on-primary/60 select-none">location_on</span>
                <p className="text-xs font-semibold text-on-primary/70 truncate max-w-[220px]">{locationName}</p>
              </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">search</span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Search restaurants & dishes…"
                  className="w-full bg-white/95 backdrop-blur rounded-full py-3 pl-10 pr-4 text-sm text-on-surface font-medium placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-white/50 shadow-sm transition-all"
                />
              </div>
            </form>
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="receipt_long"
            label="Total Orders"
            value={loadingOrders ? '…' : totalOrders}
            subLabel="All time"
            accent="primary"
            loading={loadingOrders}
          />
          <StatCard
            icon="local_shipping"
            label="Active Orders"
            value={loadingOrders ? '…' : activeOrders.length}
            subLabel="In progress"
            accent="blue"
            loading={loadingOrders}
          />
          <StatCard
            icon="favorite"
            label="Favourites"
            value={user.favoriteRestaurants?.length ?? 0}
            subLabel="Saved places"
            accent="rose"
          />
          <StatCard
            icon="person"
            label="Member Since"
            value={user.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
            subLabel={user.userType}
            accent="indigo"
          />
        </div>

        {/* ── Active Orders ────────────────────────────────────── */}
        <DashboardSection
          title="Active Orders"
          subtitle="Your orders currently in progress"
          count={activeOrders.length}
          actionLabel="View All"
          actionHref="/orders"
        >
          {loadingOrders ? (
            <SkeletonRow count={2} />
          ) : activeOrders.length === 0 ? (
            <EmptyState
              icon="shopping_bag"
              title="No active orders"
              body="Hungry? Browse restaurants and place your first order today."
              cta="Browse Restaurants"
              ctaTo="/"
            />
          ) : (
            <div className="space-y-3">
              {activeOrders.map(order => (
                <ActiveOrderBanner key={order._id} order={order} />
              ))}
            </div>
          )}
        </DashboardSection>

        {/* ── Two-column layout for Favourites + Profile ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Favourites — 2/3 width */}
          <div className="lg:col-span-2">
            <DashboardSection
              title="Favourite Restaurants"
              subtitle="Your saved places"
              count={favoriteShops.length}
              actionLabel="Explore More"
              actionHref="/"
            >
              {loadingFavorites ? (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton flex-shrink-0 w-44 h-44 rounded-[20px]" />
                  ))}
                </div>
              ) : favoriteShops.length === 0 ? (
                <EmptyState
                  icon="favorite_border"
                  title="No favourites yet"
                  body="Tap the heart icon on any restaurant to save it here."
                  cta="Discover Restaurants"
                  ctaTo="/"
                />
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {favoriteShops.map(shop => (
                    <FavoriteShopCard key={shop._id} shop={shop} />
                  ))}
                </div>
              )}
            </DashboardSection>
          </div>

          {/* Profile card — 1/3 width */}
          <div>
            <DashboardSection title="My Profile">
              <ProfileCard user={user} onLogout={handleLogout} />
            </DashboardSection>
          </div>
        </div>

        {/* ── Recent Orders ─────────────────────────────────────── */}
        <DashboardSection
          title="Recent Orders"
          subtitle="Your latest order history"
          count={recentOrders.length}
          actionLabel="View All Orders"
          actionHref="/orders"
        >
          {loadingOrders ? (
            <SkeletonRow count={3} />
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon="history"
              title="No orders yet"
              body="Your order history will appear here once you place your first order."
              cta="Start Ordering"
              ctaTo="/"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentOrders.map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </DashboardSection>

        {/* ── Restaurant Owner Section (conditional) ──────────── */}
        {user.userType === 'restaurant' && (
          <DashboardSection
            title="Your Restaurants"
            subtitle="Manage your shops and menu"
            count={ownedShops.length}
            actionLabel={showCreateShop ? 'Close Form' : 'Create New Shop'}
            onAction={() => setShowCreateShop(c => !c)}
          >
            {/* Create shop form */}
            {showCreateShop && (
              <form
                onSubmit={createShop}
                className="dashboard-card p-5 space-y-4 animate-slide-up"
              >
                <h3 className="font-black text-sm text-on-surface">Create New Shop</h3>
                {shopError && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{shopError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="col-span-full flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    Shop Name *
                    <input
                      name="name" value={shopForm.name} onChange={handleShopFormChange} required
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                      placeholder="e.g. Spice Garden"
                    />
                  </label>
                  <label className="col-span-full flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    Description
                    <textarea
                      name="description" value={shopForm.description} onChange={handleShopFormChange} rows={2}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium resize-none"
                      placeholder="Brief description of your restaurant"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    Category
                    <select
                      name="category" value={shopForm.category} onChange={handleShopFormChange}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                    >
                      {['Indian','Chinese','Italian','Fast Food','South Indian','Biryani','Desserts','Beverages','General'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    Street
                    <input name="street" value={shopForm.street} onChange={handleShopFormChange}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                      placeholder="Street address"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    City
                    <input name="city" value={shopForm.city} onChange={handleShopFormChange}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                      placeholder="City"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    State
                    <input name="state" value={shopForm.state} onChange={handleShopFormChange}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                      placeholder="State"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-on-surface-variant">
                    ZIP Code
                    <input name="zipCode" value={shopForm.zipCode} onChange={handleShopFormChange}
                      className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-sm text-on-surface outline-none transition-all font-medium"
                      placeholder="ZIP"
                    />
                  </label>
                </div>
                <button
                  type="submit" disabled={createLoading}
                  className="w-full bg-primary text-on-primary font-black text-sm py-3 rounded-xl shadow-sm hover:bg-primary-container transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createLoading ? 'Creating…' : 'Create Shop'}
                </button>
              </form>
            )}

            {/* Shop list */}
            {loadingOwnedShops ? (
              <SkeletonRow count={2} />
            ) : ownedShops.length === 0 && !showCreateShop ? (
              <EmptyState
                icon="storefront"
                title="No restaurants yet"
                body="Create your first restaurant and start accepting orders."
                cta="Create Shop"
                onCta={() => setShowCreateShop(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ownedShops.map(shop => (
                  <OwnerShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            )}
          </DashboardSection>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
