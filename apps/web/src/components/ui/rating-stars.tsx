'use client';
import { useState } from 'react';

const STAR_PTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26';

function Star({ filled, hovered, size, onClick, onHover, onLeave }: {
  filled: boolean;
  hovered?: boolean;
  size: string;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}) {
  const active = filled || hovered;
  return (
    <svg
      className={`${size} transition-all duration-100 ${onClick ? 'cursor-pointer' : ''} ${active ? 'text-accent' : 'text-border'} ${onClick && !filled ? 'hover:scale-110' : ''}`}
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <polygon points={STAR_PTS} />
    </svg>
  );
}

// Read-only display
interface RatingStarsProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  ratingCount?: number;
}

export function RatingStars({ rating, size = 'sm', showValue = true, ratingCount }: RatingStarsProps) {
  const szClass  = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-[18px] h-[18px]' : 'w-6 h-6';
  const txtClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl';

  if (rating === null) {
    return <span className={`${txtClass} text-subtle font-medium italic`}>Новый</span>;
  }

  const filled = Math.round(rating);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5 text-accent">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} filled={i <= filled} size={szClass} />
        ))}
      </div>
      {showValue && (
        <span className={`${txtClass} font-bold text-text tabular-nums`}>{rating.toFixed(1)}</span>
      )}
      {ratingCount !== undefined && ratingCount > 0 && (
        <span className={`${txtClass} text-subtle`}>({ratingCount})</span>
      )}
    </div>
  );
}

// Interactive picker
interface StarPickerProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size="w-8 h-8"
          filled={i <= value}
          hovered={hovered > 0 && i <= hovered}
          onClick={disabled ? undefined : () => onChange(i)}
          onHover={disabled ? undefined : () => setHovered(i)}
          onLeave={disabled ? undefined : () => setHovered(0)}
        />
      ))}
    </div>
  );
}
