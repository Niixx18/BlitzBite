import { Link } from 'react-router-dom';

/**
 * EmptyState — beautiful empty state with icon, heading, body, and optional CTA
 * Props:
 *   icon      (string) Material Symbol icon name
 *   title     (string)
 *   body      (string)
 *   cta       (string) button/link label
 *   ctaTo     (string) react-router path (if set, renders a Link; else a button)
 *   onCta     (fn)    callback when cta is a button
 */
export default function EmptyState({ icon = 'inbox', title, body, cta, ctaTo, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center border border-outline-variant/20 rounded-[24px] bg-surface-container-lowest animate-fade-in-up">
      {/* Icon bubble */}
      <div className="w-20 h-20 rounded-full bg-primary/8 flex items-center justify-center mb-5 shadow-inner">
        <span className="material-symbols-outlined text-4xl text-primary/60 select-none font-light">
          {icon}
        </span>
      </div>

      {title && (
        <h3 className="text-base font-black text-on-surface mb-1">{title}</h3>
      )}
      {body && (
        <p className="text-xs font-medium text-on-surface-variant/70 max-w-xs leading-relaxed mb-5">{body}</p>
      )}

      {cta && ctaTo && (
        <Link
          to={ctaTo}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all"
        >
          {cta}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      )}
      {cta && onCta && (
        <button
          onClick={onCta}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-full shadow-sm hover:bg-primary-container transition-all cursor-pointer"
        >
          {cta}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
