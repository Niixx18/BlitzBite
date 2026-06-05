import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiNavigation, FiRefreshCw } from 'react-icons/fi';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { socket } from '../utils/socket';

const terminalStatuses = ['delivered', 'cancelled'];
const progressSteps = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out-for-delivery', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' }
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
    if (!hasLocation(deliveryLocation)) {
      return '';
    }

    const lat = Number(deliveryLocation.latitude);
    const lng = Number(deliveryLocation.longitude);
    const delta = 0.012;
    const bbox = [
      lng - delta,
      lat - delta,
      lng + delta,
      lat + delta
    ].join(',');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [deliveryLocation]);

  const fetchTracking = useCallback(async () => {
    setTrackingError('');
    setLoadingOrder(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${id}/tracking`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
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
      const timer = setTimeout(() => {
        fetchTracking();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, user, fetchTracking]);

  useEffect(() => {
    if (!user || !id) return undefined;

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    // Register user with their ID on socket
    socket.emit('register', user.id || user._id);

    // Join tracking room for this order
    socket.emit('joinOrder', id);

    // Listen for live status changes
    socket.on('statusUpdate', (data) => {
      console.log('Real-time order status update:', data);
      if (data.order) {
        setOrder(data.order);
      }
    });

    // Listen for live location updates from the delivery rider
    socket.on('locationUpdate', (data) => {
      console.log('Real-time order location update:', data);
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;
        return {
          ...prevOrder,
          deliveryLocation: {
            ...prevOrder.deliveryLocation,
            latitude: data.latitude,
            longitude: data.longitude,
            updatedAt: data.updatedAt
          }
        };
      });
    });

    // Cleanup listeners and leave room on unmount
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
      const timer = setTimeout(() => {
        setLocationError('Location sharing is not supported in this browser.');
        setSharing(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      () => {
        setLocationError('Unable to read your location. Please allow location access.');
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharing, canShareLocation, id, sendLocation]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading tracking...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h1>Track Order</h1>
        <p>Please <Link to="/signin">sign in</Link> to track this order.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <Link to={backUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <FiArrowLeft /> Back to orders
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Track Order</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {order ? `Order #${order._id.slice(-6)} · ${order.orderStatus.replace(/-/g, ' ')}` : 'Loading order details'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTracking}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {trackingError && <p style={{ color: '#dc2626' }}>{trackingError}</p>}
      {locationError && <p style={{ color: '#dc2626' }}>{locationError}</p>}
      {loadingOrder && <p>Refreshing tracking...</p>}

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: 22, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        {progressSteps.map((step, index) => {
          const isDone = order?.orderStatus === 'cancelled' ? false : index <= activeStepIndex;
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: isDone ? '#16a34a' : '#e5e7eb',
                color: isDone ? '#fff' : '#6b7280',
                fontWeight: 800,
                flex: '0 0 auto'
              }}>
                {index + 1}
              </div>
              <span style={{ fontWeight: isDone ? 800 : 600, color: isDone ? '#111827' : '#6b7280' }}>{step.label}</span>
            </div>
          );
        })}
      </section>

      {order?.orderStatus === 'cancelled' && (
        <p style={{ color: '#dc2626', fontWeight: 700 }}>This order has been cancelled.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 22 }}>
        <section style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', minHeight: 520, background: '#eef2f7' }}>
          {mapUrl ? (
            <iframe
              title="Live delivery location"
              src={mapUrl}
              style={{ width: '100%', height: 520, border: 0, display: 'block' }}
            />
          ) : (
            <div style={{ minHeight: 520, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
              <div>
                <FiMapPin size={42} color="#2563eb" />
                <h2>{order?.deliveryPartner ? 'Waiting for live location' : 'Delivery partner not assigned yet'}</h2>
                <p style={{ color: '#4b5563', maxWidth: 420 }}>
                  {order?.deliveryPartner
                    ? 'The map will appear after the delivery partner starts location sharing.'
                    : 'You can keep this page open. Tracking will start once a delivery partner accepts your order.'}
                </p>
              </div>
            </div>
          )}
        </section>

        <aside style={{ display: 'grid', gap: 14, alignSelf: 'start' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Tracking Details</h2>
            <p><strong>Status:</strong> {order?.orderStatus?.replace(/-/g, ' ') || 'Loading'}</p>
            <p><strong>Delivery partner:</strong> {order?.deliveryPartner ? `${order.deliveryPartner.firstName || ''} ${order.deliveryPartner.lastName || ''}`.trim() || 'Assigned' : 'Not assigned'}</p>
            {order?.deliveryPartner?.phone && <p><strong>Rider phone:</strong> {order.deliveryPartner.phone}</p>}
            {order?.deliveryOtp?.sentAt && (
              <p style={{ color: '#166534', fontWeight: 700 }}>
                Delivery OTP sent to your phone at {new Date(order.deliveryOtp.sentAt).toLocaleTimeString()}.
              </p>
            )}
            <p><strong>Last updated:</strong> {deliveryLocation?.updatedAt ? new Date(deliveryLocation.updatedAt).toLocaleString() : 'Waiting for location'}</p>
            {hasLocation(deliveryLocation) && (
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                {Number(deliveryLocation.latitude).toFixed(5)}, {Number(deliveryLocation.longitude).toFixed(5)}
              </p>
            )}
          </div>

          {canShareLocation && (
            <div style={{ border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, background: '#f0fdf4' }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Delivery Controls</h2>
              <p style={{ color: '#166534' }}>Share your current location while you deliver this order.</p>
              <button
                type="button"
                onClick={() => setSharing((current) => !current)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: sharing ? '#dc2626' : '#16a34a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                <FiNavigation /> {sharing ? 'Stop sharing' : 'Start live tracking'}
              </button>
            </div>
          )}

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Delivery Address</h2>
            <p style={{ marginBottom: 0 }}>
              {order?.deliveryAddress
                ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}, ${order.deliveryAddress.country}`
                : 'Loading address'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
