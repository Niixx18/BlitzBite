import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import ImageUpload from '../components/ImageUpload';

const spiceLevels = [
  { value: 'none', label: 'None', emoji: '🧊' },
  { value: 'mild', label: 'Mild', emoji: '🌶️' },
  { value: 'medium', label: 'Medium', emoji: '🌶️🌶️' },
  { value: 'hot', label: 'Hot', emoji: '🔥' },
  { value: 'extra-hot', label: 'Extra Hot', emoji: '🔥🔥' },
];

export default function AddFoodPage() {
  const navigate = useNavigate();
  const { shopId, itemId } = useParams();
  const isEditMode = !!itemId;
  const { user, loading: userLoading } = useCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    category: '',
    tags: '',
    isAvailable: true,
    metadata: { calories: '', spiceLevel: 'medium' },
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchItem = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/items/${itemId}?t=${Date.now()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch item data');
        const data = await res.json();
        const item = data.item;
        setFormData({
          name: item.name || '',
          description: item.description || '',
          price: item.price || '',
          currency: item.currency || 'INR',
          category: item.category || '',
          tags: (item.tags || []).join(', '),
          isAvailable: item.isAvailable !== false,
          metadata: {
            calories: item.metadata?.calories || '',
            spiceLevel: item.metadata?.spiceLevel || 'medium',
          },
        });
        setImages(item.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId, isEditMode]);

  const handleChange = (field) => (event) => {
    const value = field === 'isAvailable' ? event.target.checked : event.target.value;
    if (field === 'metadata') return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: event.target.value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) { setError('Login required'); setLoading(false); return; }

    const body = {
      shop: shopId,
      name: formData.name,
      description: formData.description,
      price: formData.price,
      currency: formData.currency,
      category: formData.category,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isAvailable: formData.isAvailable,
      metadata: {
        calories: formData.metadata.calories,
        spiceLevel: formData.metadata.spiceLevel,
      },
      images,
    };

    try {
      const url = isEditMode ? `/api/items/${itemId}` : '/api/items';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'add'} food item`);
      navigate('/');
    } catch (err) {
      setError(err.message);
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
          <span className="material-symbols-outlined text-4xl text-primary">restaurant_menu</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Restaurant Account Required</h1>
        <p className="text-sm text-on-surface-variant/70 max-w-sm">You need a restaurant owner account to add food items.</p>
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
              <span className="material-symbols-outlined text-2xl text-primary">lunch_dining</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">{isEditMode ? 'Edit Food Item' : 'Add Food Item'}</h1>
              <p className="text-xs font-semibold text-on-surface-variant/70 mt-0.5">{isEditMode ? 'Update your food item details' : 'Add a new dish to your menu'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Details */}
          <Card title="🍽️ Food Details">
            <Field label="Item Name" required>
              <input value={formData.name} onChange={handleChange('name')} required placeholder="e.g. Paneer Butter Masala" className="input-field" />
            </Field>
            <Field label="Description">
              <textarea value={formData.description} onChange={handleChange('description')} rows={3} placeholder="Describe the dish, ingredients, and what makes it special..." className="input-field resize-none" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Price (₹)" required>
                <input type="number" step="0.01" min="0" value={formData.price} onChange={handleChange('price')} required placeholder="e.g. 249" className="input-field" />
              </Field>
              <Field label="Category">
                <input value={formData.category} onChange={handleChange('category')} placeholder="e.g. Main Course" className="input-field" />
              </Field>
            </div>
            <Field label="Tags (comma separated)">
              <input value={formData.tags} onChange={handleChange('tags')} placeholder="e.g. paneer, curry, north-indian, bestseller" className="input-field" />
            </Field>
          </Card>

          {/* Nutrition */}
          <Card title="🔥 Nutrition & Spice">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Calories (kcal)">
                <input type="number" min="0" value={formData.metadata.calories} onChange={handleMetadataChange('calories')} placeholder="e.g. 350" className="input-field" />
              </Field>
              <Field label="Spice Level">
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {spiceLevels.map(({ value, label, emoji }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${
                        formData.metadata.spiceLevel === value
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="spiceLevel"
                        value={value}
                        checked={formData.metadata.spiceLevel === value}
                        onChange={handleMetadataChange('spiceLevel')}
                        className="hidden"
                      />
                      <span className="text-sm">{emoji}</span>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          {/* Images */}
          <Card title="📸 Images">
            <Field label="Food Photos">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <ImageUpload
                    key={i}
                    variant="item"
                    value={url}
                    folder="blitzbite/items"
                    onUpload={(newUrl) => {
                      const updated = [...images];
                      updated[i] = newUrl;
                      setImages(updated);
                    }}
                    onRemove={() => setImages(images.filter((_, idx) => idx !== i))}
                  />
                ))}
                {images.length < 5 && (
                  <ImageUpload
                    variant="item"
                    folder="blitzbite/items"
                    onUpload={(url) => setImages([...images, url])}
                  />
                )}
              </div>
              {images.length > 0 && (
                <p className="text-[10px] text-on-surface-variant/50 font-bold mt-1">
                  {images.length} / 5 image{images.length !== 1 ? 's' : ''} uploaded
                </p>
              )}
            </Field>
          </Card>

          {/* Availability */}
          <Card title="⚙️ Availability">
            <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-outline-variant/30 hover:bg-surface-container transition-all cursor-pointer">
              <div>
                <span className="text-sm font-extrabold text-on-surface">Available for ordering</span>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Customers can see and order this item</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={handleChange('isAvailable')}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>
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
                {isEditMode ? 'Updating Item...' : 'Adding Item...'}
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">{isEditMode ? 'save' : 'add_circle'}</span>
                {isEditMode ? 'Update Food Item' : 'Add Food Item'}
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
