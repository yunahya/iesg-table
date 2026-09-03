import { useState } from 'react';
import {
  type ColumnPinningState,
  type ColumnSizingState,
  DataTable,
  type ExpandedState,
  type TableColumnDef,
  createExpanderColumn,
  createSelectionColumn,
} from '../../../src/index';
import { type Emission, emissions, labels, num } from '../data';
import { Code, DemoPage, Note, btn, btnOn, input } from '../ui';

/* ------------------------------------------------------------------ */
/* 행 확장                                                              */
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
    <DemoPage
      title='행 확장'
      summary={
        <>
          두 가지 방식이 있습니다. <strong>서브행 트리</strong>는 자식이 진짜 행이 되고, <strong>커스텀 패널</strong>은
          행 아래 전체 폭 영역에 원하는 걸 그립니다.
        </>
      }
      customization={[
        <>
          트리는 <Code>getSubRows</Code>로 자식 배열을 반환하면 끝입니다. 정렬·필터·선택이 자식 행에도 그대로 적용되고,
          들여쓰기는 <Code>row.depth</Code>를 따릅니다 (한 단계당 16px).
        </>,
        <>
          패널은 <Code>renderSubRow</Code>가 반환하는 것을 그대로 그립니다 — 폼이든 차트든 상관없습니다. 배경은{' '}
          <Code>--tbl-subrow-bg</Code>.
        </>,
        <>
          화살표 컬럼은 <Code>createExpanderColumn()</Code>이고 색은 <Code>--tbl-expander-fg</Code>입니다. 자식이 없는
          행에는 같은 폭의 빈 자리가 들어가 정렬이 흐트러지지 않습니다.
        </>,
      ]}
      api={[
        ['getSubRows', '(row) => TData[]', '트리 방식.'],
        ['renderSubRow', '(row) => ReactNode', '패널 방식.'],
        ['expanded / onExpandedChange', 'ExpandedState', '펼침 상태. true면 전부 펼칩니다.'],
        ['labels.expandRow', 'string', '화살표 버튼의 접근성 이름.'],
      ]}
      tokens={['--tbl-expander-fg', '--tbl-subrow-bg']}
      caveats={[
        <>
          <Code>renderSubRow</Code>는 가상화와 함께 쓸 수 없습니다 — 패널이 &lsquo;행 하나당 인덱스 하나&rsquo;라는
          전제를 깨기 때문입니다. 트리 방식은 실제 행이라 가상화와 문제없이 같이 씁니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
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
          {mode === 'tree'
            ? '자식이 실제 행으로 들어옵니다. 화살표를 눌러보세요.'
            : '같은 데이터에 renderSubRow만 추가했습니다 — 펼치면 표가 아니라 패널이 나옵니다.'}
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 컬럼 폭 조절                                                         */
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

export function Resizing() {
  const [sizing, setSizing] = useState<ColumnSizingState>({});
  const [mode, setMode] = useState<'onChange' | 'onEnd'>('onChange');

  return (
    <DemoPage
      title='컬럼 폭 조절'
      summary={
        <>
          헤더 셀 오른쪽 끝을 잡아 끌면 폭이 바뀝니다. 폭은 <Code>&lt;colgroup&gt;</Code>으로 나가기 때문에 브라우저가
          임의로 재배분하지 않습니다.
        </>
      }
      customization={[
        <>
          기준 폭·최소·최대는 컬럼의 <Code>meta.width</Code> / <Code>minWidth</Code> / <Code>maxWidth</Code>입니다. 이
          숫자 하나를 리사이즈·고정 오프셋·<Code>&lt;col&gt;</Code>이 함께 씁니다.
        </>,
        <>
          <Code>columnResizeMode</Code>가 <Code>onChange</Code>면 끄는 동안 실시간으로, <Code>onEnd</Code>면 손을 뗄 때
          한 번에 반영됩니다. 행이 많으면 <Code>onEnd</Code>가 부드럽습니다.
        </>,
        <>
          손잡이 폭·색은 <Code>--tbl-resize-handle-*</Code> 변수입니다. 기본은 투명이고 hover에만 보입니다.
        </>,
        <>
          <Code>enableResizing: false</Code>로 특정 컬럼을 제외합니다.
        </>,
      ]}
      api={[
        ['enableColumnResizing', 'boolean', '리사이즈를 켭니다.'],
        ['columnResizeMode', "'onChange' | 'onEnd'", '반영 시점.'],
        ['columnSizing / onColumnSizingChange', 'ColumnSizingState', '컬럼별 폭. 저장했다가 복원할 수 있습니다.'],
      ]}
      tokens={[
        '--tbl-resize-handle-width',
        '--tbl-resize-handle',
        '--tbl-resize-handle-hover',
        '--tbl-resize-handle-active',
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <button type='button' className={btn} onClick={() => setMode(mode === 'onChange' ? 'onEnd' : 'onChange')}>
            columnResizeMode: {mode}
          </button>
          <button
            type='button'
            className={btn}
            onClick={() => setSizing({})}
            disabled={Object.keys(sizing).length === 0}
          >
            폭 초기화
          </button>
          <span className='text-slate-500 text-xs'>
            {Object.keys(sizing).length > 0
              ? `${Object.keys(sizing).length}개 컬럼 조정됨`
              : '헤더 오른쪽 끝을 드래그하세요'}
          </span>
        </div>
        <DataTable
          data={emissions}
          columns={wideColumns}
          getRowId={(row) => row.id}
          labels={labels}
          enableColumnResizing
          columnResizeMode={mode}
          columnSizing={sizing}
          onColumnSizingChange={setSizing}
        />
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 헤더 고정 · 컬럼 고정                                                 */
/* ------------------------------------------------------------------ */

export function StickyAndPinning() {
  const [pinning, setPinning] = useState<ColumnPinningState>({ left: ['select', 'category'], right: [] });
  const [sticky, setSticky] = useState(true);

  const pinnedLeft = (pinning.left?.length ?? 0) > 0;
  const pinnedRight = (pinning.right?.length ?? 0) > 0;

  return (
    <DemoPage
      title='헤더 고정 · 컬럼 고정'
      summary='세로로 스크롤하면 헤더가, 가로로 스크롤하면 지정한 컬럼이 제자리에 남습니다. 경계에는 그림자가 생겨 어디까지가 고정인지 보입니다.'
      customization={[
        <>
          그림자는 <Code>--tbl-pinned-shadow</Code>(왼쪽) / <Code>--tbl-pinned-shadow-right</Code>입니다. 없애려면{' '}
          <Code>none</Code>을 넣으세요.
        </>,
        <>
          고정된 헤더 배경은 <Code>--tbl-sticky-header-bg</Code>입니다. 기본은 헤더 배경과 같습니다.
        </>,
        '고정 컬럼의 본문 배경은 일부러 강제하지 않습니다 — 그러면 선택·비활성 행의 색을 덮어써 버리기 때문입니다.',
      ]}
      api={[
        ['stickyHeader', 'boolean', 'maxHeight와 함께 써야 의미가 있습니다.'],
        ['maxHeight', 'number | string', '스크롤 컨테이너 높이 상한.'],
        ['columnPinning / onColumnPinningChange', 'ColumnPinningState', '{ left: [], right: [] } 형태의 컬럼 id.'],
      ]}
      tokens={['--tbl-sticky-header-bg', '--tbl-pinned-shadow', '--tbl-pinned-shadow-right']}
      caveats={[
        <>
          고정이 동작하려면 테이블이 <Code>border-separate</Code>여야 합니다. <Code>border-collapse</Code>에서는
          테두리를 테이블이 그려서 고정된 셀에서 사라집니다. 이 라이브러리는 이미 그렇게 되어 있습니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap gap-2'>
          <button type='button' className={sticky ? btnOn : btn} onClick={() => setSticky((v) => !v)}>
            헤더 고정 {sticky ? '켜짐' : '꺼짐'}
          </button>
          <button
            type='button'
            className={pinnedLeft ? btnOn : btn}
            onClick={() => setPinning((p) => ({ ...p, left: pinnedLeft ? [] : ['select', 'category'] }))}
          >
            왼쪽 2컬럼 고정
          </button>
          <button
            type='button'
            className={pinnedRight ? btnOn : btn}
            onClick={() => setPinning((p) => ({ ...p, right: pinnedRight ? [] : ['status'] }))}
          >
            오른쪽 &lsquo;상태&rsquo; 고정
          </button>
        </div>
        <DataTable
          data={emissions}
          columns={wideColumns}
          getRowId={(row) => row.id}
          labels={labels}
          columnPinning={pinning}
          onColumnPinningChange={setPinning}
          stickyHeader={sticky}
          maxHeight={260}
        />
        <Note>가로·세로 양쪽으로 스크롤해보세요. 고정 헤더와 고정 컬럼이 만나는 모서리도 겹치지 않습니다.</Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 가상화                                                               */
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
    <DemoPage
      title='가상화'
      summary='10,000행입니다. 켜면 화면에 보이는 행만 DOM에 존재하고, 위아래 여백은 스페이서 행이 채워서 스크롤바 길이는 실제 데이터 양과 맞습니다.'
      customization={[
        <>
          <Code>virtual</Code>에 <Code>true</Code> 대신 객체를 주면 <Code>estimateRowHeight</Code>와{' '}
          <Code>overscan</Code>을 조정할 수 있습니다. 행 높이를 바꿨다면 여기도 맞춰주세요.
        </>,
        '정렬·필터·고정 헤더와 함께 써도 됩니다. 필터 결과에 대해 가상화가 다시 계산됩니다.',
        <>
          엔진은 <Code>@tanstack/react-virtual</Code>입니다.
        </>,
      ]}
      api={[
        ['virtual', 'boolean | VirtualOptions', 'maxHeight가 반드시 있어야 합니다.'],
        ['virtual.estimateRowHeight', 'number', '측정 전 가정하는 행 높이. 기본 40.'],
        ['virtual.overscan', 'number', '화면 밖에 미리 그릴 행 수. 기본 8.'],
      ]}
      caveats={[
        <>
          <Code>renderSubRow</Code> 패널과 함께 쓸 수 없습니다.
        </>,
        '행 높이가 제각각이면 스크롤이 약간 튈 수 있습니다. 이 라이브러리는 행 높이가 고정이라 해당하지 않습니다.',
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <button type='button' className={on ? btnOn : btn} onClick={() => setOn((v) => !v)}>
            가상화 {on ? '켜짐' : '꺼짐'}
          </button>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='10,000행에서 검색…'
            className={`${input} w-52`}
          />
          <span className='text-slate-500 text-xs'>
            {on ? '보이는 행만 DOM에 있습니다' : '10,000행 전부 렌더링 — 눈에 띄게 느려집니다'}
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
      </div>
    </DemoPage>
  );
}
