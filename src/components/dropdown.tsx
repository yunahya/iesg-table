import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../lib/utils';

export interface DropdownOption<T> {
  value: T;
  label: string;
}

export interface DropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name for the trigger. */
  label: string;
  /** Which side of the trigger the menu opens on. */
  placement?: 'top' | 'bottom';
  /** Which edge of the trigger the menu aligns to. */
  align?: 'start' | 'end';
  disabled?: boolean;
  className?: string;
}

/** The chevron of the trigger — 16x16 box, per `Button/Small`. */
function TriggerChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('h-4 w-4 shrink-0 transition-transform', open && '-scale-y-100')}
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      <path
        d='M3.52864 5.86201C3.78899 5.60166 4.2111 5.60166 4.47145 5.86201L8.00004 9.39061L11.5286 5.86201C11.789 5.60166 12.2111 5.60166 12.4714 5.86201C12.7318 6.12236 12.7318 6.54447 12.4714 6.80482L8.47145 10.8048C8.2111 11.0652 7.78899 11.0652 7.52864 10.8048L3.52864 6.80482C3.26829 6.54447 3.26829 6.12236 3.52864 5.86201Z'
        fill='currentColor'
      />
    </svg>
  );
}

/**
 * Single-select dropdown built on a button + listbox, so the menu can be
 * styled to the design system (a native `<select>` popup cannot be).
 *
 * Focus stays on the trigger the whole time and the active option is tracked
 * with `aria-activedescendant` — no focus trap, and Tab still leaves the
 * control the way it would from a `<select>`.
 */
export function TableDropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
  placement = 'bottom',
  align = 'start',
  disabled,
  className,
}: DropdownProps<T>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));

  const close = useCallback((): void => {
    setOpen(false);
    setActiveIndex(Math.max(selectedIndex, 0));
  }, [selectedIndex]);

  // Any press outside the control dismisses it, like a native popup.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  const openMenu = (): void => {
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const commit = (index: number): void => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    setActiveIndex(index);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        close();
      }
      return;
    }

    if (event.key === 'Tab') {
      if (open) close();
      return;
    }

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      default:
        break;
    }
  };

  const selected = options[selectedIndex];

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <button
        type='button'
        className={cn(
          'inline-flex h-[var(--tbl-dropdown-height)] w-full min-w-[95px] items-center justify-between gap-1.5',
          'rounded-[var(--tbl-dropdown-radius)] px-2.5',
          'border-[length:var(--tbl-border-width)] border-[var(--tbl-dropdown-border)]',
          'bg-[var(--tbl-dropdown-bg)] text-[var(--tbl-dropdown-fg)]',
          'text-sm font-medium leading-[1.5] tracking-[-0.03em]',
          'hover:bg-[var(--tbl-dropdown-hover-bg)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className='truncate'>{selected?.label ?? ''}</span>
        <TriggerChevron open={open} />
      </button>

      {open ? (
        <div
          id={listId}
          // biome-ignore lint/a11y/useSemanticElements: a native <select> popup cannot be styled to the design system
          role='listbox'
          tabIndex={-1}
          aria-label={label}
          className={cn(
            'absolute z-10 min-w-full overflow-auto py-1',
            'max-h-[var(--tbl-dropdown-menu-max-height)]',
            'rounded-[var(--tbl-dropdown-radius)] shadow-[var(--tbl-dropdown-menu-shadow)]',
            'border-[length:var(--tbl-border-width)] border-[var(--tbl-dropdown-border)]',
            'bg-[var(--tbl-dropdown-bg)]',
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection is handled on the trigger via aria-activedescendant
              <div
                key={String(option.value)}
                id={`${listId}-${index}`}
                // biome-ignore lint/a11y/useSemanticElements: part of the listbox pattern above
                role='option'
                tabIndex={-1}
                aria-selected={isSelected}
                className={cn(
                  'cursor-pointer px-2.5 py-1.5 text-sm leading-[1.5] tracking-[-0.03em]',
                  isSelected ? 'font-medium text-[var(--tbl-dropdown-selected-fg)]' : 'text-[var(--tbl-dropdown-fg)]',
                  index === activeIndex && 'bg-[var(--tbl-dropdown-hover-bg)]',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
