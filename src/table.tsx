import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  PropsWithChildren,
  ReactNode,
  Ref,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from './lib/utils';

/** What kind of content a header cell holds. Drives padding and alignment. */
export type HeaderType = 'text' | 'number' | 'unit' | 'memo' | 'checkbox' | 'sort';

/** What kind of content a body cell holds. Drives padding, alignment and inner layout. */
export type CellType =
  | 'text'
  | 'number'
  | 'unit'
  | 'memo'
  | 'checkbox'
  | 'tag'
  | 'text-tag'
  | 'text-dropdown'
  | 'text-button'
  | 'button'
  | 'icon'
  | 'icon-text'
  | 'switch';

/** Interaction state of a cell. */
export type CellState = 'default' | 'selected' | 'disabled';

/** Semantic emphasis of a cell, applied only when `state` is `default`. */
export type CellTone = 'none' | 'muted' | 'info' | 'warning' | 'danger';

/** Horizontal alignment. */
export type Align = 'left' | 'center' | 'right';

export interface CellVariantProps {
  type?: CellType;
  state?: CellState;
  tone?: CellTone;
  /** Draw the bottom border. */
  line?: boolean;
  /** Draw the right border. */
  rightStroke?: boolean;
}

const BORDER_B = 'border-b-[length:var(--tbl-border-width)] border-b-[var(--tbl-border)]';
const BORDER_R = 'border-r-[length:var(--tbl-border-width)] border-r-[var(--tbl-border)]';

const headerTypeStyles: Record<HeaderType, string> = {
  checkbox: 'p-0',
  sort: 'px-[var(--tbl-cell-px)] py-0',
  text: 'px-[var(--tbl-cell-px)] py-0',
  number: 'px-[var(--tbl-cell-px)] py-0 text-right',
  unit: 'px-[var(--tbl-cell-px)] py-0',
  memo: 'px-[var(--tbl-cell-px)] py-0',
};

const cellTypeStyles: Record<CellType, string> = {
  checkbox: 'p-0',
  text: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)]',
  number: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)] text-right',
  unit: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)]',
  memo: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)]',
  'text-dropdown': 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)] text-right',
  'text-tag': 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py)]',
  tag: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py-loose)]',
  'text-button': 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py-compact)]',
  button: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py-compact)]',
  'icon-text': 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py-compact)]',
  icon: 'px-[var(--tbl-cell-px)] py-[var(--tbl-cell-py-loose)]',
  switch: 'px-[var(--tbl-cell-px-wide)] py-[var(--tbl-cell-py-switch)]',
};

const cellStateStyles: Record<CellState, string> = {
  default: 'bg-[var(--tbl-cell-bg)] text-[var(--tbl-cell-fg)]',
  selected: 'bg-[var(--tbl-row-selected-bg)] text-[var(--tbl-row-selected-fg)]',
  disabled: 'bg-[var(--tbl-cell-disabled-bg)] text-[var(--tbl-cell-disabled-fg)]',
};

const cellToneStyles: Record<CellTone, string> = {
  none: '',
  muted: 'bg-[var(--tbl-tone-muted-bg)] text-[var(--tbl-tone-muted-fg)]',
  info: 'bg-[var(--tbl-tone-info-bg)] text-[var(--tbl-tone-info-fg)]',
  warning: 'bg-[var(--tbl-tone-warning-bg)] text-[var(--tbl-tone-warning-fg)]',
  danger: 'bg-[var(--tbl-tone-danger-bg)] text-[var(--tbl-tone-danger-fg)]',
};

/** Tone is an accent on the resting state; an explicit state always wins. */
function stateClassName(state: CellState, tone: CellTone) {
  return state === 'default' ? cn(cellStateStyles[state], cellToneStyles[tone]) : cellStateStyles[state];
}

