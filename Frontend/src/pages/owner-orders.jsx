import { useEffect, useState } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OrderCard from '../components/OrderCard';
import { Link } from 'react-router-dom';

export default function OwnerOrdersPage() {
  const { user, loading } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [deliveryAssignLoading, setDeliveryAssignLoading] = useState({});

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
      if (!user?.id || user.userType !== 'restaurant') return;
      setLoadingOrders(true);
      setOrderError(null);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders/owner', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load owner orders');
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

  useEffect(() => {
    const fetchDeliveryPartners = async () => {
      if (!user?.id || user.userType !== 'restaurant') return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/orders/delivery-partners', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        setDeliveryPartners(data.partners || []);
      } catch {
        // ignore delivery partner fetch errors for now
      }
    };

    fetchDeliveryPartners();
  }, [user]);

  const handleStatusChange = (orderId, status) => {
    setSelectedStatus((prev) => ({ ...prev, [orderId]: status }));
  };

  const updateOrderStatus = async (orderId) => {
    const status = selectedStatus[orderId];
    if (!status) return;

    setStatusUpdateLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderError(null);

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
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setStatusUpdateLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeliveryChange = (orderId, partnerId) => {
    setSelectedDelivery((prev) => ({ ...prev, [orderId]: partnerId }));
  };

  const assignDeliveryPartner = async (orderId) => {
    const partnerId = selectedDelivery[orderId];
    if (!partnerId) return;

    setDeliveryAssignLoading((prev) => ({ ...prev, [orderId]: true }));
    setOrderError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/assign-delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryPartner: partnerId })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to assign delivery partner');
      }

      const data = await res.json();
      setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? data.order : order)));
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setDeliveryAssignLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading owner orders...</div>;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Owner Orders</h1>
        <p>Please sign in to view orders for your restaurant.</p>
        <Link to="/signin">Sign in</Link>
      </div>
    );
  }

  if (user.userType !== 'restaurant') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Owner Orders</h1>
        <p>Your account is not registered as a restaurant owner.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Owner Orders</h1>
      {orderError && <p style={{ color: 'red' }}>{orderError}</p>}
      {loadingOrders && <p>Loading orders placed for your shop(s)...</p>}
      {!loadingOrders && orders.length === 0 && (
        <div>
          <p>No orders found for your restaurants yet.</p>
          <Link to="/owner-dashboard">Manage your shop</Link>
        </div>
      )}
      <div style={{ display: 'grid', gap: 18, marginTop: 16 }}>
        {orders.map((order) => {
          const options = statusTransitionMap[order.orderStatus] || [];
          return (
            <div key={order._id} style={{ display: 'grid', gap: 12 }}>
              <OrderCard order={order} showCustomer />
                {order.deliveryPartner && (
                  <div style={{ padding: 14, border: '1px solid #d1d5db', borderRadius: 12, background: '#f8fafc' }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>Delivery Partner Assigned</p>
                    <p style={{ margin: '8px 0 0' }}>{order.deliveryPartner.firstName} {order.deliveryPartner.lastName}</p>
                    {order.deliveryPartner.phone && <p style={{ margin: '4px 0 0' }}>Phone: {order.deliveryPartner.phone}</p>}
                    {order.deliveryPartner.email && <p style={{ margin: '4px 0 0' }}>Email: {order.deliveryPartner.email}</p>}
                  </div>
                )}
                {!order.deliveryPartner && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>Assign delivery partner:</span>
                      <select
                        value={selectedDelivery[order._id] || ''}
                        onChange={(event) => handleDeliveryChange(order._id, event.target.value)}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                      >
                        <option value="">Select rider</option>
                        {deliveryPartners.map((partner) => (
                          <option key={partner._id} value={partner._id}>
                            {partner.firstName} {partner.lastName} {partner.phone ? `(${partner.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => assignDeliveryPartner(order._id)}
                      disabled={!selectedDelivery[order._id] || deliveryAssignLoading[order._id]}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#059669',
                        color: '#fff',
                        cursor: selectedDelivery[order._id] ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {deliveryAssignLoading[order._id] ? 'Assigning...' : 'Assign rider'}
                    </button>
                  </div>
                )}
              {options.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>Update status:</span>
                    <select
                      value={selectedStatus[order._id] || ''}
                      onChange={(event) => handleStatusChange(order._id, event.target.value)}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                    >
                      <option value="">Select status</option>
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
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#2563eb',
                      color: '#fff',
                      cursor: selectedStatus[order._id] ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {statusUpdateLoading[order._id] ? 'Updating...' : 'Save status'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
