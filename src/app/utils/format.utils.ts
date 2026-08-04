export function getQuantityFormat(symbol: string, assetType?: string): string {
  return symbol.toUpperCase().endsWith('.CRYPTO') || assetType === 'crypto' ? '1.0-10' : '1.0-7';
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(BKFUND|BK|CRYPTO)$/i, '');
}

export function toYahooSymbol(symbol: string): string {
  if (!symbol) return '';
  const trimmed = symbol.trim();
  if (trimmed.toUpperCase().endsWith('.BKFUND')) {
    return trimmed.replace(/\.BKFUND$/i, '');
  }
  if (trimmed.toUpperCase().endsWith('.BK')) {
    return trimmed;
  }
  if (trimmed.toUpperCase().endsWith('.CRYPTO')) {
    return trimmed.replace(/\.CRYPTO$/i, '');
  }
  return trimmed.replace(/[./]/g, '-');
}

export function getPriceFormat(symbol: string, assetType?: string): string {
  return symbol.toUpperCase().endsWith('.CRYPTO') || assetType === 'crypto' ? '1.2-2' : '1.2-4';
}

/**
 * Helper to convert HSL components to standard 6-digit hex string (#rrggbb).
 */
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Dynamically computes a consistent, vibrant brand color for any symbol.
 * Uses a deterministic string hash mapped to the HSL color space without any hardcoded dictionary.
 */
export function getSymbolColor(symbol: string): string {
  const clean = displaySymbol(symbol || '').toUpperCase().trim();
  if (!clean) return '#6366f1';

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;
  const sat = 0.65 + (Math.abs(hash >> 3) % 20) / 100;
  const light = 0.45 + (Math.abs(hash >> 7) % 10) / 100;

  return hslToHex(hue, sat, light);
}

function toProperCase(text: string): string {
  return text
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSymbolName(symbol: string, rawName: string = ''): string {
  if (!rawName) return '';

  let name = rawName.trim();
  if (!name) return '';

  if (symbol.toUpperCase().endsWith('.BK')) {
    const prefix = symbol.replace(/\.BK$/i, '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }

  // Strip trailing currency / pair suffixes (e.g. "Bitcoin USD" -> "Bitcoin", "PAX Gold USD" -> "PAX Gold")
  if (symbol.toUpperCase().endsWith('.CRYPTO') || /\s+(USD|USDT|THB|USDC)$/i.test(name)) {
    name = name.replace(/\s+(USD|USDT|THB|USDC)$/i, '').trim();
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
    const sym = symbol.toUpperCase();
    if (sym.endsWith('.BKFUND')) return 'mutual-fund';
    if (sym.endsWith('.BK')) return 'thai-stock';
    if (sym.endsWith('.CRYPTO')) return 'crypto';
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
