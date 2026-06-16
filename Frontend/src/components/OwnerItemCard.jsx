import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function OwnerItemCard({ item, onDelete }) {
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      if (res.ok) {
        setIsAvailable(!isAvailable);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/items/${item._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        onDelete?.(item._id);
      } else {
        alert('Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="dashboard-card overflow-hidden flex flex-col group">
      {/* Image */}
      <div className="relative h-40 bg-surface-container overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 select-none font-light">
              restaurant_menu
            </span>
          </div>
        )}
        {/* Delete Button Overlay */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-3 left-3 bg-rose-600/90 hover:bg-rose-700 hover:scale-105 text-white w-7 h-7 rounded-md flex items-center justify-center backdrop-blur-md border border-rose-500/30 transition-all cursor-pointer shadow-md disabled:opacity-50 z-10"
          title="Delete Item"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
        {/* Availability Badge */}
        <div className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
          isAvailable
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-700'
        }`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-extrabold text-sm text-on-surface leading-tight line-clamp-2 flex-1">
            {item.name}
          </h3>
          <span className="font-black text-sm text-primary shrink-0">
            ₹{item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p className="text-xs text-on-surface-variant/70 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
          {item.category && (
            <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2.5 py-1 rounded-full">
              {item.category}
            </span>
          )}
          {item.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-primary/8 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <Link
            to={`/shop/${item.shop?._id || item.shop}/food/${item._id}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-bold text-xs py-2 rounded-xl transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </Link>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`flex-1 flex items-center justify-center gap-1.5 font-bold text-xs py-2 rounded-xl transition-all border cursor-pointer ${
              isAvailable
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isAvailable ? 'block' : 'check_circle'}
            </span>
            {toggling ? 'Updating...' : isAvailable ? 'Out of Stock' : 'Available'}
          </button>
        </div>
      </div>
    </div>
  );
}
