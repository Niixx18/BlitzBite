import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      
      localStorage.setItem('token', data.token);
      setMessage('Password reset successful! Redirecting...');
      showToast('Password reset successful! 🎉');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pt-24 pb-20 flex items-center justify-center font-sans px-4">
      {/* Toast notification */}
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
        
        {!message ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-fixed-dim/20 flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-3xl font-bold animate-pulse-soft">lock</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Reset Password</h2>
              <p className="text-xs text-on-surface-variant/70 font-semibold leading-relaxed">
                Please enter and confirm your new password below.
              </p>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-slide-in">
                <span className="material-symbols-outlined text-sm font-bold shrink-0 mt-0.5">warning</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-wider">New Password</span>
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
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                    <span>Reset Password</span>
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="text-center space-y-4 animate-slide-up py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <span className="material-symbols-outlined text-3xl font-bold">published_with_changes</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Success!</h2>
            <p className="text-xs text-on-surface-variant/70 font-semibold">
              {message}
            </p>
            <div className="flex justify-center pt-2">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
          </div>
        )}

        {/* Footer Link */}
        <p className="text-center text-xs font-semibold text-on-surface-variant/75 pt-2 border-t border-outline-variant/10">
          <Link to="/signin" className="inline-flex items-center gap-1.5 text-primary font-bold hover:text-primary-container transition-colors">
            <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
            <span>Back to Sign In</span>
          </Link>
        </p>

      </div>
    </div>
  );
}
