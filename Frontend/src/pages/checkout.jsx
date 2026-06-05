import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  clearCartState,
  fetchCart,
  selectCartError,
  selectCartItems,
  selectCartStatus
} from '../features/cart/cartSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';

// ── Load Razorpay checkout script lazily ─────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const items = useSelector(selectCartItems);
  const cartStatus = useSelector(selectCartStatus);
  const cartError = useSelector(selectCartError);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    paymentMethod: 'razorpay',
    notes: '',
  });

  useEffect(() => {
    if (user?.id || user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  // Pre-fill address from user profile on first load
  const [addressPrefilled, setAddressPrefilled] = useState(false);
  useEffect(() => {
    if ((user?.id || user?._id) && !addressPrefilled && user.address) {
      const timer = setTimeout(() => {
        setAddressPrefilled(true);
        setForm((cur) => ({
          ...cur,
          street: cur.street || user.address?.street || '',
          city: cur.city || user.address?.city || '',
          state: cur.state || user.address?.state || '',
          zipCode: cur.zipCode || user.address?.zipCode || '',
          country: cur.country || user.address?.country || 'India',
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user, addressPrefilled]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, ci) => {
      return sum + Number(ci.item?.price || 0) * Number(ci.quantity || 0);
    }, 0);
    const deliveryFee = subtotal > 0 && subtotal < 499 ? 39 : 0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + deliveryFee + tax;
    return { subtotal, deliveryFee, tax, totalAmount };
  }, [items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((cur) => ({ ...cur, [name]: value }));
  };

  const deliveryAddress = useMemo(() => ({
    street: form.street,
    city: form.city,
    state: form.state,
    zipCode: form.zipCode,
    country: form.country,
  }), [form.street, form.city, form.state, form.zipCode, form.country]);

  // ── COD payment ──────────────────────────────────────────────────
  const handleCodSubmit = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryAddress, paymentMethod: form.paymentMethod, notes: form.notes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || 'Order checkout failed');
    }
    dispatch(clearCartState());
    setSuccess(true);
  }, [deliveryAddress, form.paymentMethod, form.notes, dispatch]);

  // ── Razorpay payment ──────────────────────────────────────────────────────
  const handleRazorpaySubmit = useCallback(async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Failed to load Razorpay SDK. Check your internet connection.');

    const token = localStorage.getItem('token');

    // Step 1: Create a Razorpay order on our backend
    const orderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.message || 'Failed to initiate payment');

    const { razorpayOrderId, amount, currency, key } = orderData;

    // Step 2: Open Razorpay checkout popup
    return new Promise((resolve, reject) => {
      const options = {
        key,
        amount,
        currency,
        name: 'BlitzBite',
        description: 'Food Order Payment',
        order_id: razorpayOrderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
          contact: user?.phone ? `+91${user.phone}` : '',
        },
        theme: { color: '#ff5c00' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
        },
        handler: async (response) => {
          try {
            // Step 3: Verify signature and create order in our DB
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                deliveryAddress,
                notes: form.notes,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) return reject(new Error(verifyData.message || 'Payment verification failed'));
            dispatch(clearCartState());
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  }, [user, deliveryAddress, form.notes, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (items.length === 0) { setSubmitError('Your cart is empty.'); return; }

    setSubmitting(true);
    try {
      if (form.paymentMethod === 'razorpay') {
        await handleRazorpaySubmit();
      } else {
        await handleCodSubmit();
      }
      setSuccess(true);
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') {
        setSubmitError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24">
        <span className="material-symbols-outlined text-5xl text-primary animate-spin">restaurant</span>
        <div className="text-on-surface-variant font-semibold mt-4">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 font-light">lock</span>
        <h2 className="text-2xl font-extrabold text-on-surface">Sign in to checkout</h2>
        <Link to="/signin" className="bg-primary text-on-primary font-bold text-sm px-6 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-24">
        <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] p-8 md:p-12 text-center max-w-md w-full shadow-lg space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-on-surface">Order Placed Successfully!</h1>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
              Your delicious order is confirmed and sent to the kitchen. Get ready to blitz!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="bg-primary-container hover:bg-primary text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/35 text-on-surface font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop space-y-8">
        
        {/* Back Link */}
        <div>
          <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Cart
          </Link>
        </div>

        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Checkout</h1>
            <p className="text-xs font-semibold text-on-surface-variant/70 mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          <div className="bg-primary-container/10 border border-primary/20 text-primary font-black text-xl px-5 py-2.5 rounded-2xl w-fit shadow-sm">
            ₹{totals.totalAmount.toFixed(2)}
          </div>
        </div>

        {cartStatus === 'loading' && <p className="text-on-surface-variant text-xs">Loading order details...</p>}
        {cartError && <p className="text-error text-xs font-bold">⚠️ {cartError}</p>}

        {items.length === 0 && cartStatus !== 'loading' ? (
          <div className="text-center py-20 border border-outline-variant/35 rounded-[24px] bg-surface-container-lowest p-6 space-y-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 font-light">shopping_basket</span>
            <h2 className="text-xl font-bold text-on-surface">Your cart is empty</h2>
            <Link to="/" className="inline-block bg-primary text-on-primary font-bold text-xs px-6 py-2.5 rounded-full shadow hover:bg-primary-container transition-all">
              Browse Shops
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Address & Payment options) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Delivery Address Section */}
              <Section title="📍 Delivery Address">
                <div className="grid grid-cols-1 gap-4">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Street Address</span>
                    <input
                      required
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder="e.g. 123 Main St, Apartment 4B"
                      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">City</span>
                      <input
                        required
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="e.g. Patna"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">State</span>
                      <input
                        required
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="e.g. Bihar"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">ZIP Code</span>
                      <input
                        required
                        name="zipCode"
                        value={form.zipCode}
                        onChange={handleChange}
                        placeholder="e.g. 800001"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Country</span>
                      <input
                        required
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                  </div>
                </div>
              </Section>

              {/* Payment Method Section */}
              <Section title="💳 Payment Options">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'razorpay', label: '🏦 Online Payment (Razorpay - Card/UPI/Wallets)', recommended: true },
                    { value: 'cod', label: '💵 Cash on Delivery (COD)', recommended: false },
                  ].map(({ value, label, recommended }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                        form.paymentMethod === value
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-surface border-outline-variant/35 text-on-surface-variant/80 hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={value}
                        checked={form.paymentMethod === value}
                        onChange={handleChange}
                        className="accent-primary w-4.5 h-4.5 cursor-pointer shrink-0"
                      />
                      <span className={`text-xs md:text-sm font-extrabold leading-none ${
                        form.paymentMethod === value ? 'text-on-surface' : ''
                      }`}>
                        {label}
                      </span>
                      {recommended && (
                        <span className="ml-auto bg-primary text-on-primary font-black text-[9px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {form.paymentMethod === 'razorpay' && (
                  <div className="mt-4 p-3.5 bg-primary-container/10 border border-primary/20 rounded-xl text-xs text-on-surface-variant leading-relaxed flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-lg select-none">lock</span>
                    <p>
                      Transactions are secured via <strong className="text-primary">Razorpay</strong>. Clicking below opens a secure checkout modal supporting card payments, netbanking, and UPI.
                    </p>
                  </div>
                )}

                {/* Delivery Notes */}
                <label className="grid gap-1.5 mt-5">
                  <span className="text-xs font-extrabold text-on-surface-variant/70 uppercase tracking-wider">Delivery Instructions (Optional)</span>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                    maxLength="500"
                    placeholder="e.g. Ring bell, leave near the security post..."
                    className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all resize-none"
                  />
                </label>
              </Section>
            </div>

            {/* Right Column: Order Summary & Placement */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <Section title="🛍️ Summary">
                
                {/* Items list */}
                <div className="space-y-3 pb-4 border-b border-outline-variant/30">
                  {items.map((ci) => (
                    <div key={ci.item?._id || ci._id} className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-on-surface leading-tight truncate">
                          {ci.item?.name || 'Unknown item'}
                        </p>
                        <p className="text-[10px] font-bold text-on-surface-variant/60 mt-0.5">
                          Qty: {ci.quantity} × ₹{Number(ci.item?.price || 0)}
                        </p>
                      </div>
                      <span className="font-extrabold text-xs text-on-surface whitespace-nowrap">
                        ₹{(Number(ci.item?.price || 0) * Number(ci.quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculations details */}
                <div className="space-y-2 pt-2.5 pb-4 border-b border-outline-variant/30 text-xs">
                  <Row label="Items Subtotal" value={`₹${totals.subtotal.toFixed(2)}`} />
                  <Row label="Delivery Charge" value={totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee.toFixed(2)}`} />
                  <Row label="GST (5%)" value={`₹${totals.tax.toFixed(2)}`} />
                </div>

                {/* Final Total Amount */}
                <div className="flex justify-between items-center font-black text-base md:text-lg text-on-surface pt-3.5">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{totals.totalAmount.toFixed(2)}</span>
                </div>

                {submitError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold">
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Place Order CTA Button */}
                <button
                  id="place-order-btn"
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full mt-6 bg-primary-container text-white font-black text-xs md:text-sm px-4 py-4 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Processing...</span>
                    </span>
                  ) : form.paymentMethod === 'razorpay' ? (
                    '🔒 Pay and Confirm'
                  ) : (
                    'Confirm COD Order'
                  )}
                </button>

                <p className="text-center text-[10px] text-on-surface-variant/65 mt-3 leading-relaxed">
                  {form.paymentMethod === 'razorpay'
                    ? 'Payment is handled securely via the Razorpay gateway overlay.'
                    : 'Amount is payable in cash/digital transfer at time of delivery.'}
                </p>
              </Section>
            </aside>

          </form>
        )}
      </div>
    </div>
  );
}

// ─── Small helper sub-components ───────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
      <h2 className="text-base font-black text-on-surface select-none pb-2 border-b border-outline-variant/10">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-on-surface-variant/80">
      <span>{label}</span>
      <span className="font-extrabold text-on-surface">{value}</span>
    </div>
  );
}
