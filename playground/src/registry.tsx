import type { ComponentType } from 'react';
import { Reference } from './Reference';
import { CellTypes, Pagination, Selection, Sorting, StatesAndTones, StatusStates } from './demos/basics';
import { ComponentSlots, CustomCells, HandComposed, InlineEditing } from './demos/custom';
import { ColumnReorder, ColumnVisibility, Export, Grouping, RowReorder } from './demos/dataops';
import { Expansion, Resizing, StickyAndPinning, Virtualised } from './demos/layout';
import { Overview } from './demos/overview';

export interface Entry {
  /** Hash route without the leading `#/`. The empty string is the landing page. */
  id: string;
  label: string;
  /** One line for the sidebar, so a menu item is self-explanatory. */
  hint: string;
  Component: ComponentType;
}

export interface Group {
  title: string;
  entries: Entry[];
}

export const GROUPS: Group[] = [
  {
    title: '시작하기',
    entries: [{ id: '', label: '한눈에 보기', hint: '모든 기본 기능을 한 테이블에', Component: Overview }],
  },
  {
    title: '기본',
    entries: [
      { id: 'sorting', label: '정렬', hint: '클릭으로 오름 · 내림 · 해제', Component: Sorting },
      { id: 'selection', label: '행 선택', hint: '체크박스, 전체선택', Component: Selection },
      { id: 'pagination', label: '페이지네이션', hint: '서버 연동, 페이지 간 선택 유지', Component: Pagination },
      { id: 'cell-types', label: '셀 타입', hint: '13종 + custom, 행 높이는 그대로', Component: CellTypes },
      { id: 'states', label: '상태와 톤', hint: '두 축이 겹칠 때의 규칙', Component: StatesAndTones },
      { id: 'status', label: '로딩 · 빈 상태', hint: '스캐폴드 + 스피너, 빈 상태 행', Component: StatusStates },
    ],
  },
  {
    title: '데이터 다루기',
    entries: [
      { id: 'visibility', label: '컬럼 표시', hint: '숨기면 폭도 함께 사라집니다', Component: ColumnVisibility },
      { id: 'row-reorder', label: '행 순서 변경', hint: '드래그 또는 방향키', Component: RowReorder },
      { id: 'column-reorder', label: '컬럼 순서 변경', hint: '헤더를 잡아 끌기', Component: ColumnReorder },
      { id: 'grouping', label: '그룹 · 집계', hint: '묶고 합계 내기', Component: Grouping },
      { id: 'export', label: 'CSV 내보내기', hint: '화면 기준, 엑셀에서 한글 정상', Component: Export },
    ],
  },
  {
    title: '레이아웃',
    entries: [
      { id: 'expansion', label: '행 확장', hint: '테이블 토글 · 뎁스 있는 테이블', Component: Expansion },
      { id: 'resizing', label: '컬럼 폭 조절', hint: '드래그로 폭 바꾸기', Component: Resizing },
      { id: 'sticky', label: '헤더 · 컬럼 고정', hint: '스크롤해도 남는 영역', Component: StickyAndPinning },
      { id: 'virtual', label: '가상화', hint: '10,000행도 가볍게', Component: Virtualised },
    ],
  },
  {
    title: '편집 · 커스터마이징',
    entries: [
      { id: 'editing', label: '인라인 편집', hint: '셀에서 바로 수정', Component: InlineEditing },
      { id: 'custom-cells', label: '커스텀 셀', hint: '원하는 컴포넌트를 셀에 그대로', Component: CustomCells },
      { id: 'slots', label: '컴포넌트 교체', hint: '체크박스 · 정렬 아이콘', Component: ComponentSlots },
      { id: 'primitives', label: '프리미티브 직접 조합', hint: 'DataTable 없이 짜기', Component: HandComposed },
    ],
  },
  {
    title: '문서',
    entries: [{ id: 'docs', label: '레퍼런스', hint: '기능·토큰 전체 목록', Component: Reference }],
  },
];

export const ENTRIES: Entry[] = GROUPS.flatMap((group) => group.entries);

export function findEntry(id: string): Entry {
  return ENTRIES.find((entry) => entry.id === id) ?? (ENTRIES[0] as Entry);
}
