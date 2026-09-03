import type { CellContext } from '@tanstack/react-table';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

export interface EditableCellProps<TData> {
  ctx: CellContext<TData, unknown>;
  /** Defaults to `text`. `number` commits a number, not a string. */
  inputType?: 'text' | 'number';
  /** Rejects a value before it is committed. */
  validate?: (value: string) => boolean;
  /** Formats the value for display while not editing. */
  format?: (value: unknown) => string;
  /** Per-row opt-out. Defaults to editable. */
  disabled?: boolean;
  className?: string;
}

/**
 * Cell renderer that turns into an input on click, Enter or F2.
 * Commits on Enter and on blur; Escape reverts.
 *
 * Wire it up with `onCellEdit` on `DataTable`:
 *   cell: (ctx) => <EditableCell ctx={ctx} />
 */
export function EditableCell<TData>({
  ctx,
  inputType = 'text',
  validate,
  format,
  disabled = false,
  className,
}: EditableCellProps<TData>) {
  const initial = ctx.getValue();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => String(initial ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  // A commit from elsewhere (or a re-sort) should be reflected when not editing.
  useEffect(() => {
    if (!editing) setDraft(String(initial ?? ''));
  }, [initial, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (validate && !validate(draft)) {
      setDraft(String(initial ?? ''));
      return;
    }
    const next = inputType === 'number' ? Number(draft) : draft;
    if (inputType === 'number' && Number.isNaN(next as number)) {
      setDraft(String(initial ?? ''));
      return;
    }
    if (next === initial) return;
    ctx.table.options.meta?.updateCell?.({
      rowId: ctx.row.id,
      columnId: ctx.column.id,
      value: next,
      row: ctx.row.original,
    });
  };

  const cancel = () => {
    setDraft(String(initial ?? ''));
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (editing) commit();
      else setEditing(true);
      return;
    }
    if (!editing && event.key === 'F2') {
      event.preventDefault();
      setEditing(true);
    }
  };

  if (disabled) {
    return <span className={className}>{format ? format(initial) : String(initial ?? '')}</span>;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={inputType}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onClick={(event) => event.stopPropagation()}
        // biome-ignore lint/a11y/noAutofocus: focus must follow the click that opened the editor
        autoFocus
        className={cn(
          'w-full min-w-0 rounded-sm px-1 py-0.5 text-inherit',
          'bg-[var(--tbl-edit-bg)] text-[var(--tbl-edit-fg)]',
          'border border-[var(--tbl-edit-border)] outline-none',
          'text-right [&[type=text]]:text-left',
          className,
        )}
      />
    );
  }

  return (
    <button
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full min-w-0 truncate rounded-sm px-1 py-0.5 text-left [font:inherit] text-inherit',
        'cursor-text hover:bg-[var(--tbl-edit-hover-bg)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
        className,
      )}
    >
      {format ? format(initial) : String(initial ?? '')}
    </button>
  );
}
