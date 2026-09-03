/* Presentational primitives — use these to hand-build a table. */
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableRowHeaderCell,
  type Align,
  type CellState,
  type CellTone,
  type CellType,
  type CellVariantProps,
  type HeaderType,
  type TableProps,
  type TableRowProps,
  type TableHeadProps,
  type TableCellProps,
  type TableRowHeaderCellProps,
} from './table';

/* Data-driven table — TanStack Table wired to the primitives above. */
export {
  DataTable,
  createSelectionColumn,
  SELECTION_COLUMN_ID,
  type DataTableProps,
  type RowSelectionOptions,
  type TableColumnDef,
  type TableColumnMeta,
  type TableComponents,
  type TableLabels,
  type TablePaginationOptions,
} from './data-table';

/* Default slot components — swap them out via `<DataTable components={...} />`. */
export { TableCheckbox, type TableCheckboxProps } from './components/checkbox';
export { SortIcon, type SortIconProps } from './components/icons';
export { TablePagination, type PaginationLabels, type PaginationProps } from './components/pagination';

/* Utility, exported so consumers can compose class names the same way. */
export { cn } from './lib/utils';

/* Re-exported TanStack types, so consumers need not add a second import. */
export type { ColumnDef, Header, Row, SortingState, OnChangeFn } from '@tanstack/react-table';
