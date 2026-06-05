import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OwnerItemCard from '../components/OwnerItemCard';
import StatCard from '../components/dashboard/StatCard';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import Toast, { useToast } from '../components/dashboard/Toast';
import { SkeletonRow } from '../components/dashboard/SkeletonCard';

/* ─── Helpers ──────────────────────────────────────────── */
const ORDER_STATUS_STEPS = ['placed', 'accepted', 'preparing', 'out-for-delivery', 'delivered'];

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

/* ─── Quick Action Button ──────────────────────────────── */
function QuickAction({ icon, label, to, onClick, accent = 'default' }) {
  const accentClass = {
    default: 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant/30',
    primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-sm',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  }[accent];

  const content = (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all cursor-pointer ${accentClass}`}>
      <span className="material-symbols-outlined text-2xl select-none">{icon}</span>
      <span className="text-[10px] font-black text-center">{label}</span>
    </div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick} className="w-full">{content}</button>;
}

/* ─── Order Row (mini) ─────────────────────────────────── */
function MiniOrderRow({ order }) {
  const statusClass = STATUS_COLOR[order.orderStatus] || 'bg-surface-container/60 border-outline-variant/20 text-on-surface';
  const icon = STATUS_ICON[order.orderStatus] || 'receipt_long';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 bg-surface hover:bg-surface-container/40 transition-all">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${statusClass}`}>
        <span className="material-symbols-outlined text-base select-none">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-extrabold text-xs text-on-surface">#{order._id.slice(-6).toUpperCase()}</p>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${statusClass}`}>
            {order.orderStatus.replace(/-/g, ' ')}
          </span>
        </div>
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5 truncate">
          {order.user?.firstName} {order.user?.lastName} · ₹{order.totalAmount?.toFixed(2)}
        </p>
      </div>
      <Link
        to="/owner-orders"
        className="text-[10px] font-bold text-primary hover:text-primary-container transition-colors shrink-0"
      >
        View →
      </Link>
    </div>
  );
}

