import type { ColumnDef, RowData } from '@tanstack/react-table';
import type { Align, CellState, CellTone, CellType, HeaderType } from './table';

export interface TableColumnMeta {
  /** Alignment for body cells. Defaults to `right` when `numeric`, else `left`. */
  align?: Align;
  /** Alignment for the header cell. Defaults to `align`. */
  headerAlign?: Align;
  /**
   * Column width. A number is authoritative — it is fed to TanStack's column
   * sizing and emitted as a `<col>`, so the browser cannot redistribute it.
   */
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

export interface TableCellEdit<TData = unknown> {
  rowId: string;
  columnId: string;
  value: unknown;
  row: TData;
}

declare module '@tanstack/react-table' {
  // TanStack's module augmentation requires the same generic parameters.
  interface ColumnMeta<TData extends RowData, TValue> extends TableColumnMeta {}

  interface TableMeta<TData extends RowData> {
    /** Set by `DataTable` from its `onCellEdit` prop; used by `EditableCell`. */
    updateCell?: (edit: TableCellEdit<TData>) => void;
  }
}

export type TableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue>;
