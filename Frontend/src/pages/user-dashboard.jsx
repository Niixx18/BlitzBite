import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function UserDashboard() {
  const { user, loading, error } = useCurrentUser();
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [ownedShops, setOwnedShops] = useState([]);
  const [loadingOwnedShops, setLoadingOwnedShops] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    category: 'Indian',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.favoriteRestaurants?.length) return;

      setLoadingFavorites(true);
      setFavoriteError(null);

      try {
        const token = localStorage.getItem('token');
        const results = await Promise.all(
          user.favoriteRestaurants.map(async (shopId) => {
            const res = await fetch(`/api/shops/${shopId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.shop;
          })
        );
        setFavoriteShops(results.filter(Boolean));
      } catch (err) {
        setFavoriteError(err.message);
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    const fetchOwnedShops = async () => {
      const userId = user?.id || user?._id;
      if (!userId || user.userType !== 'restaurant') return;

      setLoadingOwnedShops(true);
      setShopError(null);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shops?owner=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || 'Failed to load your shops');
        }
        const data = await res.json();
        setOwnedShops(data.shops || []);
      } catch (err) {
        setShopError(err.message);
      } finally {
        setLoadingOwnedShops(false);
      }
    };

    fetchOwnedShops();
  }, [user]);

  const handleShopFormChange = (event) => {
    const { name, value } = event.target;
    setShopForm((current) => ({ ...current, [name]: value }));
  };

  const createShop = async (event) => {
    event.preventDefault();
    setCreateLoading(true);
    setShopError(null);
    setCreateSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: shopForm.name,
          description: shopForm.description,
          category: shopForm.category,
          location: {
            street: shopForm.street,
            city: shopForm.city,
            state: shopForm.state,
            zipCode: shopForm.zipCode
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create shop');

      setOwnedShops((current) => [data.shop, ...current]);
      setShopForm({
        name: '',
        description: '',
        category: 'Indian',
        street: '',
        city: '',
        state: '',
        zipCode: ''
      });
      setShowCreateShop(false);
      setCreateSuccess('Shop created successfully.');
    } catch (err) {
      setShopError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error loading user: {error}</div>;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h1>User Dashboard</h1>
        <p>Please sign in to access your dashboard.</p>
        <Link to="/signin">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>User Dashboard</h1>
      <div style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Profile</h2>
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
        <p><strong>User type:</strong> {user.userType}</p>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Favorites</h2>
        {loadingFavorites && <p>Loading favorite shops...</p>}
        {favoriteError && <p style={{ color: 'red' }}>{favoriteError}</p>}
        {!loadingFavorites && favoriteShops.length === 0 && (
          <p>You don’t have any favorite shops yet.</p>
        )}
        {favoriteShops.length > 0 && (
          <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
            {favoriteShops.map((shop) => (
              <div key={shop._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                <h3>{shop.name}</h3>
                <p>{shop.description || 'No description available.'}</p>
                <p><strong>Category:</strong> {shop.category}</p>
                <p><strong>Status:</strong> {shop.isOpen ? 'Open' : 'Closed'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {user.userType === 'restaurant' && (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Your Shops</h2>
              <p style={{ margin: '6px 0 0', color: '#666' }}>Create and manage restaurants from your dashboard.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateShop((current) => !current)}
              style={{ padding: '10px 16px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
            >
              {showCreateShop ? 'Close Form' : 'Create Shop'}
            </button>
          </div>

          {shopError && <p style={{ color: 'red' }}>{shopError}</p>}
          {createSuccess && <p style={{ color: 'green' }}>{createSuccess}</p>}

          {showCreateShop && (
            <form onSubmit={createShop} style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8, display: 'grid', gap: 12 }}>
              <label>
                Shop Name *
                <input name="name" value={shopForm.name} onChange={handleShopFormChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
              </label>
              <label>
                Description
                <textarea name="description" value={shopForm.description} onChange={handleShopFormChange} rows={3} style={{ width: '100%', padding: 8, marginTop: 4 }} />
              </label>
              <label>
                Category
                <select name="category" value={shopForm.category} onChange={handleShopFormChange} style={{ width: '100%', padding: 8, marginTop: 4 }}>
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Biryani">Biryani</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="General">General</option>
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <label>
                  Street
                  <input name="street" value={shopForm.street} onChange={handleShopFormChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
                <label>
                  City
                  <input name="city" value={shopForm.city} onChange={handleShopFormChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
                <label>
                  State
                  <input name="state" value={shopForm.state} onChange={handleShopFormChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
                <label>
                  ZIP Code
                  <input name="zipCode" value={shopForm.zipCode} onChange={handleShopFormChange} style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
              </div>
              <button type="submit" disabled={createLoading} style={{ padding: 10, background: createLoading ? '#999' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: createLoading ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                {createLoading ? 'Creating...' : 'Create Shop'}
              </button>
            </form>
          )}

          {loadingOwnedShops && <p>Loading your shops...</p>}
          {!loadingOwnedShops && ownedShops.length === 0 && (
            <p style={{ marginTop: 16 }}>No shops created yet.</p>
          )}
          {ownedShops.length > 0 && (
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              {ownedShops.map((shop) => (
                <div key={shop._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                  <h3 style={{ marginTop: 0 }}>{shop.name}</h3>
                  <p>{shop.description || 'No description available.'}</p>
                  <p><strong>Category:</strong> {shop.category}</p>
                  <p><strong>Status:</strong> {shop.isOpen ? 'Open' : 'Closed'}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to={`/shop/${shop._id}/add-food`}>Add food item</Link>
                    <Link to="/owner-dashboard">Manage shops</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
