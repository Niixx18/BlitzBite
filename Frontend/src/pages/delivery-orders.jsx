import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';
import { socket } from '../utils/socket';

export default function DeliveryOrdersPage() {
  const { user, loading } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});
  const [acceptLoading, setAcceptLoading] = useState({});
  const [otpLoading, setOtpLoading] = useState({});
  const [otpMessage, setOtpMessage] = useState('');

  useEffect(() => {
    if (user && (user.id || user._id)) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('register', user.id || user._id);
    }
  }, [user]);

  const statusTransitionMap = {
    placed: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['out-for-delivery', 'cancelled'],
    'out-for-delivery': ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  };

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
          fetch('/api/orders/available-delivery', { headers })
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
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  const acceptOrder = async (orderId) => {
    setAcceptLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/accept-delivery`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to accept order');
      }

      const data = await res.json();
      setAvailableOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      setOrders((prevOrders) => [data.order, ...prevOrders]);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setAcceptLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleStatusChange = (orderId, status) => {
    setSelectedStatus((prev) => ({ ...prev, [orderId]: status }));
  };

  const updateOrderStatus = async (orderId) => {
    const status = selectedStatus[orderId];
    if (!status) return;

    setStatusUpdateLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    setOtpMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: status })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to update status');
      }

      const data = await res.json();
      setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? data.order : order)));
      if (data.deliveryOtp?.message) {
        setOtpMessage(data.deliveryOtp.devOtp
          ? `${data.deliveryOtp.message}. Test OTP: ${data.deliveryOtp.devOtp}`
          : data.deliveryOtp.message);
      }
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setStatusUpdateLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const sendDeliveryOtp = async (orderId) => {
    setOtpLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderError(null);
    setOtpMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/delivery-otp/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to send delivery OTP');
      }

      const data = await res.json();
      setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? data.order : order)));
      setOtpMessage(data.devOtp ? `${data.message}. Test OTP: ${data.devOtp}` : data.message);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOtpLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">local_shipping</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading assigned orders...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 font-light">lock</span>
        <h2 className="text-2xl font-extrabold text-on-surface">Sign in to view deliveries</h2>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (user.userType !== 'delivery') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-3">
        <span className="material-symbols-outlined text-6xl text-rose-500 font-light">warning</span>
        <h2 className="text-2xl font-extrabold text-on-surface">Access Denied</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          Your account is not registered as a delivery rider.
        </p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCompleted = orders.filter((order) => {
    if (order.orderStatus !== 'delivered' || !order.deliveredAt) return false;
    const deliveredDate = new Date(order.deliveredAt);
    return deliveredDate >= today;
  });

  const todayCount = todayCompleted.length;
  const todayEarnings = todayCompleted.reduce((sum, order) => {
    const pay = Math.max(Number(order.deliveryFee || 0), 40);
    return sum + pay;
  }, 0);

  const activeOrdersCount = orders.filter(
    (order) => !['delivered', 'cancelled'].includes(order.orderStatus)
  ).length;

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop space-y-8">
        
        {/* Header */}
        <div className="pb-4 border-b border-outline-variant/20">
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Rider Dashboard</h1>
          <p className="text-xs font-semibold text-on-surface-variant/70 mt-1">
            Manage active shipments, view available jobs, and track your daily earnings.
          </p>
        </div>

        {/* Status Alerts */}
        {orderError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-slide-in">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{orderError}</span>
          </div>
        )}
        {otpMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-in">
            <span className="material-symbols-outlined text-sm">key</span>
            <span>{otpMessage}</span>
          </div>
        )}

        {/* Daily Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Earnings Card */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl select-none">payments</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Today's Earnings</p>
              <h3 className="text-xl font-black text-on-surface mt-1">₹{todayEarnings.toFixed(2)}</h3>
            </div>
          </div>

          {/* Today Deliveries Card */}
          <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl select-none">local_shipping</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Today's Deliveries</p>
              <h3 className="text-xl font-black text-on-surface mt-1">{todayCount} order{todayCount !== 1 ? 's' : ''}</h3>
            </div>
          </div>

          {/* Active Shipments Card */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[24px] p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl select-none">schedule</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Active Shipments</p>
              <h3 className="text-xl font-black text-on-surface mt-1">{activeOrdersCount} order{activeOrdersCount !== 1 ? 's' : ''}</h3>
            </div>
          </div>
        </div>

        {/* 1. Available Orders */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-on-surface select-none">Available Deliveries</h2>
            <div className="flex-1 h-[1px] bg-outline-variant/30" />
            {!loadingOrders && (
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2.5 py-1 rounded-full">
                {availableOrders.length} Available
              </span>
            )}
          </div>

          {!loadingOrders && availableOrders.length === 0 && (
            <div className="text-center py-10 border border-outline-variant/20 rounded-[24px] bg-surface-container-lowest p-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 font-light mb-2">info</span>
              <p className="text-xs font-semibold text-on-surface-variant">No new delivery requests in your area.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableOrders.map((order) => (
              <div key={order._id} className="space-y-3">
                <OrderCard order={order} showCustomer />
                
                <div className="bg-surface-container border border-outline-variant/35 rounded-2xl p-4">
                  <button
                    onClick={() => acceptOrder(order._id)}
                    disabled={acceptLoading[order._id]}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:bg-surface-container-high disabled:text-on-surface-variant/40 disabled:cursor-not-allowed"
                  >
                    {acceptLoading[order._id] ? 'Accepting...' : 'Accept Delivery Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Assigned Orders */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-on-surface select-none">Your Assigned Shipments</h2>
            <div className="flex-1 h-[1px] bg-outline-variant/30" />
            {!loadingOrders && (
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2.5 py-1 rounded-full">
                {orders.length} Assigned
              </span>
            )}
          </div>

          {!loadingOrders && orders.length === 0 && (
            <div className="text-center py-12 border border-outline-variant/20 rounded-[24px] bg-surface-container-lowest p-6 space-y-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 font-light">shopping_bag</span>
              <p className="text-xs font-semibold text-on-surface-variant">No orders assigned to you yet.</p>
              <Link to="/" className="inline-block text-primary font-bold text-xs hover:text-primary-container">
                Find restaurants near you →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => {
              const options = statusTransitionMap[order.orderStatus] || [];
              return (
                <div key={order._id} className="space-y-3">
                  <OrderCard order={order} showCustomer />
                  
                  {options.length > 0 && (
                    <div className="bg-surface-container border border-outline-variant/35 rounded-2xl p-4 space-y-4">
                      
                      {/* Interactive Actions */}
                      <div className="flex flex-wrap gap-2.5">
                        <Link
                          to={`/orders/${order._id}/track`}
                          className="bg-primary text-on-primary font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">explore</span>
                          Live Navigation
                        </Link>
                        
                        {order.orderStatus === 'out-for-delivery' && (
                          <button
                            type="button"
                            onClick={() => sendDeliveryOtp(order._id)}
                            disabled={otpLoading[order._id]}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:bg-surface-container-high disabled:text-on-surface-variant/40"
                          >
                            {otpLoading[order._id] ? 'Sending OTP...' : 'Send Delivery OTP'}
                          </button>
                        )}
                      </div>

                      {/* Status Update Dropdown */}
                      <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <label className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-on-surface-variant">Update Status:</span>
                          <select
                            value={selectedStatus[order._id] || ''}
                            onChange={(event) => handleStatusChange(order._id, event.target.value)}
                            className="bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2 px-3 text-xs text-on-surface font-semibold outline-none cursor-pointer transition-all"
                          >
                            <option value="">Select Status</option>
                            {options.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption.replace(/-/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          onClick={() => updateOrderStatus(order._id)}
                          disabled={!selectedStatus[order._id] || statusUpdateLoading[order._id]}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:bg-surface-container-high disabled:text-on-surface-variant/40 disabled:cursor-not-allowed"
                        >
                          {statusUpdateLoading[order._id] ? 'Saving...' : 'Save Status'}
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
