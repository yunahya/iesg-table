import { useMemo, useState } from 'react';
import {
  type ColumnPinningState,
  type ColumnSizingState,
  DataTable,
  EditableCell,
  type ExpandedState,
  type TableColumnDef,
  type VisibilityState,
  createExpanderColumn,
  createSelectionColumn,
} from '../../src/index';
import { type Emission, emissions, labels, num } from './data';

const btn =
  'rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
const btnOn = 'rounded border border-slate-900 bg-slate-900 px-2 py-1 text-white text-xs';

function Note({ children }: { children: React.ReactNode }) {
  return <p className='text-slate-500 text-xs leading-relaxed'>{children}</p>;
}

/* ------------------------------------------------------------------ */
/* 컬럼 표시 토글 + 필터                                                */
/* ------------------------------------------------------------------ */

const filterColumns: TableColumnDef<Emission>[] = [
  { accessorKey: 'category', header: '구분', meta: { width: 200 } },
  { accessorKey: 'facility', header: '사업장', meta: { width: 150 } },
  { accessorKey: 'scope', header: 'Scope', meta: { width: 90, align: 'center' } },
  {
    accessorKey: 'amount',
    header: '배출량',
    meta: { numeric: true, width: 120 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'status', header: '상태', meta: { width: 110 } },
];

export function FilterAndVisibility() {
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<VisibilityState>({});

  const toggleable = filterColumns.filter((c) => 'accessorKey' in c) as { accessorKey: string; header: string }[];

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='전역 검색…'
          className='h-7 w-52 rounded border border-slate-300 px-2 text-xs'
        />
        <span className='text-slate-400 text-xs'>|</span>
        {toggleable.map((column) => {
          const hidden = visibility[column.accessorKey] === false;
          return (
            <button
              key={column.accessorKey}
              type='button'
              className={hidden ? btn : btnOn}
              onClick={() => setVisibility((v) => ({ ...v, [column.accessorKey]: hidden }))}
            >
              {column.header}
            </button>
          );
        })}
      </div>

      <DataTable
        data={emissions}
        columns={filterColumns}
        getRowId={(row) => row.id}
        labels={labels}
        globalFilter={query}
        onGlobalFilterChange={(updater) =>
          setQuery((prev) => (typeof updater === 'function' ? (updater(prev) as string) : (updater as string)))
        }
        columnVisibility={visibility}
        onColumnVisibilityChange={setVisibility}
      />
      <Note>
        검색은 모든 컬럼을 대상으로 하는 <code>globalFilter</code>입니다. 컬럼 버튼은 <code>columnVisibility</code>를
        토글합니다 — 숨긴 컬럼은 <code>&lt;colgroup&gt;</code>에서도 함께 빠집니다.
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 행 확장 — 서브행 트리 + 커스텀 패널                                   */
/* ------------------------------------------------------------------ */

type Node = { id: string; name: string; amount: number; note: string; children?: Node[] };

const tree: Node[] = [
  {
    id: 's1',
    name: 'Scope 1 · 직접 배출',
    amount: 15690.5,
    note: '연료 연소',
    children: [
      { id: 's1a', name: '고정연소', amount: 12480.5, note: '보일러·발전기' },
      { id: 's1b', name: '이동연소', amount: 3210, note: '사업장 차량' },
    ],
  },
  {
    id: 's2',
    name: 'Scope 2 · 간접 배출',
    amount: 9205.25,
    note: '구매 에너지',
    children: [
      { id: 's2a', name: '구매전력', amount: 8790.25, note: '한국전력' },
      { id: 's2b', name: '구매스팀', amount: 415, note: '지역난방' },
    ],
  },
  { id: 's3', name: 'Scope 3 · 기타 간접', amount: 24696.05, note: '가치사슬' },
];

const treeColumns: TableColumnDef<Node>[] = [
  createExpanderColumn<Node>(),
  { accessorKey: 'name', header: '구분', meta: { width: 240 } },
  {
    accessorKey: 'amount',
    header: 'tCO₂eq',
    meta: { numeric: true, width: 130 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'note', header: '비고', meta: { width: 180, type: 'memo' } },
];

export function Expansion() {
  const [expanded, setExpanded] = useState<ExpandedState>({ s1: true });
  const [mode, setMode] = useState<'tree' | 'panel'>('tree');

  return (
    <div className='space-y-2'>
      <div className='flex gap-2'>
        <button type='button' className={mode === 'tree' ? btnOn : btn} onClick={() => setMode('tree')}>
          서브행 트리
        </button>
        <button type='button' className={mode === 'panel' ? btnOn : btn} onClick={() => setMode('panel')}>
          커스텀 패널
        </button>
      </div>

      <DataTable
        data={tree}
        columns={treeColumns}
        getRowId={(row) => row.id}
        labels={{ ...labels, expandRow: '하위 항목 펼치기' }}
        getSubRows={(row) => row.children}
        expanded={expanded}
        onExpandedChange={setExpanded}
        renderSubRow={
          mode === 'panel'
            ? (row) => (
                <div className='px-4 py-3 text-xs'>
                  <div className='font-medium text-slate-700'>{row.original.name} 상세</div>
                  <div className='mt-1 text-slate-500'>
                    하위 {row.original.children?.length ?? 0}건 · 합계 {num(row.original.amount)} tCO₂eq
                  </div>
                </div>
              )
            : undefined
        }
      />
      <Note>
        <strong>서브행 트리</strong>는 <code>getSubRows</code>로 자식을 반환하면 실제 행이 됩니다 — 정렬·필터·선택이
        그대로 적용되고, 들여쓰기는 <code>row.depth</code>를 따릅니다. <strong>커스텀 패널</strong>은{' '}
        <code>renderSubRow</code>로 전체 폭 영역을 그립니다 (가상화와는 함께 못 씁니다).
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 리사이징 + sticky + 컬럼 고정                                        */
/* ------------------------------------------------------------------ */

const wideColumns: TableColumnDef<Emission>[] = [
  createSelectionColumn<Emission>(),
  { accessorKey: 'category', header: '구분', meta: { width: 200, rowHeader: true } },
  { accessorKey: 'facility', header: '사업장', meta: { width: 160 } },
  { accessorKey: 'scope', header: 'Scope', meta: { width: 100, align: 'center' } },
  {
    accessorKey: 'amount',
    header: '배출량',
    meta: { numeric: true, width: 140 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'unit', header: '단위', meta: { width: 100, type: 'unit' } },
  { accessorKey: 'status', header: '상태', meta: { width: 130 } },
  { accessorKey: 'note', header: '비고', meta: { width: 260, type: 'memo' } },
];

export function ResizeStickyPin() {
  const [sizing, setSizing] = useState<ColumnSizingState>({});
  const [pinning, setPinning] = useState<ColumnPinningState>({ left: ['select', 'category'], right: [] });

  const pinned = (pinning.left?.length ?? 0) > 0;

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          className={pinned ? btnOn : btn}
          onClick={() => setPinning(pinned ? { left: [], right: [] } : { left: ['select', 'category'], right: [] })}
        >
          왼쪽 2컬럼 고정 {pinned ? '켜짐' : '꺼짐'}
        </button>
        <button type='button' className={btn} onClick={() => setSizing({})} disabled={Object.keys(sizing).length === 0}>
          컬럼 폭 초기화
        </button>
        <span className='self-center text-slate-500 text-xs'>
          {Object.keys(sizing).length > 0 ? `${Object.keys(sizing).length}개 컬럼 조정됨` : '헤더 오른쪽 끝을 드래그'}
        </span>
      </div>

      <DataTable
        data={emissions}
        columns={wideColumns}
        getRowId={(row) => row.id}
        labels={labels}
        enableColumnResizing
        columnSizing={sizing}
        onColumnSizingChange={setSizing}
        columnPinning={pinning}
        onColumnPinningChange={setPinning}
        stickyHeader
        maxHeight={260}
      />
      <Note>
        헤더 셀 오른쪽 끝을 드래그하면 폭이 바뀝니다. 세로로 스크롤하면 헤더가 고정되고, 가로로 스크롤하면 왼쪽 2개
        컬럼이 고정된 채 그림자가 생깁니다. <code>border-separate</code>를 쓰기 때문에 고정된 셀에서도 테두리가 사라지지
        않습니다.
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 가상화                                                              */
/* ------------------------------------------------------------------ */

type BigRow = { id: string; name: string; facility: string; amount: number };

const BIG: BigRow[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `r${i}`,
  name: `배출원 ${i + 1}`,
  facility: `사업장 ${(i % 40) + 1}`,
  amount: Math.round(Math.random() * 100000) / 10,
}));

const bigColumns: TableColumnDef<BigRow>[] = [
  { accessorKey: 'id', header: 'ID', meta: { width: 100 } },
  { accessorKey: 'name', header: '배출원', meta: { width: 220 } },
  { accessorKey: 'facility', header: '사업장', meta: { width: 160 } },
  {
    accessorKey: 'amount',
    header: 'tCO₂eq',
    meta: { numeric: true, width: 140 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
];

export function Virtualised() {
  const [on, setOn] = useState(true);
  const [query, setQuery] = useState('');

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <button type='button' className={on ? btnOn : btn} onClick={() => setOn((v) => !v)}>
          가상화 {on ? '켜짐' : '꺼짐'}
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='10,000행에서 검색…'
          className='h-7 w-52 rounded border border-slate-300 px-2 text-xs'
        />
        <span className='self-center text-slate-500 text-xs'>
          {on ? 'DOM에는 화면에 보이는 행만 존재합니다' : '10,000행 전부 DOM에 렌더링됩니다 — 느려집니다'}
        </span>
      </div>

      <DataTable
        data={BIG}
        columns={bigColumns}
        getRowId={(row) => row.id}
        labels={labels}
        globalFilter={query}
        onGlobalFilterChange={(updater) =>
          setQuery((prev) => (typeof updater === 'function' ? (updater(prev) as string) : (updater as string)))
        }
        stickyHeader
        maxHeight={320}
        virtual={on ? { estimateRowHeight: 40, overscan: 10 } : false}
      />
      <Note>
        가상화는 <code>maxHeight</code>가 있어야 동작합니다. 위아래 여백은 스페이서 행으로 채워서 스크롤바 길이가 실제
        데이터 양과 맞습니다. 정렬·필터와 함께 써도 됩니다.
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 인라인 편집                                                          */
/* ------------------------------------------------------------------ */

type EditRow = { id: string; category: string; amount: number; note: string };

const SEED: EditRow[] = emissions.slice(0, 5).map((e) => ({
  id: e.id,
  category: e.category,
  amount: e.amount,
  note: e.note,
}));

export function InlineEditing() {
  const [rows, setRows] = useState<EditRow[]>(SEED);
  const [log, setLog] = useState<string[]>([]);

  const columns = useMemo<TableColumnDef<EditRow>[]>(
    () => [
      { accessorKey: 'category', header: '구분', meta: { width: 220 }, cell: (ctx) => <EditableCell ctx={ctx} /> },
      {
        accessorKey: 'amount',
        header: 'tCO₂eq',
        meta: { numeric: true, width: 140 },
        cell: (ctx) => <EditableCell ctx={ctx} inputType='number' format={(v) => num(Number(v))} />,
      },
      {
        accessorKey: 'note',
        header: '비고',
        meta: { width: 260, type: 'memo' },
        cell: (ctx) => <EditableCell ctx={ctx} />,
      },
    ],
    [],
  );

  return (
    <div className='space-y-2'>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        labels={labels}
        onCellEdit={({ rowId, columnId, value }) => {
          setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)));
          setLog((prev) => [`${rowId}.${columnId} → ${JSON.stringify(value)}`, ...prev].slice(0, 4));
        }}
      />
      <Note>
        셀을 클릭하거나 포커스 후 <code>Enter</code> / <code>F2</code>로 편집을 시작합니다. <code>Enter</code>와 포커스
        해제로 확정, <code>Escape</code>로 취소합니다. 숫자 컬럼은 숫자가 아니면 되돌립니다.
      </Note>
      {log.length > 0 && (
        <pre className='rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700'>
          {log.join('\n')}
        </pre>
      )}
    </div>
  );
}
