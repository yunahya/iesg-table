import { type KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SearchOption {
  value: string;
  label: string;
  hint?: string;
}

export interface SearchSelectProps {
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  /** Accessible name for the trigger. */
  label: string;
}

/**
 * A searchable picker for a `custom` cell.
 *
 * The panel is rendered into `document.body` through a portal. That is the
 * whole point of this example: the table's scroll container is `overflow:
 * auto`, so a panel drawn inside the cell would be clipped the moment it
 * extended past the row. Portalled out, it floats above everything — at the
 * cost of having to position it by hand and keep that position in sync while
 * anything scrolls.
 */
export function SearchSelect({ value, options, onChange, placeholder, emptyLabel, label }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle) || o.hint?.toLowerCase().includes(needle))
    : options;

  const place = useCallback(() => setRect(triggerRef.current?.getBoundingClientRect() ?? null), []);

  // Position before paint, so the panel never shows up in the wrong place first.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // The cell scrolls with the table, and the panel does not — so follow it.
  // `capture` is what catches the table's own scroll container, not just the window.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // A click outside closes. Pointerdown rather than click, so the panel is gone
  // before the click lands on whatever is underneath.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery('');
    if (restoreFocus) triggerRef.current?.focus();
  };

  const commit = (option: SearchOption) => {
    onChange(option.value);
    close();
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (matches.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + matches.length) % matches.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = matches[active];
      if (option) commit(option);
    }
  };

  const panel =
    open && rect
      ? createPortal(
          <div
            ref={panelRef}
            className='fixed z-50 w-64 rounded-lg border border-slate-200 bg-white shadow-lg'
            style={{
              // Flip above the trigger when there is no room below it.
              top: rect.bottom + 288 > window.innerHeight ? undefined : rect.bottom + 4,
              bottom: rect.bottom + 288 > window.innerHeight ? window.innerHeight - rect.top + 4 : undefined,
              left: Math.min(rect.left, window.innerWidth - 264),
            }}
          >
            <div className='border-slate-100 border-b p-2'>
              <input
                // biome-ignore lint/a11y/noAutofocus: the panel exists to be typed into
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={placeholder ?? '검색…'}
                role='combobox'
                aria-expanded='true'
                aria-controls={listId}
                aria-autocomplete='list'
                className='w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-500'
              />
            </div>

            <ul id={listId} aria-label={label} className='max-h-56 overflow-y-auto py-1 text-xs'>
              {matches.length === 0 && <li className='px-3 py-2 text-slate-400'>{emptyLabel ?? '결과 없음'}</li>}
              {matches.map((option, index) => (
                <li key={option.value}>
                  <button
                    type='button'
                    onClick={() => commit(option)}
                    onMouseEnter={() => setActive(index)}
                    aria-selected={option.value === value}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left ${
                      index === active ? 'bg-slate-100' : ''
                    }`}
                  >
                    <span className='inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px]'>
                      {option.label.slice(0, 1)}
                    </span>
                    <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                    {option.hint && <span className='shrink-0 text-slate-400'>{option.hint}</span>}
                    {option.value === value && <span className='shrink-0 text-emerald-600'>✓</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        aria-label={label}
        aria-haspopup='listbox'
        aria-expanded={open}
        onClick={(event) => {
          // Otherwise the row's own click handler fires too.
          event.stopPropagation();
          setOpen((previous) => !previous);
        }}
        className='flex h-full w-full items-center gap-1.5 px-2 text-left hover:bg-slate-50'
      >
        {selected ? (
          <>
            <span className='inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px]'>
              {selected.label.slice(0, 1)}
            </span>
            <span className='min-w-0 flex-1 truncate text-xs'>{selected.label}</span>
          </>
        ) : (
          <span className='flex-1 text-slate-400 text-xs'>선택 안 함</span>
        )}
        <span className='shrink-0 text-slate-400 text-[10px]'>▾</span>
      </button>
      {panel}
    </>
  );
}
