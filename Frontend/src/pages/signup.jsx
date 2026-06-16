import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';

export default function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [step, setStep] = useState(1); // 1 or 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Step 1 State
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 Common State
  const [role, setRole] = useState('customer'); // 'customer', 'restaurant', 'delivery'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 Role-Specific State
  // Customer
  const [customerImage, setCustomerImage] = useState('');
  
  // Kitchen Owner
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenAddress, setKitchenAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [kitchenImage, setKitchenImage] = useState('');

  // Delivery Boy
  const [vehicleType, setVehicleType] = useState('Motorcycle'); // Default
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [riderImage, setRiderImage] = useState('');

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Validate Step 1 and proceed
  const handleNextStep = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Check if phone number is already registered
      const res = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Validation failed');

      setStep(2);
      showToast('Phone number verified! Proceed to role setup.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit final registration details
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    // Split Name into First and Last Name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build Payload
    const payload = {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone,
      password,
      userType: role,
    };

    if (role === 'customer') {
      payload.profilePhoto = customerImage.trim() || null;
    } else if (role === 'restaurant') {
      if (!kitchenName.trim()) {
        setError('Kitchen Name is required.');
        return;
      }
      if (!kitchenAddress.trim()) {
        setError('Kitchen Address is required.');
        return;
      }
      payload.kitchenName = kitchenName.trim();
      payload.kitchenAddress = kitchenAddress.trim();
      payload.businessDescription = businessDescription.trim();
      payload.kitchenImage = kitchenImage.trim() || null;
    } else if (role === 'delivery') {
      if (!vehicleNumber.trim()) {
        setError('Vehicle Number is required.');
        return;
      }
      payload.vehicleType = vehicleType;
      payload.vehicleNumber = vehicleNumber.trim().toUpperCase();
      payload.profilePhoto = riderImage.trim() || null;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('token', data.token);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      showToast('Account registered successfully! 🎉');

      // Route according to userType
      setTimeout(() => {
        if (role === 'restaurant') navigate('/');
        else if (role === 'delivery') navigate('/delivery-orders');
        else navigate('/');
      }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 flex items-center justify-center font-sans px-4">
      {/* ── Toast notification ─────────────────────────── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-md font-bold text-sm text-white transition-all duration-300 animate-slide-in ${
          toast.type === 'error' ? 'bg-error' : 'bg-emerald-600'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Card Wrapper */}
      <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] p-6 md:p-10 max-w-xl w-full shadow-lg space-y-6">
        
        {/* Header Title & Steps indicator */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Create Account</h2>
          <div className="flex justify-center items-center gap-2 text-xs font-bold text-on-surface-variant/60">
            <span className={`px-2 py-0.5 rounded-md ${step === 1 ? 'bg-primary text-white' : 'bg-surface-container'}`}>Step 1: Phone</span>
            <span className="material-symbols-outlined text-sm font-bold text-on-surface-variant/40">arrow_forward</span>
            <span className={`px-2 py-0.5 rounded-md ${step === 2 ? 'bg-primary text-white' : 'bg-surface-container'}`}>Step 2: Profile</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-slide-in">
            <span className="material-symbols-outlined text-sm font-bold shrink-0 mt-0.5">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Phone Verification & Password */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Phone Number</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 9876543210 (10 digits)"
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Password (Min 6 chars)</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Confirm Password</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-white font-black text-xs md:text-sm px-4 py-3.5 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Role Details Form */}
        {step === 2 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6 animate-slide-in">
            
            {/* Back button to Step 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Go back to Step 1
            </button>

            {/* Role Select Selector Tabs */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider select-none">Choose Your Role</span>
              <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-1 flex flex-col sm:flex-row gap-1 shadow-sm">
                {[
                  { value: 'customer', label: 'Customer', icon: 'person' },
                  { value: 'restaurant', label: 'Kitchen Owner', icon: 'restaurant' },
                  { value: 'delivery', label: 'Delivery Rider', icon: 'motorcycle' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => { setRole(item.value); setError(null); }}
                    className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                      role === item.value
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm font-bold select-none">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Common & Prefilled Fields Grid */}
            <div className="space-y-4 pt-3 border-t border-outline-variant/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Phone Number (Prefilled)</span>
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full bg-surface-container border-2 border-transparent rounded-xl py-2.5 px-4 text-sm text-on-surface-variant/60 font-semibold cursor-not-allowed opacity-75 outline-none"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Password (Prefilled)</span>
                  <input
                    type="password"
                    disabled
                    value="••••••••"
                    className="w-full bg-surface-container border-2 border-transparent rounded-xl py-2.5 px-4 text-sm text-on-surface-variant/60 font-semibold cursor-not-allowed opacity-75 outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Full Name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adarsh Raj"
                    className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Email Address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                  />
                </label>
              </div>
            </div>

            {/* Role-Specific Form Fields */}
            <div className="space-y-4 pt-3 border-t border-outline-variant/10 animate-fade-in">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                {role === 'customer' && 'Customer Profile Details'}
                {role === 'restaurant' && 'Kitchen Details'}
                {role === 'delivery' && 'Delivery Rider Details'}
              </h3>

              {/* A. Customer details */}
              {role === 'customer' && (
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Profile Photo URL (Optional)</span>
                  <input
                    type="url"
                    value={customerImage}
                    onChange={(e) => setCustomerImage(e.target.value)}
                    placeholder="e.g. https://domain.com/my-photo.jpg"
                    className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                  />
                </label>
              )}

              {/* B. Kitchen Owner details */}
              {role === 'restaurant' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Kitchen Name</span>
                      <input
                        type="text"
                        required
                        value={kitchenName}
                        onChange={(e) => setKitchenName(e.target.value)}
                        placeholder="e.g. Bistro Central"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Kitchen Image URL (Optional)</span>
                      <input
                        type="url"
                        value={kitchenImage}
                        onChange={(e) => setKitchenImage(e.target.value)}
                        placeholder="e.g. https://domain.com/bistro.jpg"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Kitchen Address</span>
                    <input
                      type="text"
                      required
                      value={kitchenAddress}
                      onChange={(e) => setKitchenAddress(e.target.value)}
                      placeholder="e.g. 45 Boring Road, Sector 3"
                      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Business Description (Optional)</span>
                    <textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      placeholder="Tell customers about your delicious menu and specialties..."
                      rows="3"
                      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all resize-none"
                    />
                  </label>
                </div>
              )}

              {/* C. Delivery Boy details */}
              {role === 'delivery' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Vehicle Type</span>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-3 text-xs text-on-surface font-bold outline-none cursor-pointer transition-all"
                      >
                        <option value="Motorcycle">Motorcycle / Scooty</option>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Car">Car</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Vehicle Number</span>
                      <input
                        type="text"
                        required
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. MH-12-AB-1234"
                        className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Profile Photo URL (Optional)</span>
                    <input
                      type="url"
                      value={riderImage}
                      onChange={(e) => setRiderImage(e.target.value)}
                      placeholder="e.g. https://domain.com/my-photo.jpg"
                      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* CTA Register Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-white font-black text-xs md:text-sm px-4 py-3.5 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Register & Sign Up'
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <p className="text-center text-xs font-semibold text-on-surface-variant/75 pt-2 border-t border-outline-variant/10">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary font-bold hover:text-primary-container transition-colors">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}