function CellContent({ type, truncate, children }: { type: CellType; truncate: boolean; children: ReactNode }) {
  const rightAligned = type === 'number' || type === 'text-dropdown';
  const centerAligned = type === 'checkbox';
  const compound = type === 'text-tag' || type === 'text-button' || type === 'icon-text';

  return (
    <div
      className={cn(
        'flex h-full items-center',
        rightAligned && 'justify-end',
        centerAligned && 'justify-center',
        compound && 'gap-2',
        // The ellipsis has to live on the element holding the text, not the cell.
        // Controls are never truncated — that would let them shrink.
        truncate &&
          !centerAligned &&
          'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [&>*]:min-w-0 [&>*]:truncate',
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Class for the scroll container that wraps the `<table>`. */
  wrapperClassName?: string;
  /** Style for the sizing box between the scroll container and the table. */
  contentStyle?: CSSProperties;
  /**
   * Caps the scroll container's height, turning on vertical scrolling. Required
   * for a sticky header or virtualisation to have anything to scroll against.
   */
  maxHeight?: number | string;
  /** Ref for the scroll container — virtualisation measures against it. */
  scrollRef?: Ref<HTMLDivElement>;
}

/** Scrollable wrapper plus the `<table>` element. */
export const Table = ({
  className,
  wrapperClassName,
  contentStyle,
  maxHeight,
  scrollRef,
  children,
  ...props
}: PropsWithChildren<TableProps>) => (
  <div
    ref={scrollRef}
    className={cn(
      'w-full overflow-auto rounded-[var(--tbl-radius)]',
      'border-[length:var(--tbl-border-width)] border-[var(--tbl-border)]',
      wrapperClassName,
    )}
    style={maxHeight === undefined ? undefined : { maxHeight }}
  >
    <div className='min-w-full' style={contentStyle}>
      {/*
        border-separate, not border-collapse: collapsed borders are painted by
        the table, so they vanish from sticky cells. Every cell draws only its
        own bottom and right edge, so nothing doubles up.
      */}
      <table className={cn('w-full min-w-max border-separate border-spacing-0 text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  </div>
);

export const TableHeader = ({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) => (
  <thead className={className} {...props}>
    {children}
  </thead>
);

export const TableBody = ({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
  disabled?: boolean;
  hoverable?: boolean;
}

export const TableRow = ({
  className,
  selected,
  clickable,
  disabled,
  hoverable,
  onClick,
  onKeyDown,
  tabIndex,
  children,
  ...props
}: PropsWithChildren<TableRowProps>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || !clickable || !onClick) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Ignore keys bubbling up from a button or input inside the row.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.currentTarget.click();
  };

  return (
    <tr
      className={cn(
        BORDER_B,
        'last:border-b-0',
        selected && 'bg-[var(--tbl-row-selected-bg)] [&>td]:bg-[var(--tbl-row-selected-bg)]',
        disabled && [
          'bg-[var(--tbl-row-disabled-bg)] text-[var(--tbl-row-disabled-fg)]',
          '[&>td]:bg-[var(--tbl-row-disabled-bg)] [&>td]:text-[var(--tbl-row-disabled-fg)]',
          '[&>th]:bg-[var(--tbl-row-disabled-bg)] [&>th]:text-[var(--tbl-row-disabled-fg)]',
        ],
        hoverable && !selected && !disabled && 'hover:bg-[var(--tbl-row-hover-bg)]',
        clickable &&
          !disabled && [
            'cursor-pointer hover:bg-[var(--tbl-row-clickable-hover-bg)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
            'focus-visible:ring-[var(--tbl-focus-ring)]',
          ],
        hoverable && 'group',
        className,
      )}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? undefined : clickable ? (tabIndex ?? 0) : tabIndex}
      {...props}
    >
      {children}
    </tr>
  );
};

/* ------------------------------------------------------------------ */
/* Header cell                                                         */
/* ------------------------------------------------------------------ */

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  type?: HeaderType;
  line?: boolean;
  rightStroke?: boolean;
}

export const TableHead = ({
  className,
  scope,
  type = 'text',
  line = true,
  rightStroke = true,
  children,
  ...props
}: PropsWithChildren<TableHeadProps>) => (
  <th
    className={cn(
      'h-[var(--tbl-row-height)] text-left font-normal',
      'bg-[var(--tbl-header-bg)] text-[var(--tbl-header-fg)]',
      headerTypeStyles[type],
      line ? BORDER_B : 'border-b-0',
      rightStroke ? cn(BORDER_R, 'last:border-r-0') : 'border-r-0',
      className,
    )}
    scope={scope ?? 'col'}
    {...props}
  >
    {children}
  </th>
);

/* ------------------------------------------------------------------ */
/* Body cell                                                           */
/* ------------------------------------------------------------------ */

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement>, CellVariantProps {
  truncate?: boolean;
}

/** Shared class computation for `<td>` and row-header `<th>`. */
function bodyCellClassName({
  type,
  state,
  tone,
  line,
  rightStroke,
  truncate,
  className,
}: Required<Omit<CellVariantProps, 'line' | 'rightStroke'>> & {
  line: boolean;
  rightStroke: boolean;
  truncate: boolean;
  className?: string;
}) {
  return cn(
    'h-[var(--tbl-row-height)] font-normal',
    cellTypeStyles[type],
    stateClassName(state, tone),
    state === 'default' && 'group-hover:bg-[var(--tbl-cell-hover-bg)]',
    line ? BORDER_B : 'border-b-0',
    rightStroke ? cn(BORDER_R, 'last:border-r-0') : 'border-r-0',
    truncate && 'overflow-hidden text-ellipsis whitespace-nowrap',
    className,
  );
}

export const TableCell = ({
  className,
  truncate = true,
  type = 'text',
  state = 'default',
  tone = 'none',
  line = true,
  rightStroke = true,
  children,
  ...props
}: PropsWithChildren<TableCellProps>) => (
  <td className={bodyCellClassName({ type, state, tone, line, rightStroke, truncate, className })} {...props}>
    <CellContent type={type} truncate={truncate}>
      {children}
    </CellContent>
  </td>
);

export interface TableRowHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement>, CellVariantProps {
  truncate?: boolean;
}

/** A `<th scope="row">` styled like a body cell — for tables with a leading label column. */
export const TableRowHeaderCell = ({
  className,
  scope,
  truncate = true,
  type = 'text',
  state = 'default',
  tone = 'none',
  line = true,
  rightStroke = true,
  children,
  ...props
}: PropsWithChildren<TableRowHeaderCellProps>) => (
  <th
    className={bodyCellClassName({ type, state, tone, line, rightStroke, truncate, className })}
    scope={scope ?? 'row'}
    {...props}
  >
    <CellContent type={type} truncate={truncate}>
      {children}
    </CellContent>
  </th>
);

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHead.displayName = 'TableHead';
TableCell.displayName = 'TableCell';
TableRowHeaderCell.displayName = 'TableRowHeaderCell';
