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

/* Column definition types and the ColumnMeta / TableMeta augmentation. */
export type { TableCellEdit, TableColumnDef, TableColumnMeta } from './column-meta';

/* Data-driven table — TanStack Table wired to the primitives above. */
export {
  DataTable,
  createSelectionColumn,
  SELECTION_COLUMN_ID,
  type DataTableProps,
  type RowSelectionOptions,
  type TableComponents,
  type TableLabels,
  type TablePaginationOptions,
  type VirtualOptions,
} from './data-table';

/* Row expansion. */
export {
  Expander,
  createExpanderColumn,
  EXPANDER_COLUMN_ID,
  type ExpanderProps,
} from './components/expander';

/* Inline editing — use as a `cell` renderer with DataTable's `onCellEdit`. */
export { EditableCell, type EditableCellProps } from './components/editable-cell';

/* Default slot components — swap them out via `<DataTable components={...} />`. */
export { TableCheckbox, CheckboxIcon, CHECKBOX_SIZE, type TableCheckboxProps } from './components/checkbox';
export { SortIcon, type SortIconProps } from './components/icons';
export { TablePagination, type PaginationLabels, type PaginationProps } from './components/pagination';

/* Utility, exported so consumers can compose class names the same way. */
export { cn } from './lib/utils';

/* Re-exported TanStack types, so consumers need not add a second import. */
export type {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnResizeMode,
  ColumnSizingState,
  ExpandedState,
  Header,
  OnChangeFn,
  Row,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
