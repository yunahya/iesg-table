import type { Row } from '@tanstack/react-table';
import type { TableColumnDef } from '../column-meta';
import { cn } from '../lib/utils';

export const EXPANDER_COLUMN_ID = 'expander';

export interface ExpanderProps {
  expanded: boolean;
  /** False for leaf rows — the control renders as a blank spacer. */
  canExpand: boolean;
  onToggle: () => void;
  label: string;
  /** Nesting level, used to indent sub-rows. */
  depth?: number;
  className?: string;
}

/** Chevron toggle for expandable rows. Rotates rather than swapping artwork. */
export function Expander({ expanded, canExpand, onToggle, label, depth = 0, className }: ExpanderProps) {
  const indent = depth * 16;

  if (!canExpand) {
    return <span className='inline-block' style={{ width: 20 + indent }} aria-hidden='true' />;
  }

  return (
    <button
      type='button'
      aria-label={label}
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      style={{ marginLeft: indent }}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded text-[var(--tbl-expander-fg)]',
        'hover:bg-[var(--tbl-row-hover-bg)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
        className,
      )}
    >
      <svg
        className={cn('size-3.5 transition-transform duration-150', expanded && 'rotate-90')}
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden='true'
        focusable='false'
      >
        <path
          d='M6 3.5L10.5 8L6 12.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  );
}

/**
 * Column definition for the expand/collapse control. `DataTable` renders the
 * chevron itself, so the caller only has to include this column.
 */
export function createExpanderColumn<TData>(overrides?: Partial<TableColumnDef<TData>>): TableColumnDef<TData> {
  return {
    id: EXPANDER_COLUMN_ID,
    header: '',
    enableSorting: false,
    enableResizing: false,
    meta: { type: 'icon', width: 44, truncate: false, align: 'center' },
    ...overrides,
  } as TableColumnDef<TData>;
}

export type { Row };
