import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateShop() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: 'Indian',
        street: '',
        city: '',
        state: '',
        zipCode: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    category: form.category,
                    location: {
                        street: form.street,
                        city: form.city,
                        state: form.state,
                        zipCode: form.zipCode
                    }
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create shop');
            navigate('/owner-dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: 20 }}>
            <h2>Create Your Shop</h2>
            <form onSubmit={submit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Shop Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8, marginTop: 4 }} placeholder="e.g. Adarsh's Kitchen" />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} rows={3} placeholder="Tell customers about your shop" />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }}>
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
                </div>
                <h3 style={{ marginTop: 16 }}>Location</h3>
                <div style={{ marginBottom: 12 }}>
                    <label>Street</label>
                    <input name="street" value={form.street} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} placeholder="Street address" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label>City</label>
                        <input name="city" value={form.city} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} placeholder="City" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>State</label>
                        <input name="state" value={form.state} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} placeholder="State" />
                    </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>ZIP Code</label>
                    <input name="zipCode" value={form.zipCode} onChange={handleChange} style={{ width: '100%', padding: 8, marginTop: 4 }} placeholder="ZIP Code" />
                </div>
                {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#0366d6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    {loading ? 'Creating...' : 'Create Shop'}
                </button>
            </form>
        </div>
    );
}