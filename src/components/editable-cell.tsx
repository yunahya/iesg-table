import type { CellContext } from '@tanstack/react-table';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { CELL_NAV_ATTR, directionForKey, focusNeighbour } from '../lib/grid-nav';
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
  /**
   * Arrow keys and Tab move between editable cells. Turn this off to get plain
   * tab order and native caret movement instead. Defaults to `true`.
   */
  gridNavigation?: boolean;
  /**
   * Open the editor as soon as the cell takes focus, so moving into a cell and
   * typing just works. Defaults to `true`. Escape closes the editor and leaves
   * focus where it is, so it is still possible to sit on a cell without editing.
   */
  editOnFocus?: boolean;
  className?: string;
}

/** A single printable character — the key that should open the editor and be typed into it. */
function isTypingKey(event: KeyboardEvent<HTMLElement>) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/**
 * Cell renderer that becomes an input as soon as the cell takes focus — by
 * click, by Tab, or by an arrow key. Enter, F2 and plain typing also open it,
 * so an `editOnFocus={false}` cell still behaves sensibly.
 * Commits on Enter and on blur; Escape reverts and leaves focus in place.
 *
 * Arrow keys and Tab move between editable cells, in both the resting and the
 * editing state — so a whole column can be filled in without reaching for the
 * mouse. While editing, Left/Right move the caret until it reaches the end of
 * the text, and only then move to the next cell.
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
  gridNavigation = true,
  editOnFocus = true,
  className,
}: EditableCellProps<TData>) {
  const initial = ctx.getValue();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => String(initial ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Set when the editor was opened by typing, so the first character is kept
  // instead of being selected away.
  const keepDraft = useRef(false);
  // Escape has to be able to leave a focused cell alone; without this the
  // focus handler would reopen the editor the instant it closed.
  const skipFocusEdit = useRef(false);
  // Moving focus out of the input fires blur after the key handler already
  // committed. Without this the same edit would be reported twice.
  const committed = useRef(false);

  // A commit from elsewhere (or a re-sort) should be reflected when not editing.
  useEffect(() => {
    if (!editing) setDraft(String(initial ?? ''));
  }, [initial, editing]);

  useEffect(() => {
    if (!editing) return;
    committed.current = false;
    if (keepDraft.current) {
      keepDraft.current = false;
      // Caret after the typed character, nothing selected.
      const end = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(end, end);
      return;
    }
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
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
    committed.current = true;
    setDraft(String(initial ?? ''));
    setEditing(false);
    skipFocusEdit.current = true;
    buttonRef.current?.focus();
  };

  const onRestingFocus = () => {
    if (!editOnFocus) return;
    if (skipFocusEdit.current) {
      skipFocusEdit.current = false;
      return;
    }
    setEditing(true);
  };

  /** Keys while the cell is focused but not being edited. */
  const onRestingKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      setEditing(true);
      return;
    }
    if (gridNavigation) {
      const direction = directionForKey(event.key, event.shiftKey);
      if (direction && focusNeighbour(event.currentTarget, direction)) {
        event.preventDefault();
        return;
      }
    }
    // Typing straight into a cell starts the edit, the way a spreadsheet does.
    if (isTypingKey(event)) {
      event.preventDefault();
      keepDraft.current = true;
      setDraft(event.key);
      setEditing(true);
    }
  };

  /** Keys while the input has focus. */
  const onEditingKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      return;
    }

    const input = event.currentTarget;

    // Left/Right belong to the caret until it has nowhere left to go.
    if (gridNavigation && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const collapsed = input.selectionStart === input.selectionEnd;
      const atStart = input.selectionStart === 0;
      const atEnd = input.selectionEnd === input.value.length;
      const leaving = event.key === 'ArrowLeft' ? atStart : atEnd;
      if (!collapsed || !leaving) return;
    }

    const direction = gridNavigation ? directionForKey(event.key, event.shiftKey) : null;
    if (event.key !== 'Enter' && !direction) return;

    event.preventDefault();
    commit();
    // Enter moves down, matching every spreadsheet; the arrows and Tab move
    // the way they point.
    focusNeighbour(input, direction ?? 'down');
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
        onKeyDown={onEditingKeyDown}
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
      ref={buttonRef}
      type='button'
      {...(gridNavigation ? CELL_NAV_ATTR : {})}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      onFocus={onRestingFocus}
      onKeyDown={onRestingKeyDown}
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
