import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Premium reusable Profile Card showing user details, Sign Out action,
 * and a secure two-step Account Deletion flow with clean UI states.
 */
export default function ProfileCard({ user, onLogout }) {
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete account');
      
      // Perform local logout
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem('token');
        navigate('/signin');
      }
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card p-5 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <img
          src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY7bz4y7JB3bftfjsqwmgTpO79CfW26LdufMKVp_ZLqzt9UqjPEB7m-VE01p8r_xoqQeKu8VtnSrs1KB108fsI5ElISaj5h-RClyMKD0aiPdq9cTYLq_nV33iTujtj61WEJ7u4iVH1h1CldupYWOzqvDinDPDH2tnhr1-JE2ZFjdPqceeue-UHlGPzbrc8zIHUmM9zCSxX-Y_y2IaodPCB8N1I-i_DJCISi2YB_SwbEitbZiKLPE3FgvubvwDJiF9RRPLNMOOBzsA'}
          alt={user.firstName}
          className="w-12 h-12 rounded-full border-2 border-outline-variant object-cover shadow-sm"
        />
        <div className="min-w-0">
          <p className="font-black text-sm text-on-surface truncate">{user.firstName} {user.lastName}</p>
          <p className="text-[10px] font-semibold text-on-surface-variant/60 truncate">{user.email}</p>
        </div>
      </div>

      {/* Quick links (only show for customer dashboard context) */}
      {user.userType === 'customer' && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: 'shopping_bag', label: 'My Orders', to: '/orders' },
            { icon: 'favorite', label: 'Favourites', to: '/dashboard' },
            { icon: 'home', label: 'Browse', to: '/' },
            { icon: 'shopping_cart', label: 'Cart', to: '/cart' },
          ].map(({ icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all text-center group"
            >
              <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary transition-colors select-none">{icon}</span>
              <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-primary transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all border border-rose-100 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        Sign Out
      </button>

      {/* Delete Account */}
      <div className="border-t border-outline-variant/10 pt-4 mt-2">
        {deleteConfirm ? (
          <div className="space-y-2">
            <p className="text-[10px] text-rose-600 font-extrabold text-center leading-tight">
              ⚠️ This will permanently delete your account, shops, and menu items.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-xs">delete_forever</span>
                {loading ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant/60 hover:text-rose-600 hover:bg-rose-50/50 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_remove</span>
            Delete Account
          </button>
        )}
        {error && <p className="text-[9px] font-bold text-rose-600 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
