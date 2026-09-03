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

/** Leaves carry the numbers; every parent is the sum of what is under it. */
function rollUp(node: Node): Node {
  if (!node.children?.length) return node;
  const children = node.children.map(rollUp);
  return { ...node, children, amount: children.reduce((total, child) => total + child.amount, 0) };
}

const tree: Node[] = [
  {
    id: 's1',
    name: 'Scope 1 · 직접 배출',
    amount: 0,
    note: '연료 연소',
    children: [
      {
        id: 's1-1',
        name: '고정연소',
        amount: 0,
        note: '보일러 · 발전기',
        children: [
          {
            id: 's1-1-1',
            name: '무연탄',
            amount: 0,
            note: '고체연료',
            children: [
              { id: 's1-1-1-a', name: '울산 1공장 · 1호기', amount: 6240.5, note: '2026-01 검침' },
              { id: 's1-1-1-b', name: '울산 1공장 · 2호기', amount: 3180.0, note: '2026-01 검침' },
              { id: 's1-1-1-c', name: '여수 2공장 · 1호기', amount: 1860.25, note: '2026-01 검침' },
            ],
          },
          {
            id: 's1-1-2',
            name: 'LNG',
            amount: 0,
            note: '기체연료',
            children: [
              { id: 's1-1-2-a', name: '울산 1공장 · 발전기', amount: 940.75, note: '공급사 명세' },
              { id: 's1-1-2-b', name: '서울 본사 · 난방', amount: 258.5, note: '공급사 명세' },
            ],
          },
        ],
      },
      {
        id: 's1-2',
        name: '이동연소',
        amount: 0,
        note: '사업장 차량',
        children: [
          {
            id: 's1-2-1',
            name: '경유',
            amount: 0,
            note: '법인 차량',
            children: [
              { id: 's1-2-1-a', name: '물류 트럭 12대', amount: 2410.0, note: '주유 카드' },
              { id: 's1-2-1-b', name: '지게차 8대', amount: 512.4, note: '주유 카드' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 's2',
    name: 'Scope 2 · 간접 배출',
    amount: 0,
    note: '구매 에너지',
    children: [
      {
        id: 's2-1',
        name: '구매전력',
        amount: 0,
        note: '한국전력',
        children: [
          {
            id: 's2-1-1',
            name: '고압 A',
            amount: 0,
            note: '산업용',
            children: [
              { id: 's2-1-1-a', name: '울산 1공장', amount: 5820.25, note: '월별 고지서' },
              { id: 's2-1-1-b', name: '여수 2공장', amount: 2140.0, note: '월별 고지서' },
            ],
          },
          { id: 's2-1-2', name: '일반용', amount: 830.0, note: '서울 본사' },
        ],
      },
      { id: 's2-2', name: '구매스팀', amount: 415.0, note: '지역난방' },
    ],
  },
  { id: 's3', name: 'Scope 3 · 기타 간접', amount: 24696.05, note: '가치사슬 — 하위 분해 예정' },
].map(rollUp);

const treeColumns: TableColumnDef<Node>[] = [
  createExpanderColumn<Node>(),
  { accessorKey: 'name', header: '구분', meta: { width: 320 } },
  {
    accessorKey: 'amount',
    header: 'tCO₂eq',
    meta: { numeric: true, width: 130 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'note', header: '비고', meta: { width: 200, type: 'memo' } },
];

export function Expansion() {
  const [expanded, setExpanded] = useState<ExpandedState>({ s1: true, 's1-1': true });
  const [mode, setMode] = useState<'depth' | 'toggle'>('depth');

  return (
    <DemoPage
      title='행 확장'
      summary={
        <>
          두 가지 방식이 있습니다. <strong>뎁스 있는 테이블</strong>은 자식이 진짜 행이 되어 몇 단계든 내려갈 수 있고,{' '}
          <strong>테이블 토글</strong>은 행 아래 전체 폭 영역을 열어 원하는 걸 그립니다.
        </>
      }
      customization={[
        <>
          뎁스는 <Code>getSubRows</Code>로 자식 배열을 반환하면 끝입니다. 깊이 제한이 없고, 정렬·필터·선택이 자식 행에도
          그대로 적용됩니다. 들여쓰기는 <Code>row.depth</Code>를 따릅니다 (한 단계당 16px).
        </>,
        <>
          토글 영역은 <Code>renderSubRow</Code>가 반환하는 것을 그대로 그립니다 — 표든 폼이든 차트든 상관없습니다.
          배경은 <Code>--tbl-subrow-bg</Code>.
        </>,
        <>
          화살표 컬럼은 <Code>createExpanderColumn()</Code>이고 색은 <Code>--tbl-expander-fg</Code>입니다. 자식이 없는
          행에는 같은 폭의 빈 자리가 들어가 정렬이 흐트러지지 않습니다.
        </>,
        <>
          한 번에 다 펼치려면 <Code>expanded={'{true}'}</Code>를 넘기세요.
        </>,
      ]}
      api={[
        ['getSubRows', '(row) => TData[]', '뎁스 방식. 반환한 배열이 자식 행이 됩니다.'],
        ['renderSubRow', '(row) => ReactNode', '토글 방식. 행 아래 전체 폭 영역.'],
        ['expanded / onExpandedChange', 'ExpandedState', '펼침 상태. true면 전부 펼칩니다.'],
        ['row.depth', 'number', '들여쓰기 단계. 화살표가 알아서 씁니다.'],
        ['labels.expandRow', 'string', '화살표 버튼의 접근성 이름.'],
      ]}
      tokens={['--tbl-expander-fg', '--tbl-subrow-bg']}
      caveats={[
        <>
          <Code>renderSubRow</Code>는 가상화와 함께 쓸 수 없습니다 — 토글 영역이 &lsquo;행 하나당 인덱스 하나&rsquo;라는
          전제를 깨기 때문입니다. 뎁스 방식은 실제 행이라 가상화와 문제없이 같이 씁니다.
        </>,
        <>
          그룹핑(<Code>grouping</Code>)이 켜져 있으면 <Code>getSubRows</Code>는 무시됩니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap gap-2'>
          <button type='button' className={mode === 'depth' ? btnOn : btn} onClick={() => setMode('depth')}>
            뎁스 있는 테이블
          </button>
          <button type='button' className={mode === 'toggle' ? btnOn : btn} onClick={() => setMode('toggle')}>
            테이블 토글
          </button>
          <button type='button' className={btn} onClick={() => setExpanded(true)}>
            전부 펼치기
          </button>
          <button type='button' className={btn} onClick={() => setExpanded({})}>
            전부 접기
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
          renderSubRow={mode === 'toggle' ? (row) => <SubTable node={row.original} /> : undefined}
        />
        <Note>
          {mode === 'depth'
            ? '4단계까지 내려갑니다: Scope → 배출원 → 연료 → 설비·사업장. 상위 행의 수치는 아래 행들의 합계입니다.'
            : '같은 데이터에 renderSubRow만 추가했습니다 — 펼치면 자식이 행으로 끼어드는 대신, 행 아래에 별도의 표가 열립니다.'}
        </Note>
      </div>
    </DemoPage>
  );
}

/** What the toggle mode opens: a small table of its own, not more rows. */
function SubTable({ node }: { node: Node }) {
  const children = node.children ?? [];

  return (
    <div className='px-4 py-3'>
      <div className='mb-2 font-medium text-slate-700 text-xs'>
        {node.name} · 하위 {children.length}건 · 합계 {num(node.amount)} tCO₂eq
      </div>
      {children.length === 0 ? (
        <div className='text-slate-400 text-xs'>하위 항목이 없습니다.</div>
      ) : (
        <table className='w-full max-w-xl text-xs'>
          <thead className='text-slate-400'>
            <tr>
              <th className='py-1 text-left font-medium'>항목</th>
              <th className='py-1 text-right font-medium'>tCO₂eq</th>
              <th className='py-1 text-right font-medium'>비중</th>
            </tr>
          </thead>
          <tbody className='text-slate-700'>
            {children.map((child) => (
              <tr key={child.id} className='border-slate-200 border-t'>
                <td className='py-1'>{child.name}</td>
                <td className='py-1 text-right tabular-nums'>{num(child.amount)}</td>
                <td className='py-1 text-right tabular-nums text-slate-400'>
                  {node.amount > 0 ? `${Math.round((child.amount / node.amount) * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
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
        '컬럼 순서 변경과 같이 켜도 됩니다. 손잡이 위에서는 헤더 드래그가 꺼지므로, 가장자리를 끌면 폭이 바뀌고 그 밖을 끌면 순서가 바뀝니다.',
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
