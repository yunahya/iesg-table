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
 * The checkbox is a fixed 18x18 control. This is intentionally a constant and
 * not a theme token: it must render at exactly this size everywhere, whatever
 * the row height, cell padding or surrounding flex layout.
 */
export const CHECKBOX_SIZE = 18;

const BOX = {
  x: 0.5,
  y: 0.5,
  width: 17,
  height: 17,
  rx: 1.5,
} as const;

/** Unchecked, enabled. */
function BoxUnchecked() {
  return <rect {...BOX} fill='var(--tbl-checkbox-bg)' stroke='var(--tbl-checkbox-border)' />;
}

/** Unchecked, disabled. */
function BoxDisabled() {
  return <rect {...BOX} fill='var(--tbl-checkbox-disabled-bg)' stroke='var(--tbl-checkbox-disabled-border)' />;
}

/** Filled box shared by the checked and indeterminate states. */
function BoxFilled() {
  return <rect {...BOX} fill='var(--tbl-checkbox-checked-bg)' stroke='var(--tbl-checkbox-checked-border)' />;
}

export function CheckboxIcon({
  checked,
  disabled = false,
  className,
}: {
  checked: boolean | 'indeterminate';
  disabled?: boolean;
  className?: string;
}) {
  const filled = checked === true || checked === 'indeterminate';

  return (
    <svg
      className={cn(
        'block shrink-0 grow-0 basis-auto rounded-[var(--tbl-checkbox-radius)]',
        // The design system has no disabled+checked artwork, so the filled box
        // is dimmed instead of dropping the checked state entirely.
        disabled && filled && 'opacity-40',
        className,
      )}
      width={CHECKBOX_SIZE}
      height={CHECKBOX_SIZE}
      // Locked in the style attribute so no utility class can override it.
      style={{
        width: CHECKBOX_SIZE,
        height: CHECKBOX_SIZE,
        minWidth: CHECKBOX_SIZE,
        minHeight: CHECKBOX_SIZE,
        maxWidth: CHECKBOX_SIZE,
        maxHeight: CHECKBOX_SIZE,
      }}
      viewBox='0 0 18 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
    >
      {filled ? <BoxFilled /> : disabled ? <BoxDisabled /> : <BoxUnchecked />}
      {checked === true && (
        <path
          d='M4.5 8.66667L8.1 12L13.5 6'
          stroke='var(--tbl-checkbox-mark)'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      )}
      {checked === 'indeterminate' && (
        <path
          d='M5 9H13'
          stroke='var(--tbl-checkbox-mark)'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      )}
    </svg>
  );
}

/**
 * Selection checkbox. A real `<input type="checkbox">` sits transparent on top
 * of the artwork, so keyboard, form semantics and the indeterminate state all
 * behave natively while the design system supplies the visuals.
 */
export function TableCheckbox({ checked, onChange, label, disabled = false, className }: TableCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = checked === 'indeterminate';
  }, [checked]);

  return (
    <span
      className={cn('relative inline-flex shrink-0 grow-0', className)}
      style={{ width: CHECKBOX_SIZE, height: CHECKBOX_SIZE, minWidth: CHECKBOX_SIZE, minHeight: CHECKBOX_SIZE }}
    >
      <input
        ref={ref}
        type='checkbox'
        className='peer absolute inset-0 z-10 m-0 cursor-pointer appearance-none disabled:cursor-not-allowed'
        checked={checked === true}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        // Keep a row-level onClick from firing when the checkbox is the target.
        onClick={(event) => event.stopPropagation()}
      />
      <CheckboxIcon
        checked={checked}
        disabled={disabled}
        className='peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--tbl-focus-ring)] peer-focus-visible:ring-offset-1'
      />
    </span>
  );
}
