import { useEffect, useMemo, useState } from 'react';
import {
  DataTable,
  SELECTION_COLUMN_ID,
  type SortIconProps,
  type SortingState,
  Table,
  TableBody,
  TableCell,
  TableCheckbox,
  type TableCheckboxProps,
  type TableColumnDef,
  TableHead,
  TableHeader,
  TableRow,
  createSelectionColumn,
} from '../../src/index';
import { Expansion, FilterAndVisibility, InlineEditing, ResizeStickyPin, Virtualised } from './Advanced';
import { Reference } from './Reference';
import { ThemeEditor } from './ThemeEditor';
import { type Emission, emissions, labels, num, paginationLabels } from './data';

/* ------------------------------------------------------------------ */
/* Page furniture                                                      */
/* ------------------------------------------------------------------ */

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className='scroll-mt-6' id={title.toLowerCase().replace(/\W+/g, '-')}>
      <h2 className='font-semibold text-base text-slate-900'>{title}</h2>
      <p className='mt-0.5 mb-3 text-slate-500 text-sm'>{hint}</p>
      {children}
    </section>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const tones = {
    ok: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
  };
  return <span className={`rounded px-1.5 py-0.5 font-medium text-xs ${tones[tone]}`}>{children}</span>;
}

const statusTag: Record<Emission['status'], React.ReactNode> = {
  approved: <Tag tone='ok'>Approved</Tag>,
  requested: <Tag tone='info'>Requested</Tag>,
  new: <Tag tone='info'>New</Tag>,
  over: <Tag tone='warn'>Over</Tag>,
  rejected: <Tag tone='bad'>Rejected</Tag>,
};

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

