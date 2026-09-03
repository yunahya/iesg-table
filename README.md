# @iesg/table

A React data table built on [TanStack Table v8](https://tanstack.com/table). TanStack gives you the
logic and no markup; this package supplies the markup — accessible, keyboard-navigable, and
themeable end to end through CSS variables.

It ships with the i-ESG design system as its default look. Override any token to make it yours.

```bash
pnpm add @iesg/table @tanstack/react-table
```

Requires React 18 or 19 and Tailwind CSS v4. `@tanstack/react-virtual` is bundled as a dependency and
only does work when you turn virtualisation on.

## Setup

```css
/* app.css */
@import "tailwindcss";
@import "@iesg/table/styles.css";

/* Tailwind must scan the package for the classes it uses */
@source "../node_modules/@iesg/table/dist";
```

## Usage

```tsx
import { DataTable, createSelectionColumn, type TableColumnDef } from '@iesg/table';

type Emission = { id: string; category: string; amount: number };

const columns: TableColumnDef<Emission>[] = [
  createSelectionColumn<Emission>(),
  {
    accessorKey: 'category',
    header: 'Category',
    meta: { width: 240, required: true },
  },
  {
    accessorKey: 'amount',
    header: 'tCO₂eq',
    meta: { numeric: true, width: 140 },
    cell: (ctx) => ctx.getValue<number>().toLocaleString(),
  },
];

function EmissionsTable({ rows }: { rows: Emission[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      labels={{
        loading: 'Loading…',
        empty: 'No emissions recorded',
        selectAll: 'Select all rows',
        selectRow: 'Select row',
      }}
      rowSelection={{ selectedIds: selected, onChange: setSelected }}
    />
  );
}
```

No strings are hardcoded — `labels` is required, so the table is translatable from day one.

## Theming

Every colour and every dimension resolves through a `--tbl-*` variable. Override them anywhere in
the cascade; nothing else changes.

```css
/* your whole app */
:root {
  --tbl-row-selected-bg: #e0f2fe;
  --tbl-focus-ring: #0284c7;
  --tbl-border: #e2e8f0;
}

/* one table */
.compact-table {
  --tbl-row-height: 32px;
  --tbl-cell-py: 4px;
}

/* dark mode */
[data-theme='dark'] {
  --tbl-cell-bg: #18181b;
  --tbl-cell-fg: #fafafa;
  --tbl-header-bg: #27272a;
  --tbl-border: #3f3f46;
}
```

Already have a palette? Point the tokens at your own variables instead of literals:

```css
:root {
  --tbl-border: var(--color-warm-neutral-40);
  --tbl-row-selected-bg: var(--color-green-10);
}
```

Defaults live in [`src/styles.css`](./src/styles.css). The tokens are grouped as structure, spacing,
header, cell, row states, cell tones, and misc.

## Swapping components

The built-in checkbox and sort icon are intentionally plain. Pass your own:

```tsx
<DataTable
  {...props}
  components={{
    Checkbox: MyCheckbox,   // (props: TableCheckboxProps) => ReactNode
    SortIcon: MySortIcon,   // (props: SortIconProps) => ReactNode
  }}
/>
```

## Column meta

Layout and cell behaviour are declared on the column, not at the call site.

| Key | Type | Notes |
| --- | --- | --- |
| `align` / `headerAlign` | `'left' \| 'center' \| 'right'` | Defaults to `right` when `numeric` |
| `width` / `minWidth` / `maxWidth` | `number \| string` | Numeric `width` also feeds the table's min-width |
| `numeric` | `boolean` | Right-align and use the `number` cell type |
| `required` | `boolean` | Renders `*` before the header label |
| `truncate` | `boolean` | Ellipsis overflow. Default `true` |
| `rowHeader` | `boolean` | Render cells as `<th scope="row">` |
| `type` | `CellType` | Padding and inner layout — see below |
| `state` | `'default' \| 'selected' \| 'disabled'` | Usually derived automatically |
| `tone` | `'none' \| 'muted' \| 'info' \| 'warning' \| 'danger'` | Semantic emphasis on resting cells |
| `line` / `rightStroke` | `boolean` | Bottom / right border. Default `true` |
| `className` / `headerClassName` | `string` | Extra classes on the `<td>` / `<th>` |
| `reorderable` | `boolean` | Opt out of header drag reordering. Default `true` |
| `exportable` | `boolean` | Drop the column from a CSV export |
| `exportHeader` | `string` | Export header text when the rendered header is not a string |
| `exportValue` | `(row) => unknown` | Export value when the cell shows something else |

`CellType` is one of `text`, `number`, `unit`, `memo`, `checkbox`, `tag`, `text-tag`,
`text-dropdown`, `text-button`, `button`, `icon`, `icon-text`, `switch`, `custom`. It only controls
padding and inner flex layout, so rows stay the same height whatever the cell holds.

## Custom cells

The thirteen described types will not cover everything. `custom` is the type that stops describing
the content and gets out of the way:

```tsx
const columns = [
  {
    accessorKey: 'due',
    header: 'Due',
    meta: { type: 'custom', width: 170 },
    cell: (ctx) => <DatePicker value={ctx.getValue()} onChange={(v) => save(ctx.row.id, v)} />,
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    // p-0 lets the control fill the cell edge to edge.
    meta: { type: 'custom', width: 150, className: 'p-0' },
    cell: (ctx) => <OwnerButton owner={ctx.getValue()} />,
  },
];
```

A `custom` cell keeps the shared row height and borders and drops everything else: no ellipsis, no
type-driven alignment, no rules applied to children. Padding matches `button`; `meta.className`
reaches the `<td>` when you need an exception, `meta.headerClassName` the `<th>`, and `meta.align`
places the content. The header defaults to the `custom` type as well, so a filter input in a header
lines up with the cells below it.

Two things to know:

- **A popover drawn inside a cell is clipped**, because the scroll container is `overflow: auto`.
  Render calendars and dropdown panels through `createPortal` into `document.body`, and keep their
  position in sync with scroll and resize — the cell moves, the portalled panel does not. A worked
  searchable picker is in `playground/src/SearchSelect.tsx`. Native controls like
  `<input type="date">` need none of this: the browser draws their popup outside the page.
- With `onRowClick`, call `event.stopPropagation()` in your control. The library only does that
  automatically for the checkbox, the expander and the drag grip.

## Server-side data

`manualSorting` and `manualFiltering` do not mean "the server does it". They mean **the table does
not**: `data` is already in the order and the shape it should be shown in. The headers still report
what the user asked for through `sorting` / `columnFilters`, and acting on it is yours — usually a
server query, but a worker or a parent component sorting the array is the same thing.

```tsx
<DataTable
  data={page.items}
  columns={columns}
  getRowId={(row) => row.id}
  labels={labels}
  manualSorting
  sorting={sorting}
  onSortingChange={setSorting}
  pagination={{
    page,
    pageSize,
    totalCount: page.total,
    labels: { previous: 'Previous', next: 'Next', page: (n) => `Page ${n}`, pageSize: 'Rows per page' },
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  }}
/>
```

### Select-all across pages

By default the header checkbox selects only the rows currently rendered — the right behaviour for
server-side pagination. To select every matching row instead:

```tsx
rowSelection={{
  selectedIds,
  onChange: setSelectedIds,
  selectAllMode: 'all',
  totalSelectableCount: page.total,
  onSelectAll: async (checked) => setSelectedIds(checked ? await fetchAllIds() : []),
}}
```

## Composing by hand

When `DataTable` does not fit, the primitives are exported and carry all the styling:

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@iesg/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Category</TableHead>
      <TableHead type='number'>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow hoverable>
      <TableCell>Scope 1</TableCell>
      <TableCell type='number' tone='warning'>1,200</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Accessibility

- `aria-sort` on sortable headers, with a real `<button>` as the sort control
- `scope="col"` / `scope="row"` on header cells
- Clickable rows are focusable and respond to Enter and Space, ignoring keys that bubble from
  controls inside the row
- Loading and empty states announce via `<output aria-live="polite">`
- `aria-busy` while loading, `aria-selected` and `aria-disabled` on rows
- Every interactive element takes its accessible name from `labels`

## Development

```bash
pnpm install
pnpm test          # render smoke tests (react-dom/server)
pnpm check-types
pnpm build
pnpm dev           # playground at http://localhost:5273
```

The playground has one page per feature in the left sidebar: a live example, what you can change
about it, the props involved, the CSS variables it reads, and its limitations. `#/docs` is the
reference page.

## Loading and empty states

```tsx
<DataTable {...props} loading={isFetching} loadingRowCount={pageSize} />
```

Loading does not blank the table. The header stays sharp, stand-in rows are drawn with the real
columns and blurred, and a spinner sits on top — so the column widths and row height are already the
ones the data will land in and nothing jumps when it arrives. The stand-in rows are `aria-hidden`;
the spinner carries `labels.loading` in an `<output aria-live="polite">`, and the table is
`aria-busy`.

`--tbl-loading-blur` (set it to `0` to switch the blur off), `--tbl-loading-overlay-bg`,
`--tbl-skeleton-bg`, `--tbl-spinner-track` and `--tbl-spinner-indicator` cover the appearance. For a
completely different treatment, leave `loading` unset and render your own.

## Filtering and column visibility

```tsx
<DataTable
  {...props}
  globalFilter={query}
  onGlobalFilterChange={setQuery}
  columnVisibility={{ note: false }}
  onColumnVisibilityChange={setVisibility}
/>
```

Hidden columns drop out of the `<colgroup>` too, so the remaining widths stay correct. Pass
`manualFiltering` when the rows arrive already filtered — the filter values still reach you, the
table just stops applying them itself.

## Row expansion

Two shapes. A tree of real rows:

```tsx
import { createExpanderColumn } from '@iesg/table';

const columns = [createExpanderColumn<Node>(), ...rest];

<DataTable
  {...props}
  getSubRows={(row) => row.children}
  expanded={expanded}
  onExpandedChange={setExpanded}
/>
```

Or a full-width panel under the row:

```tsx
<DataTable {...props} renderSubRow={(row) => <Detail row={row.original} />} />
```

Sub-rows are ordinary rows, so sorting, filtering and selection apply to them and `row.depth` drives
the indent, at any depth. `renderSubRow` cannot be combined with virtualisation — a panel breaks the fixed
row-to-index mapping.

## Resizing, sticky header, pinned columns

```tsx
<DataTable
  {...props}
  enableColumnResizing
  columnSizing={sizing}
  onColumnSizingChange={setSizing}
  columnPinning={{ left: ['select', 'category'], right: [] }}
  stickyHeader
  maxHeight={400}
/>
```

`meta.width` feeds TanStack's column sizing, so resizing, pinning offsets and the `<col>` elements
all read from one number. Pinned columns get their `left`/`right` offsets computed for you plus a
divider shadow at the boundary.

The table uses `border-separate`, not `border-collapse` — collapsed borders are painted by the table
and vanish from sticky cells. Each cell draws only its own bottom and right edge, so nothing doubles
up.

## Virtualisation

```tsx
<DataTable {...props} maxHeight={400} virtual={{ estimateRowHeight: 40, overscan: 10 }} />
```

Only the visible rows reach the DOM; spacer rows keep the scrollbar honest. Needs `maxHeight`. Works
alongside sorting, filtering and sub-rows.

## Inline editing

```tsx
import { EditableCell } from '@iesg/table';

const columns = [
  { accessorKey: 'amount', header: 'tCO₂eq', meta: { numeric: true },
    cell: (ctx) => <EditableCell ctx={ctx} inputType='number' /> },
];

<DataTable {...props} onCellEdit={({ rowId, columnId, value }) => save(rowId, columnId, value)} />
```

A cell becomes an input as soon as it takes focus — by click, by Tab, or by an arrow key — so moving
into a cell and typing just works. Enter and blur commit; Escape reverts and leaves focus on the cell
without reopening the editor. A `number` input that does not parse reverts rather than committing
`NaN`.

Arrow keys and Tab move between editable cells:

| Key | While editing | Resting on a cell |
| --- | --- | --- |
| `↑` / `↓` | Commit, move up / down | Move up / down |
| `←` / `→` | Move the caret; at the end of the text, move to the next cell | Move left / right |
| `Tab` / `Shift+Tab` | Commit, move right / left | Move right / left |
| `Enter` | Commit, move down | Open the editor |
| `Escape` | Revert, stay on the cell | — |

Movement walks the rendered DOM, so hidden columns, reordered columns and virtualised rows all work
without extra bookkeeping, and rows with nothing editable in that column are skipped. Turn either
behaviour off per cell with `editOnFocus={false}` or `gridNavigation={false}`. Spread `CELL_NAV_ATTR`
onto your own cell control to include it in the same grid.

## Persisting table state

```tsx
import { usePersistedState, clearPersistedState, type ColumnOrderState } from '@iesg/table';

const [order, setOrder] = usePersistedState<ColumnOrderState>('emissions.columnOrder', []);

<DataTable {...props} enableColumnReordering columnOrder={order} onColumnOrderChange={setOrder} />
```

The table never writes to storage on its own — persistence is a hook you opt into, so the key naming
stays yours and nothing is stored behind a user's back. It works for any controlled state: column
order, sizing, visibility, pinning, sorting.

Storage failures are not errors: server rendering, private mode, blocked site data and an exceeded
quota all fall back to in-memory state. A corrupt or hand-edited entry falls back to the initial
value rather than reaching the component.

Stored values contain column ids, so a schema change can leave a stale entry behind. Bump `version`
to have old entries ignored: `usePersistedState(key, initial, { version: 2 })`. Pass
`{ storage: sessionStorage }` for per-tab state, and `clearPersistedState(key)` behind a "reset
layout" control.

## Row reordering

```tsx
import { createRowDragColumn } from '@iesg/table';

const columns = [createRowDragColumn<Row>(), ...rest];

<DataTable {...props} enableRowDragging rowOrder={order} onRowOrderChange={setOrder}
  labels={{ ...labels, dragRow: 'reorder row' }} />
```

Drag the grip, or focus it and press the arrow keys. The order is applied to the source array before
TanStack sorts or filters, so an active sort wins over it — turn sorting off on a screen where the
user is arranging rows by hand. Ids missing from `rowOrder` keep their position at the end, so newly
appended rows are never dropped.

## Column reordering

```tsx
<DataTable {...props} enableColumnReordering columnOrder={order} onColumnOrderChange={setOrder} />
```

Header cells become draggable. The selection, expander and drag-grip columns are excluded because
their position is structural, as are pinned columns; opt a column out with `meta.reorderable: false`.
Clicking a header still sorts — a drag needs movement, so the two do not collide.

With `enableColumnResizing` on as well, the resize grip wins: the header stops being draggable while
the pointer is over it, so dragging the edge resizes and dragging anywhere else reorders. Both
gestures start the same way, and the grip is the smaller, more deliberate target.

## Grouping and aggregation

```tsx
const columns = [
  { accessorKey: 'scope', header: 'Scope' },
  { accessorKey: 'amount', header: 'tCO₂eq', aggregationFn: 'sum',
    aggregatedCell: (ctx) => <b>{format(ctx.getValue())}</b> },
];

<DataTable {...props} grouping={['scope']} onGroupingChange={setGrouping} />
```

Group rows carry the expand toggle, the group value and the child count. Pass more than one column id
to nest. `getSubRows` is ignored while grouping is on — grouping builds its own sub-rows.

## CSV export

```tsx
import { exportTableToCsv, type TableInstance } from '@iesg/table';

const tableRef = useRef<TableInstance<Row> | null>(null);

<DataTable {...props} tableRef={tableRef} />
<button onClick={() => exportTableToCsv(tableRef.current!, { fileName: 'emissions.csv' })}>Export</button>
```

The export follows the view: filters, sorting, column order and visibility all apply. `rows` picks the
scope (`filtered` by default, or `all` / `selected` / `page`). A UTF-8 BOM is prepended so Excel reads
Korean correctly, and values starting with `=` or `+` are prefixed with an apostrophe so Excel does
not evaluate them as formulas (`sanitize: false` turns that off).

Columns without an accessor are skipped. Use `meta.exportValue` when the cell renders something other
than the raw value, `meta.exportHeader` when the header is not a plain string, and
`meta.exportable: false` to drop a column entirely.

There is no real `.xlsx` writer — that needs a zip implementation and a dependency this package does
not want. `tableToMatrix()` returns `string[][]`, which is what SheetJS and exceljs take as input.

## Roadmap

Not in 0.1: a native `.xlsx` writer, auto-scroll while dragging near the viewport edge, touch drag
(the reorder uses HTML5 drag-and-drop, so use the arrow-key fallback on mobile), and combining
virtualisation with `renderSubRow` panels.

## License

MIT — see [LICENSE](./LICENSE). Builds on TanStack Table (MIT) as an unmodified peer dependency; see
[NOTICE](./NOTICE). Not affiliated with or endorsed by TanStack.
