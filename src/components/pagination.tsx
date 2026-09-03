import { cn } from '../lib/utils';

export interface PaginationLabels {
  previous: string;
  next: string;
  /** Accessible name for a page button, e.g. `(n) => \`page ${n}\`` */
  page: (page: number) => string;
  /** Accessible name for the rows-per-page select. */
  pageSize: string;
}

export interface PaginationProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  totalCount: number;
  labels: PaginationLabels;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /** Number of page buttons shown around the current page. */
  siblingCount?: number;
  className?: string;
}

const GAP = '…';

/** Page numbers to render, with `null` marking a gap. */
function buildPageList(current: number, total: number, siblings: number): (number | null)[] {
  // 2 ends + 2 gaps + current + siblings on both sides
  if (total <= siblings * 2 + 5) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftGap = left > 2;
  const showRightGap = right < total - 1;

  const pages: (number | null)[] = [1];
  if (showLeftGap) pages.push(null);
  for (let p = Math.max(left, 2); p <= Math.min(right, total - 1); p += 1) pages.push(p);
  if (showRightGap) pages.push(null);
  pages.push(total);
  return pages;
}

const buttonBase = cn(
  'inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
  'disabled:cursor-not-allowed disabled:opacity-40',
);

export function TablePagination({
  page,
  pageSize,
  totalCount,
  labels,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalCount) / safePageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const pages = buildPageList(current, totalPages, Math.max(0, siblingCount));

  return (
    <nav className={cn('flex items-center justify-between gap-4 py-2', className)} aria-label='pagination'>
      {onPageSizeChange ? (
        <label className='flex items-center gap-2 text-sm text-[var(--tbl-header-fg)]'>
          <span className='sr-only'>{labels.pageSize}</span>
          <select
            className={cn(
              'h-8 rounded border-[length:var(--tbl-border-width)] border-[var(--tbl-border)]',
              'bg-[var(--tbl-cell-bg)] px-2 text-sm text-[var(--tbl-cell-fg)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
            )}
            value={safePageSize}
            aria-label={labels.pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <span />
      )}

      <div className='flex items-center gap-1'>
        <button
          type='button'
          className={cn(buttonBase, 'text-[var(--tbl-cell-fg)] hover:bg-[var(--tbl-row-hover-bg)]')}
          disabled={current <= 1}
          aria-label={labels.previous}
          onClick={() => onPageChange(current - 1)}
        >
          ‹
        </button>

        {pages.map((entry, index) =>
          entry === null ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: gap markers have no stable identity
            <span key={`gap-${index}`} className='px-1 text-sm text-[var(--tbl-empty-fg)]' aria-hidden='true'>
              {GAP}
            </span>
          ) : (
            <button
              key={entry}
              type='button'
              className={cn(
                buttonBase,
                entry === current
                  ? 'bg-[var(--tbl-row-selected-bg)] font-medium text-[var(--tbl-row-selected-fg)]'
                  : 'text-[var(--tbl-cell-fg)] hover:bg-[var(--tbl-row-hover-bg)]',
              )}
              aria-label={labels.page(entry)}
              aria-current={entry === current ? 'page' : undefined}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type='button'
          className={cn(buttonBase, 'text-[var(--tbl-cell-fg)] hover:bg-[var(--tbl-row-hover-bg)]')}
          disabled={current >= totalPages}
          aria-label={labels.next}
          onClick={() => onPageChange(current + 1)}
        >
          ›
        </button>
      </div>
    </nav>
  );
}
