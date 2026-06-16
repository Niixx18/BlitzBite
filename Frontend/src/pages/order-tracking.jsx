import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { socket } from '../utils/socket';

const terminalStatuses = ['delivered', 'cancelled'];
const progressSteps = [
  { key: 'placed', label: 'Placed', icon: 'receipt_long' },
  { key: 'accepted', label: 'Accepted', icon: 'thumb_up' },
  { key: 'preparing', label: 'Preparing', icon: 'skillet' },
  { key: 'out-for-delivery', label: 'On the way', icon: 'delivery_dining' },
  { key: 'delivered', label: 'Delivered', icon: 'check_circle' },
];

const hasLocation = (location) =>
  Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { user, loading } = useCurrentUser();
  const [order, setOrder] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);

  const deliveryLocation = order?.deliveryLocation;
  const backUrl = user?.userType === 'delivery' ? '/delivery-orders' : '/orders';
  const activeStepIndex = Math.max(progressSteps.findIndex((step) => step.key === order?.orderStatus), 0);
  const canShareLocation = user?.userType === 'delivery'
    && order?.deliveryPartner
    && String(order.deliveryPartner._id || order.deliveryPartner) === String(user.id || user._id)
    && !terminalStatuses.includes(order.orderStatus);

  const mapUrl = useMemo(() => {
    if (!hasLocation(deliveryLocation)) return '';
    const lat = Number(deliveryLocation.latitude);
    const lng = Number(deliveryLocation.longitude);
    const delta = 0.012;
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [deliveryLocation]);

  const fetchTracking = useCallback(async () => {
    setTrackingError('');
    setLoadingOrder(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${id}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to load tracking');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setTrackingError(err.message);
    } finally {
      setLoadingOrder(false);
    }
  }, [id]);

  const sendLocation = useCallback(async (position) => {
    setLocationError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${id}/location`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to update location');
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setLocationError(err.message);
      setSharing(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => fetchTracking(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, user, fetchTracking]);

  useEffect(() => {
    if (!user || !id) return undefined;
    if (!socket.connected) socket.connect();
    socket.emit('register', user.id || user._id);
    socket.emit('joinOrder', id);
    socket.on('statusUpdate', (data) => {
      if (data.order) setOrder(data.order);
    });
    socket.on('locationUpdate', (data) => {
      setOrder((prev) => {
        if (!prev) return prev;
        return { ...prev, deliveryLocation: { ...prev.deliveryLocation, latitude: data.latitude, longitude: data.longitude, updatedAt: data.updatedAt } };
      });
    });
    return () => {
      socket.emit('leaveOrder', id);
      socket.off('statusUpdate');
      socket.off('locationUpdate');
    };
  }, [id, user]);

  useEffect(() => {
    if (!user) return undefined;
    const intervalId = window.setInterval(fetchTracking, 8000);
    return () => window.clearInterval(intervalId);
  }, [id, user, fetchTracking]);

  useEffect(() => {
    if (!sharing || !canShareLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return undefined;
    }
    if (!navigator.geolocation) {
      const timer = setTimeout(() => { setLocationError('Location sharing is not supported.'); setSharing(false); }, 0);
      return () => clearTimeout(timer);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      () => { setLocationError('Unable to read location. Allow location access.'); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharing, canShareLocation, id, sendLocation]);

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">restaurant</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading tracking...</div>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">lock</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Sign in to track orders</h1>
        <p className="text-sm text-on-surface-variant/70 max-w-sm">Please sign in to view the real-time tracking for this order.</p>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-8 py-3 rounded-full shadow-md hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const isCancelled = order?.orderStatus === 'cancelled';

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <Link to={backUrl} className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors mb-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to orders
            </Link>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Track Order</h1>
            <p className="text-xs font-semibold text-on-surface-variant/70 mt-1">
              {order ? (
                <>Order <span className="text-on-surface font-black">#{order._id.slice(-6)}</span> · <span className="capitalize">{order.orderStatus.replace(/-/g, ' ')}</span></>
              ) : 'Loading order details...'}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTracking}
            disabled={loadingOrder}
            className="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-surface-container hover:text-primary transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${loadingOrder ? 'animate-spin' : ''}`}>refresh</span>
            {loadingOrder ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Errors */}
        {trackingError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            {trackingError}
          </div>
        )}
        {locationError && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">location_off</span>
            {locationError}
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {progressSteps.map((step, index) => {
              const isDone = isCancelled ? false : index <= activeStepIndex;
              const isCurrent = !isCancelled && index === activeStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 min-w-margin-desktop flex-1 relative">
                  {/* Connector line */}
                  {index > 0 && (
                    <div className={`absolute top-4 -left-1/2 w-full h-0.5 -z-1 transition-colors duration-500 ${isDone ? 'bg-primary' : 'bg-outline-variant/30'}`} />
                  )}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                    isDone ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant/50'
                  } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                    <span className="material-symbols-outlined text-lg">{step.icon}</span>
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${isDone ? 'text-on-surface font-extrabold' : 'text-on-surface-variant/50'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-2xl">cancel</span>
            <span className="text-rose-700 font-bold text-sm">This order has been cancelled.</span>
          </div>
        )}

        {/* Main content grid: Map + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Map */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] overflow-hidden shadow-sm">
              {mapUrl ? (
                <iframe
                  title="Live delivery location"
                  src={mapUrl}
                  className="w-full border-0 block"
                  style={{ height: 480 }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10" style={{ minHeight: 480 }}>
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-4xl text-primary">location_on</span>
                  </div>
                  <h2 className="text-lg font-black text-on-surface mb-2">
                    {order?.deliveryPartner ? 'Waiting for live location' : 'Delivery partner not assigned'}
                  </h2>
                  <p className="text-xs text-on-surface-variant/70 max-w-md leading-relaxed">
                    {order?.deliveryPartner
                      ? 'The map will appear once the delivery partner starts sharing their location.'
                      : 'Keep this page open. Tracking begins once a delivery partner accepts your order.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details sidebar */}
          <aside className="lg:col-span-5 space-y-5">

            {/* Delivery Verification OTP Card */}
            {order?.otpSentAt && !order?.otpVerified && order?.deliveryOtp && (
              <Card title="🔑 Delivery Verification OTP">
                <div className="flex flex-col items-center justify-center py-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                  <span className="text-[10px] uppercase font-black text-primary tracking-widest mb-1.5">Share with Rider on Delivery</span>
                  <span className="text-3xl font-black text-primary tracking-[0.35em] pl-[0.35em] font-mono select-all">
                    {order.deliveryOtp}
                  </span>
                  {order.deliveryOtpExpiry && (
                    <span className="text-[10px] font-bold text-on-surface-variant/50 mt-2">
                      Expires: {new Date(order.deliveryOtpExpiry).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* Tracking Details card */}
            <Card title="📍 Tracking Details">
              <InfoRow label="Status" value={
                <span className={`capitalize font-extrabold ${isCancelled ? 'text-rose-500' : 'text-primary'}`}>
                  {order?.orderStatus?.replace(/-/g, ' ') || 'Loading'}
                </span>
              } />
              <InfoRow label="Delivery Partner" value={
                order?.deliveryPartner
                  ? `${order.deliveryPartner.firstName || ''} ${order.deliveryPartner.lastName || ''}`.trim() || 'Assigned'
                  : <span className="text-on-surface-variant/50">Not assigned yet</span>
              } />
              {order?.deliveryPartner?.phone && (
                <InfoRow label="Rider Phone" value={
                  <a href={`tel:${order.deliveryPartner.phone}`} className="text-primary font-bold hover:underline">{order.deliveryPartner.phone}</a>
                } />
              )}
              {order?.otpSentAt && !order?.otpVerified && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                  OTP sent at {new Date(order.otpSentAt).toLocaleTimeString()}
                </div>
              )}
              <InfoRow label="Last Updated" value={
                deliveryLocation?.updatedAt
                  ? new Date(deliveryLocation.updatedAt).toLocaleString()
                  : <span className="text-on-surface-variant/50">Waiting for location</span>
              } />
              {hasLocation(deliveryLocation) && (
                <p className="text-[10px] text-on-surface-variant/40 font-mono mt-1">
                  {Number(deliveryLocation.latitude).toFixed(5)}, {Number(deliveryLocation.longitude).toFixed(5)}
                </p>
              )}
            </Card>

            {/* Delivery Controls (for delivery riders) */}
            {canShareLocation && (
              <Card title="🚴 Delivery Controls">
                <p className="text-xs text-on-surface-variant/70 leading-relaxed mb-3">
                  Share your current location in real-time while delivering this order.
                </p>
                <button
                  type="button"
                  onClick={() => setSharing((c) => !c)}
                  className={`w-full inline-flex items-center justify-center gap-2 font-black text-sm px-5 py-3.5 rounded-xl transition-all active:scale-[0.97] cursor-pointer ${
                    sharing
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{sharing ? 'location_off' : 'my_location'}</span>
                  {sharing ? 'Stop Sharing Location' : 'Start Live Tracking'}
                </button>
              </Card>
            )}

            {/* Delivery Address card */}
            <Card title="🏠 Delivery Address">
              <div className="text-sm text-on-surface space-y-1">
                {order?.deliveryAddress ? (
                  order.deliveryAddress.fullName ? (
                    <>
                      <p className="font-extrabold">{order.deliveryAddress.fullName} ({order.deliveryAddress.phoneNumber})</p>
                      <p className="leading-relaxed">
                        {order.deliveryAddress.flatNo}, {order.deliveryAddress.street}
                        {order.deliveryAddress.landmark ? `, Landmark: ${order.deliveryAddress.landmark}` : ''}
                      </p>
                      <p className="leading-relaxed">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode || order.deliveryAddress.zipCode}
                      </p>
                      {order.deliveryAddress.deliveryInstructions && (
                        <p className="text-xs text-on-surface-variant mt-2.5 p-2.5 bg-surface border border-outline-variant/20 rounded-xl italic">
                          <strong>Instruction:</strong> {order.deliveryAddress.deliveryInstructions}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="leading-relaxed">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}, {order.deliveryAddress.country}
                    </p>
                  )
                ) : (
                  <span className="text-on-surface-variant/50">Loading address...</span>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-3">
      <h2 className="text-base font-black text-on-surface select-none pb-2 border-b border-outline-variant/10">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 text-xs py-1.5">
      <span className="text-on-surface-variant/70 font-bold shrink-0">{label}</span>
      <span className="text-on-surface font-extrabold text-right">{value}</span>
    </div>
  );
}
