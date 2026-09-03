import { useMemo, useRef, useState } from 'react';
import {
  type ColumnFiltersState,
  type ColumnOrderState,
  DataTable,
  type GroupingState,
  type TableColumnDef,
  type TableInstance,
  type VisibilityState,
  clearPersistedState,
  createRowDragColumn,
  createSelectionColumn,
  exportTableToCsv,
  tableToCsv,
  usePersistedState,
} from '../../../src/index';
import { baseColumns } from '../columns';
import { type Emission, emissions, labels, num } from '../data';
import { Code, DemoPage, Note, btn, btnOn, input } from '../ui';

/* ------------------------------------------------------------------ */
/* 검색 · 필터                                                          */
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

export function Filtering() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const scope = filters.find((f) => f.id === 'scope')?.value as string | undefined;

  return (
    <DemoPage
      title='검색 · 필터'
      summary={
        <>
          모든 컬럼을 훑는 <Code>globalFilter</Code>와 컬럼 단위 <Code>columnFilters</Code> 두 가지가 있습니다. 서버
          필터링이면 <Code>manualFiltering</Code>을 켜고 결과만 넘기세요.
        </>
      }
      customization={[
        '검색창 UI는 라이브러리가 그리지 않습니다 — 값만 넘기면 됩니다. 디자인은 전부 사용자 것입니다.',
        <>
          비교 방식은 컬럼의 <Code>filterFn</Code>으로 바꿉니다 (<Code>includesString</Code>, <Code>equalsString</Code>,
          직접 작성 등).
        </>,
        <>
          <Code>enableGlobalFilter: false</Code>로 특정 컬럼을 전역 검색 대상에서 뺄 수 있습니다.
        </>,
      ]}
      api={[
        ['globalFilter / onGlobalFilterChange', 'string', '전체 컬럼 대상 검색어.'],
        ['columnFilters / onColumnFiltersChange', 'ColumnFiltersState', '컬럼별 필터 값 배열.'],
        ['manualFiltering', 'boolean', '클라이언트 필터링을 건너뜁니다.'],
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='전역 검색…'
            className={`${input} w-52`}
          />
          <span className='text-slate-400 text-xs'>컬럼 필터:</span>
          {['1', '2', '3'].map((value) => (
            <button
              key={value}
              type='button'
              className={scope === value ? btnOn : btn}
              onClick={() => setFilters(scope === value ? [] : [{ id: 'scope', value }])}
            >
              Scope {value}
            </button>
          ))}
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
          columnFilters={filters}
          onColumnFiltersChange={setFilters}
        />
        <Note>전역 검색과 컬럼 필터는 AND로 걸립니다. 검색어를 지우면 필터만 남습니다.</Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 컬럼 표시                                                            */
/* ------------------------------------------------------------------ */

export function ColumnVisibility() {
  const [visibility, setVisibility] = useState<VisibilityState>({ status: false });
  const toggleable = filterColumns as { accessorKey: string; header: string }[];

  return (
    <DemoPage
      title='컬럼 표시'
      summary={
        <>
          숨긴 컬럼은 <Code>&lt;colgroup&gt;</Code>에서도 함께 빠집니다 — 폭이 남아 빈 칸이 생기는 일이 없습니다.
        </>
      }
      customization={[
        <>
          토글 UI는 직접 그립니다. <Code>table.getAllLeafColumns()</Code>가 필요하면 <Code>tableRef</Code>로 인스턴스를
          받으세요.
        </>,
        <>
          <Code>enableHiding: false</Code>로 숨길 수 없는 컬럼을 지정합니다. 선택 컬럼은 기본으로 그렇게 되어 있습니다.
        </>,
        <>
          초기 상태만 주고 이후는 라이브러리에 맡기려면 <Code>onColumnVisibilityChange</Code>를 넘기지 않으면 됩니다.
        </>,
      ]}
      api={[['columnVisibility / onColumnVisibilityChange', 'VisibilityState', '{ [columnId]: boolean } 형태.']]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
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
          columnVisibility={visibility}
          onColumnVisibilityChange={setVisibility}
        />
        <Note>
          현재 상태: <Code>{JSON.stringify(visibility)}</Code>
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 행 순서 변경                                                         */
/* ------------------------------------------------------------------ */

export function RowReorder() {
  const [order, setOrder] = useState<string[]>([]);

  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [createRowDragColumn<Emission>(), ...baseColumns.slice(0, 4)],
    [],
  );

  return (
    <DemoPage
      title='행 순서 변경'
      summary={
        <>
          왼쪽 손잡이를 잡아 끌면 행 순서가 바뀝니다. 놓을 자리에 초록 선이 표시됩니다. 손잡이에 포커스를 준 뒤{' '}
          <Code>↑</Code> <Code>↓</Code> 키로도 옮길 수 있습니다.
        </>
      }
      customization={[
        <>
          손잡이 컬럼은 <Code>createRowDragColumn()</Code>입니다. 폭·정렬은 넘기는 <Code>meta</Code>로 덮어씁니다.
        </>,
        <>
          손잡이 색은 <Code>--tbl-drag-handle-fg</Code>, 놓을 자리 표시선은 <Code>--tbl-drop-indicator</Code>와{' '}
          <Code>--tbl-drop-indicator-width</Code>입니다.
        </>,
        <>
          순서를 서버에 저장하려면 <Code>onRowOrderChange</Code>에서 받은 id 배열을 그대로 보내면 됩니다.
        </>,
        <>
          <Code>RowDragHandle</Code>을 직접 import해서 원하는 셀 안에 넣어도 됩니다.
        </>,
      ]}
      api={[
        ['enableRowDragging', 'boolean', '드래그를 켭니다.'],
        ['rowOrder / onRowOrderChange', 'string[]', '표시 순서. 목록에 없는 id는 뒤에 그대로 남습니다.'],
        ['createRowDragColumn()', 'ColumnDef', '손잡이 컬럼.'],
        ['labels.dragRow', 'string', '손잡이의 접근성 이름.'],
      ]}
      tokens={[
        '--tbl-drag-handle-fg',
        '--tbl-drag-handle-fg-hover',
        '--tbl-drop-indicator',
        '--tbl-drop-indicator-width',
      ]}
      caveats={[
        '순서는 원본 배열에 적용됩니다. 정렬이 걸려 있으면 정렬이 이깁니다 — 드래그로 순서를 정하는 화면에서는 정렬을 꺼두는 편이 자연스럽습니다.',
        '뎁스 있는 테이블에서는 최상위 행 순서만 바뀝니다.',
      ]}
    >
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <button type='button' className={btn} onClick={() => setOrder([])} disabled={order.length === 0}>
            원래 순서로
          </button>
          <span className='text-slate-500 text-xs'>
            {order.length > 0 ? '순서가 변경되었습니다' : '손잡이를 잡고 위아래로 끌어보세요'}
          </span>
        </div>
        <DataTable
          data={emissions}
          columns={columns}
          getRowId={(row) => row.id}
          labels={{ ...labels, dragRow: '행 순서 변경' }}
          enableRowDragging
          enableSorting={false}
          rowOrder={order}
          onRowOrderChange={setOrder}
        />
        <Note>
          현재 순서: <Code>{order.length > 0 ? order.join(' → ') : '기본'}</Code>
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 컬럼 순서 변경                                                       */
/* ------------------------------------------------------------------ */

const ORDER_KEY = 'iesg-table.demo.columnOrder';

export function ColumnReorder() {
  // Persisting is opt-in and lives outside the table: one hook, one key.
  const [order, setOrder] = usePersistedState<ColumnOrderState>(ORDER_KEY, []);
  const [selected, setSelected] = useState<string[]>([]);
  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [createSelectionColumn<Emission>(), ...baseColumns.slice(0, 5)],
    [],
  );

  return (
    <DemoPage
      title='컬럼 순서 변경'
      summary={
        <>
          헤더를 잡아 끌면 컬럼 순서가 바뀝니다. 놓을 쪽 모서리에 세로선이 표시됩니다. 헤더를 그냥 클릭하면 평소대로
          정렬됩니다 — 드래그와 클릭이 서로 방해하지 않습니다.{' '}
          <strong>이 예제는 순서를 localStorage에 저장합니다</strong> — 새로고침해도 그대로입니다.
        </>
      }
      customization={[
        '선택 컬럼·확장 컬럼·드래그 손잡이 컬럼은 구조상 자리가 고정이라 대상에서 자동으로 빠집니다.',
        <>
          개별 컬럼을 빼려면 <Code>meta.reorderable: false</Code>를 주세요.
        </>,
        '고정(pinned)된 컬럼도 자동으로 제외됩니다.',
        <>
          <Code>enableColumnResizing</Code>과 함께 켜면 <strong>폭 조절이 우선</strong>입니다 — 헤더 오른쪽 끝 손잡이
          위에서는 헤더가 드래그되지 않습니다. 두 동작이 똑같이 시작되기 때문에, 더 작고 의도적인 쪽에 양보합니다.
        </>,
        <>
          저장은 <Code>usePersistedState</Code> 훅으로 합니다. 컬럼 폭·표시 여부·정렬 등 다른 제어 상태에도 똑같이
          씁니다. 테이블이 스스로 저장소에 쓰지는 않습니다 — 키 이름과 저장 여부는 사용자가 정합니다.
        </>,
        <>
          표시선 색은 행 드래그와 같은 <Code>--tbl-drop-indicator</Code>를 씁니다.
        </>,
      ]}
      api={[
        ['enableColumnReordering', 'boolean', '헤더 드래그를 켭니다.'],
        ['columnOrder / onColumnOrderChange', 'ColumnOrderState', '컬럼 id 배열.'],
        ['meta.reorderable', 'boolean', '컬럼 단위 예외.'],
        ['usePersistedState(key, initial)', '[T, OnChangeFn<T>]', 'localStorage에 저장되는 제어 상태.'],
        ['clearPersistedState(key)', 'void', '저장된 값을 지웁니다.'],
      ]}
      caveats={[
        <>
          저장된 값에는 컬럼 <strong>id</strong>가 들어갑니다. 컬럼을 추가·삭제하면 옛 값이 남아 이상하게 보일 수
          있으니, 그럴 때는 <Code>version</Code> 옵션을 올려 예전 항목을 무시하게 하세요.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <button
            type='button'
            className={btn}
            onClick={() => {
              clearPersistedState(ORDER_KEY);
              setOrder([]);
            }}
            disabled={order.length === 0}
          >
            원래 순서로 (저장분도 삭제)
          </button>
          <span className='text-slate-500 text-xs'>
            헤더를 잡고 좌우로 끌어본 다음, 새로고침해보세요 — 순서가 유지됩니다.
          </span>
        </div>
        <DataTable
          data={emissions.slice(0, 5)}
          columns={columns}
          getRowId={(row) => row.id}
          labels={labels}
          enableColumnReordering
          columnOrder={order}
          onColumnOrderChange={setOrder}
          rowSelection={{ selectedIds: selected, onChange: setSelected }}
        />
        <Note>
          현재 순서: <Code>{order.length > 0 ? order.join(', ') : '기본'}</Code>
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 그룹 · 집계                                                          */
/* ------------------------------------------------------------------ */

const groupColumns: TableColumnDef<Emission>[] = [
  { accessorKey: 'scope', header: 'Scope', meta: { width: 220 }, cell: (ctx) => `Scope ${ctx.getValue<number>()}` },
  { accessorKey: 'facility', header: '사업장', meta: { width: 180 } },
  { accessorKey: 'category', header: '구분', meta: { width: 200 } },
  {
    accessorKey: 'amount',
    header: '배출량',
    aggregationFn: 'sum',
    meta: { numeric: true, width: 140 },
    cell: (ctx) => num(ctx.getValue<number>()),
    aggregatedCell: (ctx) => <b>{num(Number(ctx.getValue()))}</b>,
  },
  {
    accessorKey: 'status',
    header: '상태',
    meta: { width: 120 },
    aggregationFn: 'count',
    aggregatedCell: (ctx) => <span className='text-slate-400'>{String(ctx.getValue())}건</span>,
  },
];

export function Grouping() {
  const [grouping, setGrouping] = useState<GroupingState>(['scope']);

  return (
    <DemoPage
      title='그룹 · 집계'
      summary={
        <>
          컬럼 id를 <Code>grouping</Code>에 넣으면 그 값으로 행이 묶이고, 그룹 행에는 하위 개수와 집계값이 표시됩니다.
          두 개를 넣으면 2단으로 중첩됩니다.
        </>
      }
      customization={[
        <>
          집계 함수는 컬럼의 <Code>aggregationFn</Code>입니다 — <Code>sum</Code>, <Code>mean</Code>, <Code>min</Code>,{' '}
          <Code>max</Code>, <Code>count</Code>, <Code>uniqueCount</Code> 또는 직접 작성.
        </>,
        <>
          집계 셀의 모양은 <Code>aggregatedCell</Code>로 따로 그립니다. 안 주면 평소 <Code>cell</Code>을 씁니다.
        </>,
        <>
          그룹 행 배경은 <Code>--tbl-group-row-bg</Code>, 개수 글자색은 <Code>--tbl-group-count-fg</Code>입니다.
        </>,
        <>
          펼침 상태는 <Code>expanded</Code>로 제어합니다. 행 확장과 같은 상태를 씁니다.
        </>,
      ]}
      api={[
        ['grouping / onGroupingChange', 'string[]', '묶을 컬럼 id. 순서가 곧 중첩 순서입니다.'],
        ['aggregationFn', "'sum' | 'mean' | … | fn", '컬럼별 집계 방식.'],
        ['aggregatedCell', '(ctx) => ReactNode', '집계 셀 렌더러.'],
      ]}
      tokens={['--tbl-group-row-bg', '--tbl-group-row-fg', '--tbl-group-count-fg', '--tbl-expander-fg']}
      caveats={[
        <>
          그룹이 켜져 있으면 <Code>getSubRows</Code>는 무시됩니다 — 그룹핑이 스스로 하위 행을 만들기 때문입니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          {(['scope', 'facility', 'status'] as const).map((id) => {
            const on = grouping.includes(id);
            return (
              <button
                key={id}
                type='button'
                className={on ? btnOn : btn}
                onClick={() => setGrouping((g) => (on ? g.filter((x) => x !== id) : [...g, id]))}
              >
                {id} 로 묶기
              </button>
            );
          })}
          <button type='button' className={btn} onClick={() => setGrouping([])} disabled={grouping.length === 0}>
            해제
          </button>
        </div>
        <DataTable
          data={emissions}
          columns={groupColumns}
          getRowId={(row) => row.id}
          labels={{ ...labels, expandRow: '그룹 펼치기' }}
          grouping={grouping}
        />
        <Note>
          현재 그룹: <Code>{grouping.join(' → ') || '없음'}</Code> — 그룹 행의 화살표를 눌러 펼쳐보세요.
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* CSV 내보내기                                                         */
/* ------------------------------------------------------------------ */

export function Export() {
  const tableRef = useRef<TableInstance<Emission> | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState('');

  const columns = useMemo<TableColumnDef<Emission>[]>(() => [createSelectionColumn<Emission>(), ...baseColumns], []);

  const show = (scope: 'filtered' | 'all' | 'selected') => {
    if (!tableRef.current) return;
    setPreview(tableToCsv(tableRef.current, { rows: scope }));
  };

  return (
    <DemoPage
      title='CSV 내보내기'
      summary='현재 화면 기준(필터·정렬·컬럼 순서·표시 여부 반영)으로 CSV를 만듭니다. UTF-8 BOM을 붙이므로 엑셀에서 한글이 깨지지 않습니다.'
      customization={[
        <>
          <Code>rows</Code>로 대상을 고릅니다 — <Code>filtered</Code>(기본) / <Code>all</Code> / <Code>selected</Code> /{' '}
          <Code>page</Code>.
        </>,
        <>
          셀에 태그·버튼이 들어가는 컬럼은 <Code>meta.exportValue</Code>로 내보낼 값을 따로 지정합니다. 아래
          &lsquo;상태&rsquo; 컬럼이 그렇습니다.
        </>,
        <>
          헤더가 문자열이 아니면 <Code>meta.exportHeader</Code>를, 아예 빼려면 <Code>meta.exportable: false</Code>를
          씁니다. 체크박스 같은 표시용 컬럼은 자동으로 빠집니다.
        </>,
        <>
          <Code>delimiter</Code>를 탭으로 주면 TSV가 되고, <Code>formatValue</Code>로 숫자·날짜 형식을 지정합니다.
        </>,
      ]}
      api={[
        ['tableRef', 'MutableRefObject<TableInstance>', '테이블 인스턴스를 받는 통로.'],
        ['exportTableToCsv(table, opts)', 'void', '직렬화 + 다운로드 한 번에.'],
        ['tableToCsv(table, opts)', 'string', 'CSV 문자열만.'],
        ['tableToMatrix(table, opts)', 'string[][]', 'SheetJS·exceljs로 .xlsx를 만들 때의 입력.'],
      ]}
      caveats={[
        <>
          진짜 <Code>.xlsx</Code>는 만들지 않습니다. zip 라이터가 필요해 의존성이 커지기 때문입니다. 필요하면{' '}
          <Code>tableToMatrix()</Code>의 결과를 SheetJS에 넘기세요 — 그게 이 함수가 있는 이유입니다.
        </>,
        <>
          <Code>=</Code>, <Code>+</Code>로 시작하는 값은 엑셀이 수식으로 실행하지 않도록 앞에 따옴표를 붙입니다(수식
          인젝션 방지). <Code>sanitize: false</Code>로 끌 수 있습니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='먼저 걸러보세요…'
            className={`${input} w-40`}
          />
          <button
            type='button'
            className={btn}
            onClick={() => tableRef.current && exportTableToCsv(tableRef.current, { fileName: '배출량.csv' })}
          >
            ⬇ 다운로드 (화면 기준)
          </button>
          <span className='text-slate-400 text-xs'>미리보기:</span>
          <button type='button' className={btn} onClick={() => show('filtered')}>
            filtered
          </button>
          <button type='button' className={btn} onClick={() => show('all')}>
            all
          </button>
          <button type='button' className={btn} onClick={() => show('selected')} disabled={selected.length === 0}>
            selected ({selected.length})
          </button>
        </div>

        <DataTable
          data={emissions}
          columns={columns}
          getRowId={(row) => row.id}
          labels={labels}
          tableRef={tableRef}
          globalFilter={query}
          onGlobalFilterChange={(updater) =>
            setQuery((prev) => (typeof updater === 'function' ? (updater(prev) as string) : (updater as string)))
          }
          rowSelection={{ selectedIds: selected, onChange: setSelected }}
        />

        {preview && (
          <pre className='max-h-56 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700'>
            {preview}
          </pre>
        )}
      </div>
    </DemoPage>
  );
}
