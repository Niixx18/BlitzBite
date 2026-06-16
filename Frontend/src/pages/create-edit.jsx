import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import ImageUpload from '../components/ImageUpload';

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
    isActive: true,
  });
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [coverImageUrls, setCoverImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadShop = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/shops/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
          isActive: shop.isActive,
        });
        if (shop.featuredImage) setFeaturedImageUrl(shop.featuredImage);
        if (shop.coverImages?.length) setCoverImageUrls(shop.coverImages);
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
    if (!token) { setError('Login required'); setLoading(false); return; }

    const body = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      tags: formData.tags,
      isOpen: formData.isOpen,
      isActive: formData.isActive,
      featuredImage: featuredImageUrl,
      coverImages: coverImageUrls,
    };

    try {
      const url = id ? `/api/shops/${id}` : '/api/shops';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save shop');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/shops/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete shop');
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">restaurant</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading...</div>
      </div>
    );
  }

  // ── Auth gate ──────────────────────────────────────────────────────
  if (!user || user.userType !== 'restaurant') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Restaurant Account Required</h1>
        <p className="text-sm text-on-surface-variant/70 max-w-sm">You need a restaurant owner account to manage shops.</p>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-8 py-3 rounded-full shadow-md hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

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
              <span className="material-symbols-outlined text-2xl text-primary">{id ? 'edit' : 'add_business'}</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">{id ? 'Edit Shop' : 'Create Shop'}</h1>
              <p className="text-xs font-semibold text-on-surface-variant/70 mt-0.5">{id ? 'Update your shop details' : 'Set up your restaurant on BlitzBite'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Details */}
          <Card title="🏪 Shop Details">
            <Field label="Name" required>
              <input value={formData.name} onChange={handleChange('name')} required placeholder="e.g. Adarsh's Kitchen" className="input-field" />
            </Field>
            <Field label="Description">
              <textarea value={formData.description} onChange={handleChange('description')} rows={4} placeholder="Tell customers what makes your shop special..." className="input-field resize-none" />
            </Field>
            <Field label="Category">
              <input value={formData.category} onChange={handleChange('category')} placeholder="e.g. Indian, Chinese, Fast Food" className="input-field" />
            </Field>
            <Field label="Tags (comma separated)">
              <input value={formData.tags} onChange={handleChange('tags')} placeholder="e.g. spicy, veg, family" className="input-field" />
            </Field>
          </Card>

          {/* Location */}
          <Card title="📍 Location">
            <Field label="Street">
              <input value={formData.street} onChange={handleChange('street')} placeholder="e.g. 123 Main Street" className="input-field" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <input value={formData.city} onChange={handleChange('city')} placeholder="City" className="input-field" />
              </Field>
              <Field label="State">
                <input value={formData.state} onChange={handleChange('state')} placeholder="State" className="input-field" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ZIP Code">
                <input value={formData.zipCode} onChange={handleChange('zipCode')} placeholder="e.g. 800001" className="input-field" />
              </Field>
              <Field label="Country">
                <input value={formData.country} onChange={handleChange('country')} className="input-field" />
              </Field>
            </div>
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
            <Field label="Cover Images">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {coverImageUrls.map((url, i) => (
                  <ImageUpload
                    key={i}
                    variant="item"
                    value={url}
                    folder="blitzbite/shops"
                    onUpload={(newUrl) => {
                      const updated = [...coverImageUrls];
                      updated[i] = newUrl;
                      setCoverImageUrls(updated);
                    }}
                    onRemove={() => setCoverImageUrls(coverImageUrls.filter((_, idx) => idx !== i))}
                  />
                ))}
                {coverImageUrls.length < 5 && (
                  <ImageUpload
                    variant="item"
                    folder="blitzbite/shops"
                    onUpload={(url) => setCoverImageUrls([...coverImageUrls, url])}
                  />
                )}
              </div>
              {coverImageUrls.length > 0 && (
                <p className="text-[10px] text-on-surface-variant/50 font-bold mt-1">
                  {coverImageUrls.length} / 5 cover image{coverImageUrls.length !== 1 ? 's' : ''}
                </p>
              )}
            </Field>
          </Card>

          {/* Toggles */}
          <Card title="⚙️ Settings">
            <div className="flex flex-col gap-3">
              <Toggle label="Open for orders" description="Customers can place new orders" checked={formData.isOpen} onChange={handleChange('isOpen')} />
              <Toggle label="Active listing" description="Shop appears in search results" checked={formData.isActive} onChange={handleChange('isActive')} />
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              {error}
            </div>
          )}

          {/* Delete Confirm State / Submit Buttons */}
          <div className="flex flex-col gap-3">
            {id && (
              deleteConfirm ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-[20px] space-y-3">
                  <p className="text-xs font-bold text-rose-700 text-center leading-tight">
                    ⚠️ Are you sure you want to delete this shop? This will delete all its food items and menu data.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteShop}
                      disabled={loading}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer border-0"
                    >
                      {loading ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      disabled={loading}
                      className="flex-1 bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-black text-xs px-4 py-3 rounded-xl transition-all border border-outline-variant/30 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  disabled={loading}
                  className="w-full bg-rose-50 hover:bg-rose-100/70 text-rose-700 font-extrabold text-sm px-4 py-4 rounded-xl border border-rose-200 shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete Shop
                </button>
              )
            )}

            <button
              type="submit"
              disabled={loading || deleteConfirm}
              className="w-full bg-primary-container text-white font-black text-sm px-4 py-4 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">{id ? 'save' : 'rocket_launch'}</span>
                  {id ? 'Update Shop' : 'Create Shop'}
                </>
              )}
            </button>
          </div>
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

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-outline-variant/30 hover:bg-surface-container transition-all cursor-pointer">
      <div>
        <span className="text-sm font-extrabold text-on-surface">{label}</span>
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-primary rounded cursor-pointer"
      />
    </label>
  );
}
