import type { Column } from '@tanstack/react-table';
import { cn } from '../lib/utils';
import { TableCell, TableRow } from '../table';

/** Deterministic bar widths — random ones would flicker on every render. */
const BAR_WIDTHS = ['72%', '48%', '86%', '60%', '38%', '78%', '54%'];

interface SkeletonRowsProps<TData> {
  columns: Column<TData, unknown>[];
  count: number;
}

/**
 * Stand-in rows drawn with the real columns, so the header, the widths and the
 * row height are all the ones the data will land in. Hidden from assistive
 * technology: the overlay announces the loading state, and a screen reader has
 * no use for fake content.
 */
export function SkeletonRows<TData>({ columns, count }: SkeletonRowsProps<TData>) {
  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholders with no identity
        <TableRow key={`skeleton-${rowIndex}`} aria-hidden='true' className='border-b-0'>
          {columns.map((column, columnIndex) => {
            const meta = column.columnDef.meta;
            const type = meta?.type ?? (meta?.numeric ? 'number' : 'text');
            const control = type === 'checkbox' || type === 'icon';

            return (
              <TableCell
                key={column.id}
                type={type}
                truncate={false}
                line={meta?.line ?? true}
                rightStroke={meta?.rightStroke ?? true}
                align={control ? 'center' : meta?.align}
              >
                <span
                  className={cn(
                    'block h-3 rounded-full bg-[var(--tbl-skeleton-bg)]',
                    'motion-safe:animate-pulse',
                    control && 'size-4 rounded',
                  )}
                  style={
                    control
                      ? undefined
                      : // Offsetting by the row keeps the column from looking
                        // like a solid block of identical bars.
                        { width: BAR_WIDTHS[(columnIndex + rowIndex) % BAR_WIDTHS.length] }
                  }
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

/**
 * Sits above the blurred rows. Absolutely positioned against the wrapper
 * `DataTable` renders, so it stays centred no matter how far the body scrolls.
 */
export function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className='absolute inset-0 z-40 flex items-center justify-center bg-[var(--tbl-loading-overlay-bg)]'>
      <output aria-live='polite' className='flex flex-col items-center gap-2'>
        <svg className='size-8 animate-spin' viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
          <circle cx='12' cy='12' r='9' fill='none' strokeWidth='3' className='stroke-[var(--tbl-spinner-track)]' />
          <path
            d='M21 12a9 9 0 0 0-9-9'
            fill='none'
            strokeWidth='3'
            strokeLinecap='round'
            className='stroke-[var(--tbl-spinner-indicator)]'
          />
        </svg>
        <span className='text-[var(--tbl-empty-fg)] text-sm'>{label}</span>
      </output>
    </div>
  );
}
