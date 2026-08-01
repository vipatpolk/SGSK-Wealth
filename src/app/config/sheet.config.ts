export interface SheetConfig {
  spreadsheetId: string;
  baseUrl: string;
  gids: Record<string, string>;
}

export const SHEET_CONFIG: SheetConfig = {
  baseUrl: 'https://docs.google.com/spreadsheets/d',
  spreadsheetId: 'your_google_spreadsheet_id_here',
  gids: {
    'us-stock': '1032243687',
    'thai-stock': '102823823',
    'crypto': '1822302220',
    'mutual-fund': '359978839',
    'closed-position': '273600915',
  }
};

export function getSheetExportUrl(gid: string): string {
  return `${SHEET_CONFIG.baseUrl}/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${gid}`;
}

export interface AssetTab {
  id: string;
  label: string;
  icon: string;
  sheetGid: string;
  currency: string;
}

export const ASSET_TABS: AssetTab[] = [
  {
    id: 'all',
    label: 'All',
    icon: 'globe',
    sheetGid: '',
    currency: '',
  },
  {
    id: 'us-stock',
    label: 'U.S. Stock',
    icon: 'flag-us',
    sheetGid: SHEET_CONFIG.gids['us-stock'],
    currency: 'USD',
  },
  {
    id: 'thai-stock',
    label: 'Thai Stock',
    icon: 'flag-th',
    sheetGid: SHEET_CONFIG.gids['thai-stock'],
    currency: 'THB',
  },
  {
    id: 'crypto',
    label: 'Cryptocurrency',
    icon: 'bitcoin',
    sheetGid: SHEET_CONFIG.gids['crypto'],
    currency: 'THB',
  },
  {
    id: 'mutual-fund',
    label: 'Mutual Fund',
    icon: 'fund',
    sheetGid: SHEET_CONFIG.gids['mutual-fund'],
    currency: 'THB',
  },
  {
    id: 'closed-position',
    label: 'Closed Position',
    icon: 'check-circle',
    sheetGid: SHEET_CONFIG.gids['closed-position'],
    currency: '',
  },
];
