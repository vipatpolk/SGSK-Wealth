export const KNOWN_CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'PAXG', 'SOL', 'XRP', 'DOGE', 'USDT',
]);

export function isCryptoSymbol(symbol: string): boolean {
  if (!symbol) return false;
  return symbol.endsWith('.CRYPTO') || KNOWN_CRYPTO_SYMBOLS.has(symbol.toUpperCase().replace(/\.CRYPTO$/, ''));
}

export function getQuantityFormat(symbol: string): string {
  return isCryptoSymbol(symbol) ? '1.0-10' : '1.0-7';
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(BK|CRYPTO)$/, '');
}

export function toYahooSymbol(symbol: string): string {
  if (!symbol) return '';
  const trimmed = symbol.trim();
  if (trimmed.toUpperCase().endsWith('.BK')) {
    return trimmed;
  }
  if (trimmed.toUpperCase().endsWith('.CRYPTO')) {
    return trimmed.replace(/\.CRYPTO$/i, '');
  }
  return trimmed.replace(/[./]/g, '-');
}

export function getPriceFormat(symbol: string): string {
  return isCryptoSymbol(symbol) ? '1.2-2' : '1.2-4';
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
    'BRK.B': '#475569', 'BRK-B': '#475569', 'BRK.A': '#475569', 'BRK-A': '#475569',
    'BF.B': '#78716c', 'BF-B': '#78716c',
    V: '#2563eb', GLD: '#d97706', TLT: '#7c3aed',
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
    BTC: '#f7931a', 'BTC.CRYPTO': '#f7931a',
    ETH: '#627eea', 'ETH.CRYPTO': '#627eea',
    BNB: '#f3ba2f', 'BNB.CRYPTO': '#f3ba2f',
    ADA: '#0033ad', 'ADA.CRYPTO': '#0033ad',
    DOT: '#e6007a', 'DOT.CRYPTO': '#e6007a',
    PAXG: '#e6b800', 'PAXG.CRYPTO': '#e6b800',
    SOL: '#14f195', 'SOL.CRYPTO': '#14f195',
    XRP: '#23292f', 'XRP.CRYPTO': '#23292f',
    DOGE: '#c2a633', 'DOGE.CRYPTO': '#c2a633',
    USDT: '#26a17b', 'USDT.CRYPTO': '#26a17b',
    // Mutual Funds
    'ES-GTECHSSF': '#0891b2', 'SCBGOLDH-SSF': '#d97706', 'UGSTAR-SSF-D': '#7c3aed',
  };
  return colors[symbol] || colors[symbol.toUpperCase()] || '#6366f1';
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
  'BRK-B': 'Berkshire Hathaway Inc.',
  'BRK.A': 'Berkshire Hathaway Inc.',
  'BRK-A': 'Berkshire Hathaway Inc.',
  'BF.B': 'Brown-Forman Corporation',
  'BF-B': 'Brown-Forman Corporation',
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
  // Crypto
  BTC: 'Bitcoin',
  'BTC.CRYPTO': 'Bitcoin',
  ETH: 'Ethereum',
  'ETH.CRYPTO': 'Ethereum',
  BNB: 'BNB',
  'BNB.CRYPTO': 'BNB',
  ADA: 'Cardano',
  'ADA.CRYPTO': 'Cardano',
  DOT: 'Polkadot',
  'DOT.CRYPTO': 'Polkadot',
  PAXG: 'PAX Gold',
  'PAXG.CRYPTO': 'PAX Gold',
  SOL: 'Solana',
  'SOL.CRYPTO': 'Solana',
  XRP: 'Ripple',
  'XRP.CRYPTO': 'Ripple',
  DOGE: 'Dogecoin',
  'DOGE.CRYPTO': 'Dogecoin',
  USDT: 'Tether',
  'USDT.CRYPTO': 'Tether',
  // Mutual Funds
  'ES-GTECHSSF': 'Eastspring Global Technology SSF',
  'SCBGOLDH-SSF': 'SCB Gold Hedged SSF',
  'UGSTAR-SSF-D': 'UOB Global Stars SSF (Dividends)',
  'tsp1-preserver-SSF': 'TMB Smart Port 1 Preserver SSF',
  'tsp3-balancer': 'TMB Smart Port 3 Balancer',
  'tsp4-explorer': 'TMB Smart Port 4 Explorer',
  'tsp4-explorer-SSF': 'TMB Smart Port 4 Explorer SSF',
  'tsp5-gogetter': 'TMB Smart Port 5 Go-Getter',
  'tsp5-gogetter-SSF': 'TMB Smart Port 5 Go-Getter SSF',
  'T-ES-GSBOND': 'Eastspring Global Short Duration Bond Fund',
  'UOBSD-SSF': 'UOB Smart Dividend SSF',
  'SCBSFF': 'SCB Smart Fixed Income SSF',
  'ES-GDIV': 'Eastspring Global Dividend Equity Fund',
  'ES-CASH': 'Eastspring Daily Cash Management Fund',
  'TCMF': 'Thai Cash Management Fund',
};

