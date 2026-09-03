import { cn } from '../lib/utils';

export interface SortIconProps {
  /** Current sort direction of the column, or false when unsorted. */
  direction: 'asc' | 'desc' | false;
  className?: string;
}

/**
 * The two arrows of the sort glyph, split out of the original single path so
 * each can be coloured independently. Geometry is unchanged.
 */
const ARROW_UP =
  'M10.9996 12.3617V2.33887L9.17834 4.10971L9.12544 4.1561C8.84971 4.37481 8.44764 4.3534 8.1969 4.09588C7.92954 3.82089 7.93574 3.38097 8.21073 3.11362L11.2104 0.196941L11.2625 0.150554C11.5327 -0.0644371 11.9261 -0.0487365 12.1788 0.196941L15.1785 3.11362L15.2273 3.1657C15.4534 3.4353 15.4429 3.83816 15.1923 4.09588C14.9417 4.35349 14.5396 4.37469 14.2638 4.1561L14.2101 4.10971L12.3888 2.33806V12.3617C12.3886 12.745 12.078 13.0558 11.6946 13.0559C11.3112 13.0559 10.9998 12.7451 10.9996 12.3617Z';
const ARROW_DOWN =
  'M2.99996 0.694175C2.99996 0.310752 3.31075 0.000176427 3.69413 0C4.07766 0 4.38912 0.310643 4.38912 0.694175V10.717L6.2104 8.94615C6.4854 8.67888 6.92534 8.68502 7.19266 8.95999C7.45991 9.23495 7.45371 9.67492 7.17883 9.94225L4.17834 12.8589C3.90889 13.1207 3.48022 13.1207 3.21073 12.8589L0.210242 9.94225L0.162228 9.89017C-0.0642295 9.62056 -0.0542958 9.21785 0.196407 8.95999C0.447076 8.70216 0.849087 8.68109 1.12496 8.89977L1.17867 8.94615L2.99996 10.717V0.694175Z';

const ACTIVE = 'var(--tbl-sort-active)';

/**
 * Sort affordance. Both arrows are always drawn, so the icon never changes
 * width; the one matching the current direction is tinted with
 * `--tbl-sort-active`, the other inherits the header text colour.
 */
export function SortIcon({ direction, className }: SortIconProps) {
  return (
    <svg
      className={cn('h-3.5 w-4 shrink-0', className)}
      viewBox='0 0 16 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      <path d={ARROW_UP} fill={direction === 'asc' ? ACTIVE : 'currentColor'} />
      <path d={ARROW_DOWN} fill={direction === 'desc' ? ACTIVE : 'currentColor'} />
    </svg>
  );
}

const CHEVRON =
  'M6.697 0.219671C6.98989 0.512565 6.98989 0.98744 6.697 1.28033L1.81066 6.16668L6.697 11.053C6.98989 11.3459 6.98989 11.8208 6.697 12.1137C6.4041 12.4066 5.92923 12.4066 5.63634 12.1137L0.21967 6.69702C-0.0732233 6.40412 -0.0732233 5.92925 0.21967 5.63635L5.63634 0.219671C5.92923 -0.0732235 6.4041 -0.0732235 6.697 0.219671Z';

export interface ChevronIconProps {
  direction: 'left' | 'right';
  className?: string;
}

/**
 * Single chevron used by the pagination arrows. The path points left; the
 * right variant is the same geometry mirrored, so both render identically.
 */
export function ChevronIcon({ direction, className }: ChevronIconProps) {
  return (
    <svg
      className={cn('h-[13px] w-[7px] shrink-0', direction === 'right' && '-scale-x-100', className)}
      viewBox='0 0 7 13'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      <path d={CHEVRON} fill='currentColor' />
    </svg>
  );
}
