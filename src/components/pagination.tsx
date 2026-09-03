import { cn } from '../lib/utils';
import { TableDropdown } from './dropdown';
import { ChevronIcon } from './icons';

export interface PaginationLabels {
  previous: string;
  next: string;
  /** Accessible name for a page button, e.g. `(n) => \`page ${n}\`` */
  page: (page: number) => string;
  /** Accessible name for the rows-per-page select. */
  pageSize: string;
  /**
   * Visible text of one rows-per-page option.
   * Defaults to `(size) => \`${size}줄 보기\``.
   */
  pageSizeOption?: (size: number) => string;
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

const defaultPageSizeOption = (size: number): string => `${size}줄 보기`;

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

/** 20x30 hit area, 14px Pretendard body-2 metrics, per the design system. */
const buttonBase = cn(
  'inline-flex h-[30px] min-w-5 items-center justify-center px-0.5',
  'rounded-[var(--tbl-pagination-radius)] text-sm leading-[1.5] tracking-[-0.03em]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
  'disabled:cursor-not-allowed disabled:opacity-40',
);

const arrowButton = cn(buttonBase, 'text-[var(--tbl-pagination-fg)]');

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
  const formatPageSize = labels.pageSizeOption ?? defaultPageSizeOption;

  return (
    <nav className={cn('grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2', className)} aria-label='pagination'>
      <span />

      <div className='flex items-center gap-1'>
        <button
          type='button'
          className={arrowButton}
          disabled={current <= 1}
          aria-label={labels.previous}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronIcon direction='left' />
        </button>

        {pages.map((entry, index) =>
          entry === null ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: gap markers have no stable identity
            <span key={`gap-${index}`} className={cn(buttonBase, 'text-[var(--tbl-pagination-fg)]')} aria-hidden='true'>
              {GAP}
            </span>
          ) : (
            <button
              key={entry}
              type='button'
              className={cn(
                buttonBase,
                entry === current
                  ? 'bg-[var(--tbl-pagination-active-bg)] font-medium text-[var(--tbl-pagination-active-fg)]'
                  : 'text-[var(--tbl-pagination-fg)] hover:bg-[var(--tbl-pagination-hover-bg)]',
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
          className={arrowButton}
          disabled={current >= totalPages}
          aria-label={labels.next}
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronIcon direction='right' />
        </button>
      </div>

      <div className='flex justify-end'>
        {onPageSizeChange ? (
          <TableDropdown
            value={safePageSize}
            options={pageSizeOptions.map((size) => ({ value: size, label: formatPageSize(size) }))}
            onChange={onPageSizeChange}
            label={labels.pageSize}
            placement='top'
            align='end'
          />
        ) : null}
      </div>
    </nav>
  );
}
