import { useMemo, useState } from 'react';
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
          셀을 클릭하거나 포커스 후 <Code>Enter</Code> / <Code>F2</Code>로 편집을 시작합니다. <Code>Enter</Code>와
          포커스 해제로 확정, <Code>Escape</Code>로 취소합니다.
        </>
      }
      customization={[
        <>
          <Code>EditableCell</Code>은 기본 제공일 뿐입니다. <Code>onCellEdit</Code>만 받아 처리하면 입력 UI는 얼마든지
          직접 만들어도 됩니다.
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
      ]}
      tokens={['--tbl-edit-bg', '--tbl-edit-fg', '--tbl-edit-border', '--tbl-edit-hover-bg']}
      caveats={[
        <>
          상태는 여러분이 들고 있습니다 — <Code>onCellEdit</Code>에서 데이터를 갱신하지 않으면 값은 되돌아갑니다. 낙관적
          업데이트도, 서버 확인 후 반영도 모두 여러분 선택입니다.
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
        <Note>숫자 컬럼에 글자를 넣고 Enter를 눌러보세요 — 되돌아갑니다.</Note>
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
      summary='체크박스와 정렬 아이콘은 슬롯입니다. 여러분의 디자인 시스템 컴포넌트를 그대로 꽂으면 됩니다 — 아래는 토글 스위치와 글자 표시기로 바꾼 같은 테이블입니다.'
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
