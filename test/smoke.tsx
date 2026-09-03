/**
 * Render smoke test. Not a unit-test suite — it asserts the package mounts,
 * sorts, and selects without throwing, using react-dom/server.
 */
import { createTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CHECKBOX_SIZE,
  DataTable,
  EditableCell,
  TableCell,
  TableCheckbox,
  type TableColumnDef,
  applyOrder,
  createExpanderColumn,
  createRowDragColumn,
  createSelectionColumn,
  directionForKey,
  moveById,
  tableToCsv,
  usePersistedState,
} from '../src/index';
import { shallowEqual } from '../src/lib/shallow-equal';

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
    // Loading keeps the scaffold: header sharp, stand-in rows blurred, spinner
    // over the top — rather than blanking the table and making it jump.
    ['header stays visible', loading.includes('Category') && loading.includes('tCO2eq')],
    ['stand-in rows are drawn', (loading.match(/--tbl-skeleton-bg/g)?.length ?? 0) >= 5],
    ['they are hidden from assistive tech', loading.includes('aria-hidden="true"')],
    ['the body is blurred, not the header', loading.includes('--tbl-loading-blur')],
    ['a spinner sits on top', loading.includes('animate-spin') && loading.includes('--tbl-spinner-indicator')],
    ['column widths still come from colgroup', loading.includes('<col style="width:50px"/>')],
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

// 18. row drag reordering
{
  const dragColumns: TableColumnDef<Row>[] = [createRowDragColumn<Row>(), ...columns.slice(1)];
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={dragColumns}
      getRowId={(r) => r.id}
      labels={{ ...labels, dragRow: '순서 변경' }}
      enableRowDragging
    />,
  );
  // rowOrder is applied to the source array before TanStack sees it.
  const reordered = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={dragColumns}
      getRowId={(r) => r.id}
      labels={labels}
      enableRowDragging
      rowOrder={['3', '1', '2']}
    />,
  );
  const at = (name: string) => reordered.indexOf(name);
  const [one, two, three] = [at('Scope 1'), at('Scope 2'), at('Scope 3')];
  check('row drag reordering', html, [
    ['one grip per row', (html.match(/순서 변경/g)?.length ?? 0) === 3],
    ['grip is draggable', html.includes('draggable="true"')],
    ['grip column is 40px', html.includes('width:40px')],
    ['rowOrder reorders the rows', three < one && one < two],
    [
      'grip is excluded from a plain render',
      !renderToStaticMarkup(
        <DataTable data={data} columns={dragColumns} getRowId={(r) => r.id} labels={labels} />,
      ).includes('draggable="true"'),
    ],
  ]);
}

// 19. column reordering
{
  const html = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      enableColumnReordering
      columnOrder={['select', 'amount', 'name']}
    />,
  );
  check('column reordering', html, [
    ['columnOrder swaps the headers', html.indexOf('tCO2eq') < html.indexOf('Category')],
    ['colgroup follows the same order', html.includes('<col style="width:50px"/><col style="width:120px"/>')],
    ['reorderable headers are draggable', html.includes('draggable="true"')],
    [
      'the selection column stays put',
      !/draggable="true"[^>]*>\s*<div class="flex h-full w-full items-center justify-center"/.test(html),
    ],
  ]);
}

// 20. grouping and aggregation
{
  type GroupRow = { id: string; scope: string; site: string; amount: number };
  const groupData: GroupRow[] = [
    { id: '1', scope: 'Scope 1', site: '울산', amount: 100 },
    { id: '2', scope: 'Scope 1', site: '여수', amount: 200 },
    { id: '3', scope: 'Scope 2', site: '울산', amount: 50 },
  ];
  const groupColumns: TableColumnDef<GroupRow>[] = [
    { accessorKey: 'scope', header: 'Scope', meta: { width: 200 } },
    { accessorKey: 'site', header: 'Site', meta: { width: 140 } },
    {
      accessorKey: 'amount',
      header: 'tCO2eq',
      aggregationFn: 'sum',
      meta: { numeric: true, width: 120 },
      aggregatedCell: (ctx) => <b>{String(ctx.getValue())}</b>,
    },
  ];
  const html = renderToStaticMarkup(
    <DataTable
      data={groupData}
      columns={groupColumns}
      getRowId={(r) => r.id}
      labels={labels}
      grouping={['scope']}
      expanded={true}
    />,
  );
  check('grouping and aggregation', html, [
    ['group rows are tinted', html.includes('--tbl-group-row-bg')],
    ['child counts are shown', html.includes('(2)') && html.includes('(1)')],
    ['sum aggregation ran', html.includes('<b>300</b>')],
    ['leaf rows are still rendered', html.includes('울산') && html.includes('여수')],
  ]);
}

