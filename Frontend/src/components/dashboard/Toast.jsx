import { useEffect, useState } from 'react';

/**
 * Toast — auto-dismissing toast notification
 * Props:
 *   message  (string)
 *   type     'success'|'error'|'info'
 *   onClose  (fn)
 *   duration (ms, default 3500)
 */
export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      icon: 'check_circle',
    },
    error: {
      bg: 'bg-rose-50 border-rose-300 text-rose-700',
      icon: 'error',
    },
    info: {
      bg: 'bg-blue-50 border-blue-300 text-blue-700',
      icon: 'info',
    },
  }[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-xs font-bold max-w-sm transition-all duration-300 ${config.bg} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <span className="material-symbols-outlined text-base select-none">{config.icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}

/**
 * useToast — helper hook for managing toast state
 * Returns: { toast, showToast, clearToast }
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, key: Date.now() });
  };

  const clearToast = () => setToast(null);

  return { toast, showToast, clearToast };
}
