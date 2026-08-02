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

function toProperCase(text: string): string {
  return text
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSymbolName(symbol: string, rawName: string = ''): string {
  if (!rawName) return '';

  let name = rawName.trim();
  if (!name) return '';

  if (symbol.endsWith('.BK')) {
    const prefix = symbol.replace('.BK', '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }

  name = name.replace(/\([R|TM|r|tm]\)/g, '').trim();

  if (name === name.toUpperCase() && name !== name.toLowerCase()) {
    return toProperCase(name);
  }

  return name;
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
