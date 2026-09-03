/**
 * Render smoke test. Not a unit-test suite — it asserts the package mounts,
 * sorts, and selects without throwing, using react-dom/server.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { DataTable, type TableColumnDef, createSelectionColumn } from '../src/index';

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

console.log('\nAll smoke tests passed.');
