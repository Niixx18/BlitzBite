import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';

export default function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 'password' or 'otp'
  const [loginMethod, setLoginMethod] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Method 1 Form State
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Method 2 Form State (OTP)
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Submit Password-based Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Detect if input is phone (10-digit number) or email
    const isPhone = /^\d{10}$/.test(phoneOrEmail.trim());
    const payload = isPhone 
      ? { phone: phoneOrEmail.trim(), password }
      : { email: phoneOrEmail.trim().toLowerCase(), password };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      showToast('Logged in successfully! 🚀');

      setTimeout(() => {
        if (data.user.userType === 'restaurant') navigate('/');
        else if (data.user.userType === 'delivery') navigate('/delivery-orders');
        else navigate('/');
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Send OTP Request
  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(otpPhone)) {
      setError('Please provide a valid 10-digit phone number.');
      return;
    }
    setOtpLoading(true);
    setError(null);
    setDevOtp('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      setOtpSent(true);
      showToast('OTP sent successfully! 💬');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Submit OTP Verification and Login
  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP Verification failed');

      localStorage.setItem('token', data.token);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      showToast('OTP verified! Welcome back. 🎉');

      setTimeout(() => {
        if (data.user.userType === 'restaurant') navigate('/');
        else if (data.user.userType === 'delivery') navigate('/delivery-orders');
        else navigate('/');
      }, 500);
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

      {/* Card container */}
      <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-[32px] p-8 md:p-10 max-w-md w-full shadow-lg space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Welcome Back</h2>
          <p className="text-xs text-on-surface-variant/70 font-semibold">
            Choose your login option below to access your account.
          </p>
        </div>

        {/* Tab selector */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-1 flex gap-1 shadow-sm">
          <button
            onClick={() => { setLoginMethod('password'); setError(null); }}
            className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
              loginMethod === 'password'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Password Login
          </button>
          <button
            onClick={() => { setLoginMethod('otp'); setError(null); }}
            className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
              loginMethod === 'otp'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-slide-in">
            <span className="material-symbols-outlined text-sm font-bold shrink-0 mt-0.5">warning</span>
            <span>{error}</span>
          </div>
        )}

        {/* Method 1: Password Form */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Phone or Email</span>
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="e.g. 9876543210 or user@example.com"
                className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all"
              />
            </label>

            <label className="grid gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Password</span>
                <Link to="/forgot-password" className="text-[10px] font-bold text-primary hover:text-primary-container transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* Method 2: OTP Login Form */}
        {loginMethod === 'otp' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Phone Number</span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      disabled={otpSent || otpLoading}
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210 (10 digits)"
                      className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !/^\d{10}$/.test(otpPhone)}
                      className="bg-primary text-on-primary font-bold text-xs px-4 rounded-xl shadow-sm hover:bg-primary-container disabled:bg-surface-container-high disabled:text-on-surface-variant/40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </label>

              {/* Dev OTP helper display */}
              {devOtp && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-slide-in">
                  <span>🔑 Dev Mode OTP: <strong className="text-sm font-black">{devOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtp)}
                    className="text-[10px] bg-emerald-700 text-white font-extrabold px-2 py-1 rounded hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
              )}
            </div>

            {/* OTP Code Entry & Login Trigger (Shown after OTP is sent) */}
            {otpSent && (
              <form onSubmit={handleOtpVerifySubmit} className="space-y-4 animate-slide-in">
                <label className="grid gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">Verification OTP</span>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setDevOtp(''); }}
                      className="text-[10px] font-bold text-primary hover:text-primary-container transition-colors cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-surface-container-high border-2 border-transparent focus:border-primary focus:bg-white rounded-xl py-2.5 px-4 text-sm text-on-surface font-semibold placeholder:text-on-surface-variant/30 outline-none transition-all tracking-widest text-center text-lg"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-primary-container text-white font-black text-xs md:text-sm px-4 py-3.5 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:bg-surface-container-high disabled:text-on-surface-variant/40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Link */}
        <p className="text-center text-xs font-semibold text-on-surface-variant/75 pt-2 border-t border-outline-variant/10">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-bold hover:text-primary-container transition-colors">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}