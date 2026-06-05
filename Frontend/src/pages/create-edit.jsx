import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function CreateEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: userLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    tags: '',
    isOpen: true,
    isActive: true
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [coverImages, setCoverImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const loadShop = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shops/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Unable to fetch shop');
        const data = await res.json();
        const shop = data.shop;
        setFormData({
          name: shop.name || '',
          description: shop.description || '',
          category: shop.category || '',
          street: shop.location?.street || '',
          city: shop.location?.city || '',
          state: shop.location?.state || '',
          zipCode: shop.location?.zipCode || '',
          country: shop.location?.country || 'India',
          tags: (shop.tags || []).join(', '),
          isOpen: shop.isOpen,
          isActive: shop.isActive
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadShop();
  }, [id]);

  const handleChange = (field) => (event) => {
    const value = field === 'isOpen' || field === 'isActive'
      ? event.target.checked
      : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Login required');
      setLoading(false);
      return;
    }

    const body = new FormData();
    body.append('name', formData.name);
    body.append('description', formData.description);
    body.append('category', formData.category);
    body.append('location[street]', formData.street);
    body.append('location[city]', formData.city);
    body.append('location[state]', formData.state);
    body.append('location[zipCode]', formData.zipCode);
    body.append('location[country]', formData.country);
    body.append('tags', formData.tags);
    body.append('isOpen', formData.isOpen);
    body.append('isActive', formData.isActive);

    if (featuredImage) {
      body.append('featuredImage', featuredImage);
    }
    coverImages.forEach((file) => body.append('coverImages', file));

    try {
      const url = id ? `/api/shops/${id}` : '/api/shops';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save shop');
      navigate('/owner-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user || user.userType !== 'restaurant') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Shop editor</h1>
        <p>You need a restaurant owner account to access this page.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>{id ? 'Edit Shop' : 'Create Shop'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label>
          Name
          <input value={formData.name} onChange={handleChange('name')} required />
        </label>
        <label>
          Description
          <textarea value={formData.description} onChange={handleChange('description')} rows={4} />
        </label>
        <label>
          Category
          <input value={formData.category} onChange={handleChange('category')} />
        </label>
        <fieldset style={{ border: '1px solid #ddd', padding: 12 }}>
          <legend>Location</legend>
          <label>
            Street
            <input value={formData.street} onChange={handleChange('street')} />
          </label>
          <label>
            City
            <input value={formData.city} onChange={handleChange('city')} />
          </label>
          <label>
            State
            <input value={formData.state} onChange={handleChange('state')} />
          </label>
          <label>
            Zip Code
            <input value={formData.zipCode} onChange={handleChange('zipCode')} />
          </label>
          <label>
            Country
            <input value={formData.country} onChange={handleChange('country')} />
          </label>
        </fieldset>
        <label>
          Tags (comma separated)
          <input value={formData.tags} onChange={handleChange('tags')} />
        </label>
        <label>
          Featured image
          <input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files[0])} />
        </label>
        <label>
          Cover images
          <input type="file" accept="image/*" multiple onChange={(e) => setCoverImages(Array.from(e.target.files))} />
        </label>
        <label>
          <input type="checkbox" checked={formData.isOpen} onChange={handleChange('isOpen')} /> Open
        </label>
        <label>
          <input type="checkbox" checked={formData.isActive} onChange={handleChange('isActive')} /> Active
        </label>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : id ? 'Update Shop' : 'Create Shop'}</button>
      </form>
    </div>
  );
}
