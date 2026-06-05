import { Link } from 'react-router-dom';

export default function FoodCard({
  item,
  showShopLink = false,
  actionLabel,
  onAction,
  className = ''
}) {
  if (!item) return null;

  return (
    <div className={`food-card ${className}`} style={{
      border: '1px solid #ddd',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {item.images?.[0] && (
        <img
          src={item.images[0]}
          alt={item.name}
          style={{ width: '100%', height: 200, objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{item.name}</h3>
          <p style={{ margin: 0, color: '#555' }}>{item.description || 'No description available.'}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>₹{Number(item.price || 0).toFixed(2)}</span>
          <span style={{ color: item.isAvailable ? 'green' : 'red', fontWeight: 600 }}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {item.category && (
            <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
              {item.category}
            </span>
          )}
          {item.tags?.map((tag) => (
            <span key={tag} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
              {tag}
            </span>
          ))}
        </div>

        {showShopLink && item.shop && (
          <Link to={`/shops/${item.shop}`} style={{ color: '#0366d6', fontSize: 14 }}>
            View shop
          </Link>
        )}

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              marginTop: 'auto',
              padding: '10px 16px',
              background: '#0366d6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