/* ─── Shop Card ────────────────────────────────────────── */
function ShopCard({ shop, items, loadingItems }) {
  const [expanded, setExpanded] = useState(false);
  const itemList = items || [];

  return (
    <div className="dashboard-card overflow-hidden">
      {/* Shop Header */}
      <div className="p-5 flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl text-primary select-none">storefront</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-black text-base text-on-surface truncate">{shop.name}</h3>
              <p className="text-xs text-on-surface-variant/60 mt-0.5">{shop.category}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                shop.isOpen
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
              }`}>
                {shop.isOpen ? '● Open' : '○ Closed'}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                shop.isActive
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-700'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant/60'
              }`}>
                {shop.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {shop.description && (
            <p className="text-xs text-on-surface-variant/70 mt-2 line-clamp-2 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-outline-variant/15 pt-3">
        <Link
          to={`/shop/${shop._id}/add-food`}
          className="flex items-center gap-1 text-xs font-bold bg-primary text-on-primary px-3.5 py-2 rounded-xl hover:bg-primary-container transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Item
        </Link>
        <Link
          to="/owner-orders"
          className="flex items-center gap-1 text-xs font-bold bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-3.5 py-2 rounded-xl transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-sm">receipt_long</span>
          Orders
        </Link>
        <Link
          to={`/shop/${shop._id}/edit`}
          className="flex items-center gap-1 text-xs font-bold bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-3.5 py-2 rounded-xl transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit Shop
        </Link>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors ml-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">
            {expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
          {expanded ? 'Hide' : `Menu (${itemList.length})`}
        </button>
      </div>

      {/* Menu Items (expandable) */}
      {expanded && (
        <div className="border-t border-outline-variant/15 p-5 space-y-3 animate-slide-up">
          <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">
            Menu Items ({itemList.length})
          </p>
          {loadingItems ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1,2].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
            </div>
          ) : itemList.length === 0 ? (
            <div className="text-center py-6 text-xs text-on-surface-variant/60">
              No items yet.{' '}
              <Link to={`/shop/${shop._id}/add-food`} className="text-primary font-bold">
                Add your first item →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemList.map(item => (
                <OwnerItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────── */
export default function OwnerDashboard() {
  const { user, loading, error } = useCurrentUser();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [shops, setShops] = useState([]);
  const [itemsByShop, setItemsByShop] = useState({});
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [itemsError, setItemsError] = useState(null);

  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  /* ── Fetch shops (identical to original) ── */
  useEffect(() => {
    const fetchShops = async () => {
      if (!user?.id || user.userType !== 'restaurant') return;
      setLoadingShops(true);
      setShopError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shops?owner=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load shops');
        const data = await res.json();
        setShops(data.shops || []);
      } catch (err) {
        setShopError(err.message);
        showToast(err.message, 'error');
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, [user]);

  /* ── Fetch items (identical to original) ── */
  useEffect(() => {
    const fetchItems = async () => {
      if (shops.length === 0) { setItemsByShop({}); return; }
      setLoadingItems(true);
      setItemsError(null);
      try {
        const token = localStorage.getItem('token');
        const results = await Promise.all(
          shops.map(async shop => {
            const res = await fetch(`/api/items?shop=${shop._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to load items');
            const data = await res.json();
            return { shopId: shop._id, items: data.items || [] };
          })
        );
        setItemsByShop(results.reduce((acc, e) => { acc[e.shopId] = e.items; return acc; }, {}));
      } catch (err) {
        setItemsError(err.message);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [shops]);

  /* ── Fetch recent orders for metrics ── */
  useEffect(() => {
    if (!user?.id || user?.userType !== 'restaurant') return;
    setLoadingOrders(true);
    const token = localStorage.getItem('token');
    fetch('/api/orders/owner', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setRecentOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  /* ── Guards ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">storefront</span>
        <p className="text-sm font-bold text-on-surface-variant">Loading your dashboard…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 font-light select-none">lock</span>
        <h2 className="text-2xl font-black text-on-surface">Sign in to continue</h2>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (user.userType !== 'restaurant') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-rose-400 font-light select-none">warning</span>
        <h2 className="text-2xl font-black text-on-surface">Access Denied</h2>
        <p className="text-sm text-on-surface-variant/70">This dashboard is only available to restaurant owners.</p>
        <p className="text-xs text-on-surface-variant/50">Your account type: <strong>{user.userType}</strong></p>
        <Link to="/" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  /* ── Derived metrics ── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = recentOrders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders
    .filter(o => o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalRevenue = recentOrders
    .filter(o => o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = recentOrders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.orderStatus));
  const deliveredOrders = recentOrders.filter(o => o.orderStatus === 'delivered');
  const totalMenuItems = Object.values(itemsByShop).reduce((sum, items) => sum + items.length, 0);
  const latestOrders = recentOrders.slice(0, 8);

  return (
    <div className="bg-background min-h-screen pt-20 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-16 space-y-8">

        {/* ── Header Banner ───────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary to-primary-container p-6 md:p-8 shadow-lg">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-on-primary/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Restaurant Owner
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-on-primary leading-tight">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-on-primary/70 text-sm mt-1">
                {shops.length} restaurant{shops.length !== 1 ? 's' : ''} · {totalMenuItems} menu item{totalMenuItems !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/owner-orders"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-on-primary font-bold text-sm px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm border border-white/20"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                Orders {pendingOrders.length > 0 && <span className="bg-on-primary text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{pendingOrders.length}</span>}
              </Link>
              <Link
                to="/create-shop"
                className="flex items-center gap-2 bg-white text-primary font-black text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                New Shop
              </Link>
            </div>
          </div>
        </div>

        {/* ── Metrics Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="payments" label="Today's Revenue" value={`₹${todayRevenue.toFixed(0)}`} accent="green" loading={loadingOrders} />
          <StatCard icon="account_balance_wallet" label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} accent="primary" loading={loadingOrders} />
          <StatCard icon="receipt_long" label="Total Orders" value={recentOrders.length} accent="blue" loading={loadingOrders} />
          <StatCard icon="pending_actions" label="Pending" value={pendingOrders.length} subLabel="Need action" accent="amber" loading={loadingOrders} />
          <StatCard icon="done_all" label="Delivered" value={deliveredOrders.length} subLabel="Completed" accent="green" loading={loadingOrders} />
        </div>

        {/* ── Main Grid: Orders + Quick Actions ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders Feed — 2/3 */}
          <div className="lg:col-span-2">
            <DashboardSection
              title="Recent Orders"
              subtitle="Latest incoming orders"
              count={latestOrders.length}
              actionLabel="Manage All Orders"
              actionHref="/owner-orders"
            >
              {loadingOrders ? (
                <SkeletonRow count={4} />
              ) : latestOrders.length === 0 ? (
                <EmptyState
                  icon="receipt_long"
                  title="No orders yet"
                  body="Once customers start ordering, they will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {latestOrders.map(order => (
                    <MiniOrderRow key={order._id} order={order} />
                  ))}
                </div>
              )}
            </DashboardSection>
          </div>

          {/* Quick Actions Panel — 1/3 */}
          <div className="space-y-6">
            <DashboardSection title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon="add_circle" label="Add Menu Item" to={shops[0] ? `/shop/${shops[0]._id}/add-food` : '/owner-dashboard'} accent="primary" />
                <QuickAction icon="receipt_long" label="View Orders" to="/owner-orders" accent="default" />
                <QuickAction icon="storefront" label="Create Shop" to="/create-shop" accent="default" />
                <QuickAction icon="bar_chart" label="All Orders" to="/owner-orders" accent="green" />
              </div>
            </DashboardSection>

            {/* Order Status Summary */}
            <DashboardSection title="Order Pipeline">
              <div className="space-y-2">
                {['placed', 'accepted', 'preparing', 'out-for-delivery', 'delivered'].map(status => {
                  const count = recentOrders.filter(o => o.orderStatus === status).length;
                  const sc = STATUS_COLOR[status];
                  const icon = STATUS_ICON[status];
                  return (
                    <div key={status} className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/20 hover:bg-surface-container/40 transition-all">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-base select-none ${sc.split(' ').find(c => c.startsWith('text-'))}`}>{icon}</span>
                        <span className="text-xs font-bold text-on-surface-variant capitalize">{status.replace(/-/g, ' ')}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${sc}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </DashboardSection>
          </div>
        </div>

        {/* ── Your Restaurants ────────────────────────────────── */}
        <DashboardSection
          title="Your Restaurants"
          subtitle="Manage menus and shop settings"
          count={shops.length}
          actionLabel="Create New Shop"
          actionHref="/create-shop"
        >
          {shopError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {shopError}
            </div>
          )}
          {itemsError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              {itemsError}
            </div>
          )}

          {loadingShops ? (
            <SkeletonRow count={2} />
          ) : shops.length === 0 ? (
            <EmptyState
              icon="storefront"
              title="No restaurants yet"
              body="Create your first restaurant and start accepting orders from customers."
              cta="Create Your Shop"
              ctaTo="/create-shop"
            />
          ) : (
            <div className="space-y-4">
              {shops.map(shop => (
                <ShopCard
                  key={shop._id}
                  shop={shop}
                  items={itemsByShop[shop._id]}
                  loadingItems={loadingItems}
                />
              ))}
            </div>
          )}
        </DashboardSection>

      </div>

      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