const baseColumns: TableColumnDef<Emission>[] = [
  {
    accessorKey: 'category',
    header: 'Category',
    meta: { width: 220, required: true, rowHeader: true },
  },
  {
    accessorKey: 'scope',
    header: 'Scope',
    meta: { width: 90, align: 'center' },
    cell: (ctx) => `Scope ${ctx.getValue<number>()}`,
  },
  { accessorKey: 'facility', header: 'Facility', meta: { width: 160 } },
  {
    accessorKey: 'amount',
    header: 'Emissions',
    meta: { numeric: true, width: 130 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'unit', header: 'Unit', meta: { width: 90, type: 'unit' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { width: 120, type: 'tag' },
    cell: (ctx) => statusTag[ctx.getValue<Emission['status']>()],
    enableSorting: false,
  },
  {
    accessorKey: 'note',
    header: 'Note',
    meta: { width: 220, type: 'memo' },
    enableSorting: false,
  },
];

/* ------------------------------------------------------------------ */
/* 1. Everything at once                                               */
/* ------------------------------------------------------------------ */

function FullFeatured() {
  const [selected, setSelected] = useState<string[]>(['e3']);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [clicked, setClicked] = useState<string | null>(null);

  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [
      createSelectionColumn<Emission>(),
      ...baseColumns,
      {
        id: 'actions',
        header: '',
        meta: { width: 100, type: 'button', align: 'center' },
        enableSorting: false,
        cell: (ctx) => (
          <button
            type='button'
            className='rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50'
            onClick={(event) => {
              event.stopPropagation();
              setClicked(`Edit → ${ctx.row.original.category}`);
            }}
          >
            Edit
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className='space-y-2'>
      <DataTable
        data={emissions}
        columns={columns}
        getRowId={(row) => row.id}
        labels={labels}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={{ selectedIds: selected, onChange: setSelected }}
        getRowDisabled={(row) => !row.active}
        onRowClick={(row) => setClicked(`Row → ${row.category}`)}
      />
      <p className='text-slate-500 text-xs'>
        selected: <code>[{selected.join(', ') || '—'}]</code> · sort:{' '}
        <code>{sorting[0] ? `${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}` : '—'}</code> · last click:{' '}
        <code>{clicked ?? '—'}</code>
      </p>
      <p className='text-slate-500 text-xs'>
        Rows 5 and 8 are disabled via <code>getRowDisabled</code> — not clickable, not selectable. Clicking the checkbox
        does not fire the row click. Sortable headers are real buttons: tab to one and press Enter.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Cell types                                                       */
/* ------------------------------------------------------------------ */

const CELL_TYPES = [
  'text',
  'number',
  'unit',
  'memo',
  'checkbox',
  'tag',
  'text-tag',
  'text-dropdown',
  'text-button',
  'button',
  'icon',
  'icon-text',
  'switch',
] as const;

function sampleFor(type: (typeof CELL_TYPES)[number]) {
  switch (type) {
    case 'number':
      return '12,480.5';
    case 'unit':
      return 'tCO₂eq';
    case 'memo':
      return 'Verified by a third party in Q2';
    case 'checkbox':
      return <TableCheckbox checked label='sample' onChange={() => {}} />;
    case 'tag':
      return <Tag tone='ok'>Approved</Tag>;
    case 'text-tag':
      return (
        <>
          <span>Scope 1</span>
          <Tag tone='info'>New</Tag>
        </>
      );
    case 'text-dropdown':
      return (
        <>
          <span>1,240</span>
          <span className='text-slate-400'>▾</span>
        </>
      );
    case 'text-button':
      return (
        <>
          <span>Ulsan</span>
          <button type='button' className='rounded border border-slate-300 px-2 py-1 text-xs'>
            Change
          </button>
        </>
      );
    case 'button':
      return (
        <button type='button' className='rounded border border-slate-300 px-2 py-1 text-xs'>
          Edit
        </button>
      );
    case 'icon':
      return <span className='text-base'>📄</span>;
    case 'icon-text':
      return (
        <>
          <span>🏭</span>
          <span>Ulsan Plant 1</span>
        </>
      );
    case 'switch':
      return (
        <span className='inline-flex h-4 w-8 items-center rounded-full bg-emerald-500 px-0.5'>
          <span className='ml-auto size-3 rounded-full bg-white' />
        </span>
      );
    default:
      return 'Stationary combustion';
  }
}

function CellTypes() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: 180 }}>type</TableHead>
          <TableHead style={{ width: 320 }}>rendering</TableHead>
          <TableHead>notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CELL_TYPES.map((type) => (
          <TableRow key={type} hoverable>
            <TableCell>
              <code className='text-xs'>{type}</code>
            </TableCell>
            <TableCell type={type}>{sampleFor(type)}</TableCell>
            <TableCell type='memo'>
              {type === 'number' || type === 'text-dropdown'
                ? 'right-aligned'
                : type === 'checkbox'
                  ? 'centred'
                  : type.includes('-')
                    ? 'flex row, gap-2'
                    : 'left-aligned'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */
/* 3. States and tones                                                 */
/* ------------------------------------------------------------------ */

const TONES = ['none', 'muted', 'info', 'warning', 'danger'] as const;
const STATES = ['default', 'selected', 'disabled'] as const;

function StatesAndTones() {
  return (
    <div className='grid gap-6 lg:grid-cols-2'>
      <div>
        <h3 className='mb-2 font-medium text-slate-700 text-sm'>tone — resting emphasis</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 120 }}>tone</TableHead>
              <TableHead>sample</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TONES.map((tone) => (
              <TableRow key={tone}>
                <TableCell>
                  <code className='text-xs'>{tone}</code>
                </TableCell>
                <TableCell tone={tone}>Purchased electricity</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className='mb-2 font-medium text-slate-700 text-sm'>state — beats tone when set</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 120 }}>state</TableHead>
              <TableHead>with tone=&quot;warning&quot;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {STATES.map((state) => (
              <TableRow key={state}>
                <TableCell>
                  <code className='text-xs'>{state}</code>
                </TableCell>
                <TableCell state={state} tone='warning'>
                  Purchased electricity
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className='mt-2 text-slate-500 text-xs'>
          Only <code>default</code> shows the warning tone — this is the fix for the old API where{' '}
          <code>&apos;Default&apos;</code> meant two different things.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Loading / empty                                                  */
/* ------------------------------------------------------------------ */

function StatusStates() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  return (
    <div className='space-y-2'>
      <div className='flex gap-2'>
        <button
          type='button'
          className='rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50'
          onClick={() => setLoading((v) => !v)}
        >
          loading: {String(loading)}
        </button>
        <button
          type='button'
          className='rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50'
          onClick={() => setHasData((v) => !v)}
        >
          data: {hasData ? '8 rows' : 'empty'}
        </button>
      </div>
      <DataTable
        data={hasData ? emissions.slice(0, 3) : []}
        columns={baseColumns}
        getRowId={(row) => row.id}
        labels={labels}
        loading={loading}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Server-side pagination + select-all across pages                 */
/* ------------------------------------------------------------------ */

const ALL_IDS = Array.from({ length: 95 }, (_, i) => `s${i + 1}`);

function ServerSide() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'amount', desc: true }]);
  const [selected, setSelected] = useState<string[]>([]);

  // Stand-in for a server response.
  const rows = useMemo<Emission[]>(() => {
    const start = (page - 1) * pageSize;
    return Array.from({ length: Math.min(pageSize, 95 - start) }, (_, i) => {
      const source = emissions[(start + i) % emissions.length] as Emission;
      return { ...source, id: `s${start + i + 1}`, facility: `Site ${start + i + 1}` };
    });
  }, [page, pageSize]);

  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [createSelectionColumn<Emission>(), ...baseColumns.slice(0, 5)],
    [],
  );

  return (
    <div className='space-y-2'>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        labels={labels}
        manualSorting
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={{
          selectedIds: selected,
          onChange: setSelected,
          selectAllMode: 'all',
          totalSelectableCount: ALL_IDS.length,
          onSelectAll: (checked) => setSelected(checked ? ALL_IDS : []),
        }}
        pagination={{
          page,
          pageSize,
          totalCount: 95,
          labels: paginationLabels,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />
      <p className='text-slate-500 text-xs'>
        <code>manualSorting</code> — the header only reports intent; no client-side reorder happens.{' '}
        <code>selectAllMode=&quot;all&quot;</code> — the header checkbox selects all 95 rows, not just this page.
        Selected: <code>{selected.length}</code> / 95.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Component slots                                                  */
/* ------------------------------------------------------------------ */

function PillCheckbox({ checked, onChange, label, disabled }: TableCheckboxProps) {
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={checked === true}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(checked !== true);
      }}
      className={`h-5 w-9 rounded-full border transition-colors disabled:opacity-40 ${
        checked === true
          ? 'border-violet-600 bg-violet-600'
          : checked === 'indeterminate'
            ? 'border-violet-400 bg-violet-200'
            : 'border-slate-300 bg-white'
      }`}
    >
      <span
        className={`block size-3.5 rounded-full bg-white shadow transition-transform ${
          checked === true ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function LetterSortIcon({ direction }: SortIconProps) {
  return (
    <span className='w-6 shrink-0 text-center font-mono text-[10px] text-violet-600'>
      {direction === 'asc' ? 'A→Z' : direction === 'desc' ? 'Z→A' : '↕'}
    </span>
  );
}

function CustomComponents() {
  const [selected, setSelected] = useState<string[]>(['e2']);
  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [
      createSelectionColumn<Emission>({ meta: { headerType: 'checkbox', type: 'checkbox', width: 64 } }),
      ...baseColumns.slice(0, 4),
    ],
    [],
  );

  return (
    <div className='space-y-2'>
      <DataTable
        data={emissions.slice(0, 4)}
        columns={columns}
        getRowId={(row) => row.id}
        labels={labels}
        rowSelection={{ selectedIds: selected, onChange: setSelected }}
        components={{ Checkbox: PillCheckbox, SortIcon: LetterSortIcon }}
      />
      <p className='text-slate-500 text-xs'>
        Same table, <code>components={'{{ Checkbox, SortIcon }}'}</code> swapped for toggles and letter indicators. The
        selection column id is <code>{SELECTION_COLUMN_ID}</code>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Hand-composed primitives                                         */
/* ------------------------------------------------------------------ */

function HandComposed() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead rowSpan={2} style={{ width: 160 }}>
            Facility
          </TableHead>
          <TableHead colSpan={2} className='text-center'>
            2025
          </TableHead>
          <TableHead colSpan={2} className='text-center'>
            2026
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead type='number'>Scope 1</TableHead>
          <TableHead type='number'>Scope 2</TableHead>
          <TableHead type='number'>Scope 1</TableHead>
          <TableHead type='number'>Scope 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          ['Ulsan Plant 1', 12480, 8790, 11200, 8100],
          ['Busan Logistics', 415, 964, 380, 1020],
          ['Seoul HQ', 88, 1502, 74, 1440],
        ].map(([site, ...values]) => (
          <TableRow key={site as string} hoverable>
            <TableCell>{site}</TableCell>
            {(values as number[]).map((value, index) => (
              <TableCell
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length demo columns
                key={index}
                type='number'
                tone={value > 10000 ? 'warning' : 'none'}
              >
                {num(value)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    title: 'Everything at once',
    hint: 'Selection, sorting, disabled rows, row click, action cells.',
    el: FullFeatured,
  },
  { title: 'Cell types', hint: 'All 13 types. Padding differs so every row stays the same height.', el: CellTypes },
  { title: 'States and tones', hint: 'How state and tone interact.', el: StatesAndTones },
  { title: 'Loading and empty', hint: 'Announced through <output aria-live="polite">.', el: StatusStates },
  {
    title: 'Server-side',
    hint: 'manualSorting, pagination, and select-all across pages.',
    el: ServerSide,
  },
  {
    title: 'Filter and visibility',
    hint: '전역 검색 + 컬럼 표시 토글.',
    el: FilterAndVisibility,
  },
  { title: 'Expansion', hint: '서브행 트리와 커스텀 패널 두 가지 방식.', el: Expansion },
  {
    title: 'Resize, sticky, pin',
    hint: '컬럼 폭 드래그 + 헤더 고정 + 왼쪽 컬럼 고정.',
    el: ResizeStickyPin,
  },
  { title: 'Virtualised', hint: '10,000행. 보이는 행만 DOM에 렌더링합니다.', el: Virtualised },
  { title: 'Inline editing', hint: '클릭 또는 Enter 로 편집, Escape 로 취소.', el: InlineEditing },
  { title: 'Component slots', hint: 'Bring your own checkbox and sort icon.', el: CustomComponents },
  {
    title: 'Hand-composed',
    hint: 'Primitives without DataTable — grouped headers, rowSpan, colSpan.',
    el: HandComposed,
  },
];

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

const ROUTES = [
  { path: '#/', label: '데모', note: '동작하는 예제' },
  { path: '#/docs', label: '문서', note: '기능과 커스터마이징 범위' },
] as const;

type RoutePath = (typeof ROUTES)[number]['path'];

const readRoute = (): RoutePath => (window.location.hash.startsWith('#/docs') ? '#/docs' : '#/');

/** Hash routing — no dependency, and section anchors keep working. */
function useRoute(): RoutePath {
  const [route, setRoute] = useState<RoutePath>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

function Tabs({ route }: { route: RoutePath }) {
  return (
    <nav className='flex gap-1' aria-label='pages'>
      {ROUTES.map((entry) => {
        const active = entry.path === route;
        return (
          <a
            key={entry.path}
            href={entry.path}
            aria-current={active ? 'page' : undefined}
            className={`rounded px-3 py-1.5 font-medium text-sm transition-colors ${
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {entry.label}
            <span className={`ml-2 font-normal text-xs ${active ? 'text-slate-300' : 'text-slate-400'}`}>
              {entry.note}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export function App() {
  const route = useRoute();
  const isDocs = route === '#/docs';

  // A new page should start at the top, but keep in-page anchors working.
  useEffect(() => {
    if (!window.location.hash.includes('#', 2)) window.scrollTo(0, 0);
  }, []);

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <header className='sticky top-0 z-20 border-slate-200 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto max-w-[1400px] px-6 py-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h1 className='font-semibold text-lg'>@iesg/table</h1>
              <p className='text-slate-500 text-sm'>
                Playground — imports the library from <code>src/</code>, so edits hot-reload.
              </p>
            </div>
            <Tabs route={route} />
          </div>

          {!isDocs && (
            <nav className='mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs'>
              {SECTIONS.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/\W+/g, '-')}`}
                  className='text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline'
                >
                  {section.title}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className='mx-auto flex max-w-[1400px] gap-6 px-6 py-6'>
        <main className='min-w-0 flex-1'>
          {isDocs ? (
            <Reference />
          ) : (
            <div className='space-y-10'>
              {SECTIONS.map(({ title, hint, el: Component }) => (
                <Section key={title} title={title} hint={hint}>
                  <Component />
                </Section>
              ))}
            </div>
          )}
        </main>
        <ThemeEditor />
      </div>
    </div>
  );
}
