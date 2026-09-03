import { useMemo, useState } from 'react';
import { useRef } from 'react';
import {
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  DataTable,
  EditableCell,
  type ExpandedState,
  type SortingState,
  type TableColumnDef,
  type TableInstance,
  type VisibilityState,
  createExpanderColumn,
  createRowDragColumn,
  createSelectionColumn,
  exportTableToCsv,
} from '../../../src/index';
import { type Emission, emissions, labels, num, paginationLabels } from '../data';
import { Code, DemoPage, Note, Tag, btn, btnOn, input } from '../ui';

/* ------------------------------------------------------------------ */
/* Data — a small tree, plus a large set for the virtualisation toggle  */
/* ------------------------------------------------------------------ */

type Row = Emission & { children?: Row[] };

const SMALL: Row[] = emissions.map((row, index) =>
  index === 0 || index === 2
    ? {
        ...row,
        children: [
          { ...row, id: `${row.id}-a`, category: `${row.category} · 상반기`, amount: row.amount * 0.55, note: '' },
          { ...row, id: `${row.id}-b`, category: `${row.category} · 하반기`, amount: row.amount * 0.45, note: '' },
        ],
      }
    : row,
);

const BIG: Row[] = Array.from({ length: 500 }, (_, i) => {
  const source = emissions[i % emissions.length] as Emission;
  return {
    ...source,
    id: `v${i}`,
    facility: `사업장 ${(i % 40) + 1}`,
    amount: Math.round(Math.random() * 200000) / 10,
  };
});

const statusTag: Record<Emission['status'], React.ReactNode> = {
  approved: <Tag tone='ok'>승인</Tag>,
  requested: <Tag tone='info'>요청</Tag>,
  new: <Tag tone='info'>신규</Tag>,
  over: <Tag tone='warn'>초과</Tag>,
  rejected: <Tag tone='bad'>반려</Tag>,
};

/* ------------------------------------------------------------------ */
/* Feature switches                                                     */
/* ------------------------------------------------------------------ */

type FeatureKey =
  | 'selection'
  | 'drag'
  | 'expansion'
  | 'sorting'
  | 'filter'
  | 'visibility'
  | 'resizing'
  | 'reordering'
  | 'pinning'
  | 'sticky'
  | 'editing'
  | 'grouping'
  | 'virtual'
  | 'pagination';

type Features = Record<FeatureKey, boolean>;

const DEFAULTS: Features = {
  selection: true,
  drag: true,
  expansion: true,
  sorting: true,
  filter: true,
  visibility: true,
  resizing: true,
  reordering: true,
  pinning: true,
  sticky: true,
  editing: true,
  grouping: false,
  virtual: false,
  pagination: false,
};

const SWITCHES: { key: FeatureKey; label: string; prop: string }[] = [
  { key: 'selection', label: '행 선택', prop: 'rowSelection' },
  { key: 'drag', label: '행 순서 변경', prop: 'enableRowDragging' },
  { key: 'expansion', label: '행 확장(트리)', prop: 'getSubRows' },
  { key: 'sorting', label: '정렬', prop: 'sorting' },
  { key: 'filter', label: '전역 검색', prop: 'globalFilter' },
  { key: 'visibility', label: '컬럼 표시', prop: 'columnVisibility' },
  { key: 'resizing', label: '컬럼 폭 조절', prop: 'enableColumnResizing' },
  { key: 'reordering', label: '컬럼 순서 변경', prop: 'enableColumnReordering' },
  { key: 'pinning', label: '컬럼 고정', prop: 'columnPinning' },
  { key: 'sticky', label: '헤더 고정', prop: 'stickyHeader' },
  { key: 'editing', label: '인라인 편집', prop: 'onCellEdit' },
  { key: 'grouping', label: '그룹 · 집계', prop: 'grouping' },
  { key: 'virtual', label: '가상화 (500행)', prop: 'virtual' },
  { key: 'pagination', label: '페이지네이션', prop: 'pagination' },
];

/** Pairs that cannot both be on, and the reason. */
const CONFLICTS: Partial<Record<FeatureKey, { with: FeatureKey; why: string }>> = {
  grouping: { with: 'expansion', why: '그룹핑이 스스로 하위 행을 만들기 때문에 getSubRows를 무시합니다' },
  expansion: { with: 'grouping', why: '그룹핑이 켜져 있으면 트리는 무시됩니다' },
  virtual: { with: 'pagination', why: '페이지로 잘라 놓고 가상화할 이유가 없습니다' },
  pagination: { with: 'virtual', why: '가상화가 이미 렌더링 양을 제한합니다' },
};

/* ------------------------------------------------------------------ */
/* Overview                                                             */
/* ------------------------------------------------------------------ */

