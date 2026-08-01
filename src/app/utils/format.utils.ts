export function getQuantityFormat(symbol: string): string {
  return symbol.endsWith('.CRYPTO') ? '1.0-10' : '1.0-7';
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(BK|CRYPTO)$/, '');
}

export function getPriceFormat(symbol: string): string {
  return symbol.endsWith('.CRYPTO') ? '1.2-2' : '1.2-4';
}

export function getSymbolColor(symbol: string): string {
  const colors: Record<string, string> = {
    // U.S. Stocks & ETFs
    VOO: '#6366f1', GOOGL: '#10b981', NVDA: '#84cc16', JEPI: '#f59e0b',
    SCHD: '#06b6d4', VXUS: '#8b5cf6', O: '#ec4899', TSM: '#14b8a6',
    AVGO: '#f43f5e', LLY: '#a855f7', COST: '#0ea5e9', KO: '#ef4444',
    MU: '#22c55e', GPIQ: '#eab308', BNDW: '#64748b', ASML: '#0284c7',
    AAPL: '#94a3b8', AMZN: '#f97316', MSFT: '#0284c7', TSLA: '#e11d48',
    AMD: '#ef4444', INTC: '#0284c7', SBUX: '#059669', JNJ: '#dc2626',
    'BRK.B': '#475569', V: '#2563eb', GLD: '#d97706', TLT: '#7c3aed',
    BND: '#4f46e5', QQQM: '#9333ea', QQQI: '#c026d3', SPYI: '#db2777',
    JEPQ: '#ea580c', SMH: '#059669', SGOV: '#16a34a', VIG: '#0d9488',
    VYM: '#0284c7', PFFD: '#4f46e5',
    // Thai Stocks
    'PTT.BK': '#3b82f6', 'HMPRO.BK': '#f97316', 'WHA.BK': '#14b8a6',
    'TRUE.BK': '#ef4444', 'GULF.BK': '#6366f1', 'SCB.BK': '#8b5cf6',
    'KTB.BK': '#06b6d4', 'ICHI.BK': '#ec4899', 'KKP.BK': '#10b981',
    '3BBIF.BK': '#f97316', 'TISCO.BK': '#0284c7', 'TTB.BK': '#2563eb',
    'SC.BK': '#0d9488', 'DIF.BK': '#dc2626', 'TTW.BK': '#059669',
    'LH.BK': '#f59e0b', 'CPF.BK': '#ef4444', 'CPAXT.BK': '#10b981',
    // Crypto
    'BTC.CRYPTO': '#f7931a', 'PAXG.CRYPTO': '#e6b800',
    // Mutual Funds
    'ES-GTECHSSF': '#0891b2', 'SCBGOLDH-SSF': '#d97706', 'UGSTAR-SSF-D': '#7c3aed',
  };
  return colors[symbol] || '#6366f1';
}

const STATIC_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  AMZN: 'Amazon.com Inc.',
  MSFT: 'Microsoft Corporation',
  TSLA: 'Tesla, Inc.',
  AMD: 'Advanced Micro Devices, Inc.',
  INTC: 'Intel Corporation',
  SBUX: 'Starbucks Corporation',
  JNJ: 'Johnson & Johnson',
  'BRK.B': 'Berkshire Hathaway Inc.',
  V: 'Visa Inc.',
  GLD: 'SPDR Gold Shares',
  TLT: 'iShares 20+ Year Treasury Bond ETF',
  BND: 'Vanguard Total Bond Market ETF',
  QQQM: 'Invesco NASDAQ 100 ETF',
  QQQI: 'NEOS Nasdaq-100 High Income ETF',
  SPYI: 'NEOS S&P 500 High Income ETF',
  JEPQ: 'JPMorgan NASDAQ Equity Premium Income ETF',
  SMH: 'VanEck Semiconductor ETF',
  SGOV: 'iShares 0-3 Month Treasury Bond ETF',
  VIG: 'Vanguard Dividend Appreciation ETF',
  VYM: 'Vanguard High Dividend Yield ETF',
  PFFD: 'Global X U.S. Preferred ETF',
  AVGO: 'Broadcom Inc.',
  '3BBIF.BK': '3BB Internet Infrastructure Fund',
  'TISCO.BK': 'TISCO Financial Group PCL',
  'TTB.BK': 'TMBThanachart Bank PCL',
  'SC.BK': 'SC Asset Corporation PCL',
  'DIF.BK': 'Digital Telecommunications Infrastructure Fund',
  'TTW.BK': 'TTW PCL',
  'LH.BK': 'Land and Houses PCL',
  'CPF.BK': 'Charoen Pokphand Foods PCL',
  'CPAXT.BK': 'CP Axtra PCL',
};

export function getSymbolName(symbol: string, rawName: string = ''): string {
  if (STATIC_NAMES[symbol]) {
    return STATIC_NAMES[symbol];
  }
  let name = rawName;
  if (symbol.endsWith('.BK')) {
    const prefix = symbol.replace('.BK', '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }
  
  // Convert to Proper Case
  return name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
