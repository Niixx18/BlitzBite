import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [devResetURL, setDevResetURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevResetURL(null);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      
      setMessage(data.message || 'Check your email for reset instructions');
      if (data.resetURL) {
        setDevResetURL(data.resetURL);
      }
      showToast('Reset email sent successfully! 📧');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (devResetURL) {
      navigator.clipboard.writeText(devResetURL);
      setCopied(true);
      showToast('Link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2000);
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
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-fixed-dim/20 flex items-center justify-center text-primary mb-2 animate-pulse-soft">
                <span className="material-symbols-outlined text-3xl font-bold">lock_reset</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Forgot Password</h2>
              <p className="text-xs text-on-surface-variant/70 font-semibold leading-relaxed">
                Enter your registered email address and we'll send you instructions to reset your password.
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white font-black text-xs md:text-sm px-4 py-3.5 rounded-xl hover:bg-primary shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center space-y-6 animate-slide-up">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <span className="material-symbols-outlined text-3xl font-bold">mail</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Check your email</h2>
              <p className="text-xs text-on-surface-variant/70 font-semibold leading-relaxed">
                We've sent a password reset link to:
                <br />
                <strong className="text-on-surface font-bold text-sm block mt-1">{email}</strong>
              </p>
              <p className="text-[10px] text-on-surface-variant/50 font-medium pt-1">
                Please follow the instructions in the email to set a new password.
              </p>
            </div>

            {/* Dev helper Reset URL */}
            {devResetURL && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-left space-y-2.5 animate-slide-in">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm font-bold">terminal</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">Dev Mode Helper</span>
                </div>
                <p className="text-[10px] font-medium leading-relaxed">
                  In production, this link is emailed. In local development, you can use the button below:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={devResetURL}
                    className="flex-1 bg-emerald-600 text-white font-bold text-[10px] py-2 px-3 rounded-lg text-center hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Open Reset Link
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 bg-white border border-emerald-300 text-emerald-700 font-bold text-[10px] py-2 px-3 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">{copied ? 'done' : 'content_copy'}</span>
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-xs text-primary font-bold hover:underline transition-all cursor-pointer"
            >
              Didn't get the email? Try again
            </button>
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
