import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';
import { socket } from '../utils/socket';
import StatCard from '../components/dashboard/StatCard';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import Toast, { useToast } from '../components/dashboard/Toast';
import { SkeletonRow } from '../components/dashboard/SkeletonCard';

/* ─── Status transition map (identical to original) ─────── */
const STATUS_TRANSITION_MAP = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_COLOR = {
  placed: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  accepted: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
  preparing: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
  'out-for-delivery': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
  delivered: 'bg-green-500/10 border-green-500/30 text-green-700',
  cancelled: 'bg-rose-500/10 border-rose-500/30 text-rose-700',
};

/* ─── Online/Offline Toggle ────────────────────────────── */
function StatusToggle({ isOnline, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-black text-sm transition-all shadow-sm cursor-pointer border ${
        isOnline
          ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
          : 'bg-surface-container text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
      }`}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-on-surface-variant/40'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </button>
  );
}

/* ─── Active Delivery Card ─────────────────────────────── */
function ActiveDeliveryCard({
  order,
  onStatusChange,
  onUpdate,
  selectedStatus,
  updateLoading,
  onSendOtp,
  otpLoading,
  otpValue = '',
  onOtpValueChange,
  onVerifyOtp,
  verifyLoading = false
}) {
  let options = STATUS_TRANSITION_MAP[order.orderStatus] || [];
  if (order.orderStatus === 'out-for-delivery' && !order.otpVerified) {
    options = options.filter(s => s !== 'delivered');
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-surface-container-lowest p-5 shadow-md space-y-4 animate-slide-up">
      {/* Pulse indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-black text-primary uppercase tracking-wider">Active</span>
      </div>

      {/* Order ID + Status */}
      <div>
        <h3 className="font-black text-base text-on-surface">
          Order #{order._id.slice(-6).toUpperCase()}
        </h3>
        <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full border mt-1 ${STATUS_COLOR[order.orderStatus] || ''}`}>
          {order.orderStatus.replace(/-/g, ' ')}
        </span>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 flex gap-2.5 items-start">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-sm text-amber-700 select-none">restaurant</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Pickup</p>
            <p className="text-xs font-semibold text-on-surface mt-0.5 truncate">
              {order.items?.[0]?.shop?.name || 'Restaurant'}
            </p>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 flex gap-2.5 items-start">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-sm text-emerald-700 select-none">home</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Deliver To</p>
            <p className="text-xs font-semibold text-on-surface mt-0.5 truncate">
              {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      {order.user && (
        <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-base text-primary select-none">person</span>
            </div>
            <div>
              <p className="text-xs font-extrabold text-on-surface">{order.user.firstName} {order.user.lastName}</p>
              <p className="text-[10px] font-semibold text-on-surface-variant/60">{order.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/orders/${order._id}/track`}
              className="flex items-center gap-1 bg-primary text-on-primary font-bold text-xs px-3 py-2 rounded-xl shadow-sm hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              Navigate
            </Link>
          </div>
        </div>
      )}

      {/* OTP Button */}
      {order.orderStatus === 'out-for-delivery' && !order.otpVerified && (
        <button
          type="button"
          onClick={() => onSendOtp(order._id)}
          disabled={otpLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">key</span>
          {otpLoading ? 'Sending OTP…' : 'Send Delivery OTP to Customer'}
        </button>
      )}

      {/* OTP Verification Form */}
      {order.orderStatus === 'out-for-delivery' && order.otpSentAt && !order.otpVerified && (
        <div className="bg-surface border border-outline-variant/35 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
            <p className="text-xs font-black text-on-surface">Enter Customer Delivery OTP</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otpValue}
              onChange={(e) => onOtpValueChange(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-center font-bold tracking-widest outline-none focus:border-primary focus:bg-white transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => onVerifyOtp(order._id)}
              disabled={otpValue.length !== 6 || verifyLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {verifyLoading ? 'Verifying…' : 'Verify & Deliver'}
            </button>
          </div>
        </div>
      )}

      {/* Status Update */}
      {options.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-outline-variant/20">
          <label className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-extrabold text-on-surface-variant shrink-0">Update Status:</span>
            <select
              value={selectedStatus || ''}
              onChange={e => onStatusChange(order._id, e.target.value)}
              className="flex-1 bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold outline-none transition-all"
            >
              <option value="">Select next status</option>
              {options.map(s => (
                <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => onUpdate(order._id)}
            disabled={!selectedStatus || updateLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {updateLoading ? 'Saving…' : 'Update'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Available Order Card ─────────────────────────────── */
function AvailableOrderCard({ order, onAccept, loading }) {
  return (
    <div className="dashboard-card p-4 space-y-3 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-sm text-on-surface">
            Order #{order._id.slice(-6).toUpperCase()}
          </h4>
          <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <span className="text-sm font-black text-primary">₹{order.totalAmount?.toFixed(2)}</span>
      </div>

      <div className="bg-surface-container rounded-xl p-3 space-y-1.5">
        <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Deliver to</p>
        <p className="text-xs font-semibold text-on-surface">
          {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
        </p>
        <p className="text-[10px] text-on-surface-variant/60">
          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · Est. ₹{Math.max(Number(order.deliveryFee || 0), 40)} fee
        </p>
      </div>

      <button
        onClick={() => onAccept(order._id)}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
      >
        {loading ? 'Accepting…' : '✓ Accept Delivery'}
      </button>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────── */
export default function DeliveryOrdersPage() {
  const { user, loading } = useCurrentUser();
  const { toast, showToast, clearToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});
  const [acceptLoading, setAcceptLoading] = useState({});
  const [otpLoading, setOtpLoading] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [verifyLoading, setVerifyLoading] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  /* ── Socket registration (identical to original) ── */
  useEffect(() => {
    if (user && (user.id || user._id)) {
      if (!socket.connected) socket.connect();
      socket.emit('register', user.id || user._id);
    }
  }, [user]);

  /* ── Fetch orders (identical to original) ── */
  useEffect(() => {
    const fetchOrders = async () => {
      if (!(user?.id || user?._id) || user.userType !== 'delivery') return;
      setLoadingOrders(true);
      setOrderError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [assignedRes, availableRes] = await Promise.all([
          fetch('/api/orders/assigned', { headers }),
          fetch('/api/orders/available-delivery', { headers }),
        ]);
        if (!assignedRes.ok) {
          const data = await assignedRes.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load assigned orders');
        }
        if (!availableRes.ok) {
          const data = await availableRes.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load available orders');
        }
        const assignedData = await assignedRes.json();
        const availableData = await availableRes.json();
        setOrders(assignedData.orders || []);
        setAvailableOrders(availableData.orders || []);
      } catch (err) {
        setOrderError(err.message);
        showToast(err.message, 'error');
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  /* ── Handlers (identical logic to original) ── */
  const acceptOrder = async (orderId) => {
    setAcceptLoading(prev => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/accept-delivery`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to accept order');
      }
      const data = await res.json();
      setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
      setOrders(prev => [data.order, ...prev]);
      showToast('Order accepted! Get ready to pick it up.', 'success');
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setAcceptLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

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
      if (data.deliveryOtp?.message) {
        const msg = data.deliveryOtp.devOtp
          ? `${data.deliveryOtp.message}. Test OTP: ${data.deliveryOtp.devOtp}`
          : data.deliveryOtp.message;
        showToast(msg, 'info');
      } else {
        showToast('Status updated successfully!', 'success');
      }
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const sendDeliveryOtp = async (orderId) => {
    setOtpLoading(prev => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/delivery-otp/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to send delivery OTP');
      }
      const data = await res.json();
      setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
      const msg = data.devOtp ? `${data.message}. Test OTP: ${data.devOtp}` : data.message;
      showToast(msg, 'info');
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setOtpLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleOtpInputChange = (orderId, val) => {
    setOtpInputs(prev => ({ ...prev, [orderId]: val }));
  };

  const verifyDeliveryOtp = async (orderId) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.trim().length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }
    setVerifyLoading(prev => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/delivery-otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'OTP verification failed');
      }
      const data = await res.json();
      setOrders(prev => prev.map(o => (o._id === orderId ? data.order : o)));
      showToast('OTP verified successfully! Order marked as delivered.', 'success');
      // Clear input state
      setOtpInputs(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    } catch (err) {
      setOrderError(err.message);
      showToast(err.message, 'error');
    } finally {
      setVerifyLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  /* ── Guards ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-3">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin select-none">local_shipping</span>
        <p className="text-sm font-bold text-on-surface-variant">Loading your orders…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 font-light select-none">lock</span>
        <h2 className="text-2xl font-black text-on-surface">Sign in to view deliveries</h2>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (user.userType !== 'delivery') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-3">
        <span className="material-symbols-outlined text-6xl text-rose-400 font-light select-none">warning</span>
        <h2 className="text-2xl font-black text-on-surface">Access Denied</h2>
        <p className="text-sm text-on-surface-variant/70">Your account is not registered as a delivery rider.</p>
        <Link to="/" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  /* ── Derived data ── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCompleted = orders.filter(o => {
    if (o.orderStatus !== 'delivered' || !o.deliveredAt) return false;
    return new Date(o.deliveredAt) >= today;
  });

  const todayCount = todayCompleted.length;
  const todayEarnings = todayCompleted.reduce((sum, o) => sum + Math.max(Number(o.deliveryFee || 0), 40), 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weeklyEarnings = orders
    .filter(o => o.orderStatus === 'delivered' && o.deliveredAt && new Date(o.deliveredAt) >= weekStart)
    .reduce((sum, o) => sum + Math.max(Number(o.deliveryFee || 0), 40), 0);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus));
  const completedTotal = orders.filter(o => o.orderStatus === 'delivered').length;
  const outForDelivery = orders.filter(o => o.orderStatus === 'out-for-delivery');

  return (
    <div className="bg-background text-on-background min-h-screen pt-20 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-16 space-y-8">

        {/* ── Header Banner ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary to-primary-container p-6 md:p-8 shadow-lg">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/8 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-on-primary/70 text-xs font-semibold uppercase tracking-widest mb-1">
                Delivery Partner
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-on-primary leading-tight">
                {user.firstName}'s Dashboard
              </h1>
              <p className="text-on-primary/70 text-sm mt-1">
                {activeOrders.length} active · {completedTotal} completed total
              </p>
            </div>
            <StatusToggle isOnline={isOnline} onToggle={() => setIsOnline(o => !o)} />
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────── */}
        {orderError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-slide-up">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{orderError}</span>
          </div>
        )}

        {/* ── Stats Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="payments" label="Today's Earnings" value={`₹${todayEarnings.toFixed(0)}`} accent="green" loading={loadingOrders} />
          <StatCard icon="account_balance_wallet" label="Weekly Earnings" value={`₹${weeklyEarnings.toFixed(0)}`} accent="blue" loading={loadingOrders} />
          <StatCard icon="local_shipping" label="Today's Runs" value={todayCount} subLabel="Deliveries" accent="primary" loading={loadingOrders} />
          <StatCard icon="schedule" label="Active" value={activeOrders.length} subLabel="In progress" accent="amber" loading={loadingOrders} />
        </div>

        {/* ── Active Delivery Highlight ─────────────────────── */}
        {outForDelivery.length > 0 && (
          <DashboardSection title="🚴 Out For Delivery" subtitle="Currently delivering — keep going!">
            <div className="space-y-4">
              {outForDelivery.map(order => (
                <ActiveDeliveryCard
                  key={order._id}
                  order={order}
                  selectedStatus={selectedStatus[order._id]}
                  onStatusChange={handleStatusChange}
                  onUpdate={updateOrderStatus}
                  updateLoading={statusUpdateLoading[order._id]}
                  onSendOtp={sendDeliveryOtp}
                  otpLoading={otpLoading[order._id]}
                  otpValue={otpInputs[order._id] || ''}
                  onOtpValueChange={(val) => handleOtpInputChange(order._id, val)}
                  onVerifyOtp={verifyDeliveryOtp}
                  verifyLoading={verifyLoading[order._id] || false}
                />
              ))}
            </div>
          </DashboardSection>
        )}

        {/* ── Available Orders ──────────────────────────────── */}
        <DashboardSection
          title="Available Deliveries"
          subtitle="New orders waiting to be picked up"
          count={availableOrders.length}
        >
          {loadingOrders ? (
            <SkeletonRow count={2} />
          ) : availableOrders.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No available orders"
              body="There are no new delivery requests in your area right now. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map(order => (
                <AvailableOrderCard
                  key={order._id}
                  order={order}
                  onAccept={acceptOrder}
                  loading={acceptLoading[order._id]}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        {/* ── Assigned Orders ───────────────────────────────── */}
        <DashboardSection
          title="Your Assigned Orders"
          subtitle="Orders currently assigned to you"
          count={orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus)).length}
        >
          {loadingOrders ? (
            <SkeletonRow count={3} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon="local_shipping"
              title="No assigned orders"
              body="Accept available delivery requests above to get started."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map(order => {
                let options = STATUS_TRANSITION_MAP[order.orderStatus] || [];
                if (order.orderStatus === 'out-for-delivery' && !order.otpVerified) {
                  options = options.filter(s => s !== 'delivered');
                }
                return (
                  <div key={order._id} className="space-y-3">
                    <OrderCard order={order} showCustomer />

                    {options.length > 0 && (
                      <div className="bg-surface-container border border-outline-variant/35 rounded-2xl p-4 space-y-4">
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2.5">
                          <Link
                            to={`/orders/${order._id}/track`}
                            className="bg-primary text-on-primary font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">explore</span>
                            Live Navigation
                          </Link>

                          {order.orderStatus === 'out-for-delivery' && !order.otpVerified && (
                            <button
                              type="button"
                              onClick={() => sendDeliveryOtp(order._id)}
                              disabled={otpLoading[order._id]}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                            >
                              {otpLoading[order._id] ? 'Sending OTP…' : 'Send Delivery OTP'}
                            </button>
                          )}
                        </div>

                        {/* OTP Verification Form */}
                        {order.orderStatus === 'out-for-delivery' && order.otpSentAt && !order.otpVerified && (
                          <div className="bg-surface border border-outline-variant/35 rounded-xl p-4 mt-3 space-y-3 animate-slide-up">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                              <p className="text-xs font-black text-on-surface">Enter Customer Delivery OTP</p>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="6-digit OTP"
                                value={otpInputs[order._id] || ''}
                                onChange={(e) => handleOtpInputChange(order._id, e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-center font-bold tracking-widest outline-none focus:border-primary focus:bg-white transition-all font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => verifyDeliveryOtp(order._id)}
                                disabled={(otpInputs[order._id] || '').length !== 6 || verifyLoading[order._id]}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {verifyLoading[order._id] ? 'Verifying…' : 'Verify & Deliver'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                          <label className="flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-on-surface-variant">Update Status:</span>
                            <select
                              value={selectedStatus[order._id] || ''}
                              onChange={e => handleStatusChange(order._id, e.target.value)}
                              className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold outline-none transition-all"
                            >
                              <option value="">Select Status</option>
                              {options.map(s => (
                                <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                              ))}
                            </select>
                          </label>
                          <button
                            onClick={() => updateOrderStatus(order._id)}
                            disabled={!selectedStatus[order._id] || statusUpdateLoading[order._id]}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {statusUpdateLoading[order._id] ? 'Saving…' : 'Save Status'}
                          </button>
                        </div>
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
