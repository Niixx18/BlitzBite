import { useState } from 'react';

/**
 * StarRating component
 *
 * Props:
 *  - rating       (number)   : current average rating (0-5)
 *  - ratingCount  (number)   : total number of ratings
 *  - userRating   (number)   : the current user's own rating (0 = not yet rated)
 *  - onRate       (function) : called with (starValue) when user submits a rating
 *  - interactive  (boolean)  : if true, hoverable/clickable stars are shown
 *  - size         ('sm'|'md'|'lg') : star size
 *  - loading      (boolean)  : show spinner while submitting
 */
export default function StarRating({
  rating = 0,
  ratingCount = 0,
  userRating = 0,
  onRate,
  interactive = false,
  size = 'md',
  loading = false,
}) {
  const [hovered, setHovered] = useState(0);

  const starSizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size] || 'text-lg';

  // Display rating rounded to nearest 0.5
  const displayRating = Math.round(rating * 2) / 2;

  const getStarFill = (star) => {
    const active = interactive ? (hovered || userRating) : displayRating;
    if (star <= Math.floor(active)) return 'full';
    if (star - 0.5 <= active) return 'half';
    return 'empty';
  };

  const handleClick = (star) => {
    if (interactive && onRate && !loading) {
      onRate(star);
    }
  };

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* Stars */}
      <div
        className="flex gap-0.5"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onMouseLeave={() => interactive && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getStarFill(star);
          const isActive = interactive && (hovered >= star || (!hovered && userRating >= star));

          return (
            <span
              key={star}
              onMouseEnter={() => interactive && setHovered(star)}
              onClick={() => handleClick(star)}
              title={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
              className={`material-symbols-outlined leading-none block transition-transform duration-100 ${starSizeClass} ${
                isActive ? 'scale-120' : 'scale-100'
              } ${
                fill === 'empty'
                  ? 'text-outline-variant'
                  : 'text-amber-500'
              }`}
              style={{
                fontVariationSettings: fill === 'full' ? "'FILL' 1" : fill === 'half' ? "'FILL' 0.5" : "'FILL' 0"
              }}
            >
              {fill === 'half' ? 'star_half' : 'star'}
            </span>
          );
        })}
      </div>

      {/* Rating label */}
      {!interactive && (
        <span className={`font-bold ml-1 ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        } ${rating > 0 ? 'text-amber-600' : 'text-on-surface-variant/40'}`}>
          {rating > 0 ? rating.toFixed(1) : '—'}
        </span>
      )}

      {/* Count */}
      {!interactive && ratingCount > 0 && (
        <span className={`text-on-surface-variant/50 font-medium ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        }`}>
          ({ratingCount})
        </span>
      )}

      {/* Loading spinner */}
      {loading && (
        <span className="text-xs text-primary animate-spin ml-1">⟳</span>
      )}
    </div>
  );
}

