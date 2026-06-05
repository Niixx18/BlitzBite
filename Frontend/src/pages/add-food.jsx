import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function AddFoodPage() {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const { user, loading: userLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    category: '',
    tags: '',
    isAvailable: true,
    metadata: { calories: '', spiceLevel: 'medium' }
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (event) => {
    const value = field === 'isAvailable'
      ? event.target.checked
      : event.target === 'metadata'
      ? undefined
      : event.target.value;
    if (field === 'metadata') return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: event.target.value
      }
    }));
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
    body.append('shop', shopId);
    body.append('name', formData.name);
    body.append('description', formData.description);
    body.append('price', formData.price);
    body.append('currency', formData.currency);
    body.append('category', formData.category);
    body.append('tags', formData.tags);
    body.append('isAvailable', formData.isAvailable);
    body.append('metadata[calories]', formData.metadata.calories);
    body.append('metadata[spiceLevel]', formData.metadata.spiceLevel);
    images.forEach((file) => body.append('images', file));

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add food item');
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
        <h1>Add Food</h1>
        <p>You need a restaurant owner account to add food items.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Add Food Item</h1>
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
          Price
          <input type="number" step="0.01" value={formData.price} onChange={handleChange('price')} required />
        </label>
        <label>
          Category
          <input value={formData.category} onChange={handleChange('category')} />
        </label>
        <label>
          Tags (comma separated)
          <input value={formData.tags} onChange={handleChange('tags')} />
        </label>
        <label>
          Available
          <input type="checkbox" checked={formData.isAvailable} onChange={handleChange('isAvailable')} />
        </label>
        <fieldset style={{ border: '1px solid #ddd', padding: 12 }}>
          <legend>Nutrition</legend>
          <label>
            Calories
            <input type="number" value={formData.metadata.calories} onChange={handleMetadataChange('calories')} />
          </label>
          <label>
            Spice level
            <select value={formData.metadata.spiceLevel} onChange={handleMetadataChange('spiceLevel')}>
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="medium">Medium</option>
              <option value="hot">Hot</option>
              <option value="extra-hot">Extra-hot</option>
            </select>
          </label>
        </fieldset>
        <label>
          Images
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))} />
        </label>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Food Item'}</button>
      </form>
    </div>
  );
}
