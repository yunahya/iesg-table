/**
 * Render smoke test. Not a unit-test suite — it asserts the package mounts,
 * sorts, and selects without throwing, using react-dom/server.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CHECKBOX_SIZE,
  DataTable,
  EditableCell,
  TableCell,
  TableCheckbox,
  type TableColumnDef,
  createExpanderColumn,
  createSelectionColumn,
} from '../src/index';

type Row = { id: string; name: string; amount: number };

const data: Row[] = [
  { id: '1', name: 'Scope 1', amount: 1200 },
  { id: '2', name: 'Scope 2', amount: 340 },
  { id: '3', name: 'Scope 3', amount: 98 },
];

const columns: TableColumnDef<Row>[] = [
  createSelectionColumn<Row>(),
  { accessorKey: 'name', header: 'Category', meta: { width: 200, required: true } },
  { accessorKey: 'amount', header: 'tCO2eq', meta: { numeric: true, width: 120, tone: 'info' } },
];

const labels = { loading: 'Loading…', empty: 'No data', selectAll: 'Select all', selectRow: 'Select row' };

function check(name: string, html: string, expectations: Array<[string, boolean]>) {
  for (const [what, ok] of expectations) {
    if (!ok) {
      console.error(`FAIL  ${name}: ${what}`);
      console.error(html.slice(0, 800));
      process.exit(1);
    }
  }
  console.log(`ok    ${name}`);
}

// 1. base render
{
  const html = renderToStaticMarkup(<DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} />);
  check('renders rows and headers', html, [
    ['3 body rows', (html.match(/<tr/g)?.length ?? 0) === 4],
    ['header text present', html.includes('Category') && html.includes('tCO2eq')],
    ['required asterisk', html.includes('--tbl-required-fg')],
    ['numeric tone applied', html.includes('--tbl-tone-info-bg')],
    ['no raw palette class leaked', !/bg-(green|warm-neutral|cool-neutral)-\d/.test(html)],
  ]);
}

// 2. selection: header checkbox + per-row checkbox both rendered by the lib
{
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      rowSelection={{ selectedIds: ['1', '2'], onChange: () => {} }}
    />,
  );
  const boxes = html.match(/type="checkbox"/g)?.length ?? 0;
  check('selection column', html, [
    ['4 checkboxes (1 header + 3 rows)', boxes === 4],
    ['select-all label', html.includes('Select all')],
    ['per-row label', html.includes('Select row')],
    ['selected rows styled', html.includes('--tbl-row-selected-bg')],
    ['aria-selected set', html.includes('aria-selected="true"')],
  ]);
}

// 3. sorting is applied client-side
{
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      sorting={[{ id: 'amount', desc: false }]}
    />,
  );
  const order = [...html.matchAll(/>(\d+)<\/div>/g)].map((m) => m[1]);
  check('sorting', html, [
    ['ascending by amount', order.join(',').startsWith('98,340,1200')],
    ['aria-sort present', html.includes('aria-sort="ascending"')],
  ]);
}

// 4. empty + loading states
{
  const empty = renderToStaticMarkup(<DataTable data={[]} columns={columns} getRowId={(r) => r.id} labels={labels} />);
  const loading = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} loading />,
  );
  check('status rows', empty, [
    ['empty label', empty.includes('No data') && empty.includes('aria-live="polite"')],
    ['loading label', loading.includes('Loading…')],
    ['aria-busy', loading.includes('aria-busy="true"')],
  ]);
}

// 5. disabled rows and row-header cells
{
  const cols: TableColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'Category', meta: { rowHeader: true } },
    { accessorKey: 'amount', header: 'tCO2eq', meta: { numeric: true } },
  ];
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={cols}
      getRowId={(r) => r.id}
      labels={labels}
      getRowDisabled={(r) => r.id === '2'}
      onRowClick={() => {}}
    />,
  );
  check('row states', html, [
    ['row header th', html.includes('scope="row"')],
    ['disabled row', html.includes('aria-disabled="true"')],
    ['clickable rows focusable', html.includes('tabindex="0"')],
  ]);
}

// 6. pagination
{
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      pagination={{
        page: 2,
        pageSize: 10,
        totalCount: 95,
        labels: { previous: 'Prev', next: 'Next', page: (n) => `page ${n}`, pageSize: 'Rows' },
        onPageChange: () => {},
        onPageSizeChange: () => {},
      }}
    />,
  );
  check('pagination', html, [
    ['nav rendered', html.includes('aria-label="pagination"')],
    ['current page marked', html.includes('aria-current="page"')],
    ['10 pages total', html.includes('page 10')],
    ['page size select', html.includes('<select')],
  ]);
}

// 7. the checkbox is a fixed 18x18 control, whatever the surroundings
{
  const sizeStyle = `width:${CHECKBOX_SIZE}px;height:${CHECKBOX_SIZE}px`;
  const countLocked = (h: string) => h.match(/width:18px;height:18px/g)?.length ?? 0;

  // inside the selection column of a full table
  const inTable = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      rowSelection={{ selectedIds: ['1'], onChange: () => {} }}
      getRowDisabled={(r) => r.id === '3'}
    />,
  );

  // in a truncating cell, a narrow cell, and with a hostile className
  const hostile = renderToStaticMarkup(
    <TableCell type='checkbox' truncate style={{ width: 4 }}>
      <TableCheckbox checked='indeterminate' label='x' onChange={() => {}} className='size-2 w-96' />
    </TableCell>,
  );

  check('checkbox size is locked', inTable, [
    ['every checkbox carries the inline lock', countLocked(inTable) === 8], // 4 boxes x (span + svg)
    ['size is 18px', sizeStyle === 'width:18px;height:18px'],
    ['min/max pinned too', inTable.includes('min-width:18px') && inTable.includes('max-width:18px')],
    ['svg has width/height attrs', inTable.includes('width="18"') && inTable.includes('height="18"')],
    ['shrink-0 present', inTable.includes('shrink-0')],
    ['checkbox cell is not truncated', !/justify-center[^"]*truncate/.test(inTable)],
    ['hostile className cannot resize it', countLocked(hostile) === 2],
    ['narrow cell cannot squash it', hostile.includes('min-width:18px')],
    ['checkbox cells carry no padding', /class="[^"]*\bp-0\b[^"]*"/.test(inTable)],
    ['no checkbox padding tokens remain', !inTable.includes('--tbl-cell-px-checkbox')],
  ]);
}

// 8. column widths are pinned through <colgroup>, not just suggested on <th>
{
  const cols: TableColumnDef<Row>[] = [
    createSelectionColumn<Row>(),
    { accessorKey: 'name', header: 'Category', meta: { width: 220 } },
    { accessorKey: 'amount', header: 'tCO2eq', meta: { numeric: true, width: 130 } },
  ];
  const html = renderToStaticMarkup(<DataTable data={data} columns={cols} getRowId={(r) => r.id} labels={labels} />);
  const colgroup = html.match(/<colgroup>.*?<\/colgroup>/)?.[0] ?? '';
  const widths = [...colgroup.matchAll(/width:(\d+)px/g)].map((m) => Number(m[1]));

  check('column widths', html, [
    ['colgroup is rendered', colgroup.length > 0],
    ['one <col> per leaf column', (colgroup.match(/<col /g)?.length ?? 0) === 3],
    ['widths match the column meta', widths.join(',') === '50,220,130'],
    ['table-fixed applied', html.includes('table-fixed')],
    ['min-w-max does not leak through', !html.includes('min-w-max')],
    ['scroll container gets the total width', html.includes('min-width:400px')],
  ]);
}

/* ------------------------------------------------------------------ */
/* New features                                                        */
/* ------------------------------------------------------------------ */

