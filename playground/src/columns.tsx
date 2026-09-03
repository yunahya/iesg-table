import type { TableColumnDef } from '../../src/index';
import { type Emission, num } from './data';
import { Tag } from './ui';

export const statusTag: Record<Emission['status'], React.ReactNode> = {
  approved: <Tag tone='ok'>Approved</Tag>,
  requested: <Tag tone='info'>Requested</Tag>,
  new: <Tag tone='info'>New</Tag>,
  over: <Tag tone='warn'>Over</Tag>,
  rejected: <Tag tone='bad'>Rejected</Tag>,
};

/** The column set most demos start from. Slice it rather than redefining it. */
export const baseColumns: TableColumnDef<Emission>[] = [
  { accessorKey: 'category', header: '구분', meta: { width: 220, required: true, rowHeader: true } },
  {
    accessorKey: 'scope',
    header: 'Scope',
    meta: { width: 90, align: 'center' },
    cell: (ctx) => `Scope ${ctx.getValue<number>()}`,
  },
  { accessorKey: 'facility', header: '사업장', meta: { width: 160 } },
  {
    accessorKey: 'amount',
    header: '배출량',
    meta: { numeric: true, width: 130 },
    cell: (ctx) => num(ctx.getValue<number>()),
  },
  { accessorKey: 'unit', header: '단위', meta: { width: 90, type: 'unit' } },
  {
    accessorKey: 'status',
    header: '상태',
    meta: { width: 120, type: 'tag', exportValue: (row) => row.status },
    cell: (ctx) => statusTag[ctx.getValue<Emission['status']>()],
    enableSorting: false,
  },
  { accessorKey: 'note', header: '비고', meta: { width: 220, type: 'memo' }, enableSorting: false },
];
