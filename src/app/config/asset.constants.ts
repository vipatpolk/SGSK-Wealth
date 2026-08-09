export interface AssetTab {
  id: string;
  label: string;
  icon: string;
  currency: string;
}

export const ASSET_TABS: AssetTab[] = [
  {
    id: 'all',
    label: 'All',
    icon: 'globe',
    currency: '',
  },
  {
    id: 'us-stock',
    label: 'U.S. Stock',
    icon: 'flag-us',
    currency: 'USD',
  },
  {
    id: 'thai-stock',
    label: 'Thai Stock',
    icon: 'flag-th',
    currency: 'THB',
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    icon: 'bitcoin',
    currency: 'THB',
  },
  {
    id: 'mutual-fund',
    label: 'Mutual Fund',
    icon: 'pie-chart',
    currency: 'THB',
  },
  {
    id: 'closed-position',
    label: 'Closed Position',
    icon: 'check-circle',
    currency: '',
  },
];
