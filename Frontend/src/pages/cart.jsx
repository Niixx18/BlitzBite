import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  selectCartItems,
  selectCartStatus,
  selectCartError
} from '../features/cart/cartSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function CartPage() {
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useCurrentUser();
  const items = useSelector(selectCartItems);
  const status = useSelector(selectCartStatus);
  const error = useSelector(selectCartError);

  useEffect(() => {
    if (user?.id || user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const handleChange = (itemId, quantity) => {
    dispatch(updateCartItem({ itemId, quantity }));
  };

  const handleRemove = (itemId) => {
    dispatch(removeCartItem(itemId));
  };

  const total = items.reduce((sum, cartItem) => {
    const price = Number(cartItem.item?.price || 0);
    return sum + price * cartItem.quantity;
  }, 0);

  if (userLoading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Your Cart</h1>
        <p>Please <Link to="/signin">sign in</Link> to view your cart.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Your Cart</h1>
      {status === 'loading' && <p>Loading cart...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {items.length === 0 && status !== 'loading' ? (
        <div>
          <p>Your cart is empty.</p>
          <Link to="/">Browse shops</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {items.map((cartItem) => (
            <div key={cartItem.item?._id || cartItem._id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {cartItem.item?.images?.[0] && (
                  <img src={cartItem.item.images[0]} alt={cartItem.item.name} style={{ width: 140, height: 110, objectFit: 'cover', borderRadius: 10 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px' }}>{cartItem.item?.name || 'Unknown item'}</h2>
                  <p style={{ margin: 0 }}>{cartItem.item?.description || 'No description provided.'}</p>
                  <p style={{ margin: '8px 0 0' }}><strong>Price:</strong> ₹{Number(cartItem.item?.price || 0).toFixed(2)}</p>
                  <p style={{ margin: '4px 0 0' }}><strong>Shop:</strong> {cartItem.item?.shop?.name || 'Unknown'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label>
                  Quantity:
                  <input
                    type="number"
                    min="1"
                    value={cartItem.quantity}
                    onChange={(e) => handleChange(cartItem.item?._id, Number(e.target.value))}
                    style={{ width: 64, marginLeft: 8 }}
                  />
                </label>
                <button type="button" onClick={() => handleRemove(cartItem.item?._id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div style={{ padding: 18, border: '1px solid #ddd', borderRadius: 12, background: '#f9fafb' }}>
            <h3>Total</h3>
            <p style={{ fontSize: 20, margin: 0 }}>₹{total.toFixed(2)}</p>
            <Link
              to="/checkout"
              style={{
                display: 'inline-block',
                marginTop: 14,
                background: '#16a34a',
                color: '#fff',
                padding: '11px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
