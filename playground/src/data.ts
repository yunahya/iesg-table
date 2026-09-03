export type Emission = {
  id: string;
  category: string;
  scope: 1 | 2 | 3;
  facility: string;
  amount: number;
  unit: string;
  status: 'approved' | 'requested' | 'new' | 'over' | 'rejected';
  note: string;
  active: boolean;
};

export const emissions: Emission[] = [
  {
    id: 'e1',
    category: 'Stationary combustion',
    scope: 1,
    facility: 'Ulsan Plant 1',
    amount: 12480.5,
    unit: 'tCO₂eq',
    status: 'approved',
    note: 'Verified by third party',
    active: true,
  },
  {
    id: 'e2',
    category: 'Mobile combustion',
    scope: 1,
    facility: 'Ulsan Plant 1',
    amount: 3210,
    unit: 'tCO₂eq',
    status: 'requested',
    note: 'Awaiting fuel receipts',
    active: true,
  },
  {
    id: 'e3',
    category: 'Purchased electricity',
    scope: 2,
    facility: 'Seoul HQ',
    amount: 8790.25,
    unit: 'tCO₂eq',
    status: 'new',
    note: 'First reporting period for this site',
    active: true,
  },
  {
    id: 'e4',
    category: 'Purchased steam',
    scope: 2,
    facility: 'Busan Logistics',
    amount: 415,
    unit: 'tCO₂eq',
    status: 'over',
    note: 'Exceeds allocation by 12%',
    active: true,
  },
  {
    id: 'e5',
    category: 'Business travel',
    scope: 3,
    facility: 'All sites',
    amount: 964.8,
    unit: 'tCO₂eq',
    status: 'rejected',
    note: 'Missing supporting documents',
    active: false,
  },
  {
    id: 'e6',
    category: 'Employee commuting',
    scope: 3,
    facility: 'All sites',
    amount: 1502.75,
    unit: 'tCO₂eq',
    status: 'approved',
    note: 'Survey-based estimate',
    active: true,
  },
  {
    id: 'e7',
    category: 'Upstream transport',
    scope: 3,
    facility: 'Busan Logistics',
    amount: 22140.1,
    unit: 'tCO₂eq',
    status: 'approved',
    note: 'Supplier-reported',
    active: true,
  },
  {
    id: 'e8',
    category: 'Waste generated',
    scope: 3,
    facility: 'Ulsan Plant 2',
    amount: 88.4,
    unit: 'tCO₂eq',
    status: 'requested',
    note: '',
    active: false,
  },
];

export const labels = {
  loading: 'Loading emissions…',
  empty: 'No emissions recorded for this period',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
};

export const paginationLabels = {
  previous: 'Previous page',
  next: 'Next page',
  page: (n: number) => `Page ${n}`,
  pageSize: 'Rows per page',
};

export const num = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
