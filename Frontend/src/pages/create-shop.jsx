import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

const categories = [
  { value: 'Indian', emoji: '🍛' },
  { value: 'Chinese', emoji: '🥡' },
  { value: 'Italian', emoji: '🍝' },
  { value: 'Fast Food', emoji: '🍔' },
  { value: 'South Indian', emoji: '🥘' },
  { value: 'Biryani', emoji: '🍚' },
  { value: 'Desserts', emoji: '🧁' },
  { value: 'Beverages', emoji: '☕' },
  { value: 'General', emoji: '🍽️' },
];

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
    zipCode: '',
  });
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          location: { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode },
          featuredImage: featuredImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create shop');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-2xl mx-auto px-4 md:px-margin-desktop space-y-8">

        {/* Header */}
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors mb-3">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-primary">add_business</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">Create Your Shop</h1>
              <p className="text-xs font-semibold text-on-surface-variant/70 mt-0.5">Set up your restaurant on BlitzBite</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-6">

          {/* Shop Details Card */}
          <Card title="🏪 Shop Details">
            <Field label="Shop Name" required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Adarsh's Kitchen"
                className="input-field"
              />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Tell customers what makes your shop special..."
                className="input-field resize-none"
              />
            </Field>

            <Field label="Category">
              <div className="grid grid-cols-3 gap-2">
                {categories.map(({ value, emoji }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${
                      form.category === value
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={value}
                      checked={form.category === value}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span>{emoji}</span>
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </Field>
          </Card>

          {/* Location Card */}
          <Card title="📍 Location">
            <Field label="Street Address">
              <input
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="e.g. 123 Main Street"
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input-field" />
              </Field>
              <Field label="State">
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input-field" />
              </Field>
            </div>

            <Field label="ZIP Code">
              <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="e.g. 800001" className="input-field" />
            </Field>
          </Card>

          {/* Media */}
          <Card title="📸 Images">
            <Field label="Banner Image">
              <ImageUpload
                variant="banner"
                value={featuredImageUrl}
                folder="blitzbite/shops"
                onUpload={(url) => setFeaturedImageUrl(url)}
                onRemove={() => setFeaturedImageUrl('')}
              />
            </Field>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-white font-black text-sm px-4 py-4 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Shop...
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Create Shop
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
      <h2 className="text-base font-black text-on-surface select-none pb-2 border-b border-outline-variant/10">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}