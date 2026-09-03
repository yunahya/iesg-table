import {
  type Cell,
  type Column,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnResizeMode,
  type ColumnSizingState,
  type ExpandedState,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type ComponentType, type ReactNode, useMemo, useRef } from 'react';
import type { TableCellEdit, TableColumnDef, TableColumnMeta } from './column-meta';
import { TableCheckbox, type TableCheckboxProps } from './components/checkbox';
import { EXPANDER_COLUMN_ID, Expander } from './components/expander';
import { SortIcon, type SortIconProps } from './components/icons';
import { type PaginationLabels, TablePagination } from './components/pagination';
import { useControllable } from './lib/controllable';
import { cn } from './lib/utils';
import {
  type Align,
  type CellState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHeaderCell,
} from './table';

export type { TableCellEdit, TableColumnDef, TableColumnMeta } from './column-meta';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface TableLabels {
  loading: string;
  empty: string;
  selectAll: string;
  /** Accessible name for a row's selection checkbox. */
  selectRow: string;
  /** Accessible name for the expand/collapse control. */
  expandRow?: string;
}

export interface RowSelectionOptions {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /**
   * What the header checkbox selects.
   * - `page` (default): only rows currently rendered. Correct for server-side pagination.
   * - `all`: delegates to `onSelectAll`, so you can select across pages.
   */
  selectAllMode?: 'page' | 'all';
  /** Required when `selectAllMode` is `all`. */
  onSelectAll?: (checked: boolean) => void;
  /** Total selectable rows across all pages; used to render the header checkbox state in `all` mode. */
  totalSelectableCount?: number;
}

export interface TablePaginationOptions {
  page: number;
  pageSize: number;
  totalCount: number;
  labels: PaginationLabels;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface VirtualOptions {
  /** Row height used before measurement. Defaults to the 40px row height. */
  estimateRowHeight?: number;
  /** Rows rendered beyond the viewport. Defaults to 8. */
  overscan?: number;
}

/** Slots for swapping in your own design-system components. */
export interface TableComponents {
  Checkbox: ComponentType<TableCheckboxProps>;
  SortIcon: ComponentType<SortIconProps>;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: TableColumnDef<TData>[];
  /** Stable row identity. Also the key used in `rowSelection.selectedIds`. */
  getRowId: (row: TData, index: number) => string;
  labels: TableLabels;
  loading?: boolean;
  rowSelection?: RowSelectionOptions;

  /* sorting */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Skip client-side sorting; you sort on the server. */
  manualSorting?: boolean;
  enableSorting?: boolean;

  /* filtering */
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  /** Skip client-side filtering; you filter on the server. */
  manualFiltering?: boolean;

  /* column visibility */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  /* expansion */
  /** Return a row's children to build a tree. Include `createExpanderColumn()`. */
  getSubRows?: (row: TData) => TData[] | undefined;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  /**
   * Renders a full-width panel under an expanded row. Not compatible with
   * virtualisation — a panel breaks the fixed row-to-index mapping.
   */
  renderSubRow?: (row: Row<TData>) => ReactNode;

  /* resizing */
  enableColumnResizing?: boolean;
  /** `onChange` (default) resizes live; `onEnd` waits for pointer release. */
  columnResizeMode?: ColumnResizeMode;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  /* pinning */
  columnPinning?: ColumnPinningState;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;

  /* scrolling */
  /** Freezes the header row while the body scrolls. Needs `maxHeight`. */
  stickyHeader?: boolean;
  /** Caps the scroll container height. Required for sticky header / virtualisation. */
  maxHeight?: number | string;
  /** Renders only the visible rows. Needs `maxHeight`. */
  virtual?: boolean | VirtualOptions;

  /* editing */
  /** Enables `EditableCell` renderers. Called on every committed edit. */
  onCellEdit?: (edit: TableCellEdit<TData>) => void;