type Node = { id: string; name: string; amount: number; children?: Node[] };

const tree: Node[] = [
  {
    id: 'a',
    name: 'Scope 1',
    amount: 100,
    children: [
      { id: 'a1', name: 'Stationary', amount: 60 },
      { id: 'a2', name: 'Mobile', amount: 40 },
    ],
  },
  { id: 'b', name: 'Scope 2', amount: 50 },
];

const treeColumns: TableColumnDef<Node>[] = [
  createExpanderColumn<Node>(),
  { accessorKey: 'name', header: 'Name', meta: { width: 200 } },
  { accessorKey: 'amount', header: 'Amount', meta: { numeric: true, width: 100 } },
];

// 9. column visibility
{
  const hidden = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      columnVisibility={{ amount: false }}
    />,
  );
  const shown = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} />,
  );
  check('column visibility', hidden, [
    ['hidden column is not rendered', !hidden.includes('tCO2eq')],
    ['other columns remain', hidden.includes('Category')],
    ['one fewer <col>', (hidden.match(/<col /g)?.length ?? 0) === (shown.match(/<col /g)?.length ?? 0) - 1],
    ['visible again when not hidden', shown.includes('tCO2eq')],
  ]);
}

// 10. global filter
{
  const html = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} globalFilter='Scope 2' />,
  );
  check('global filter', html, [
    ['matching row kept', html.includes('Scope 2')],
    ['non-matching rows dropped', !html.includes('Scope 3')],
    ['only one body row', (html.match(/aria-selected|<tr class="[^"]*group/g)?.length ?? 0) <= 2],
  ]);
}

