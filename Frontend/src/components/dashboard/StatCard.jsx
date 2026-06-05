/**
 * StatCard — reusable dashboard metric card
 * Props:
 *   icon       (string)  Material Symbol icon name
 *   label      (string)  small uppercase label
 *   value      (string|number) primary metric value
 *   subLabel   (string)  optional secondary line
 *   accent     (string)  one of: 'primary'|'green'|'blue'|'amber'|'rose'|'indigo'
 *   loading    (bool)
 */
const ACCENT_MAP = {
  primary: {
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    icon: 'bg-primary/15 text-primary',
    value: 'text-on-surface',
  },
  green: {
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/15 text-emerald-700',
    value: 'text-on-surface',
  },
  blue: {
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/20',
    icon: 'bg-blue-500/15 text-blue-700',
    value: 'text-on-surface',
  },
  amber: {
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    icon: 'bg-amber-500/15 text-amber-700',
    value: 'text-on-surface',
  },
  rose: {
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/20',
    icon: 'bg-rose-500/15 text-rose-700',
    value: 'text-on-surface',
  },
  indigo: {
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/20',
    icon: 'bg-indigo-500/15 text-indigo-700',
    value: 'text-on-surface',
  },
};

export default function StatCard({ icon, label, value, subLabel, accent = 'primary', loading = false }) {
  const c = ACCENT_MAP[accent] ?? ACCENT_MAP.primary;

  if (loading) {
    return (
      <div className={`rounded-[20px] border p-5 flex items-center gap-4 ${c.bg} ${c.border}`}>
        <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-2.5 w-20 rounded" />
          <div className="skeleton h-5 w-16 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[20px] border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in-up ${c.bg} ${c.border}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
        <span className="material-symbols-outlined text-2xl select-none">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider truncate">
          {label}
        </p>
        <h3 className={`text-xl font-black mt-0.5 truncate ${c.value}`}>
          {value ?? '—'}
        </h3>
        {subLabel && (
          <p className="text-[10px] font-semibold text-on-surface-variant/50 mt-0.5 truncate">{subLabel}</p>
        )}
      </div>
    </div>
  );
}