  pagination?: TablePaginationOptions;
  onRowClick?: (row: TData) => void;
  getRowDisabled?: (row: TData) => boolean;
  getRowClassName?: (row: TData) => string | undefined;
  components?: Partial<TableComponents>;
  className?: string;
  wrapperClassName?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const alignClassName: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const justifyClassName: Record<Align, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

function headerAlign(meta?: TableColumnMeta): Align {
  return meta?.headerAlign ?? meta?.align ?? (meta?.numeric ? 'right' : 'left');
}

function cellAlign(meta?: TableColumnMeta): Align {
  return meta?.align ?? (meta?.numeric ? 'right' : 'left');
}

function numeric(value: number | string | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export const SELECTION_COLUMN_ID = 'select';

/**
 * Column definition for a selection checkbox column. Renders both the header
 * select-all box and the per-row box, so the two never drift apart.
 */
export function createSelectionColumn<TData>(overrides?: Partial<TableColumnDef<TData>>): TableColumnDef<TData> {
  return {
    id: SELECTION_COLUMN_ID,
    header: '',
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    meta: { headerType: 'checkbox', type: 'checkbox', width: 50, minWidth: 50, truncate: false },
    ...overrides,
  } as TableColumnDef<TData>;
}

/** Sticky offsets and the divider shadow for a pinned column. */
function pinStyle<TData>(column: Column<TData, unknown>) {
  const pinned = column.getIsPinned();
  if (!pinned) return undefined;
  if (pinned === 'left') {
    return {
      left: column.getStart('left'),
      boxShadow: column.getIsLastColumn('left') ? 'var(--tbl-pinned-shadow)' : undefined,
    };
  }
  return {
    right: column.getAfter('right'),
    boxShadow: column.getIsFirstColumn('right') ? 'var(--tbl-pinned-shadow-right)' : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  labels,
  loading = false,
  rowSelection,
  sorting,
  onSortingChange,
  manualSorting = false,
  enableSorting = true,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  manualFiltering = false,
  columnVisibility,
  onColumnVisibilityChange,
  getSubRows,
  expanded,
  onExpandedChange,
  renderSubRow,
  enableColumnResizing = false,
  columnResizeMode = 'onChange',
  columnSizing,
  onColumnSizingChange,
  columnPinning,
  onColumnPinningChange,
  stickyHeader = false,
  maxHeight,
  virtual = false,
  onCellEdit,
  pagination,
  onRowClick,
  getRowDisabled,
  getRowClassName,
  components,
  className,
  wrapperClassName,
}: DataTableProps<TData>) {
  const Checkbox = components?.Checkbox ?? TableCheckbox;
  const Sort = components?.SortIcon ?? SortIcon;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentSorting, handleSortingChange] = useControllable<SortingState>(sorting, [], onSortingChange);
  const [currentGlobalFilter, handleGlobalFilterChange] = useControllable<string>(
    globalFilter,
    '',
    onGlobalFilterChange,
  );
  const [currentColumnFilters, handleColumnFiltersChange] = useControllable<ColumnFiltersState>(
    columnFilters,
    [],
    onColumnFiltersChange,
  );
  const [currentVisibility, handleVisibilityChange] = useControllable<VisibilityState>(
    columnVisibility,
    {},
    onColumnVisibilityChange,
  );
  const [currentExpanded, handleExpandedChange] = useControllable<ExpandedState>(expanded, {}, onExpandedChange);
  const [currentSizing, handleSizingChange] = useControllable<ColumnSizingState>(
    columnSizing,
    {},
    onColumnSizingChange,
  );
  const [currentPinning, handlePinningChange] = useControllable<ColumnPinningState>(
    columnPinning,
    { left: [], right: [] },
    onColumnPinningChange,
  );

  const selectionState = useMemo<RowSelectionState>(
    () => Object.fromEntries((rowSelection?.selectedIds ?? []).map((id) => [id, true])),
    [rowSelection?.selectedIds],
  );

  // meta.width is the single source of truth for width; feed it into TanStack's
  // column sizing so resizing, pinning offsets and <col> all agree.
  const sizedColumns = useMemo(
    () =>
      columns.map((column) => {
        const meta = column.meta as TableColumnMeta | undefined;
        const size = numeric(meta?.width);
        const minSize = numeric(meta?.minWidth);
        const maxSize = numeric(meta?.maxWidth);
        return {
          ...column,
          ...(size === undefined ? {} : { size }),
          ...(minSize === undefined ? {} : { minSize }),
          ...(maxSize === undefined ? {} : { maxSize }),
        };
      }),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: sizedColumns,
    getRowId,
    getSubRows,
    state: {
      sorting: currentSorting,
      rowSelection: selectionState,
      globalFilter: currentGlobalFilter,
      columnFilters: currentColumnFilters,
      columnVisibility: currentVisibility,
      expanded: currentExpanded,
      columnSizing: currentSizing,
      columnPinning: currentPinning,
    },
    enableSorting,
    enableColumnResizing,
    columnResizeMode,
    enableRowSelection: (row) => rowSelection != null && !getRowDisabled?.(row.original),
    onSortingChange: handleSortingChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleVisibilityChange,
    onExpandedChange: handleExpandedChange,
    onColumnSizingChange: handleSizingChange,
    onColumnPinningChange: handlePinningChange,
    onRowSelectionChange: (updater) => {
      if (!rowSelection) return;
      const next = functionalUpdate(updater, selectionState);
      rowSelection.onChange(Object.keys(next).filter((id) => next[id]));
    },
    manualSorting,
    manualFiltering,
    meta: { updateCell: onCellEdit },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const leafColumns = table.getVisibleLeafColumns();
  const colSpan = Math.max(1, leafColumns.length);
  const hasPinned = (currentPinning.left?.length ?? 0) + (currentPinning.right?.length ?? 0) > 0;
  // Explicit widths only become mandatory once sizing actually drives layout.
  const sizingActive = enableColumnResizing || hasPinned;
  const totalWidth = sizingActive
    ? table.getTotalSize()
    : leafColumns.reduce((sum, column) => {
        const meta = column.columnDef.meta;
        return sum + (numeric(meta?.width ?? meta?.minWidth) ?? 0);
      }, 0);

  const rows = table.getRowModel().rows;
  const selectableRows = rows.filter((row) => row.getCanSelect());
  const selectedOnPage = selectableRows.filter((row) => row.getIsSelected());

  const selectAllMode = rowSelection?.selectAllMode ?? 'page';
  const selectableTotal =
    selectAllMode === 'all' ? (rowSelection?.totalSelectableCount ?? selectableRows.length) : selectableRows.length;
  const selectedTotal = selectAllMode === 'all' ? (rowSelection?.selectedIds.length ?? 0) : selectedOnPage.length;

  const allSelected = selectableTotal > 0 && selectedTotal >= selectableTotal;
  const someSelected = selectedTotal > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return;
    if (selectAllMode === 'all') {
      rowSelection.onSelectAll?.(checked);
      return;
    }
    rowSelection.onChange(checked ? selectableRows.map((row) => row.id) : []);
  };

  /* ---------------- virtualisation ---------------- */

  const virtualOptions: VirtualOptions | null = virtual === false ? null : virtual === true ? {} : virtual;
  const virtualizer = useVirtualizer({
    count: virtualOptions ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => virtualOptions?.estimateRowHeight ?? 40,
    overscan: virtualOptions?.overscan ?? 8,
    enabled: virtualOptions != null,
  });

  const virtualItems = virtualOptions ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom =
    virtualItems.length > 0 ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0) : 0;
  const visibleRows = virtualOptions
    ? virtualItems.map((item) => rows[item.index]).filter((row): row is Row<TData> => row != null)
    : rows;

