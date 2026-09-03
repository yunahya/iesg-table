import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export interface TableCheckboxProps {
  checked: boolean | 'indeterminate';
  onChange: (checked: boolean) => void;
  /** Accessible name. Required — the checkbox has no visible label. */
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Minimal selection checkbox. Deliberately plain: most design systems will pass
 * their own via `<DataTable components={{ Checkbox }} />`.
 */
export function TableCheckbox({ checked, onChange, label, disabled = false, className }: TableCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === 'indeterminate';
  }, [checked]);

  return (
    <input
      ref={ref}
      type='checkbox'
      className={cn(
        'size-4 shrink-0 cursor-pointer rounded-sm',
        'accent-[var(--tbl-checkbox-accent)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tbl-focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      checked={checked === true}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
      // Keep a row-level onClick from firing when the checkbox is the target.
      onClick={(event) => event.stopPropagation()}
    />
  );
}
