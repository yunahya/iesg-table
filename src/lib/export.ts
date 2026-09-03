import type { Cell, Row, Table } from '@tanstack/react-table';

export type ExportRowScope = 'filtered' | 'all' | 'selected' | 'page';

export interface CsvOptions<TData> {
  /** Which rows to write. Defaults to `filtered` — what the user is looking at. */
  rows?: ExportRowScope;
  /** Restricts and orders the columns. Defaults to the visible columns, in view order. */
  columnIds?: string[];
  /** Field separator. Use `\t` for a TSV. Defaults to `,`. */
  delimiter?: string;
  /** Write the header row. Defaults to `true`. */
  header?: boolean;
  /** Turns a cell into text. Defaults to `String(value)`, with `null`/`undefined` as empty. */
  formatValue?: (value: unknown, cell: Cell<TData, unknown>) => string;
  /**
   * Neutralises values Excel would evaluate as a formula by prefixing an
   * apostrophe. Defaults to `true` — leave it on unless the data is trusted.
   */
  sanitize?: boolean;
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeField(value: string, delimiter: string): string {
  const mustQuote = value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r');
  return mustQuote ? `"${value.replace(/"/g, '""')}"` : value;
}

function defaultFormat(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function scopedRows<TData>(table: Table<TData>, scope: ExportRowScope): Row<TData>[] {
  switch (scope) {
    case 'all':
      return table.getCoreRowModel().rows;
    case 'selected':
      return table.getSelectedRowModel().rows;
    case 'page':
      return table.getRowModel().rows;
    default:
      return table.getSortedRowModel().rows;
  }
}

/**
 * Rows as a plain string matrix — the header row first, then the data.
 * Hand this to SheetJS or exceljs when you need a real `.xlsx`.
 */
export function tableToMatrix<TData>(table: Table<TData>, options: CsvOptions<TData> = {}): string[][] {
  const { rows = 'filtered', columnIds, header = true, formatValue = defaultFormat, sanitize = true } = options;

  const visible = table.getVisibleLeafColumns();
  const pool = columnIds
    ? columnIds.map((id) => visible.find((column) => column.id === id)).filter((column) => column != null)
    : visible;

  // Display columns (checkbox, drag grip, expander) hold no value to export.
  const columns = pool.filter((column) => {
    const meta = column.columnDef.meta;
    if (meta?.exportable === false) return false;
    return columnIds != null || column.accessorFn != null;
  });

  const matrix: string[][] = [];

  if (header) {
    matrix.push(
      columns.map((column) => {
        const raw = column.columnDef.header;
        return column.columnDef.meta?.exportHeader ?? (typeof raw === 'string' ? raw : column.id);
      }),
    );
  }

  for (const row of scopedRows(table, rows)) {
    matrix.push(
      columns.map((column) => {
        const cell = row.getAllCells().find((candidate) => candidate.column.id === column.id);
        const meta = column.columnDef.meta;
        const value = meta?.exportValue ? meta.exportValue(row.original) : row.getValue(column.id);
        return cell ? formatValue(value, cell) : defaultFormat(value);
      }),
    );
  }

  // Sanitising here keeps `formatValue` free to return whatever it likes.
  return sanitize
    ? matrix.map((line) => line.map((field) => (FORMULA_PREFIX.test(field) ? `'${field}` : field)))
    : matrix;
}

/** Serialises the table to CSV text. Rows are separated by CRLF, as RFC 4180 asks. */
export function tableToCsv<TData>(table: Table<TData>, options: CsvOptions<TData> = {}): string {
  const delimiter = options.delimiter ?? ',';
  // tableToMatrix already sanitised; escaping only has to quote.
  return tableToMatrix(table, options)
    .map((line) => line.map((field) => escapeField(field, delimiter)).join(delimiter))
    .join('\r\n');
}

export interface DownloadOptions {
  /** Defaults to `table.csv`. */
  fileName?: string;
  /** Prepends a UTF-8 BOM so Excel reads Korean text correctly. Defaults to `true`. */
  bom?: boolean;
  mimeType?: string;
}

/** Triggers a browser download of already-serialised text. */
export function downloadText(text: string, options: DownloadOptions = {}): void {
  const { fileName = 'table.csv', bom = true, mimeType = 'text/csv;charset=utf-8' } = options;
  if (typeof document === 'undefined') return;

  const blob = new Blob([bom ? `﻿${text}` : text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Serialises and downloads in one call.
 *
 *   <button onClick={() => exportTableToCsv(tableRef.current!, { fileName: '배출량.csv' })}>
 */
export function exportTableToCsv<TData>(table: Table<TData>, options: CsvOptions<TData> & DownloadOptions = {}): void {
  downloadText(tableToCsv(table, options), options);
}