/** Pre-computed case-insensitive lookup for STATIC_NAMES */
const STATIC_NAMES_UPPER = new Map<string, string>(
  Object.entries(STATIC_NAMES).map(([k, v]) => [k.toUpperCase(), v])
);

function toProperCase(text: string): string {
  return text
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSymbolName(symbol: string, rawName: string = ''): string {
  const staticName = STATIC_NAMES[symbol] || STATIC_NAMES_UPPER.get(symbol.toUpperCase());
  if (staticName) return staticName;

  if (!rawName) return '';

  let name = rawName;
  if (symbol.endsWith('.BK')) {
    const prefix = symbol.replace('.BK', '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }
  return toProperCase(name);
}

export function normalizeAssetType(rawType?: string): string | null {
  if (!rawType) return null;
  const normalized = rawType.trim().toLowerCase();
  if (normalized === 'thai-stock' || normalized.includes('thai') || normalized === 'th') {
    return 'thai-stock';
  }
  if (
    normalized === 'us-stock' ||
    normalized.includes('u.s') ||
    normalized.includes('us stock') ||
    normalized.includes('united states')
  ) {
    return 'us-stock';
  }
  if (normalized === 'crypto' || normalized.includes('crypto')) {
    return 'crypto';
  }
  if (normalized === 'mutual-fund' || normalized.includes('fund') || normalized.includes('mutual')) {
    return 'mutual-fund';
  }
  return null;
}

const NON_ASSET_TYPES = new Set(['closed-position', 'all', 'unknown']);

export function getAssetType(assetType?: string, symbol?: string): string {
  if (assetType && !NON_ASSET_TYPES.has(assetType)) {
    const normalized = normalizeAssetType(assetType);
    if (normalized) return normalized;
    return assetType;
  }
  if (symbol) {
    if (symbol.endsWith('.BK')) return 'thai-stock';
    if (isCryptoSymbol(symbol)) return 'crypto';
    if (
      symbol.includes('SSF') ||
      symbol.includes('RMF') ||
      symbol.endsWith('-D') ||
      symbol.startsWith('SCB') ||
      symbol.startsWith('ES-') ||
      symbol.startsWith('UGSTAR')
    ) {
      return 'mutual-fund';
    }
  }
  return 'us-stock';
}

const ASSET_TYPE_CONFIG: Record<string, { label: string; cssClass: string }> = {
  'us-stock': { label: 'U.S. Stock', cssClass: 'asset-type-tag asset-type-us-stock' },
  'thai-stock': { label: 'Thai Stock', cssClass: 'asset-type-tag asset-type-thai-stock' },
  'crypto': { label: 'Cryptocurrency', cssClass: 'asset-type-tag asset-type-crypto' },
  'mutual-fund': { label: 'Mutual Fund', cssClass: 'asset-type-tag asset-type-mutual-fund' },
};

const DEFAULT_ASSET_TYPE = 'us-stock';

export function getAssetTypeLabel(assetType?: string, symbol?: string): string {
  const type = getAssetType(assetType, symbol);
  return ASSET_TYPE_CONFIG[type]?.label ?? ASSET_TYPE_CONFIG[DEFAULT_ASSET_TYPE].label;
}

export function getAssetTypeClass(assetType?: string, symbol?: string): string {
  const type = getAssetType(assetType, symbol);
  return ASSET_TYPE_CONFIG[type]?.cssClass ?? ASSET_TYPE_CONFIG[DEFAULT_ASSET_TYPE].cssClass;
}
