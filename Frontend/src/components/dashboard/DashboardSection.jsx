/**
 * DashboardSection — section header with optional action button
 */
export default function DashboardSection({ title, subtitle, actionLabel, onAction, actionHref, children, count }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-on-surface tracking-tight">{title}</h2>
            {count !== undefined && (
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-black px-2.5 py-1 rounded-full">
                {count}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-on-surface-variant/60 mt-0.5">{subtitle}</p>
          )}
        </div>
        {(actionLabel && (onAction || actionHref)) && (
          actionHref ? (
            <a
              href={actionHref}
              className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
            >
              {actionLabel}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          ) : (
            <button
              onClick={onAction}
              className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1 cursor-pointer"
            >
              {actionLabel}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )
        )}
      </div>
      {/* Divider */}
      <div className="h-px bg-outline-variant/25" />
      {children}
    </section>
  );
}
