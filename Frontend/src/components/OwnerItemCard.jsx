import { Link } from 'react-router-dom';

export default function OwnerItemCard({ item }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {item.images?.[0] && (
        <img
          src={item.images[0]}
          alt={item.name}
          style={{ width: '100%', height: 180, objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 8px' }}>{item.name}</h3>
        <p style={{ margin: '0 0 8px', color: '#555' }}>{item.description || 'No description available.'}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Price:</strong> ₹{item.price.toFixed(2)}</p>
        <p style={{ margin: '0 0 8px' }}><strong>Category:</strong> {item.category || 'General'}</p>
        <p style={{ margin: '0 0 12px', color: item.isAvailable ? 'green' : 'red' }}>
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </p>
        {item.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {item.tags.map((tag) => (
              <span key={tag} style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link to={`/shop/${item.shop}/add-food`} style={{ color: '#0366d6', fontWeight: 600 }}>
          Edit item
        </Link>
      </div>
    </div>
  );
}
