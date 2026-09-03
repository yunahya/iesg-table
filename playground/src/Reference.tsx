import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* 문서용 프리미티브                                                    */
/* ------------------------------------------------------------------ */

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className='rounded-lg border border-slate-200 bg-white p-5'>
      <h3 className='font-semibold text-slate-900 text-sm'>{title}</h3>
      {subtitle && <p className='mt-0.5 text-slate-500 text-xs leading-relaxed'>{subtitle}</p>}
      <div className='mt-3'>{children}</div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className='rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-800'>{children}</code>;
}

function Block({ children }: { children: string }) {
  return (
    <pre className='overflow-x-auto rounded border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-800 leading-relaxed'>
      {children}
    </pre>
  );
}

function Rows({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full border-collapse text-xs'>
        <thead>
          <tr className='border-slate-200 border-b'>
            {head.map((h) => (
              <th key={h} className='py-1.5 pr-3 text-left font-medium text-slate-500'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className='border-slate-100 border-b last:border-b-0'>
              {row.map((cell, i) => (
                <td
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-shape documentation rows
                  key={i}
                  className='py-1.5 pr-3 align-top text-slate-700'
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span
        className='size-3 shrink-0 rounded-sm border border-slate-300'
        style={{ background: `var(${token})` }}
        aria-hidden='true'
      />
      <Code>{token}</Code>
    </span>
  );
}

const YES = <span className='font-medium text-emerald-700'>가능</span>;
const NO = <span className='text-slate-400'>불가</span>;

/* ------------------------------------------------------------------ */
/* 내용                                                                */
/* ------------------------------------------------------------------ */

/** Where a feature's logic actually comes from. */
function Origin({ kind }: { kind: 'tanstack' | 'own' | 'mixed' }) {
  const [className, text] = {
    tanstack: ['bg-sky-100 text-sky-800', 'TanStack'],
    own: ['bg-violet-100 text-violet-800', '직접 구현'],
    mixed: ['bg-slate-200 text-slate-700', '혼합'],
  }[kind];
  return <span className={`mr-1 rounded px-1.5 py-0.5 font-medium text-[10px] ${className}`}>{text}</span>;
}

/** 기능 | 설명 | API | 로직의 출처와 구현 방식 */
const FEATURES: ReactNode[][] = [
  [
    '정렬',
    '클라이언트 정렬, 정렬된 data 받기(manualSorting), 제어/비제어 모두',
    <Code key='k'>sorting</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      계산은 <Code>getSortedRowModel</Code>, 헤더 버튼·아이콘·<Code>aria-sort</Code>는 직접
    </span>,
  ],
  [
    '행 선택',
    '단일·다중, 부분선택(indeterminate), 페이지 범위 / 전체 범위',
    <Code key='k'>rowSelection</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      TanStack <Code>rowSelection</Code> 상태를 id 배열 API로 감싸고, 전체 범위 선택은 직접
    </span>,
  ],
  [
    '페이지네이션',
    '내장 컴포넌트 또는 직접 배치. 페이지 크기 선택 포함',
    <Code key='k'>pagination</Code>,
    <span key='o'>
      <Origin kind='own' />
      서버 기준이라 TanStack 페이지 행 모델을 쓰지 않습니다. 번호·생략(…) 계산도 직접
    </span>,
  ],
  [
    '로딩 / 빈 상태',
    '로딩은 헤더 + 흐린 대체 행 + 스피너, 빈 상태는 전용 행. 둘 다 aria-live로 안내',
    <Code key='k'>loading</Code>,
    <span key='o'>
      <Origin kind='own' />
      colSpan 한 칸짜리 상태 행
    </span>,
  ],
  [
    '행 비활성화',
    '클릭·선택 차단 + 전용 색상',
    <Code key='k'>getRowDisabled</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      선택 차단은 <Code>enableRowSelection</Code> 콜백, 클릭 차단과 색은 직접
    </span>,
  ],
  [
    '행 클릭',
    '마우스 + 키보드(Enter/Space). 내부 컨트롤 이벤트는 무시',
    <Code key='k'>onRowClick</Code>,
    <span key='o'>
      <Origin kind='own' />
      <Code>event.target !== currentTarget</Code>로 셀 안 버튼의 키 입력을 걸러냅니다
    </span>,
  ],
  [
    '셀 타입 14종',
    'text, number, unit, memo, checkbox, tag, text-tag, text-dropdown, text-button, button, icon, icon-text, switch, custom',
    <Code key='k'>meta.type</Code>,
    <span key='o'>
      <Origin kind='own' />
      타입별 패딩·정렬 클래스 매핑. TanStack은 렌더링에 관여하지 않습니다
    </span>,
  ],
  [
    '커스텀 셀',
    '13종으로 설명 안 되는 셀. 날짜 선택기·슬라이더 등 아무 컴포넌트나',
    <Code key='k'>type: 'custom'</Code>,
    <span key='o'>
      <Origin kind='own' />
      레이아웃 간섭을 끄는 타입입니다. <Code>meta.className</Code>으로 <Code>td</Code>까지 손댈 수 있고, 팝오버는
      portal로 띄웁니다
    </span>,
  ],
  [
    '셀 톤 5종',
    'none, muted, info, warning, danger — 의미 기반 강조',
    <Code key='k'>meta.tone</Code>,
    <span key='o'>
      <Origin kind='own' />
      state가 설정되면 tone을 덮는 우선순위 규칙까지 직접
    </span>,
  ],
  [
    '행 헤더 컬럼',
    'th scope="row" 로 렌더링',
    <Code key='k'>meta.rowHeader</Code>,
    <span key='o'>
      <Origin kind='own' />셀 렌더러에서 태그만 바꿉니다
    </span>,
  ],
  [
    '컬럼 폭 고정',
    'colgroup으로 확정. 균등 분할되지 않음',
    <Code key='k'>meta.width</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      <Code>meta.width</Code>를 TanStack 컬럼 사이징에 주입하고, 실제 폭은 <Code>&lt;colgroup&gt;</Code>으로 내보냅니다
    </span>,
  ],
  [
    '말줄임',
    '컬럼별 on/off',
    <Code key='k'>meta.truncate</Code>,
    <span key='o'>
      <Origin kind='own' />
      말줄임을 셀이 아니라 글자를 든 내부 요소에 겁니다 — 셀에 걸면 잘리기만 하고 … 이 안 나옵니다
    </span>,
  ],
  [
    '다국어',
    '문구 하드코딩 0개. labels가 필수 prop',
    <Code key='k'>labels</Code>,
    <span key='o'>
      <Origin kind='own' />
      필수 prop이라 빠뜨릴 수 없습니다
    </span>,
  ],
  [
    '접근성',
    'aria-sort, scope, aria-selected/disabled/busy, 포커스 링',
    '—',
    <span key='o'>
      <Origin kind='own' />
      마크업이 이 패키지 몫이므로 전부 직접
    </span>,
  ],
  [
    '전역 검색 / 컬럼 필터',
    '클라이언트 필터, 필터링된 data 받기(manualFiltering)',
    <Code key='k'>globalFilter</Code>,
    <span key='o'>
      <Origin kind='tanstack' />
      <Code>getFilteredRowModel</Code> 그대로. 검색창 UI는 제공하지 않습니다
    </span>,
  ],
  [
    '컬럼 표시 토글',
    '숨긴 컬럼은 colgroup에서도 함께 빠집니다',
    <Code key='k'>columnVisibility</Code>,
    <span key='o'>
      <Origin kind='tanstack' />
      상태는 그대로 쓰고, colgroup 동기화만 직접
    </span>,
  ],
  [
    '행 확장',
    '뎁스 있는 테이블(getSubRows, 깊이 제한 없음, 단계마다 배경이 진해짐) 또는 테이블 토글(renderSubRow)',
    <Code key='k'>expanded</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      트리는 <Code>getExpandedRowModel</Code>, 패널 행과 화살표 컬럼은 직접
    </span>,
  ],
  [
    '컬럼 리사이징',
    '헤더 끝 드래그. onChange / onEnd 모드',
    <Code key='k'>enableColumnResizing</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      계산은 <Code>getResizeHandler</Code>, 손잡이 DOM과 커서는 직접
    </span>,
  ],
  [
    'sticky 헤더',
    '세로 스크롤 시 헤더 고정',
    <Code key='k'>stickyHeader</Code>,
    <span key='o'>
      <Origin kind='own' />
      순수 CSS <Code>position: sticky</Code>. 이걸 위해 테이블을 <Code>border-separate</Code>로 씁니다
    </span>,
  ],
  [
    '컬럼 고정',
    '좌/우 고정 + 경계 그림자. 오프셋 자동 계산',
    <Code key='k'>columnPinning</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      오프셋은 <Code>getStart</Code> / <Code>getAfter</Code>, sticky 배치와 그림자는 직접
    </span>,
  ],
  [
    '가상화',
    '수만 행에서 보이는 행만 렌더링',
    <Code key='k'>virtual</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      엔진은 별도 패키지 <Code>@tanstack/react-virtual</Code>, 스페이서 행 기법은 직접
    </span>,
  ],
  [
    '셀 인라인 편집',
    '포커스되면 바로 편집. Enter·blur 확정, Escape 취소',
    <Code key='k'>onCellEdit</Code>,
    <span key='o'>
      <Origin kind='own' />
      TanStack에는 편집 기능이 없습니다. <Code>table.options.meta</Code>를 통로로만 씁니다
    </span>,
  ],
  [
    '편집 셀 키보드 이동',
    '↑↓←→ 와 Tab 으로 셀 사이 이동. 이동만 해도 편집 상태가 됩니다',
    <Code key='k'>gridNavigation</Code>,
    <span key='o'>
      <Origin kind='own' />
      렌더된 DOM의 <Code>cellIndex</Code>를 훑어 이동합니다 — 가상화·숨김·순서 변경과 무관하게 동작합니다
    </span>,
  ],
  [
    '행 순서 변경',
    '손잡이 드래그 + 방향키. 놓을 자리 표시선 포함',
    <Code key='k'>enableRowDragging</Code>,
    <span key='o'>
      <Origin kind='own' />
      TanStack에 행 순서 상태가 없습니다. HTML5 드래그앤드롭 + 원본 배열 재정렬로 구현
    </span>,
  ],
  [
    '컬럼 순서 변경',
    '헤더 드래그. 선택·확장·고정 컬럼은 자동 제외',
    <Code key='k'>enableColumnReordering</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      상태는 TanStack <Code>columnOrder</Code>, 드래그 상호작용과 표시선은 직접
    </span>,
  ],
  [
    '그룹 · 집계',
    '다중 그룹 중첩, sum/mean/count 등 집계 셀',
    <Code key='k'>grouping</Code>,
    <span key='o'>
      <Origin kind='mixed' />
      <Code>getGroupedRowModel</Code>과 집계 함수는 TanStack, 그룹 행 렌더링은 직접
    </span>,
  ],
  [
    'CSV 내보내기',
    '화면 기준 직렬화, UTF-8 BOM, 수식 인젝션 방지',
    <Code key='k'>exportTableToCsv</Code>,
    <span key='o'>
      <Origin kind='own' />
      TanStack 행 모델에서 값만 읽습니다. RFC 4180 이스케이프도 직접
    </span>,
  ],
  [
    '상태 저장',
    '컬럼 순서·폭·표시 여부를 새로고침 후에도 유지',
    <Code key='k'>usePersistedState</Code>,
    <span key='o'>
      <Origin kind='own' />
      선택 사항인 훅 하나. 테이블이 스스로 저장소에 쓰지 않습니다
    </span>,
  ],
];

const NOT_YET: ReactNode[][] = [
  ['진짜 .xlsx 파일 생성', 'zip 라이터가 필요합니다. tableToMatrix()를 SheetJS·exceljs에 넘기세요'],
  ['가상화 + 테이블 토글', '토글 영역이 행-인덱스 매핑을 깨뜨립니다. 뎁스 있는 테이블은 가능합니다'],
  ['드래그 중 자동 스크롤', '긴 목록에서 화면 밖으로 끌 때 스크롤이 따라가지 않습니다'],
  ['터치 드래그', 'HTML5 드래그앤드롭 기반이라 모바일에서는 방향키 이동을 쓰세요'],
  ['다중 헤더 그룹 정렬', 'colSpan 헤더는 프리미티브로 직접 조합해야 합니다'],
];

const TOKEN_GROUPS: { title: string; note: string; tokens: string[] }[] = [
  {
    title: '구조',
    note: '테두리와 모서리, 행 높이',
    tokens: ['--tbl-border', '--tbl-border-width', '--tbl-radius', '--tbl-row-height'],
  },
  {
    title: '여백',
    note: '셀 타입별 세로 패딩이 달라 행 높이가 항상 일정합니다',
    tokens: [
      '--tbl-cell-px',
      '--tbl-cell-px-wide',
      '--tbl-cell-py',
      '--tbl-cell-py-loose',
      '--tbl-cell-py-compact',
      '--tbl-cell-py-switch',
    ],
  },
  {
    title: '헤더',
    note: '정렬 활성 화살표 색 포함',
    tokens: ['--tbl-header-bg', '--tbl-header-fg', '--tbl-header-fg-hover', '--tbl-sort-active'],
  },
  {
    title: '셀 기본',
    note: '아무 상태도 아닐 때',
    tokens: ['--tbl-cell-bg', '--tbl-cell-fg'],
  },
  {
    title: '행 상태',
    note: '호버·선택·비활성·포커스',
    tokens: [
      '--tbl-row-hover-bg',
      '--tbl-row-clickable-hover-bg',
      '--tbl-cell-hover-bg',
      '--tbl-row-selected-bg',
      '--tbl-row-selected-fg',
      '--tbl-row-disabled-bg',
      '--tbl-row-disabled-fg',
      '--tbl-focus-ring',
      '--tbl-cell-disabled-bg',
      '--tbl-cell-disabled-fg',
    ],
  },
  {
    title: '셀 톤',
    note: 'state가 default일 때만 적용',
    tokens: [
      '--tbl-tone-muted-bg',
      '--tbl-tone-muted-fg',
      '--tbl-tone-info-bg',
      '--tbl-tone-info-fg',
      '--tbl-tone-warning-bg',
      '--tbl-tone-warning-fg',
      '--tbl-tone-danger-bg',
      '--tbl-tone-danger-fg',
    ],
  },
  {
    title: '체크박스',
    note: '크기는 토큰이 아닙니다 — 18px 고정',
    tokens: [
      '--tbl-checkbox-radius',
      '--tbl-checkbox-bg',
      '--tbl-checkbox-border',
      '--tbl-checkbox-checked-bg',
      '--tbl-checkbox-checked-border',
      '--tbl-checkbox-mark',
      '--tbl-checkbox-disabled-bg',
      '--tbl-checkbox-disabled-border',
    ],
  },
  {
    title: '고정 (sticky · pin)',
    note: '고정 헤더 배경과 고정 컬럼 경계의 그림자',
    tokens: ['--tbl-sticky-header-bg', '--tbl-pinned-shadow', '--tbl-pinned-shadow-right'],
  },
  {
    title: '리사이즈 핸들',
    note: '헤더 오른쪽 끝의 드래그 영역',
    tokens: [
      '--tbl-resize-handle-width',
      '--tbl-resize-handle',
      '--tbl-resize-handle-hover',
      '--tbl-resize-handle-active',
    ],
  },
  {
    title: '행 확장',
    note: '펼침 아이콘, 토글 영역 배경, 뎁스별 음영. 단계당 tint를 한 번 더 섞습니다',
    tokens: ['--tbl-expander-fg', '--tbl-subrow-bg', '--tbl-row-depth-tint', '--tbl-row-depth-step'],
  },
  {
    title: '드래그 순서 변경',
    note: '행 손잡이와, 놓을 자리를 알리는 표시선',
    tokens: [
      '--tbl-drag-handle-fg',
      '--tbl-drag-handle-fg-hover',
      '--tbl-drop-indicator',
      '--tbl-drop-indicator-width',
    ],
  },
  {
    title: '그룹 · 집계',
    note: '그룹 행의 배경과 하위 개수 표시',
    tokens: ['--tbl-group-row-bg', '--tbl-group-row-fg', '--tbl-group-count-fg'],
  },
  {
    title: '인라인 편집',
    note: '편집 중 입력창과 편집 가능 셀의 호버',
    tokens: ['--tbl-edit-bg', '--tbl-edit-fg', '--tbl-edit-border', '--tbl-edit-hover-bg'],
  },
  {
    title: '로딩',
    note: '헤더는 그대로 두고, 대체 행을 흐리게 깔고 그 위에 스피너',
    tokens: [
      '--tbl-skeleton-bg',
      '--tbl-loading-blur',
      '--tbl-loading-overlay-bg',
      '--tbl-spinner-track',
      '--tbl-spinner-indicator',
    ],
  },
  {
    title: '기타',
    note: '빈 상태 문구, 필수 표시(*)',
    tokens: ['--tbl-empty-fg', '--tbl-required-fg'],
  },
];

const TOKEN_COUNT = TOKEN_GROUPS.reduce((n, g) => n + g.tokens.length, 0);

const LAYERS: ReactNode[][] = [
  [<strong key='k'>1. CSS 변수</strong>, '색상 · 여백 · 테두리 · 모서리 전부', '앱 전체 / 특정 영역 / 다크모드', YES],
  [<strong key='k'>2. 컬럼 meta</strong>, '폭, 정렬, 셀 타입, 톤, 말줄임, 행헤더 여부', '컬럼 단위', YES],
  [<strong key='k'>3. components 슬롯</strong>, '체크박스 · 정렬 아이콘을 자체 컴포넌트로 교체', '테이블 단위', YES],
  [
    <strong key='k'>4. 프리미티브 조합</strong>,
    'DataTable을 쓰지 않고 Table/TableRow/TableCell 직접 조립',
    '자유',
    YES,
  ],
  [
    <span key='k' className='text-slate-400'>
      체크박스 크기
    </span>,
    '18×18 고정. 인라인 스타일로 잠겨 있어 클래스로도 못 바꿉니다',
    '—',
    NO,
  ],
];

/* ------------------------------------------------------------------ */

export function Reference() {
  return (
    <div className='space-y-4'>
      {/* 요약 */}
      <div className='grid gap-3 sm:grid-cols-3'>
        {[
          [String(TOKEN_COUNT), 'CSS 변수', '색·여백·테두리 전부 토큰을 거칩니다'],
          ['21', '기능', '정렬·필터·확장·리사이즈·고정·가상화·편집'],
          ['0', '하드코딩된 색상', '렌더 결과에 헥스 코드가 남지 않습니다'],
        ].map(([n, label, note]) => (
          <div key={label} className='rounded-lg border border-slate-200 bg-white p-4'>
            <div className='font-semibold text-2xl text-slate-900 tabular-nums'>{n}</div>
            <div className='font-medium text-slate-700 text-xs'>{label}</div>
            <div className='mt-1 text-[11px] text-slate-500 leading-relaxed'>{note}</div>
          </div>
        ))}
      </div>

      <Card
        title='이 라이브러리의 구조'
        subtitle='TanStack Table v8을 포크하지 않고 의존성으로 사용합니다. 로직은 TanStack이, 마크업과 디자인은 이 패키지가 담당합니다.'
      >
        <Block>{`@iesg/table                     ← 마크업 · 디자인 · 접근성
  └─ dependency: @tanstack/react-table   ← 정렬 · 선택 · 페이지 계산 로직
`}</Block>
      </Card>

      {/* 기능 */}
      <Card
        title='제공하는 기능'
        subtitle='현재 0.1.0 기준으로 동작하는 것들입니다. 마지막 칸은 그 기능의 로직이 TanStack에서 오는지, 이 패키지가 직접 만든 것인지를 나눕니다.'
      >
        <Rows head={['기능', '설명', 'API', '어디서 오는가']} rows={FEATURES} />
      </Card>

      <Card title='아직 없는 기능' subtitle='숨기지 않고 적어 둡니다. 대부분 우회 방법이 있습니다.'>
        <Rows head={['기능', '비고']} rows={NOT_YET} />
      </Card>

      {/* 커스터마이징 */}
      <Card title='커스터마이징은 어디까지 되나' subtitle='아래로 갈수록 자유도가 높고, 손이 더 많이 갑니다.'>
        <Rows head={['레이어', '바꿀 수 있는 것', '적용 범위', '']} rows={LAYERS} />
      </Card>

      <Card
        title={`1. CSS 변수 — 토큰 ${TOKEN_COUNT}개`}
        subtitle='컴포넌트가 렌더링하는 모든 색과 치수가 이 변수를 거칩니다. 덮어쓰면 그대로 반영됩니다. @layer base에 선언되어 있어 레이어 없이 쓴 사용자 CSS가 항상 우선합니다.'
      >
        <Block>{`/* 앱 전체 */
:root { --tbl-row-selected-bg: #e0f2fe; }

/* 특정 테이블만 */
.compact-table { --tbl-row-height: 32px; --tbl-cell-py: 4px; }

/* 다크모드 */
[data-theme='dark'] { --tbl-cell-bg: #18181b; --tbl-cell-fg: #fafafa; }

/* 이미 팔레트가 있다면 자기 변수로 연결 */
:root { --tbl-border: var(--color-warm-neutral-40); }`}</Block>

        <div className='mt-4 space-y-3'>
          {TOKEN_GROUPS.map((group) => (
            <div key={group.title}>
              <div className='flex flex-wrap items-baseline gap-x-2'>
                <span className='font-medium text-slate-700 text-xs'>{group.title}</span>
                <span className='text-[11px] text-slate-500'>{group.note}</span>
              </div>
              <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1'>
                {group.tokens.map((token) => (
                  <Swatch key={token} token={token} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className='mt-3 text-[11px] text-slate-500'>
          위 색상 칩은 현재 적용된 실제 값입니다 — 우측 패널에서 프리셋을 바꾸면 여기도 같이 바뀝니다.
        </p>
      </Card>

      <Card
        title='2. 컬럼 meta — 컬럼 단위 설정'
        subtitle='레이아웃과 셀 동작을 호출부가 아니라 컬럼 정의에 선언합니다.'
      >
        <Rows
          head={['키', '타입', '설명']}
          rows={[
            ['align / headerAlign', <Code key='k'>'left' | 'center' | 'right'</Code>, 'numeric이면 기본 right'],
            ['width / minWidth / maxWidth', <Code key='k'>number | string</Code>, 'number면 colgroup으로 폭 확정'],
            ['numeric', <Code key='k'>boolean</Code>, '우측 정렬 + number 셀 타입'],
            ['required', <Code key='k'>boolean</Code>, '헤더 앞에 * 표시'],
            ['truncate', <Code key='k'>boolean</Code>, '말줄임. 기본 true'],
            ['rowHeader', <Code key='k'>boolean</Code>, <span key='v'>{'<th scope="row">'}로 렌더링</span>],
            ['type', <Code key='k'>CellType</Code>, '패딩과 내부 정렬 (13종 + custom)'],
            ['tone', <Code key='k'>CellTone</Code>, 'none · muted · info · warning · danger'],
            ['state', <Code key='k'>CellState</Code>, 'default · selected · disabled (보통 자동)'],
            ['line / rightStroke', <Code key='k'>boolean</Code>, '아래·오른쪽 테두리. 기본 true'],
          ]}
        />
        <div className='mt-3'>
          <Block>{`const columns: TableColumnDef<Emission>[] = [
  createSelectionColumn<Emission>(),        // 헤더 전체선택 + 행 체크박스를 함께 제공
  { accessorKey: 'category', header: '구분',
    meta: { width: 220, required: true, rowHeader: true } },
  { accessorKey: 'amount', header: '배출량',
    meta: { numeric: true, width: 130 },
    cell: (ctx) => ctx.getValue<number>().toLocaleString() },
];`}</Block>
        </div>
      </Card>

      <Card
        title='3. components 슬롯 — 컴포넌트 교체'
        subtitle='기본 체크박스와 정렬 아이콘은 아이이에스지 디자인 시스템 아트워크입니다. 외부 사용자는 자기 것으로 갈아끼울 수 있습니다.'
      >
        <Block>{`<DataTable
  {...props}
  components={{
    Checkbox: MyCheckbox,   // (props: TableCheckboxProps) => ReactNode
    SortIcon: MySortIcon,   // (props: SortIconProps) => ReactNode
  }}
/>`}</Block>
        <p className='mt-2 text-[11px] text-slate-500 leading-relaxed'>
          <a href='#/' className='font-medium text-slate-900 underline underline-offset-2'>
            데모 페이지
          </a>
          의 <strong>Component slots</strong> 섹션에서 토글 스위치와 <Code>A→Z</Code> 문자로 바꾼 실제 예시를 볼 수
          있습니다. 정렬 아이콘 슬롯은 오름/내림차순을 다른 모양으로 구분하고 싶을 때도 씁니다.
        </p>
      </Card>

      <Card
        title='4. 프리미티브 직접 조합'
        subtitle='DataTable이 안 맞으면 스타일이 다 들어 있는 프리미티브만 가져다 씁니다. 그룹 헤더, rowSpan/colSpan 등 자유롭게 조립할 수 있습니다.'
      >
        <Block>{`import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@iesg/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>구분</TableHead>
      <TableHead type='number'>배출량</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow hoverable>
      <TableCell>고정연소</TableCell>
      <TableCell type='number' tone='warning'>12,480.5</TableCell>
    </TableRow>
  </TableBody>
</Table>`}</Block>
      </Card>

      {/* 고정된 것 */}
      <Card title='의도적으로 고정한 것' subtitle='바꿀 수 없게 막아둔 부분과 그 이유입니다.'>
        <Rows
          head={['항목', '값', '이유']}
          rows={[
            [
              '체크박스 크기',
              <Code key='k'>18 × 18px</Code>,
              '어떤 행 높이·셀 패딩·flex 레이아웃에서도 동일하게 보여야 합니다. SVG와 래퍼 양쪽에 인라인 스타일로 width/height/min/max를 박아서 유틸리티 클래스로도 덮이지 않습니다.',
            ],
            ['체크박스 셀 패딩', <Code key='k'>0</Code>, '셀이 50px 고정이고 중앙 정렬이라 패딩이 불필요합니다.'],
            [
              'labels prop',
              <Code key='k'>필수</Code>,
              '문구를 하드코딩할 수 없게 강제해서 처음부터 다국어 대응이 됩니다.',
            ],
            [
              'getRowId prop',
              <Code key='k'>필수</Code>,
              '선택 상태의 키가 되므로 인덱스 기반 추측을 허용하지 않습니다.',
            ],
          ]}
        />
      </Card>

      {/* 알려진 한계 */}
      <Card title='알려진 한계' subtitle='지금 상태에서 인지하고 있는 것들입니다.'>
        <ul className='space-y-2 text-slate-700 text-xs leading-relaxed'>
          <li>
            <strong>정렬 아이콘 모양이 방향별로 같습니다.</strong> 현재는 활성 화살표에{' '}
            <Swatch token='--tbl-sort-active' /> 색만 입힙니다. 방향별 아트워크를 주시면 교체할 수 있고, 급하면{' '}
            <Code>components.SortIcon</Code>으로도 해결됩니다.
          </li>
          <li>
            <strong>"비활성 + 체크됨" 아트워크가 없습니다.</strong> 해당 조합은 체크 아이콘에 투명도 40%를 적용하고
            있습니다.
          </li>
          <li>
            <strong>톤(tone)은 컬럼 단위입니다.</strong> 행 단위로 톤을 바꾸려면 지금은 <Code>getRowClassName</Code>을
            쓰거나 셀 렌더러에서 직접 처리해야 합니다.
          </li>
          <li>
            <strong>전체선택 기본값은 현재 페이지 범위입니다.</strong> 서버 페이지네이션에서 올바른 동작이며, 전 범위
            선택은 <Code>selectAllMode: 'all'</Code>로 명시해야 합니다.
          </li>
        </ul>
      </Card>
    </div>
  );
}
