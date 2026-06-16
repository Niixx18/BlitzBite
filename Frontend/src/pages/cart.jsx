import { useEffect, useMemo, useState } from 'react';
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
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (user?.id || user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const handleQuantity = (itemId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateCartItem({ itemId, quantity }));
  };

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    await dispatch(removeCartItem(itemId));
    setRemovingId(null);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, ci) => {
      return sum + Number(ci.item?.price || 0) * Number(ci.quantity || 0);
    }, 0);
    const deliveryFee = subtotal > 0 && subtotal < 499 ? 39 : 0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + deliveryFee + tax;
    return { subtotal, deliveryFee, tax, totalAmount };
  }, [items]);

  // ── Loading state ──────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">restaurant</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading your cart...</div>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary">lock</span>
        </div>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Sign in to view your cart</h1>
        <p className="text-sm text-on-surface-variant/70 max-w-sm">
          Your cart items are saved to your account. Sign in to continue shopping.
        </p>
        <Link
          to="/signin"
          className="bg-primary text-on-primary font-bold text-sm px-8 py-3 rounded-full shadow-md hover:bg-primary-container hover:shadow-lg transition-all active:scale-[0.97]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────
  if (items.length === 0 && status !== 'loading') {
    return (
      <div className="min-h-screen bg-background pt-24 pb-20 font-sans">
        <div className="max-w-2xl mx-auto px-4 md:px-margin-desktop">
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">

            {/* Animated empty cart illustration */}
            <div className="relative animate-fade-in-up">
              <div className="w-36 h-36 rounded-full bg-linear-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-primary/40 font-extralight">
                  shopping_cart
                </span>
              </div>
              {/* Floating sparkle dots */}
              <span className="absolute top-2 right-4 w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
              <span className="absolute bottom-6 left-2 w-2 h-2 rounded-full bg-primary/20 animate-pulse delay-300" />
              <span className="absolute top-10 -left-2 w-2.5 h-2.5 rounded-full bg-primary/15 animate-pulse delay-700" />
            </div>

            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h1 className="text-3xl font-black text-on-surface tracking-tight">Your cart is empty</h1>
              <p className="text-sm text-on-surface-variant/70 max-w-md leading-relaxed">
                Looks like you haven't added anything yet. Browse our restaurants and discover delicious meals waiting for you!
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link
                to="/"
                className="bg-primary text-on-primary font-black text-sm px-8 py-3.5 rounded-full shadow-md hover:bg-primary-container hover:shadow-lg transition-all active:scale-[0.97] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                Browse Restaurants
              </Link>
              <Link
                to="/search"
                className="text-primary font-bold text-sm px-6 py-3 rounded-full border-2 border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Search Food
              </Link>
            </div>

            {/* Fun suggestions */}
            <div className="pt-6 border-t border-outline-variant/20 w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider mb-4">Popular cravings</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['🍔 Burgers', '🍕 Pizza', '🍜 Noodles', '🍱 Thali', '🧁 Desserts', '☕ Coffee'].map((tag) => (
                  <Link
                    key={tag}
                    to="/search"
                    className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-3.5 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cart with items ────────────────────────────────────────────────
  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors mb-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Your Cart</h1>
            <p className="text-xs font-semibold text-on-surface-variant/70 mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} ready to order
            </p>
          </div>
          <div className="bg-primary-container/10 border border-primary/20 text-primary font-black text-xl px-5 py-2.5 rounded-2xl w-fit shadow-sm">
            ₹{totals.totalAmount.toFixed(2)}
          </div>
        </div>

        {status === 'loading' && items.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-28 h-24 rounded-2xl bg-surface-container-high shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-surface-container-high rounded-lg w-2/3" />
                    <div className="h-3 bg-surface-container-high rounded-lg w-1/2" />
                    <div className="h-3 bg-surface-container-high rounded-lg w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((ci) => {
              const itemId = ci.item?._id;
              const isRemoving = removingId === itemId;
              const isAvailable = ci.item?.isAvailable !== false;
              return (
                <div
                  key={itemId || ci._id}
                  className={`bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 transition-all duration-300 ${
                    isRemoving ? 'opacity-40 scale-[0.98]' : !isAvailable ? 'opacity-60 border-rose-200' : 'opacity-100'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Item image */}
                    {ci.item?.images?.[0] ? (
                      <img
                        src={ci.item.images[0]}
                        alt={ci.item.name}
                        className="w-28 h-24 md:w-36 md:h-28 object-cover rounded-2xl shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="w-28 h-24 md:w-36 md:h-28 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">restaurant</span>
                      </div>
                    )}

                    {/* Item info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-sm md:text-base text-on-surface leading-tight truncate">
                          {ci.item?.name || 'Unknown item'}
                        </h3>
                        {!isAvailable && (
                          <span className="text-rose-500 text-[10px] font-black uppercase tracking-wider block mt-1">
                            ⚠️ Out of Stock
                          </span>
                        )}
                        {ci.item?.description && (
                          <p className="text-xs text-on-surface-variant/60 mt-0.5 line-clamp-1">
                            {ci.item.description}
                          </p>
                        )}
                        <p className="text-[11px] font-bold text-on-surface-variant/50 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">storefront</span>
                          {ci.item?.shop?.name || 'Restaurant'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-0 bg-surface-container-high rounded-xl overflow-hidden border border-outline-variant/30">
                          <button
                            type="button"
                            onClick={() => handleQuantity(itemId, ci.quantity - 1)}
                            disabled={ci.quantity <= 1 || status === 'loading'}
                            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">remove</span>
                          </button>
                          <span className="w-10 text-center text-sm font-black text-on-surface select-none">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantity(itemId, ci.quantity + 1)}
                            disabled={status === 'loading' || !isAvailable}
                            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">add</span>
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-black text-base text-primary whitespace-nowrap">
                          ₹{(Number(ci.item?.price || 0) * ci.quantity).toFixed(2)}
                        </span>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(itemId)}
                          disabled={isRemoving}
                          className="ml-auto w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant/50 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer group"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Free delivery nudge */}
            {totals.subtotal > 0 && totals.subtotal < 499 && (
              <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up">
                <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
                <div>
                  <p className="text-xs font-extrabold text-on-surface">
                    Add ₹{(499 - totals.subtotal).toFixed(0)} more for <span className="text-primary">FREE delivery!</span>
                  </p>
                  <div className="mt-1.5 h-1.5 bg-surface-container-high rounded-full overflow-hidden w-48">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((totals.subtotal / 499) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary (sticky on desktop) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-on-surface select-none pb-2 border-b border-outline-variant/10">
                🛍️ Order Summary
              </h2>

              {/* Line items */}
              <div className="space-y-2.5 text-xs">
                <SummaryRow label="Items Subtotal" value={`₹${totals.subtotal.toFixed(2)}`} />
                <SummaryRow
                  label="Delivery"
                  value={totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee.toFixed(2)}`}
                  highlight={totals.deliveryFee === 0}
                />
                <SummaryRow label="GST (5%)" value={`₹${totals.tax.toFixed(2)}`} />
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                <span className="font-black text-base text-on-surface">Total</span>
                <span className="font-black text-xl text-primary">₹{totals.totalAmount.toFixed(2)}</span>
              </div>

              {/* Checkout CTA */}
              {items.some((ci) => ci.item?.isAvailable === false) ? (
                <button
                  disabled
                  className="w-full mt-2 bg-surface-container-high text-on-surface-variant/40 font-black text-sm px-4 py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Remove Out of Stock Items to Checkout
                </button>
              ) : (
                <Link
                  to="/checkout"
                  id="checkout-btn"
                  className="w-full mt-2 bg-primary-container text-white font-black text-sm px-4 py-4 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 no-underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
                  Proceed to Checkout
                </Link>
              )}

              <p className="text-center text-[10px] text-on-surface-variant/55 leading-relaxed">
                Secure payment via Razorpay or Cash on Delivery
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-5 text-on-surface-variant/40">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-xl">local_shipping</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Fast</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-xl">support_agent</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Support</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center text-on-surface-variant/80">
      <span>{label}</span>
      <span className={`font-extrabold ${highlight ? 'text-green-600' : 'text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}