// 21. CSV export
{
  type CsvRow = { id: string; name: string; amount: number; note: string };
  const csvData: CsvRow[] = [
    { id: '1', name: 'Scope 1, direct', amount: 1200, note: 'says "hi"' },
    { id: '2', name: '=1+1', amount: 340, note: 'line\nbreak' },
  ];
  const csvColumns: TableColumnDef<CsvRow>[] = [
    createSelectionColumn<CsvRow>(),
    { accessorKey: 'name', header: 'Category' },
    { accessorKey: 'amount', header: 'tCO2eq' },
    { accessorKey: 'note', header: 'Note', meta: { exportable: false } },
  ];
  const table = createTable<CsvRow>({
    data: csvData,
    columns: csvColumns,
    getRowId: (r) => r.id,
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  table.setOptions((previous) => ({ ...previous, state: table.initialState }));

  const csv = tableToCsv(table);
  const lines = csv.split('\r\n');
  check('CSV export', csv, [
    ['header row uses the header text', lines[0] === 'Category,tCO2eq'],
    ['display and opted-out columns are skipped', !csv.includes('Note') && !csv.includes('select')],
    ['fields with a delimiter are quoted', lines[1] === '"Scope 1, direct",1200'],
    ['formulas are neutralised', lines[2]?.startsWith("'=1+1") === true],
    ['a tab delimiter produces a TSV', tableToCsv(table, { delimiter: '\t' }).split('\r\n')[0] === 'Category\ttCO2eq'],
    ['headers can be turned off', tableToCsv(table, { header: false }).split('\r\n').length === 2],
  ]);
}

// 22. reorder helpers — pure functions, no rendering needed
check('reorder helpers', '', [
  ['moves down', moveById(['a', 'b', 'c'], 'a', 'c', false).join('') === 'bac'],
  ['moves down and after', moveById(['a', 'b', 'c'], 'a', 'c', true).join('') === 'bca'],
  ['moves up', moveById(['a', 'b', 'c'], 'c', 'a', false).join('') === 'cab'],
  ['ignores a self drop', moveById(['a', 'b'], 'a', 'a', true).join('') === 'ab'],
  ['ignores unknown ids', moveById(['a', 'b'], 'z', 'a', true).join('') === 'ab'],
  [
    'applyOrder keeps unlisted items at the end',
    applyOrder([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['c', 'a'], (item) => item.id)
      .map((item) => item.id)
      .join('') === 'cab',
  ],
  ['an empty order is a no-op', applyOrder([{ id: 'a' }], [], (i) => i.id)[0]?.id === 'a'],
]);

// 23. editable cells join the keyboard grid
{
  const editColumns: TableColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'Name', meta: { width: 200 }, cell: (ctx) => <EditableCell ctx={ctx} /> },
    {
      accessorKey: 'amount',
      header: 'Amount',
      meta: { numeric: true, width: 120 },
      cell: (ctx) => <EditableCell ctx={ctx} gridNavigation={false} />,
    },
  ];
  const html = renderToStaticMarkup(
    <DataTable data={data} columns={editColumns} getRowId={(r) => r.id} labels={labels} onCellEdit={() => {}} />,
  );
  check('editable cell keyboard grid', html, [
    ['navigable cells are marked', (html.match(/data-tbl-cell-nav/g)?.length ?? 0) === 3],
    ['gridNavigation=false opts out', (html.match(/data-tbl-cell-nav/g)?.length ?? 0) < 6],
    ['still renders a value, not an input', !html.includes('<input')],
  ]);
}

// 24. direction mapping — pure function
check('key to direction', '', [
  ['arrows map through', directionForKey('ArrowUp', false) === 'up' && directionForKey('ArrowDown', false) === 'down'],
  ['tab goes right', directionForKey('Tab', false) === 'right'],
  ['shift+tab goes left', directionForKey('Tab', true) === 'left'],
  ['other keys are not moves', directionForKey('a', false) === null && directionForKey('Enter', false) === null],
]);

// 25. persisted state reads what was stored
{
  const makeStorage = (seed: Record<string, string>): Storage => {
    const map = new Map(Object.entries(seed));
    return {
      get length() {
        return map.size;
      },
      clear: () => map.clear(),
      getItem: (key: string) => map.get(key) ?? null,
      key: (index: number) => [...map.keys()][index] ?? null,
      removeItem: (key: string) => {
        map.delete(key);
      },
      setItem: (key: string, value: string) => void map.set(key, value),
    };
  };

  function Probe({ storage, version }: { storage: Storage; version?: number }) {
    const [value] = usePersistedState<string[]>('order', ['fallback'], { storage, version });
    return <i>{value.join(',')}</i>;
  }

  const stored = makeStorage({ order: JSON.stringify({ v: 1, value: ['b', 'a'] }) });
  const corrupt = makeStorage({ order: 'not json' });
  check('persisted state', '', [
    ['restores the stored value', renderToStaticMarkup(<Probe storage={stored} />).includes('b,a')],
    [
      'a version bump ignores the old entry',
      renderToStaticMarkup(<Probe storage={stored} version={2} />).includes('fallback'),
    ],
    ['corrupt entries fall back', renderToStaticMarkup(<Probe storage={corrupt} />).includes('fallback')],
    ['an empty store falls back', renderToStaticMarkup(<Probe storage={makeStorage({})} />).includes('fallback')],
  ]);
}

// 26. controlled props keep their identity when nothing really changed.
// This is what stops `grouping={[]}` written inline from resetting the
// expanded state on every render: TanStack compares its row-model
// dependencies by identity, and the grouped model resets expansion whenever
// it recomputes.
check('shallow identity guard', '', [
  ['two empty arrays match', shallowEqual([], [])],
  ['two empty objects match', shallowEqual({}, {})],
  ['same members match', shallowEqual(['scope'], ['scope'])],
  ['nested empties match', shallowEqual({ left: [], right: [] }, { left: [], right: [] })],
  ['nested differences are caught', !shallowEqual({ left: ['a'], right: [] }, { left: [], right: [] })],
  ['a filter list matches by value', shallowEqual([{ id: 'scope', value: '1' }], [{ id: 'scope', value: '1' }])],
  ['the depth cap stops at three levels', !shallowEqual([[['x']]], [[['x']]])],
  ['different members differ', !shallowEqual(['scope'], ['facility'])],
  ['different lengths differ', !shallowEqual(['a'], ['a', 'b'])],
  ['an array is not an object', !shallowEqual([], {})],
  ['null is handled', !shallowEqual(null, {}) && shallowEqual(null, null)],
  ['primitives compare by value', shallowEqual('a', 'a') && !shallowEqual('a', 'b')],
]);

// 27. custom cell type
{
  const customColumns: TableColumnDef<Row>[] = [
    {
      accessorKey: 'amount',
      header: 'When',
      enableSorting: false,
      meta: { type: 'custom', width: 220, className: 'p-0', headerClassName: 'uppercase' },
      cell: () => <input type='date' className='w-full' />,
    },
  ];
  const html = renderToStaticMarkup(
    <DataTable data={data} columns={customColumns} getRowId={(r) => r.id} labels={labels} />,
  );
  const head = html.slice(html.indexOf('<thead'), html.indexOf('<tbody'));
  const body = html.slice(html.indexOf('<tbody'));
  // renderToStaticMarkup escapes the arbitrary-variant brackets.
  const unescaped = body.replace(/&amp;/g, '&').replace(/&gt;/g, '>');

  const textOnly = renderToStaticMarkup(
    <DataTable data={data} columns={columns} getRowId={(r) => r.id} labels={labels} />,
  );

  check('custom cell type', html, [
    ['the control is rendered as given', body.includes('<input type="date"')],
    ['no ellipsis rules reach the control', !unescaped.includes('[&>*]:truncate')],
    ['the cell is not clipped', !body.includes('max-w-0 truncate')],
    ['meta.className lands on the td', body.includes('p-0')],
    ['meta.headerClassName lands on the th', head.includes('uppercase')],
    ['the header takes the custom padding too', head.includes('py-[var(--tbl-cell-py-compact)]')],
    ['other cell types still truncate', textOnly.includes('max-w-0 truncate')],
  ]);
}

// 28. nested rows darken with depth
{
  type Node = { id: string; name: string; children?: Node[] };
  const deep: Node[] = [
    {
      id: 'a',
      name: 'A',
      children: [{ id: 'a1', name: 'A1', children: [{ id: 'a1x', name: 'A1X' }] }],
    },
  ];
  const deepColumns: TableColumnDef<Node>[] = [
    createExpanderColumn<Node>(),
    { accessorKey: 'name', header: 'N', meta: { width: 200 } },
  ];
  const html = renderToStaticMarkup(
    <DataTable
      data={deep}
      columns={deepColumns}
      getRowId={(r) => r.id}
      labels={labels}
      getSubRows={(r) => r.children}
      expanded={true}
    />,
  );
  const multipliers = [...html.matchAll(/calc\((\d+) \* var\(--tbl-row-depth-step\)\)/g)].map((m) => m[1]);

  check('depth shading', html, [
    ['one tinted row per level below the root', multipliers.join(',') === '1,2'],
    ['the top-level row is left alone', (html.match(/style="--tbl-row-bg/g)?.length ?? 0) === 2],
    ['cells read the row variable with a fallback', html.includes('bg-[var(--tbl-row-bg,var(--tbl-cell-bg))]')],
    ['the tint is mixed, not hardcoded', html.includes('var(--tbl-row-depth-tint)')],
  ]);
}

// 29. alignment actually moves content
{
  const alignColumns: TableColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'L', meta: { width: 120, align: 'left' } },
    { accessorKey: 'amount', header: 'C', meta: { width: 120, align: 'center' } },
  ];
  const html = renderToStaticMarkup(
    <DataTable data={data.slice(0, 1)} columns={alignColumns} getRowId={(r) => r.id} labels={labels} />,
  );
  const body = html.slice(html.indexOf('<tbody'));
  // `columns` carries the selection column, whose checkbox centres itself.
  const selectionHtml = renderToStaticMarkup(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      labels={labels}
      rowSelection={{ selectedIds: [], onChange: () => {} }}
    />,
  );
  const selectionBody = selectionHtml.slice(selectionHtml.indexOf('<tbody'));

  check('cell alignment', html, [
    // text-align does nothing to a flex item sized to its content; the fix is
    // justify-content, and this is the regression guard for it.
    ['center becomes justify-center', body.includes('justify-center')],
    ['left is explicit rather than implied', body.includes('justify-start')],
    // Regression: a column with no explicit align used to resolve to `left`,
    // which then overrode the checkbox type's own centring.
    ['a checkbox cell keeps its centring', selectionBody.includes('justify-center')],
    ['and is not pushed to the start', !selectionBody.includes('justify-start')],
    [
      'numeric columns still right-align themselves',
      renderToStaticMarkup(
        <DataTable
          data={data.slice(0, 1)}
          columns={[{ accessorKey: 'amount', header: 'N', meta: { numeric: true, width: 120 } }]}
          getRowId={(r) => r.id}
          labels={labels}
        />,
      ).includes('justify-end'),
    ],
  ]);
}

console.log('\nAll feature tests passed.');