// 11. row expansion (sub-rows)
{
  const collapsed = renderToStaticMarkup(
    <DataTable
      data={tree}
      columns={treeColumns}
      getRowId={(r) => r.id}
      labels={labels}
      getSubRows={(r) => r.children}
    />,
  );
  const opened = renderToStaticMarkup(
    <DataTable
      data={tree}
      columns={treeColumns}
      getRowId={(r) => r.id}
      labels={labels}
      getSubRows={(r) => r.children}
      expanded={{ a: true }}
    />,
  );
  check('row expansion', opened, [
    ['children hidden when collapsed', !collapsed.includes('Stationary')],
    ['children shown when expanded', opened.includes('Stationary') && opened.includes('Mobile')],
    ['expander button rendered', opened.includes('aria-expanded')],
    ['expanded state on the parent', opened.includes('aria-expanded="true"')],
    ['leaf rows get no button', (opened.match(/aria-expanded/g)?.length ?? 0) === 1],
  ]);
}

// 12. custom sub-row panel
{
  const html = renderToStaticMarkup(
    <DataTable
      data={tree}
      columns={treeColumns}
      getRowId={(r) => r.id}
      labels={labels}
      getSubRows={(r) => r.children}
      expanded={{ a: true }}
      renderSubRow={(row) => <div>panel for {row.id}</div>}
    />,
  );
  check('sub-row panel', html, [
    ['panel rendered', html.includes('panel for a')],
    ['panel spans every column', html.includes('colSpan="3"') || html.includes('colspan="3"')],
    ['panel uses its token background', html.includes('--tbl-subrow-bg')],
  ]);
}

// 13. column resizing
{
  const html = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} enableColumnResizing />,
  );
  const resized = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      enableColumnResizing
      columnSizing={{ name: 400 }}
    />,
  );
  check('column resizing', html, [
    ['resize handles rendered', (html.match(/aria-label="resize /g)?.length ?? 0) >= 2],
    ['selection column is not resizable', !html.includes('aria-label="resize select"')],
    ['applied size reaches the colgroup', resized.includes('width:400px')],
    ['handles are not in the tab order', html.includes('tabindex="-1"')],
  ]);
}

// 14. column pinning
{
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      columnPinning={{ left: ['select', 'name'], right: [] }}
    />,
  );
  check('column pinning', html, [
    ['pinned cells are sticky', html.includes('sticky')],
    ['first pinned column sits at 0', html.includes('left:0')],
    ['second pinned column is offset by the first', html.includes('left:50px')],
    ['divider shadow on the boundary', html.includes('--tbl-pinned-shadow')],
  ]);
}

// 15. sticky header + scroll height
{
  const html = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} stickyHeader maxHeight={300} />,
  );
  check('sticky header', html, [
    ['header cells are sticky', html.includes('sticky top-0')],
    ['scroll container is capped', html.includes('max-height:300px')],
    ['table uses border-separate so borders survive', html.includes('border-separate')],
    ['no border-collapse left', !html.includes('border-collapse')],
  ]);
}

// 16. virtualisation
{
  const many: Row[] = Array.from({ length: 5000 }, (_, i) => ({
    id: `v${i}`,
    name: `Row ${i}`,
    amount: i,
  }));
  const html = renderToStaticMarkup(
    <DataTable data={many} columns={columns} getRowId={(r) => r.id} labels={labels} maxHeight={400} virtual />,
  );
  const plain = renderToStaticMarkup(
    <DataTable data={many} columns={columns} getRowId={(r) => r.id} labels={labels} maxHeight={400} />,
  );
  const rowCount = (h: string) => h.match(/data-row/g)?.length ?? h.match(/<tr/g)?.length ?? 0;
  check('virtualisation', html, [
    ['renders far fewer rows than the data', rowCount(html) < rowCount(plain) / 10],
    ['non-virtual table renders everything', rowCount(plain) > 5000],
    ['markup stays a valid table', html.includes('<tbody>') && html.includes('</tbody>')],
  ]);
}

// 17. inline editing
{
  const edits: unknown[] = [];
  const editColumns: TableColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'Name', meta: { width: 200 }, cell: (ctx) => <EditableCell ctx={ctx} /> },
    {
      accessorKey: 'amount',
      header: 'Amount',
      meta: { numeric: true, width: 120 },
      cell: (ctx) => <EditableCell ctx={ctx} inputType='number' />,
    },
  ];
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={editColumns}
      getRowId={(r) => r.id}
      labels={labels}
      onCellEdit={(edit) => edits.push(edit)}
    />,
  );
  check('inline editing', html, [
    ['cells render as edit triggers', (html.match(/cursor-text/g)?.length ?? 0) === 6],
    ['values are shown, not inputs, at rest', !html.includes('<input')],
    ['editor styling is tokenised', html.includes('--tbl-edit-hover-bg')],
  ]);
}

console.log('\nAll feature tests passed.');
