/**
 * Keyboard navigation between editable cells, spreadsheet style.
 *
 * Participating controls carry `data-tbl-cell-nav`; everything here works off
 * the rendered DOM rather than a registry, so virtualised rows, hidden columns
 * and reordered columns are all handled without extra bookkeeping.
 */

export type NavDirection = 'up' | 'down' | 'left' | 'right';

const SELECTOR = '[data-tbl-cell-nav]';

/** The attribute to spread onto a control that should join the grid. */
export const CELL_NAV_ATTR = { 'data-tbl-cell-nav': '' } as const;

function navTarget(cell: Element | null | undefined): HTMLElement | null {
  return (cell?.querySelector(SELECTOR) as HTMLElement | null) ?? null;
}

function bodyRows(table: HTMLTableElement): HTMLTableRowElement[] {
  // Only tbody rows: the header has no editable cells, and a spacer row from
  // virtualisation has no cells to land on.
  return Array.from(table.tBodies).flatMap((body) => Array.from(body.rows));
}

/** Scans a row outwards from `start` for a focusable control. */
function scanRow(row: HTMLTableRowElement, start: number, step: 1 | -1): HTMLElement | null {
  for (let index = start; index >= 0 && index < row.cells.length; index += step) {
    const found = navTarget(row.cells[index]);
    if (found) return found;
  }
  return null;
}

/**
 * Moves focus to the nearest editable cell in `direction`.
 * Returns true when focus actually moved, so the caller knows whether to
 * swallow the key or let the browser handle it.
 */
export function focusNeighbour(from: HTMLElement, direction: NavDirection): boolean {
  const cell = from.closest('td, th') as HTMLTableCellElement | null;
  const row = cell?.closest('tr') as HTMLTableRowElement | null;
  const table = row?.closest('table') as HTMLTableElement | null;
  if (!cell || !row || !table) return false;

  const rows = bodyRows(table);
  const rowIndex = rows.indexOf(row);
  if (rowIndex === -1) return false;
  const column = cell.cellIndex;

  if (direction === 'left' || direction === 'right') {
    const step = direction === 'right' ? 1 : -1;
    const sameRow = scanRow(row, column + step, step);
    if (sameRow) {
      sameRow.focus();
      return true;
    }
    // Past the edge of the row, wrap to the next line like a text cursor.
    const nextRow = rows[rowIndex + step];
    if (!nextRow) return false;
    const wrapped = scanRow(nextRow, step === 1 ? 0 : nextRow.cells.length - 1, step);
    if (!wrapped) return false;
    wrapped.focus();
    return true;
  }

  // Vertical movement stays in the column, skipping rows that have nothing
  // editable there (a sub-row panel, a group row, a read-only cell).
  const step = direction === 'down' ? 1 : -1;
  for (let index = rowIndex + step; index >= 0 && index < rows.length; index += step) {
    const candidate = navTarget(rows[index]?.cells[column]);
    if (candidate) {
      candidate.focus();
      return true;
    }
  }
  return false;
}

/** Maps a keyboard event to a direction, or null when the key is not a move. */
export function directionForKey(key: string, shiftKey: boolean): NavDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'Tab':
      return shiftKey ? 'left' : 'right';
    default:
      return null;
  }
}
