/**
 * SkeletonCard — animated loading placeholder
 * Props:
 *   lines  (number) number of skeleton lines (default 3)
 *   height (string) Tailwind h-* class for the main block (default 'h-32')
 *   className (string) extra classes
 */
export default function SkeletonCard({ lines = 3, height = 'h-32', className = '' }) {
  return (
    <div className={`dashboard-card p-5 space-y-3 ${className}`}>
      <div className={`skeleton w-full rounded-xl ${height}`} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton rounded h-3 ${i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-2/3'}`}
        />
      ))}
    </div>
  );
}

/** Inline skeleton row variant */
export function SkeletonRow({ count = 3, className = '' }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-outline-variant/20 p-5 flex items-center gap-4 bg-surface-container-lowest">
          <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-2.5 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
