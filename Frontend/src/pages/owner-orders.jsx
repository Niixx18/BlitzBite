import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import Toast, { useToast } from '../components/dashboard/Toast';
import { SkeletonRow } from '../components/dashboard/SkeletonCard';

const STATUS_TRANSITION_MAP = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_FILTERS = ['all', 'placed', 'accepted', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];

export default function OwnerOrdersPage() {
  const { user, loading } = useCurrentUser();
  const { toast, showToast, clearToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [deliveryAssignLoading, setDeliveryAssignLoading] = useState({});
  const [filter, setFilter] = useState('all');

  /* ── Fetch orders (identical to original) ── */
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id || user.userType !== 'restaurant') return;
      setLoadingOrders(true);
      setOrderError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders/owner', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load owner orders');
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setOrderError(err.message);
        showToast(err.message, 'error');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  /* ── Fetch delivery partners (identical to original) ── */
  useEffect(() => {
    const fetchDeliveryPartners = async () => {
      if (!user?.id || user.userType !== 'restaurant') return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders/delivery-partners', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDeliveryPartners(data.partners || []);
      } catch {
        // ignore
      }
    };
    fetchDeliveryPartners();
  }, [user]);

  /* ── Handlers (identical to original) ── */
  const handleStatusChange = (orderId, status) => {
    setSelectedStatus(prev => ({ ...prev, [orderId]: status }));
  };

  const updateOrderStatus = async (orderId) => {
    const status = selectedStatus[orderId];
    if (!status) return;
    setStatusUpdateLoading(prev => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderStatus: status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to update status');
      }
      const data = await res.json();
      setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
      showToast('Order status updated!', 'success');
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeliveryChange = (orderId, partnerId) => {
    setSelectedDelivery(prev => ({ ...prev, [orderId]: partnerId }));
  };

  const assignDeliveryPartner = async (orderId) => {
    const partnerId = selectedDelivery[orderId];
    if (!partnerId) return;
    setDeliveryAssignLoading(prev => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/assign-delivery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryPartner: partnerId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to assign delivery partner');
      }
      const data = await res.json();
      setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
      showToast('Rider assigned successfully!', 'success');
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setDeliveryAssignLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  /* ── Guards ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">receipt_long</span>
        <p className="text-sm font-bold text-on-surface-variant">Loading orders…</p>
      </div>
    );
  }

  if (!user) {
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
        <p className="text-sm text-on-surface-variant/70">Your account is not registered as a restaurant owner.</p>
      </div>
    );
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);
  const pendingCount = orders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.orderStatus)).length;

  return (
    <div className="bg-background min-h-screen pt-20 pb-16 font-sans">
      <div className="max-w-5xl mx-auto px-4 md:px-16 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Restaurant Orders</h1>
            <p className="text-xs font-medium text-on-surface-variant/60 mt-0.5">
              {orders.length} total · {pendingCount} need action
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 bg-surface-container text-on-surface-variant hover:text-primary font-bold text-xs px-4 py-2.5 rounded-full border border-outline-variant/30 hover:border-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Dashboard
          </Link>
        </div>

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

        {/* Orders */}
        <DashboardSection title={`${filter === 'all' ? 'All' : filter.replace(/-/g, ' ')} Orders`} count={filtered.length}>
          {loadingOrders ? (
            <SkeletonRow count={3} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No orders found"
              body={filter === 'all'
                ? 'No orders yet. Share your restaurant link to start receiving orders.'
                : `No orders with status "${filter.replace(/-/g, ' ')}".`}
              cta="Go to Dashboard"
              ctaTo="/"
            />
          ) : (
            <div className="space-y-5">
              {filtered.map(order => {
                const options = STATUS_TRANSITION_MAP[order.orderStatus] || [];
                return (
                  <div key={order._id} className="space-y-3">
                    <OrderCard order={order} showCustomer />

                    {/* Assign Delivery Partner */}
                    {!order.deliveryPartner && !['delivered', 'cancelled'].includes(order.orderStatus) && (
                      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                        <span className="material-symbols-outlined text-amber-600 text-base select-none">delivery_truck_speed</span>
                        <label className="flex items-center gap-2 text-xs flex-1 min-w-0">
                          <span className="font-extrabold text-on-surface-variant shrink-0">Assign Rider:</span>
                          <select
                            value={selectedDelivery[order._id] || ''}
                            onChange={e => handleDeliveryChange(order._id, e.target.value)}
                            className="flex-1 min-w-0 bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold outline-none transition-all"
                          >
                            <option value="">Select rider</option>
                            {deliveryPartners.map(p => (
                              <option key={p._id} value={p._id}>
                                {p.firstName} {p.lastName}{p.phone ? ` (${p.phone})` : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          onClick={() => assignDeliveryPartner(order._id)}
                          disabled={!selectedDelivery[order._id] || deliveryAssignLoading[order._id]}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {deliveryAssignLoading[order._id] ? 'Assigning…' : 'Assign'}
                        </button>
                      </div>
                    )}

                    {/* Update Status */}
                    {options.length > 0 && (
                      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-base select-none">update</span>
                        <label className="flex items-center gap-2 text-xs flex-1 min-w-0">
                          <span className="font-extrabold text-on-surface-variant shrink-0">Update Status:</span>
                          <select
                            value={selectedStatus[order._id] || ''}
                            onChange={e => handleStatusChange(order._id, e.target.value)}
                            className="flex-1 min-w-0 bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold outline-none transition-all"
                          >
                            <option value="">Select status</option>
                            {options.map(s => (
                              <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          onClick={() => updateOrderStatus(order._id)}
                          disabled={!selectedStatus[order._id] || statusUpdateLoading[order._id]}
                          className="bg-primary hover:bg-primary-container text-on-primary font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {statusUpdateLoading[order._id] ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
