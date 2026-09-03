# @iesg/table

A React data table built on [TanStack Table v8](https://tanstack.com/table). TanStack gives you the
logic and no markup; this package supplies the markup — accessible, keyboard-navigable, and
themeable end to end through CSS variables.

It ships with the i-ESG design system as its default look. Override any token to make it yours.

```bash
pnpm add @iesg/table @tanstack/react-table
```

Requires React 18 or 19 and Tailwind CSS v4.

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

`CellType` is one of `text`, `number`, `unit`, `memo`, `checkbox`, `tag`, `text-tag`,
`text-dropdown`, `text-button`, `button`, `icon`, `icon-text`, `switch`. It only controls padding and
inner flex layout, so rows stay the same height whatever the cell holds.

## Server-side data

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
```

## Roadmap

Not in 0.1: column resizing, sticky header and pinned columns, virtualization
(`@tanstack/react-virtual`), row expansion and sub-rows, column visibility toggles, filtering, and
inline cell editing. All are reachable through TanStack's row models and feature API without forking
anything.

## License

MIT — see [LICENSE](./LICENSE). Builds on TanStack Table (MIT) as an unmodified peer dependency; see
[NOTICE](./NOTICE). Not affiliated with or endorsed by TanStack.
