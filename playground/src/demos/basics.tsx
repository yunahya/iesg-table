import { useMemo, useState } from 'react';
import {
  DataTable,
  type SortingState,
  Table,
  TableBody,
  TableCell,
  TableCheckbox,
  type TableColumnDef,
  TableHead,
  TableHeader,
  TableRow,
  createSelectionColumn,
} from '../../../src/index';
import { baseColumns } from '../columns';
import { type Emission, emissions, labels, paginationLabels } from '../data';
import { Code, DemoPage, Note, Tag, btn, btnOn } from '../ui';

/* ------------------------------------------------------------------ */
/* 정렬                                                                 */
/* ------------------------------------------------------------------ */

export function Sorting() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'amount', desc: true }]);

  return (
    <DemoPage
      title='정렬'
      summary={
        <>
          헤더를 클릭하면 오름차순 → 내림차순 → 해제 순으로 돕니다. 활성 방향의 화살표만 <Code>--tbl-sort-active</Code>{' '}
          색으로 칠해집니다. Shift를 누른 채 클릭하면 여러 컬럼으로 정렬됩니다.
        </>
      }
      customization={[
        <>
          컬럼별로 <Code>enableSorting: false</Code>로 끌 수 있습니다. 아래 표의 &lsquo;상태&rsquo;·&lsquo;비고&rsquo;
          컬럼이 그렇습니다.
        </>,
        <>
          비교 함수는 컬럼의 <Code>sortingFn</Code>으로 바꿉니다 — TanStack 기본(<Code>alphanumeric</Code>,{' '}
          <Code>datetime</Code>, <Code>basic</Code> 등) 또는 직접 작성.
        </>,
        <>
          정렬 아이콘은 <Code>components={'{{ SortIcon }}'}</Code>로 교체합니다. 방향은{' '}
          <Code>{"'asc' | 'desc' | false"}</Code>로 넘어옵니다.
        </>,
        <>
          <Code>sorting</Code>을 넘기지 않으면 내부에서 알아서 관리합니다. 상태를 저장하고 싶을 때만 제어하세요.
        </>,
      ]}
      api={[
        ['sorting / onSortingChange', 'SortingState', '제어 상태. 넘기지 않으면 내부에서 관리합니다.'],
        ['enableSorting', 'boolean', '테이블 전체를 끕니다. 컬럼 단위로도 지정 가능합니다.'],
        ['sortingFn', "'alphanumeric' | … | fn", '컬럼별 비교 함수.'],
      ]}
      tokens={['--tbl-sort-active', '--tbl-header-fg', '--tbl-header-fg-hover']}
    >
      <div className='space-y-3'>
        <DataTable
          data={emissions}
          columns={baseColumns}
          getRowId={(row) => row.id}
          labels={labels}
          sorting={sorting}
          onSortingChange={setSorting}
        />
        <Note>
          현재 정렬 상태: <Code>{JSON.stringify(sorting)}</Code> — 헤더는 실제 <Code>button</Code>이라 Tab으로 이동해
          Enter로도 정렬됩니다.
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 행 선택                                                              */
/* ------------------------------------------------------------------ */

export function Selection() {
  const [selected, setSelected] = useState<string[]>([]);
  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [createSelectionColumn<Emission>(), ...baseColumns.slice(0, 4)],
    [],
  );

  return (
    <DemoPage
      title='행 선택'
      summary={
        <>
          <Code>createSelectionColumn()</Code>을 컬럼 배열에 넣으면 헤더의 전체선택 체크박스와 행 체크박스가 함께
          그려집니다. 둘이 따로 놀 일이 없습니다.
        </>
      }
      customization={[
        <>
          체크박스 셀은 <strong>50 × 40px 고정</strong>, 체크박스 자체는 <strong>18 × 18px 고정</strong>입니다. 일부러
          변수로 빼지 않았습니다 — 어떤 클래스를 넘겨도 크기가 바뀌지 않습니다.
        </>,
        <>
          체크박스 색은 <Code>--tbl-checkbox-*</Code> 변수로 바꿉니다.
        </>,
        <>
          모양을 통째로 바꾸려면 <Code>components={'{{ Checkbox }}'}</Code>로 교체하세요.
        </>,
        <>
          <Code>getRowDisabled</Code>인 행은 선택되지 않고, 전체선택 대상에서도 빠집니다.
        </>,
      ]}
      api={[
        ['rowSelection.selectedIds', 'string[]', 'getRowId가 만든 id 목록.'],
        ['rowSelection.onChange', '(ids) => void', '선택이 바뀔 때마다 호출됩니다.'],
        ['selectAllMode', "'page' | 'all'", "기본값 'page' — 현재 화면의 행만 전체선택합니다."],
        ['onSelectAll / totalSelectableCount', '-', "selectAllMode가 'all'일 때 필요합니다."],
      ]}
      tokens={['--tbl-row-selected-bg', '--tbl-row-selected-fg', '--tbl-checkbox-checked-bg', '--tbl-checkbox-mark']}
    >
      <div className='space-y-3'>
        <DataTable
          data={emissions}
          columns={columns}
          getRowId={(row) => row.id}
          labels={labels}
          rowSelection={{ selectedIds: selected, onChange: setSelected }}
          getRowDisabled={(row) => !row.active}
        />
        <Note>
          선택된 행 {selected.length}개: <Code>{selected.join(', ') || '—'}</Code> · 5·8행은 비활성이라 선택할 수
          없습니다.
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 페이지네이션 · 서버 연동                                              */
/* ------------------------------------------------------------------ */

const ALL_IDS = Array.from({ length: 95 }, (_, i) => `s${i + 1}`);

export function Pagination() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'amount', desc: true }]);
  const [selected, setSelected] = useState<string[]>([]);

  // Stand-in for a server response.
  const rows = useMemo<Emission[]>(() => {
    const start = (page - 1) * pageSize;
    return Array.from({ length: Math.max(0, Math.min(pageSize, 95 - start)) }, (_, i) => {
      const source = emissions[(start + i) % emissions.length] as Emission;
      return { ...source, id: `s${start + i + 1}`, facility: `사업장 ${start + i + 1}` };
    });
  }, [page, pageSize]);

  const columns = useMemo<TableColumnDef<Emission>[]>(
    () => [createSelectionColumn<Emission>(), ...baseColumns.slice(0, 5)],
    [],
  );

  return (
    <DemoPage
      title='페이지네이션 · 서버 연동'
      summary={
        <>
          페이지네이션은 서버 기준입니다 — 현재 페이지의 행만 넘기고 <Code>totalCount</Code>로 전체 개수를 알려주면
          됩니다. 페이지를 넘나드는 전체선택도 지원합니다.
        </>
      }
      customization={[
        <>
          모든 문구는 <Code>pagination.labels</Code>로 넘깁니다 — 하드코딩된 한국어/영어가 없습니다.
        </>,
        <>
          <Code>pageSizeOptions</Code>로 선택지를 바꿉니다. <Code>onPageSizeChange</Code>를 안 주면 선택 UI가
          사라집니다.
        </>,
        <>
          페이지 버튼 사이의 <Code>…</Code> 생략은 자동입니다.
        </>,
        <>
          컨트롤이 마음에 안 들면 <Code>pagination</Code>을 빼고 직접 그리세요. 테이블은 그대로 동작합니다.
        </>,
      ]}
      api={[
        ['pagination.page / pageSize / totalCount', 'number', '서버가 알려주는 값 그대로.'],
        ['onPageChange / onPageSizeChange', '(n) => void', '페이지 이동.'],
        ['manualSorting', 'boolean', '정렬된 data를 받는다는 선언. 정렬은 서버 쿼리에 맡깁니다.'],
        ["selectAllMode: 'all'", '-', '헤더 체크박스가 전체 95행을 선택합니다.'],
      ]}
    >
      <div className='space-y-3'>
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
        <Note>
          선택 <Code>{selected.length}</Code> / 95 — 페이지를 넘겨도 유지됩니다.
        </Note>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 셀 타입                                                              */
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
  'custom',
] as const;

