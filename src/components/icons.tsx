import { cn } from '../lib/utils';

export interface SortIconProps {
  /** Current sort direction of the column, or false when unsorted. */
  direction: 'asc' | 'desc' | false;
  className?: string;
}

/**
 * Default sort affordance. Both arrows are drawn; the inactive one is dimmed,
 * so the icon never changes width as sorting toggles.
 */
export function SortIcon({ direction, className }: SortIconProps) {
  return (
    <svg
      className={cn('size-4 shrink-0', className)}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      <title>sort</title>
      <path d='M8 2.5 L11 6 H5 Z' fill='currentColor' className={direction === 'asc' ? 'opacity-100' : 'opacity-30'} />
      <path
        d='M8 13.5 L5 10 H11 Z'
        fill='currentColor'
        className={direction === 'desc' ? 'opacity-100' : 'opacity-30'}
      />
    </svg>
  );
}
