import {
  type Cell,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type ComponentType, useMemo, useState } from 'react';
import { TableCheckbox, type TableCheckboxProps } from './components/checkbox';
import { SortIcon, type SortIconProps } from './components/icons';
import { type PaginationLabels, TablePagination } from './components/pagination';
import { cn } from './lib/utils';
import {
  type Align,
  type CellState,
  type CellTone,
  type CellType,
  type HeaderType,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHeaderCell,
} from './table';

/* ------------------------------------------------------------------ */
/* Column meta                                                         */
/* ------------------------------------------------------------------ */

export interface TableColumnMeta {
  /** Alignment for body cells. Defaults to `right` when `numeric`, else `left`. */
  align?: Align;
  /** Alignment for the header cell. Defaults to `align`. */
  headerAlign?: Align;
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  /** Renders a `*` before the header text. */
  required?: boolean;
  /** Shorthand for right-aligning and using the `number` cell type. */
  numeric?: boolean;
  /** Clip overflowing content with an ellipsis. Defaults to `true`. */
  truncate?: boolean;
  /** Render body cells as `<th scope="row">` instead of `<td>`. */
  rowHeader?: boolean;
  type?: CellType;
  state?: CellState;
  tone?: CellTone;
  line?: boolean;
  rightStroke?: boolean;
  headerType?: HeaderType;
  headerLine?: boolean;
}

declare module '@tanstack/react-table' {
  // TanStack's module augmentation requires the same generic parameters.
  interface ColumnMeta<TData extends RowData, TValue> extends TableColumnMeta {}
}

export type TableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue>;

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface TableLabels {
  loading: string;
  empty: string;
  selectAll: string;
  /** Accessible name for a row's selection checkbox. */
  selectRow: string;
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
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Skip client-side sorting; you sort on the server. */
  manualSorting?: boolean;
  enableSorting?: boolean;
  /** Renders pagination below the table. Omit to render it yourself. */
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

function sizeStyle(meta?: TableColumnMeta) {
  return { width: meta?.width, minWidth: meta?.minWidth, maxWidth: meta?.maxWidth };
}

function numericSize(value: number | string | undefined) {
  return typeof value === 'number' ? value : 0;
}

/**
 * Column definition for a selection checkbox column. Renders both the header
 * select-all box and the per-row box, so the two never drift apart.
 */
/** Column id the selection helper uses; `DataTable` keys its built-in checkbox off it. */
export const SELECTION_COLUMN_ID = 'select';

export function createSelectionColumn<TData>(overrides?: Partial<TableColumnDef<TData>>): TableColumnDef<TData> {
  return {
    id: SELECTION_COLUMN_ID,
    header: '',
    enableSorting: false,
    meta: { headerType: 'checkbox', type: 'checkbox', width: 48, truncate: false },
    ...overrides,
  } as TableColumnDef<TData>;
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

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const isSortingControlled = sorting !== undefined;
  const currentSorting = sorting ?? internalSorting;

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (!isSortingControlled) {
      setInternalSorting((previous) => functionalUpdate(updater, previous));
    }
    onSortingChange?.(updater);
  };

  const selectionState = useMemo<RowSelectionState>(
    () => Object.fromEntries((rowSelection?.selectedIds ?? []).map((id) => [id, true])),
    [rowSelection?.selectedIds],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting: currentSorting, rowSelection: selectionState },
    enableSorting,
    enableRowSelection: (row) => rowSelection != null && !getRowDisabled?.(row.original),
    onSortingChange: handleSortingChange,
    onRowSelectionChange: (updater) => {
      if (!rowSelection) return;
      const next = functionalUpdate(updater, selectionState);
      rowSelection.onChange(Object.keys(next).filter((id) => next[id]));
    },
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
  });

  const leafColumns = table.getAllLeafColumns();
  const colSpan = Math.max(1, leafColumns.length);
  const tableMinWidth = leafColumns.reduce(
    (total, column) => total + numericSize(column.columnDef.meta?.width ?? column.columnDef.meta?.minWidth),
    0,
  );

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

  const renderTable = (
    <Table
      aria-busy={loading || undefined}
      className={cn('table-fixed', className)}
      wrapperClassName={wrapperClassName}
      contentStyle={tableMinWidth > 0 ? { minWidth: tableMinWidth } : undefined}
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className='border-b-0'>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta;
              const sorted = header.column.getIsSorted();
              const canSort = header.column.getCanSort();
              const type = meta?.headerType ?? (canSort ? 'sort' : meta?.numeric ? 'number' : 'text');
              const align = headerAlign(meta);

              const content = (
                <>
                  {meta?.required && <span className='text-[var(--tbl-required-fg)]'>*</span>}
                  <span className={cn(meta?.truncate !== false && 'truncate')}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                  className={cn(alignClassName[align], meta?.truncate !== false && 'max-w-0 truncate')}
                  style={sizeStyle(meta)}
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                >
                  {header.isPlaceholder ? null : type === 'checkbox' ? (
                    <div className={cn('flex h-full w-full items-center justify-center')}>
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
                        'flex h-full w-full cursor-pointer select-none items-center gap-1 [font:inherit] text-inherit',
                        justifyClassName[align],
                        'hover:text-[var(--tbl-header-fg-hover)]',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={cn('flex h-full w-full items-center gap-1', justifyClassName[align])}>
                      {content}
                    </div>
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
          rows.map((row) => (
            <DataRow
              key={row.id}
              row={row}
              labels={labels}
              Checkbox={Checkbox}
              disabled={getRowDisabled?.(row.original) ?? false}
              onRowClick={onRowClick}
              className={getRowClassName?.(row.original)}
            />
          ))
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
  const meta = cell.column.columnDef.meta;
  const state: CellState = disabled ? 'disabled' : selected ? 'selected' : (meta?.state ?? 'default');
  const type = meta?.type ?? (meta?.numeric ? 'number' : 'text');

  const shared = {
    type,
    state,
    tone: meta?.tone ?? 'none',
    line: meta?.line ?? true,
    rightStroke: meta?.rightStroke ?? true,
    className: cn(alignClassName[cellAlign(meta)], meta?.truncate !== false && 'max-w-0 truncate'),
    style: sizeStyle(meta),
    truncate: meta?.truncate,
  } as const;

  // The selection column renders its own checkbox, so callers never have to.
  const isSelectionCell = cell.column.id === SELECTION_COLUMN_ID && meta?.type === 'checkbox';

  const content = isSelectionCell ? (
    <Checkbox
      checked={selected}
      label={labels.selectRow}
      disabled={!row.getCanSelect()}
      onChange={(checked) => row.toggleSelected(checked)}
    />
  ) : (
    flexRender(cell.column.columnDef.cell, cell.getContext())
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