function sampleFor(type: (typeof CELL_TYPES)[number]) {
  switch (type) {
    case 'number':
      return '12,480.5';
    case 'unit':
      return 'tCO₂eq';
    case 'memo':
      return '제3자 검증 완료 (2분기)';
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
          <span>울산</span>
          <button type='button' className={btn}>
            변경
          </button>
        </>
      );
    case 'button':
      return (
        <button type='button' className={btn}>
          수정
        </button>
      );
    case 'icon':
      return <span className='text-base'>📄</span>;
    case 'icon-text':
      return (
        <>
          <span>🏭</span>
          <span>울산 1공장</span>
        </>
      );
    case 'switch':
      return (
        <span className='inline-flex h-4 w-8 items-center rounded-full bg-emerald-500 px-0.5'>
          <span className='ml-auto size-3 rounded-full bg-white' />
        </span>
      );
    case 'custom':
      return (
        <input
          type='date'
          defaultValue='2026-03-31'
          className='w-full rounded border border-slate-300 px-1.5 py-1 text-xs'
        />
      );
    default:
      return '고정연소';
  }
}

export function CellTypes() {
  return (
    <DemoPage
      title='셀 타입'
      summary={
        <>
          셀 타입은 패딩과 내부 정렬만 정합니다. 어떤 타입을 써도 행 높이는 <Code>--tbl-row-height</Code> 하나로
          유지됩니다 — 버튼이 든 행만 살짝 커지는 일이 없습니다. 여기에 없는 모양은 <Code>custom</Code>으로 직접
          넣습니다.
        </>
      }
      customization={[
        <>
          컬럼의 <Code>meta.type</Code>으로 지정합니다. 안 주면 <Code>text</Code>, <Code>numeric: true</Code>면{' '}
          <Code>number</Code>입니다.
        </>,
        <>
          패딩 값 자체는 <Code>--tbl-cell-px</Code> 계열 변수입니다. 밀도를 바꾸려면 여기만 건드리면 됩니다.
        </>,
        '내용은 전적으로 사용자의 몫입니다 — 라이브러리는 배치만 하고 태그·버튼·스위치는 직접 렌더링합니다.',
      ]}
      api={[
        ['meta.type', 'CellType', '14가지 중 하나. custom은 레이아웃 간섭을 끕니다.'],
        ['meta.align', "'left' | 'center' | 'right'", '타입 기본 정렬을 덮어씁니다.'],
        ['meta.truncate', 'boolean', '기본 true. 말줄임을 끄면 내용이 넘칩니다.'],
      ]}
      tokens={['--tbl-cell-px', '--tbl-cell-px-wide', '--tbl-cell-py', '--tbl-cell-py-loose', '--tbl-cell-py-compact']}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 180 }}>type</TableHead>
            <TableHead style={{ width: 320 }}>렌더링</TableHead>
            <TableHead>비고</TableHead>
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
                  ? '오른쪽 정렬'
                  : type === 'checkbox'
                    ? '가운데 정렬, 패딩 없음'
                    : type === 'custom'
                      ? '말줄임·정렬 간섭 없음. 내용은 전부 여러분 것'
                      : type.includes('-')
                        ? 'flex row, gap-2'
                        : '왼쪽 정렬'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 상태와 톤                                                            */
