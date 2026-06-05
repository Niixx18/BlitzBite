import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import OwnerItemCard from '../components/OwnerItemCard';

export default function OwnerDashboard() {
  const { user, loading, error } = useCurrentUser();
  const [shops, setShops] = useState([]);
  const [itemsByShop, setItemsByShop] = useState({});
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [itemsError, setItemsError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      if (!user?.id || user.userType !== 'restaurant') return;
      setLoadingShops(true);
      setShopError(null);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shops?owner=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to load shops');
        const data = await res.json();
        setShops(data.shops || []);
      } catch (err) {
        setShopError(err.message);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchShops();
  }, [user]);

  useEffect(() => {
    const fetchItems = async () => {
      if (shops.length === 0) {
        setItemsByShop({});
        return;
      }

      setLoadingItems(true);
      setItemsError(null);

      try {
        const token = localStorage.getItem('token');
        const results = await Promise.all(
          shops.map(async (shop) => {
            const res = await fetch(`/api/items?shop=${shop._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to load items');
            const data = await res.json();
            return { shopId: shop._id, items: data.items || [] };
          })
        );

        const grouped = results.reduce((acc, entry) => {
          acc[entry.shopId] = entry.items;
          return acc;
        }, {});

        setItemsByShop(grouped);
      } catch (err) {
        setItemsError(err.message);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [shops]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Error loading user: {error}</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Owner Dashboard</h1>
        <p>You must sign in to access the dashboard.</p>
      </div>
    );
  }

  if (user.userType !== 'restaurant') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Owner Dashboard</h1>
        <p>This dashboard is only available to restaurant owners.</p>
        <p>Your account type is <strong>{user.userType}</strong>.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Owner Dashboard</h1>
      <p>Welcome back, {user.firstName}.</p>
      <div style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Your profile</h2>
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Account type:</strong> {user.userType}</p>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Shops</h2>
        {loadingShops && <p>Loading your shops...</p>}
        {shopError && <p style={{ color: 'red' }}>{shopError}</p>}
        {!loadingShops && shops.length === 0 && (
    <div>
        <p>No shops found yet. Create one to start selling.</p>
        <Link to="/create-shop" style={{ display: 'inline-block', marginTop: 8, padding: '8px 16px', background: '#0366d6', color: 'white', borderRadius: 6, textDecoration: 'none' }}>
            Create Your Shop
        </Link>
    </div>
)}
        {shops.length > 0 && (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {shops.map((shop) => (
              <div key={shop._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <h3>{shop.name}</h3>
                    <p>{shop.description || 'No description provided.'}</p>
                    <p><strong>Category:</strong> {shop.category}</p>
                    <p><strong>Status:</strong> {shop.isOpen ? 'Open' : 'Closed'} · {shop.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <Link to={`/shop/${shop._id}/add-food`} style={{ alignSelf: 'start', color: '#0366d6' }}>
                    Add food item
                  </Link>
                </div>

                <div style={{ marginTop: 16 }}>
                  <h4>Menu items</h4>
                  {loadingItems && <p>Loading items...</p>}
                  {itemsError && <p style={{ color: 'red' }}>{itemsError}</p>}
                  {!loadingItems && (itemsByShop[shop._id]?.length || 0) === 0 && (
                    <p>No items yet. Add your first food item.</p>
                  )}
                  {itemsByShop[shop._id]?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
                      {itemsByShop[shop._id].map((item) => (
                        <OwnerItemCard key={item._id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