export function Overview() {
  const [features, setFeatures] = useState<Features>(DEFAULTS);
  const tableRef = useRef<TableInstance<Row> | null>(null);

  const [selected, setSelected] = useState<string[]>(['e3']);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({ e1: true });
  const [sizing, setSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [pinning, setPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [rowOrder, setRowOrder] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>(SMALL);
  const [page, setPage] = useState(1);
  const [clicked, setClicked] = useState<string | null>(null);

  const toggle = (key: FeatureKey) =>
    setFeatures((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      const conflict = CONFLICTS[key];
      if (next[key] && conflict) next[conflict.with] = false;
      return next;
    });

  const data = features.virtual ? BIG : rows;
  const paged = features.pagination ? data.slice((page - 1) * 5, page * 5) : data;

  const columns = useMemo<TableColumnDef<Row>[]>(() => {
    const list: TableColumnDef<Row>[] = [];
    if (features.drag) list.push(createRowDragColumn<Row>());
    if (features.selection) list.push(createSelectionColumn<Row>());
    if (features.expansion && !features.grouping) list.push(createExpanderColumn<Row>());

    list.push(
      { accessorKey: 'category', header: '구분', meta: { width: 240, required: true, rowHeader: true } },
      {
        accessorKey: 'scope',
        header: 'Scope',
        meta: { width: 100, align: 'center' },
        cell: (ctx) => `Scope ${ctx.getValue<number>()}`,
        aggregationFn: 'count',
        aggregatedCell: (ctx) => <span className='text-slate-400'>{String(ctx.getValue())}건</span>,
      },
      { accessorKey: 'facility', header: '사업장', meta: { width: 160 } },
      {
        accessorKey: 'amount',
        header: '배출량',
        aggregationFn: 'sum',
        meta: { numeric: true, width: 140 },
        cell: features.editing
          ? (ctx) => <EditableCell ctx={ctx} inputType='number' format={(v) => num(Number(v))} />
          : (ctx) => num(ctx.getValue<number>()),
        aggregatedCell: (ctx) => <b>{num(Number(ctx.getValue()))}</b>,
      },
      { accessorKey: 'unit', header: '단위', meta: { width: 90, type: 'unit' } },
      {
        accessorKey: 'status',
        header: '상태',
        enableSorting: false,
        meta: { width: 110, type: 'tag', exportValue: (row) => row.status },
        cell: (ctx) => statusTag[ctx.getValue<Emission['status']>()],
      },
      {
        accessorKey: 'note',
        header: '비고',
        enableSorting: false,
        meta: { width: 240, type: 'memo' },
        cell: features.editing ? (ctx) => <EditableCell ctx={ctx} /> : undefined,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableResizing: false,
        meta: { width: 90, type: 'button', align: 'center', exportable: false, reorderable: false },
        cell: (ctx) => (
          <button
            type='button'
            className={btn}
            onClick={(event) => {
              event.stopPropagation();
              setClicked(`수정 → ${ctx.row.original.category}`);
            }}
          >
            수정
          </button>
        ),
      },
    );
    return list;
  }, [features.drag, features.selection, features.expansion, features.grouping, features.editing]);

  return (
    <DemoPage
      title='한눈에 보기'
      summary='이 테이블 하나에 라이브러리가 제공하는 기능이 전부 들어 있습니다. 아래 스위치로 하나씩 껐다 켜면서 어떤 prop이 무엇을 바꾸는지 확인해보세요. 함께 쓸 수 없는 조합은 자동으로 서로를 끕니다.'
      customization={[
        <>스위치 하나가 prop 하나입니다 — 라이브러리는 켜진 기능만 계산합니다. 끈 기능은 행 모델조차 돌지 않습니다.</>,
        <>
          이 페이지에서 바꾼 색·간격은 오른쪽 테마 편집기의 <Code>--tbl-*</Code> 변수로 전부 조정됩니다.
        </>,
        <>기능별 상세 설명·API·제약은 왼쪽 메뉴의 각 페이지에 있습니다.</>,
      ]}
      caveats={[
        <>
          <Code>grouping</Code>과 <Code>getSubRows</Code>는 동시에 못 씁니다. 그룹핑이 하위 행을 직접 만듭니다.
        </>,
        <>
          <Code>virtual</Code>과 <Code>renderSubRow</Code> 패널도 동시에 못 씁니다. 트리 방식은 가능합니다.
        </>,
        <>행 드래그와 정렬이 둘 다 켜져 있으면 정렬이 이깁니다 — 드래그로 순서를 정하는 화면에서는 정렬을 끄세요.</>,
      ]}
    >
      <div className='space-y-3'>
        {/* switches */}
        <div className='rounded border border-slate-200 bg-slate-50 p-2.5'>
          <div className='flex flex-wrap gap-1.5'>
            {SWITCHES.map(({ key, label, prop }) => {
              const conflict = CONFLICTS[key];
              // Say why a switch will turn its neighbour off before it happens.
              const title = conflict ? `${prop} — ${conflict.why}` : prop;
              return (
                <button
                  key={key}
                  type='button'
                  title={title}
                  className={features[key] ? btnOn : btn}
                  onClick={() => toggle(key)}
                >
                  {label}
                  {conflict && <span className='ml-1 opacity-60'>*</span>}
                </button>
              );
            })}
            <button type='button' className={btn} onClick={() => setFeatures(DEFAULTS)}>
              기본값으로
            </button>
          </div>
          <p className='mt-2 text-[11px] text-slate-500'>
            <span className='opacity-60'>*</span> 표시된 기능은 짝이 되는 기능과 함께 쓸 수 없어, 켜면 상대를 끕니다.
            버튼에 마우스를 올리면 이유가 보입니다.
          </p>
        </div>

        {/* controls the switches expose */}
        <div className='flex flex-wrap items-center gap-2'>
          {features.filter && (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='전역 검색…'
              className={`${input} w-44`}
            />
          )}
          {features.visibility &&
            (['facility', 'unit', 'note'] as const).map((id) => {
              const hidden = visibility[id] === false;
              return (
                <button
                  key={id}
                  type='button'
                  className={hidden ? btn : btnOn}
                  onClick={() => setVisibility((v) => ({ ...v, [id]: hidden }))}
                >
                  {id}
                </button>
              );
            })}
          {features.pinning && (
            <button
              type='button'
              className={(pinning.left?.length ?? 0) > 0 ? btnOn : btn}
              onClick={() =>
                setPinning((p) =>
                  (p.left?.length ?? 0) > 0 ? { left: [], right: [] } : { left: ['category'], right: ['actions'] },
                )
              }
            >
              좌우 고정
            </button>
          )}
          <button
            type='button'
            className={btn}
            onClick={() => tableRef.current && exportTableToCsv(tableRef.current, { fileName: '배출량.csv' })}
          >
            ⬇ CSV
          </button>
        </div>

        <DataTable
          data={paged}
          columns={columns}
          getRowId={(row) => row.id}
          labels={{ ...labels, expandRow: '하위 항목 펼치기', dragRow: '행 순서 변경' }}
          tableRef={tableRef}
          /* selection */
          rowSelection={features.selection ? { selectedIds: selected, onChange: setSelected } : undefined}
          /* sorting */
          enableSorting={features.sorting}
          sorting={sorting}
          onSortingChange={setSorting}
          /* filtering */
          globalFilter={features.filter ? query : ''}
          onGlobalFilterChange={(updater) =>
            setQuery((prev) => (typeof updater === 'function' ? (updater(prev) as string) : (updater as string)))
          }
          /* visibility */
          columnVisibility={features.visibility ? visibility : {}}
          onColumnVisibilityChange={setVisibility}
          /* expansion */
          getSubRows={features.expansion && !features.grouping ? (row) => row.children : undefined}
          expanded={expanded}
          onExpandedChange={setExpanded}
          /* grouping */
          grouping={features.grouping ? ['scope'] : []}
          /* resizing */
          enableColumnResizing={features.resizing}
          columnSizing={sizing}
          onColumnSizingChange={setSizing}
          /* reordering */
          enableColumnReordering={features.reordering}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          /* pinning */
          columnPinning={features.pinning ? pinning : { left: [], right: [] }}
          onColumnPinningChange={setPinning}
          /* row drag */
          enableRowDragging={features.drag}
          rowOrder={rowOrder}
          onRowOrderChange={setRowOrder}
          /* scrolling */
          stickyHeader={features.sticky}
          maxHeight={features.sticky || features.virtual ? 360 : undefined}
          virtual={features.virtual}
          /* editing */
          onCellEdit={
            features.editing
              ? ({ rowId, columnId, value }) =>
                  setRows((previous) =>
                    previous.map((row) =>
                      row.id === rowId
                        ? { ...row, [columnId]: value }
                        : row.children
                          ? {
                              ...row,
                              children: row.children.map((child) =>
                                child.id === rowId ? { ...child, [columnId]: value } : child,
                              ),
                            }
                          : row,
                    ),
                  )
              : undefined
          }
          /* pagination */
          pagination={
            features.pagination
              ? {
                  page,
                  pageSize: 5,
                  totalCount: data.length,
                  labels: paginationLabels,
                  onPageChange: setPage,
                }
              : undefined
          }
          getRowDisabled={(row) => !row.active}
          onRowClick={(row) => setClicked(`행 → ${row.category}`)}
        />

        <Note>
          선택 <Code>{selected.length}</Code> · 정렬{' '}
          <Code>{sorting[0] ? `${sorting[0].id} ${sorting[0].desc ? 'desc' : 'asc'}` : '—'}</Code> · 마지막 클릭{' '}
          <Code>{clicked ?? '—'}</Code> · 켜진 기능 <Code>{SWITCHES.filter((s) => features[s.key]).length}</Code> /{' '}
          {SWITCHES.length}
        </Note>
        <Note>
          비활성 행(5·8번)은 클릭도 선택도 되지 않습니다. 편집 셀에서는 <Code>↑↓←→</Code>와 <Code>Tab</Code>으로
          이동하고, 글자를 바로 입력하면 편집이 시작됩니다.
        </Note>
      </div>
    </DemoPage>
  );
}