/* ------------------------------------------------------------------ */

const TONES = ['none', 'muted', 'info', 'warning', 'danger'] as const;
const STATES = ['default', 'selected', 'disabled'] as const;

export function StatesAndTones() {
  return (
    <DemoPage
      title='상태와 톤'
      summary={
        <>
          <Code>state</Code>는 상호작용 상태(선택·비활성), <Code>tone</Code>은 평상시 강조입니다. 둘이 겹치면 state가
          이깁니다.
        </>
      }
      customization={[
        <>
          두 축 모두 <Code>meta.state</Code> / <Code>meta.tone</Code>으로 컬럼 단위 지정이 가능합니다.
        </>,
        <>
          색은 <Code>--tbl-tone-*</Code>, <Code>--tbl-row-selected-*</Code>, <Code>--tbl-cell-disabled-*</Code>{' '}
          변수입니다.
        </>,
        <>
          기존 Figma API의 <Code>&apos;Default&apos;</Code>가 두 가지 뜻으로 쓰이던 걸 두 축으로 분리한 결과입니다.
        </>,
      ]}
      tokens={['--tbl-tone-muted-bg', '--tbl-tone-info-bg', '--tbl-tone-warning-bg', '--tbl-tone-danger-bg']}
    >
      <div className='grid gap-6 lg:grid-cols-2'>
        <div>
          <h3 className='mb-2 font-medium text-slate-700 text-sm'>tone — 평상시 강조</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 120 }}>tone</TableHead>
                <TableHead>예시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TONES.map((tone) => (
                <TableRow key={tone}>
                  <TableCell>
                    <code className='text-xs'>{tone}</code>
                  </TableCell>
                  <TableCell tone={tone}>구매전력</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className='mb-2 font-medium text-slate-700 text-sm'>state — 설정되면 tone을 이깁니다</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 120 }}>state</TableHead>
                <TableHead>tone=&quot;warning&quot; 과 함께</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATES.map((state) => (
                <TableRow key={state}>
                  <TableCell>
                    <code className='text-xs'>{state}</code>
                  </TableCell>
                  <TableCell state={state} tone='warning'>
                    구매전력
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Note>
            <code>default</code>일 때만 warning 톤이 보입니다.
          </Note>
        </div>
      </div>
    </DemoPage>
  );
}