  /* ---------------- render ---------------- */

  const renderRow = (row: Row<TData>): ReactNode[] => {
    const disabled = getRowDisabled?.(row.original) ?? false;
    const body = (
      <DataRow
        key={row.id}
        row={row}
        labels={labels}
        Checkbox={Checkbox}
        disabled={disabled}
        onRowClick={onRowClick}
        className={getRowClassName?.(row.original)}
      />
    );

    if (!renderSubRow || !row.getIsExpanded()) return [body];

    return [
      body,
      <TableRow key={`${row.id}-sub`} className='border-b-0'>
        <TableCell colSpan={colSpan} truncate={false} rightStroke={false} className='bg-[var(--tbl-subrow-bg)] p-0'>
          {renderSubRow(row)}
        </TableCell>
      </TableRow>,
    ];
  };

  const renderTable = (
    <Table
      aria-busy={loading || undefined}
      className={cn('table-fixed min-w-full', className)}
      wrapperClassName={wrapperClassName}
      contentStyle={totalWidth > 0 ? { minWidth: totalWidth } : undefined}
      maxHeight={maxHeight}
      scrollRef={scrollRef}
    >
      <colgroup>
        {leafColumns.map((column) => {
          const meta = column.columnDef.meta;
          const width = sizingActive ? column.getSize() : (meta?.width ?? meta?.minWidth);
          return <col key={column.id} style={width === undefined ? undefined : { width }} />;
        })}
      </colgroup>

      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className='border-b-0'>
            {headerGroup.headers.map((header) => {
              const column = header.column;
              const meta = column.columnDef.meta;
              const sorted = column.getIsSorted();
              const canSort = column.getCanSort();
              const type = meta?.headerType ?? (canSort ? 'sort' : meta?.numeric ? 'number' : 'text');
              const align = headerAlign(meta);
              const pinned = column.getIsPinned();

              const content = (
                <>
                  {meta?.required && <span className='text-[var(--tbl-required-fg)]'>*</span>}
                  <span className={cn(meta?.truncate !== false && 'truncate')}>
                    {flexRender(column.columnDef.header, header.getContext())}
                  </span>
                  {type === 'sort' && <Sort direction={sorted} />}
                </>
              );

              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  type={type}
                  line={meta?.headerLine ?? true}
                  rightStroke={meta?.rightStroke ?? true}
                  className={cn(
                    alignClassName[align],
                    meta?.truncate !== false && 'max-w-0 truncate',
                    enableColumnResizing && 'relative',
                    // Sticky cells must be opaque or the rows show through.
                    (stickyHeader || pinned) && 'bg-[var(--tbl-sticky-header-bg)]',
                    stickyHeader && 'sticky top-0 z-20',
                    pinned && 'sticky',
                    pinned && (stickyHeader ? 'z-30' : 'z-20'),
                  )}
                  style={pinStyle(column)}
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                >
                  {header.isPlaceholder ? null : type === 'checkbox' ? (
                    <div className='flex h-full w-full items-center justify-center'>
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        label={labels.selectAll}
                        disabled={!rowSelection || selectableTotal === 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  ) : canSort ? (
                    <button
                      type='button'
                      className={cn(
                        'flex h-full w-full cursor-pointer select-none items-center gap-1 text-inherit [font:inherit]',
                        justifyClassName[align],
                        'hover:text-[var(--tbl-header-fg-hover)]',
                      )}
                      onClick={column.getToggleSortingHandler()}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={cn('flex h-full w-full items-center gap-1', justifyClassName[align])}>
                      {content}
                    </div>
                  )}

                  {enableColumnResizing && column.getCanResize() && (
                    <button
                      type='button'
                      tabIndex={-1}
                      aria-label={`resize ${column.id}`}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      onClick={(event) => event.stopPropagation()}
                      className={cn(
                        'absolute top-0 right-0 h-full cursor-col-resize touch-none select-none',
                        'w-[var(--tbl-resize-handle-width)] bg-[var(--tbl-resize-handle)]',
                        'hover:bg-[var(--tbl-resize-handle-hover)]',
                        column.getIsResizing() && 'bg-[var(--tbl-resize-handle-active)]',
                      )}
                    />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>

      <TableBody>
        {loading ? (
          <StatusRow colSpan={colSpan} label={labels.loading} />
        ) : rows.length === 0 ? (
          <StatusRow colSpan={colSpan} label={labels.empty} />
        ) : (
          <>
            {paddingTop > 0 && <SpacerRow colSpan={colSpan} height={paddingTop} />}
            {visibleRows.flatMap(renderRow)}
            {paddingBottom > 0 && <SpacerRow colSpan={colSpan} height={paddingBottom} />}
          </>
        )}
      </TableBody>
    </Table>
  );

  if (!pagination) return renderTable;

  return (
    <div className='flex flex-col gap-2'>
      {renderTable}
      <TablePagination {...pagination} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

interface DataRowProps<TData> {
  row: Row<TData>;
  labels: TableLabels;
  Checkbox: ComponentType<TableCheckboxProps>;
  disabled: boolean;
  onRowClick?: (row: TData) => void;
  className?: string;
}

function DataRow<TData>({ row, labels, Checkbox, disabled, onRowClick, className }: DataRowProps<TData>) {
  const selected = row.getIsSelected();

  return (
    <TableRow
      selected={selected}
      clickable={onRowClick != null}
      disabled={disabled}
      hoverable
      className={cn('border-b-0', className)}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <DataCell
          key={cell.id}
          cell={cell}
          row={row}
          labels={labels}
          Checkbox={Checkbox}
          selected={selected}
          disabled={disabled}
        />
      ))}
    </TableRow>
  );
}

interface DataCellProps<TData> {
  cell: Cell<TData, unknown>;
  row: Row<TData>;
  labels: TableLabels;
  Checkbox: ComponentType<TableCheckboxProps>;
  selected: boolean;
  disabled: boolean;
}

function DataCell<TData>({ cell, row, labels, Checkbox, selected, disabled }: DataCellProps<TData>) {
  const column = cell.column;
  const meta = column.columnDef.meta;
  const state: CellState = disabled ? 'disabled' : selected ? 'selected' : (meta?.state ?? 'default');
  const type = meta?.type ?? (meta?.numeric ? 'number' : 'text');
  const pinned = column.getIsPinned();

  const shared = {
    type,
    state,
    tone: meta?.tone ?? 'none',
    line: meta?.line ?? true,
    rightStroke: meta?.rightStroke ?? true,
    className: cn(
      alignClassName[cellAlign(meta)],
      meta?.truncate !== false && 'max-w-0 truncate',
      pinned && 'sticky z-10',
    ),
    style: pinStyle(column),
    truncate: meta?.truncate,
  } as const;

  const isSelectionCell = column.id === SELECTION_COLUMN_ID && meta?.type === 'checkbox';
  const isExpanderCell = column.id === EXPANDER_COLUMN_ID;

  const content = isSelectionCell ? (
    <Checkbox
      checked={selected}
      label={labels.selectRow}
      disabled={!row.getCanSelect()}
      onChange={(checked) => row.toggleSelected(checked)}
    />
  ) : isExpanderCell ? (
    <Expander
      expanded={row.getIsExpanded()}
      canExpand={row.getCanExpand()}
      onToggle={row.getToggleExpandedHandler()}
      label={labels.expandRow ?? 'expand row'}
      depth={row.depth}
    />
  ) : (
    flexRender(column.columnDef.cell, cell.getContext())
  );

  if (meta?.rowHeader) {
    return (
      <TableRowHeaderCell scope='row' {...shared}>
        {content}
      </TableRowHeaderCell>
    );
  }

  return <TableCell {...shared}>{content}</TableCell>;
}

function StatusRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className='h-20 text-center text-[var(--tbl-empty-fg)]' rightStroke={false}>
        <output aria-live='polite'>{label}</output>
      </TableCell>
    </TableRow>
  );
}

/** Keeps the scroll height correct for the rows virtualisation skipped. */
function SpacerRow({ colSpan, height }: { colSpan: number; height: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ height }} />
    </tr>
  );
}
