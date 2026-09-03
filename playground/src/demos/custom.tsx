import { useCallback, useMemo, useState } from 'react';
import {
  DataTable,
  EditableCell,
  SELECTION_COLUMN_ID,
  type SortIconProps,
  Table,
  TableBody,
  TableCell,
  type TableCheckboxProps,
  type TableColumnDef,
  TableHead,
  TableHeader,
  TableRow,
  createSelectionColumn,
} from '../../../src/index';
import { type SearchOption, SearchSelect } from '../SearchSelect';
import { baseColumns } from '../columns';
import { type Emission, emissions, labels, num } from '../data';
import { Code, DemoPage, Note } from '../ui';

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
    <DemoPage
      title='인라인 편집'
      summary={
        <>
          셀을 클릭하거나, 포커스한 뒤 <Code>Enter</Code> · <Code>F2</Code>를 누르거나, 그냥 글자를 치면 편집이
          시작됩니다. <Code>↑↓←→</Code>와 <Code>Tab</Code>으로 셀 사이를 옮겨 다닐 수 있어 마우스 없이 한 열을 쭉 채울
          수 있습니다.
        </>
      }
      customization={[
        <>
          <Code>EditableCell</Code>은 기본 제공일 뿐입니다. <Code>onCellEdit</Code>만 받아 처리하면 입력 UI는 얼마든지
          직접 만들어도 됩니다.
        </>,
        <>
          키보드 이동이 방해가 되면 <Code>gridNavigation={'{false}'}</Code>로 끕니다. 그러면 <Code>Tab</Code>은 브라우저
          기본 순서를, <Code>←→</Code>는 캐럿 이동만 하게 됩니다.
        </>,
        <>
          사용자가 만든 셀 컴포넌트도 <Code>CELL_NAV_ATTR</Code>을 펼쳐 넣으면 같은 이동 대상에 포함됩니다.
        </>,
        <>
          <Code>validate</Code>로 확정 전에 값을 거를 수 있고, 통과하지 못하면 원래 값으로 되돌아갑니다.
        </>,
        <>
          <Code>format</Code>은 편집 중이 아닐 때의 표시 형식입니다 — 아래 숫자 컬럼은 천 단위 구분이 들어갑니다.
        </>,
        <>
          <Code>disabled</Code>로 행별·셀별 편집 차단이 가능합니다. 색은 <Code>--tbl-edit-*</Code> 변수입니다.
        </>,
      ]}
      api={[
        ['onCellEdit', '(edit) => void', '{ rowId, columnId, value, row }를 받습니다.'],
        ['EditableCell.inputType', "'text' | 'number'", 'number면 숫자로 확정합니다.'],
        ['EditableCell.validate', '(value) => boolean', '거절되면 되돌립니다.'],
        ['EditableCell.format', '(value) => string', '보기 전용 표시 형식.'],
        ['EditableCell.gridNavigation', 'boolean', '기본 true. 방향키·Tab 이동.'],
        ['CELL_NAV_ATTR', 'object', '직접 만든 셀 컨트롤을 이동 대상에 넣는 속성.'],
      ]}
      tokens={['--tbl-edit-bg', '--tbl-edit-fg', '--tbl-edit-border', '--tbl-edit-hover-bg']}
      caveats={[
        <>
          상태는 사용자가 들고 있습니다 — <Code>onCellEdit</Code>에서 데이터를 갱신하지 않으면 값은 되돌아갑니다. 낙관적
          업데이트도, 서버 확인 후 반영도 모두 사용자의 선택입니다.
        </>,
      ]}
    >
      <div className='space-y-3'>
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
          셀 하나에 포커스를 준 뒤 <Code>↓</Code>로 내려가며 값을 바로 타이핑해보세요. <Code>Enter</Code>는 확정 후
          아래로, <Code>Tab</Code>은 확정 후 오른쪽으로, <Code>Escape</Code>는 취소입니다. 편집 중 <Code>←→</Code>는
          글자 사이를 움직이다가 끝에 닿으면 옆 셀로 넘어갑니다. 숫자 컬럼에 글자를 넣고 <Code>Enter</Code>를 누르면
          되돌아갑니다.
        </Note>
        {log.length > 0 && (
          <pre className='rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700'>
            {log.join('\n')}
          </pre>
        )}
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 컴포넌트 교체                                                        */
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