/* ------------------------------------------------------------------ */
/* 로딩 · 빈 상태                                                       */
/* ------------------------------------------------------------------ */

export function StatusStates() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [rowCount, setRowCount] = useState(5);

  return (
    <DemoPage
      title='로딩 · 빈 상태'
      summary={
        <>
          로딩 중에는 테이블을 비우지 않습니다. 헤더는 그대로 두고, 실제 컬럼으로 그린 대체 행을 흐리게 깔고, 그 위에
          스피너를 얹습니다. 컬럼 폭과 행 높이가 데이터가 들어올 자리 그대로라 화면이 튀지 않습니다.
        </>
      }
      customization={[
        <>
          대체 행 개수는 <Code>loadingRowCount</Code>입니다. 보통 페이지 크기와 맞춥니다.
        </>,
        <>
          흐림 정도는 <Code>--tbl-loading-blur</Code>, 덮개 색은 <Code>--tbl-loading-overlay-bg</Code>, 스피너 색은{' '}
          <Code>--tbl-spinner-indicator</Code>와 <Code>--tbl-spinner-track</Code>입니다. 흐림을 아예 끄려면{' '}
          <Code>0</Code>을 넣으세요.
        </>,
        <>
          문구는 <Code>labels.loading</Code> / <Code>labels.empty</Code>입니다. 필수 prop이라 잊고 넘어갈 수 없습니다.
        </>,
        <>
          완전히 다른 로딩 UI를 쓰고 싶다면 <Code>loading</Code>을 넘기지 말고 여러분 쪽에서 그리세요. 테이블은 받은
          데이터만 그립니다.
        </>,
      ]}
      api={[
        ['loading', 'boolean', '스캐폴드 + 스피너를 켭니다.'],
        ['loadingRowCount', 'number', '대체 행 개수. 기본 5.'],
        ['labels.loading / labels.empty', 'string', '읽히는 문구.'],
      ]}
      tokens={[
        '--tbl-skeleton-bg',
        '--tbl-loading-blur',
        '--tbl-loading-overlay-bg',
        '--tbl-spinner-track',
        '--tbl-spinner-indicator',
        '--tbl-empty-fg',
      ]}
      caveats={[
        '대체 행은 aria-hidden입니다 — 스크린리더에는 스피너 옆 문구만 읽힙니다. 가짜 내용을 읽어줄 이유가 없습니다.',
        '움직임을 줄이도록 설정한 환경에서는 대체 행의 깜빡임이 꺼집니다. 스피너는 진행 중임을 알리는 유일한 신호라 그대로 돕니다.',
      ]}
    >
      <div className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <button type='button' className={loading ? btnOn : btn} onClick={() => setLoading((v) => !v)}>
            loading: {String(loading)}
          </button>
          <button type='button' className={btn} onClick={() => setHasData((v) => !v)}>
            data: {hasData ? '3행' : '없음'}
          </button>
          <span className='text-slate-400 text-xs'>loadingRowCount:</span>
          {[3, 5, 8].map((count) => (
            <button
              key={count}
              type='button'
              className={rowCount === count ? btnOn : btn}
              onClick={() => setRowCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
        <DataTable
          data={hasData ? emissions.slice(0, 3) : []}
          columns={baseColumns}
          getRowId={(row) => row.id}
          labels={labels}
          loading={loading}
          loadingRowCount={rowCount}
        />
        <Note>
          로딩을 끄고 데이터를 &lsquo;없음&rsquo;으로 두면 빈 상태가 나옵니다. 로딩을 켜면 데이터 유무와 상관없이
          스캐폴드가 덮습니다 — 이전 데이터가 남아 새 데이터인 것처럼 보이는 일을 막습니다.
        </Note>
      </div>
    </DemoPage>
  );
}
