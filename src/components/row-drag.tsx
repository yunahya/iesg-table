import type { DragEvent } from 'react';
import type { TableColumnDef } from '../column-meta';
import { cn } from '../lib/utils';

export const ROW_DRAG_COLUMN_ID = 'drag';

export interface RowDragHandleProps {
  rowId: string;
  label: string;
  disabled?: boolean;
  onDragStart: (rowId: string) => void;
  onDragEnd: () => void;
  /** Keyboard fallback — moves the row one position. */
  onMove?: (rowId: string, direction: -1 | 1) => void;
  className?: string;
}

/**
 * Grip that starts a row drag. Only the handle is draggable, so text selection
 * and cell controls in the rest of the row keep working.
 */
export function RowDragHandle({
  rowId,
  label,
  disabled = false,
  onDragStart,
  onDragEnd,
  onMove,
  className,
}: RowDragHandleProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    // Firefox refuses to start a drag without payload.
    event.dataTransfer.setData('text/plain', rowId);
    // Drag the whole row, not the little grip the pointer is on.
    const row = event.currentTarget.closest('tr');
    if (row) event.dataTransfer.setDragImage(row, 16, row.clientHeight / 2);
    onDragStart(rowId);
  };

  return (
    <button
      type='button'
      draggable={!disabled}
      aria-label={label}
      disabled={disabled}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (!onMove) return;
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        event.stopPropagation();
        onMove(rowId, event.key === 'ArrowUp' ? -1 : 1);
      }}
      className={cn(
        'inline-flex size-5 items-center justify-center rounded',
        'text-[var(--tbl-drag-handle-fg)] hover:text-[var(--tbl-drag-handle-fg-hover)]',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
        className,
      )}
    >
      <svg viewBox='0 0 16 16' className='size-4' fill='currentColor' aria-hidden='true' focusable='false'>
        <circle cx='6' cy='3.5' r='1.25' />
        <circle cx='10' cy='3.5' r='1.25' />
        <circle cx='6' cy='8' r='1.25' />
        <circle cx='10' cy='8' r='1.25' />
        <circle cx='6' cy='12.5' r='1.25' />
        <circle cx='10' cy='12.5' r='1.25' />
      </svg>
    </button>
  );
}

/**
 * Column definition for the drag grip. `DataTable` renders the handle itself,
 * so the caller only has to include this column and set `enableRowDragging`.
 */
export function createRowDragColumn<TData>(overrides?: Partial<TableColumnDef<TData>>): TableColumnDef<TData> {
  return {
    id: ROW_DRAG_COLUMN_ID,
    header: '',
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    meta: { type: 'icon', width: 40, minWidth: 40, truncate: false, align: 'center', exportable: false },
    ...overrides,
  } as TableColumnDef<TData>;
}
