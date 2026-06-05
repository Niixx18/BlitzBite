import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';

export default function MyOrdersPage() {
  const { user, loading } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!(user?.id || user?._id)) return;
      setLoadingOrders(true);
      setOrderError(null);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
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

  if (loading) return <div style={{ padding: 24 }}>Loading orders...</div>;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h1>My Orders</h1>
        <p>Please sign in to view your order history.</p>
        <Link to="/signin">Sign in</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>My Orders</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Track active orders and review your order history.</p>
        </div>
      </div>
      {orderError && <p style={{ color: 'red' }}>{orderError}</p>}
      {loadingOrders && <p>Loading your orders...</p>}
      {!loadingOrders && orders.length === 0 && (
        <div>
          <p>You have not placed any orders yet.</p>
          <Link to="/">Browse restaurants</Link>
        </div>
      )}
      <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}
