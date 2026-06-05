import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import { SkeletonRow } from '../components/dashboard/SkeletonCard';

const STATUS_FILTERS = ['all', 'placed', 'accepted', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];

export default function MyOrdersPage() {
  const { user, loading } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!(user?.id || user?._id)) return;
      setLoadingOrders(true);
      setOrderError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load orders');
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setOrderError(err.message);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">shopping_bag</span>
        <p className="text-sm font-bold text-on-surface-variant">Loading your orders…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 font-light select-none">lock</span>
        <h2 className="text-2xl font-black text-on-surface">Sign in to view orders</h2>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus));

  return (
    <div className="bg-background min-h-screen pt-20 pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4 md:px-16 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">My Orders</h1>
            <p className="text-xs font-medium text-on-surface-variant/60 mt-0.5">
              {orders.length} total · {activeOrders.length} active
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Order
          </Link>
        </div>

        {/* Error */}
        {orderError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {orderError}
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 text-[10px] font-black px-3.5 py-1.5 rounded-full border transition-all cursor-pointer capitalize ${
                filter === s
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-primary/30'
              }`}
            >
              {s.replace(/-/g, ' ')}
              {s !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {orders.filter(o => o.orderStatus === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <DashboardSection title={`${filter === 'all' ? 'All' : filter.replace(/-/g, ' ')} Orders`} count={filtered.length}>
          {loadingOrders ? (
            <SkeletonRow count={3} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="shopping_bag"
              title="No orders found"
              body={filter === 'all'
                ? 'You haven\'t placed any orders yet. Browse restaurants to get started.'
                : `No orders with status "${filter.replace(/-/g, ' ')}".`}
              cta="Browse Restaurants"
              ctaTo="/"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </DashboardSection>

      </div>
    </div>
  );
}