export function ComponentSlots() {
  const [selected, setSelected] = useState<string[]>(['e2']);
  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [
      createSelectionColumn<Emission>({ meta: { headerType: 'checkbox', type: 'checkbox', width: 64 } }),
      ...baseColumns.slice(0, 4),
    ],
    [],
  );

  return (
    <DemoPage
      title='컴포넌트 교체'
      summary='체크박스와 정렬 아이콘은 슬롯입니다. 사용자의 디자인 시스템 컴포넌트를 그대로 꽂으면 됩니다 — 아래는 토글 스위치와 글자 표시기로 바꾼 같은 테이블입니다.'
      customization={[
        <>
          <Code>components.Checkbox</Code>는 <Code>{'{ checked, onChange, label, disabled }'}</Code>를 받습니다.{' '}
          <Code>checked</Code>는 <Code>true | false | &apos;indeterminate&apos;</Code>입니다.
        </>,
        <>
          <Code>components.SortIcon</Code>은 <Code>{"direction: 'asc' | 'desc' | false"}</Code>를 받습니다.
        </>,
        '기본 체크박스를 쓴다면 크기는 18×18 고정입니다. 다른 크기가 필요하면 이렇게 교체하세요 — 그게 의도된 방법입니다.',
        <>
          선택 컬럼의 폭은 <Code>createSelectionColumn({'{ meta: { width: 64 } }'})</Code>처럼 덮어씁니다.
        </>,
      ]}
      api={[
        ['components.Checkbox', 'ComponentType<TableCheckboxProps>', '헤더·행 양쪽에 쓰입니다.'],
        ['components.SortIcon', 'ComponentType<SortIconProps>', '정렬 가능한 헤더에 쓰입니다.'],
      ]}
    >
      <div className='space-y-3'>
        <DataTable
          data={emissions.slice(0, 4)}
          columns={columns}
          getRowId={(row) => row.id}
          labels={labels}
          rowSelection={{ selectedIds: selected, onChange: setSelected }}
          components={{ Checkbox: PillCheckbox, SortIcon: LetterSortIcon }}
        />
        <Note>
          선택 컬럼의 id는 <Code>{SELECTION_COLUMN_ID}</Code>입니다.
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 프리미티브 직접 조합                                                  */
/* ------------------------------------------------------------------ */

export function HandComposed() {
  return (
    <DemoPage
      title='프리미티브 직접 조합'
      summary={
        <>
          <Code>DataTable</Code> 없이 <Code>Table</Code> / <Code>TableRow</Code> / <Code>TableCell</Code>만 써서 직접 짤
          수 있습니다. 2단 헤더, <Code>rowSpan</Code>, <Code>colSpan</Code>처럼 데이터 구조에 안 맞는 표가 그렇습니다.
        </>
      }
      customization={[
        '모든 프리미티브가 export되어 있습니다 — 스타일은 그대로 받고 구조만 직접 정하는 방식입니다.',
        <>
          <Code>tone</Code>, <Code>state</Code>, <Code>type</Code>은 셀 단위로 그대로 쓸 수 있습니다.
        </>,
        <>
          이 방식은 정렬·선택·페이지네이션을 제공하지 않습니다. 필요하면 <Code>DataTable</Code>을 쓰세요.
        </>,
      ]}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} style={{ width: 160 }}>
              사업장
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
            ['울산 1공장', 12480, 8790, 11200, 8100],
            ['부산 물류', 415, 964, 380, 1020],
            ['서울 본사', 88, 1502, 74, 1440],
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
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 커스텀 셀                                                            */
/* ------------------------------------------------------------------ */

type Plan = { id: string; name: string; due: string; progress: number; owner: string; status: string };

const PEOPLE: SearchOption[] = [
  { value: '김선아', label: '김선아', hint: '지속가능경영' },
  { value: '이도현', label: '이도현', hint: '지속가능경영' },
  { value: '박서준', label: '박서준', hint: '환경안전' },
  { value: '최유진', label: '최유진', hint: '환경안전' },
  { value: '정민수', label: '정민수', hint: '재무' },
  { value: '한지우', label: '한지우', hint: '재무' },
  { value: '오세영', label: '오세영', hint: '생산기술' },
  { value: '윤태호', label: '윤태호', hint: '생산기술' },
  { value: '강나래', label: '강나래', hint: '구매' },
  { value: '임현우', label: '임현우', hint: '구매' },
  { value: '서지훈', label: '서지훈', hint: 'IT' },
  { value: '문가영', label: '문가영', hint: 'IT' },
];

const PLANS: Plan[] = [
  { id: 'p1', name: 'Scope 1 배출량 집계', due: '2026-03-31', progress: 80, owner: '김선아', status: 'active' },
  { id: 'p2', name: '제3자 검증 준비', due: '2026-05-15', progress: 35, owner: '이도현', status: 'hold' },
  { id: 'p3', name: 'CDP 응답서 초안', due: '2026-06-30', progress: 10, owner: '박서준', status: 'active' },
];

export function CustomCells() {
  const [rows, setRows] = useState<Plan[]>(PLANS);

  // Stable, so the column definitions below can be memoised honestly.
  const set = useCallback(
    (id: string, patch: Partial<Plan>) =>
      setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row))),
    [],
  );

  const columns = useMemo<TableColumnDef<Plan>[]>(
    () => [
      { accessorKey: 'name', header: '과제', meta: { width: 220, rowHeader: true } },
      {
        accessorKey: 'due',
        header: '마감일',
        meta: { type: 'custom', width: 170 },
        cell: (ctx) => (
          <input
            type='date'
            value={ctx.getValue<string>()}
            onChange={(event) => set(ctx.row.original.id, { due: event.target.value })}
            className='w-full rounded border border-slate-300 px-1.5 py-1 text-xs'
          />
        ),
      },
      {
        accessorKey: 'progress',
        header: '진행률',
        meta: { type: 'custom', width: 200 },
        cell: (ctx) => {
          const value = ctx.getValue<number>();
          return (
            <div className='flex w-full items-center gap-2'>
              <input
                type='range'
                min={0}
                max={100}
                step={5}
                value={value}
                onChange={(event) => set(ctx.row.original.id, { progress: Number(event.target.value) })}
                className='min-w-0 flex-1 accent-emerald-600'
              />
              <span className='w-9 shrink-0 text-right text-slate-500 text-xs tabular-nums'>{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: '상태',
        meta: { type: 'custom', width: 130 },
        cell: (ctx) => (
          <select
            value={ctx.getValue<string>()}
            onChange={(event) => set(ctx.row.original.id, { status: event.target.value })}
            className='w-full rounded border border-slate-300 px-1 py-1 text-xs'
          >
            <option value='active'>진행 중</option>
            <option value='hold'>보류</option>
            <option value='done'>완료</option>
          </select>
        ),
      },
      {
        accessorKey: 'owner',
        header: '담당',
        // p-0 lets the trigger fill the cell edge to edge.
        meta: { type: 'custom', width: 170, className: 'p-0' },
        cell: (ctx) => (
          <SearchSelect
            label='담당자 선택'
            placeholder='이름·팀으로 검색…'
            value={ctx.getValue<string>()}
            options={PEOPLE}
            onChange={(owner) => set(ctx.row.original.id, { owner })}
          />
        ),
      },
    ],
    [set],
  );

  return (
    <DemoPage
      title='커스텀 셀'
      summary={
        <>
          셀 타입 13종으로 설명되지 않는 것은 <Code>type: &apos;custom&apos;</Code>으로 넣습니다. 날짜 선택기, 슬라이더,
          드롭다운, 여러분 디자인 시스템의 아무 컴포넌트나 그대로 렌더링됩니다.
        </>
      }
      customization={[
        <>
          <Code>custom</Code>은 <strong>레이아웃 간섭을 그만두는</strong> 타입입니다 — 말줄임 없음, 타입별 정렬 없음,
          자식 요소에 거는 규칙 없음. 행 높이와 테두리만 공통으로 유지합니다.
        </>,
        <>
          여백은 <Code>button</Code> 타입과 같습니다. 셀을 가장자리까지 채우려면{' '}
          <Code>meta.className: &apos;p-0&apos;</Code>을 주세요 — 아래 &lsquo;담당&rsquo; 컬럼이 그렇습니다.
        </>,
        <>
          <Code>meta.align</Code>으로 가로 정렬을 지정합니다. <Code>meta.headerClassName</Code>은 헤더 <Code>th</Code>에
          붙습니다.
        </>,
        <>
          헤더도 별도 지정이 없으면 <Code>custom</Code>이 됩니다 — 헤더에 필터 입력을 넣어도 여백이 맞습니다.
        </>,
        <>
          &lsquo;담당&rsquo;처럼 <strong>팝오버가 열리는 컨트롤</strong>은 패널을 <Code>createPortal</Code>로{' '}
          <Code>document.body</Code>에 붙이세요. 셀 안에 그리면 테이블 스크롤 영역에 잘립니다. 예제 코드는{' '}
          <Code>playground/src/SearchSelect.tsx</Code>에 있습니다.
        </>,
      ]}
      api={[
        ['meta.type', "'custom'", '레이아웃 간섭을 끕니다.'],
        ['cell', '(ctx) => ReactNode', '평소와 같은 TanStack 셀 렌더러. 여기에 컴포넌트를 넣습니다.'],
        ['meta.className', 'string', '본문 td에 붙는 클래스. p-0 같은 예외를 넣는 곳.'],
        ['meta.headerClassName', 'string', '헤더 th에 붙는 클래스.'],
        ['meta.align', "'left' | 'center' | 'right'", '셀 안에서의 가로 정렬.'],
        ['createPortal', 'react-dom', '팝오버를 body에 붙여 잘림을 피하는 방법.'],
      ]}
      caveats={[
        <>
          <strong>셀 안에 그린 팝오버는 잘립니다.</strong> 테이블 스크롤 컨테이너가 <Code>overflow: auto</Code>이기
          때문입니다. 아래 &lsquo;담당&rsquo; 컬럼이 이걸 portal로 우회한 예시입니다 — 대신 위치를 직접 계산하고,
          스크롤·리사이즈에 맞춰 따라가게 해야 합니다. <Code>&lt;input type=&quot;date&quot;&gt;</Code> 같은 네이티브
          컨트롤은 브라우저가 페이지 밖에 그리므로 신경 쓸 게 없습니다.
        </>,
        <>
          행 클릭(<Code>onRowClick</Code>)을 함께 쓴다면 컨트롤에서 <Code>event.stopPropagation()</Code>을 불러주세요.
          라이브러리가 자동으로 막아주는 건 체크박스·확장 화살표·드래그 손잡이뿐입니다.
        </>,
        <>
          행 높이는 <Code>--tbl-row-height</Code>로 고정입니다. 더 큰 컨트롤을 넣으려면 이 변수를 올리세요.
        </>,
      ]}
    >
      <div className='space-y-3'>
        <DataTable data={rows} columns={columns} getRowId={(row) => row.id} labels={labels} />
        <Note>
          전부 실제로 동작합니다 — 날짜를 바꾸고, 슬라이더를 끌고, &lsquo;담당&rsquo;을 눌러 이름이나 팀으로 검색해
          보세요. 팝오버 안에서는 <Code>↑↓</Code>로 이동하고 <Code>Enter</Code>로 선택, <Code>Escape</Code>로 닫습니다.
          값은 전부 부모 컴포넌트의 상태로 올라갑니다.
        </Note>
        <pre className='rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700'>
          {JSON.stringify(
            rows.map(({ id, due, progress, status }) => ({ id, due, progress, status })),
            null,
            1,
          )}
        </pre>
      </div>
    </DemoPage>
  );
}
