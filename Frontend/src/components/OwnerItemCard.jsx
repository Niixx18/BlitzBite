import { Link } from 'react-router-dom';

export default function OwnerItemCard({ item }) {
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
        {/* Availability Badge */}
        <div className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
          item.isAvailable
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-700'
        }`}>
          {item.isAvailable ? 'Available' : 'Unavailable'}
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

        <Link
          to={`/shop/${item.shop}/add-food`}
          className="mt-2 flex items-center justify-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary font-bold text-xs py-2 rounded-xl transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit Item
        </Link>
      </div>
    </div>
  );
}
