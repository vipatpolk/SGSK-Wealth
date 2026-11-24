import type { AppCurrency, AppLang } from '@sgsk-wealth/contracts';
import { KNOWN_ASSET_TYPES } from './asset.constants';

export function getQuantityFormat(symbol: string, assetType?: string): string {
  return symbol.toUpperCase().endsWith('.CRYPTO') || assetType === 'crypto' ? '1.0-10' : '1.0-7';
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(FUND|BKFUND|BK|CRYPTO)$/i, '');
}

export function toYahooSymbol(symbol: string): string {
  if (!symbol) return '';
  const trimmed = symbol.trim();
  if (trimmed.toUpperCase().endsWith('.FUND')) {
    return trimmed.replace(/\.FUND$/i, '');
  }
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
    .map((word) => {
      const firstLetterIdx = word.search(/[a-zA-Z]/);
      if (firstLetterIdx === -1) return word;
      return (
        word.slice(0, firstLetterIdx) +
        word.charAt(firstLetterIdx).toUpperCase() +
        word.slice(firstLetterIdx + 1).toLowerCase()
      );
    })
    .join(' ');
}

export function isThaiMarketAsset(symbol?: string, assetType?: string): boolean {
  const type = assetType ? assetType.toLowerCase().trim() : '';
  if (type === 'thai-stock' || type === 'mutual-fund') {
    return true;
  }
  const sym = symbol ? symbol.toUpperCase().trim() : '';
  return sym.endsWith('.BK') || sym.endsWith('.FUND') || sym.endsWith('.BKFUND');
}

export function getSymbolName(
  symbol: string,
  rawName: string = '',
  lang: AppLang = 'en',
  rawNameTh: string = '',
  assetType?: string
): string {
  if (lang === 'th' && rawNameTh && rawNameTh.trim() && isThaiMarketAsset(symbol, assetType)) {
    return rawNameTh.trim();
  }

  if (!rawName) return '';

  let name = rawName.trim();
  if (!name) return '';

  const symUpper = symbol.toUpperCase().trim();

  // Strip Thai stock prefix (e.g. "PTT_PETROLEUM..." -> "PETROLEUM...")
  if (symUpper.endsWith('.BK')) {
    const prefix = symbol.replace(/\.BK$/i, '').toUpperCase() + '_';
    if (name.toUpperCase().startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }

  const hasThaiScript = /[\u0E00-\u0E7F]/.test(name);

  // Strip trailing quote currency / pair suffixes (e.g. "Bitcoin USD" -> "Bitcoin", "PAX Gold USD" -> "PAX Gold")
  if (!hasThaiScript && (symUpper.endsWith('.CRYPTO') || /\s+(USD|USDT|THB|USDC)$/i.test(name))) {
    name = name.replace(/\s+(USD|USDT|THB|USDC)$/i, '').trim();
  }

  // Strip copyright / trademark symbols
  name = name.replace(/\([R|TM|r|tm]\)/g, '').trim();

  // Convert ALL-CAPS names to Proper Case dynamically
  if (!hasThaiScript && name === name.toUpperCase() && name !== name.toLowerCase()) {
    return toProperCase(name);
  }

  return name;
}

/**
 * Dynamically resolves the formatted symbol name from a price data map,
 * checking standard suffix variants (.CRYPTO, .BKFUND, .BK).
 */
export function resolveSymbolName(
  symbol: string,
  pricesMap?: Map<string, { name?: string; nameTh?: string }>,
  lang: AppLang = 'en',
  assetType?: string
): string {
  if (!symbol || !pricesMap) return '';
  const entry =
    pricesMap.get(symbol) ||
    pricesMap.get(symbol + '.CRYPTO') ||
    pricesMap.get(symbol.replace(/\.CRYPTO$/i, '')) ||
    pricesMap.get(symbol + '.FUND') ||
    pricesMap.get(symbol.replace(/\.FUND$/i, '')) ||
    pricesMap.get(symbol + '.BKFUND') ||
    pricesMap.get(symbol.replace(/\.BKFUND$/i, '')) ||
    pricesMap.get(symbol + '.BK') ||
    pricesMap.get(symbol.replace(/\.BK$/i, ''));
  return getSymbolName(symbol, entry?.name || '', lang, entry?.nameTh || '', assetType);
}

/**
 * Converts a monetary amount between currencies (USD <-> THB) using a provided exchange rate.
 * Normalizes USDT to USD.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  const normFrom = fromCurrency === 'USDT' ? 'USD' : fromCurrency;
  const normTo = toCurrency === 'USDT' ? 'USD' : toCurrency;

  if (normFrom === normTo) return amount;
  if (exchangeRate <= 0) return amount;

  if (normFrom === 'USD' && normTo === 'THB') return amount * exchangeRate;
  if (normFrom === 'THB' && normTo === 'USD') return amount / exchangeRate;

  return amount;
}

/**
 * Returns the opposite display currency ('USD' when viewing 'THB', 'THB' when viewing 'USD').
 */
export function getSecondaryCurrency(displayCurrency: AppCurrency): AppCurrency {
  return displayCurrency === 'THB' ? 'USD' : 'THB';
}

/**
 * Converts an amount already expressed in `displayCurrency` to its secondary currency equivalent.
 * Returns `null` when the amount or exchange rate is invalid/unavailable.
 */
export function convertToSecondaryCurrency(
  amount: number,
  displayCurrency: AppCurrency,
  exchangeRate: number
): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    return null;
  }
  return displayCurrency === 'THB' ? amount / exchangeRate : amount * exchangeRate;
}

export function normalizeAssetType(rawType?: string): string | null {
  if (!rawType) return null;
  const normalized = rawType.trim().toLowerCase();
  if (normalized === 'provident-fund' || normalized.includes('provident') || normalized === 'pvd') {
    return 'provident-fund';
  }
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
  if (normalized === 'bond' || normalized.includes('bond')) {
    return 'bond';
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
    if (sym.startsWith('PVD') || sym.endsWith('.PVD')) return 'provident-fund';
    if (sym.endsWith('.FUND') || sym.endsWith('.BKFUND')) return 'mutual-fund';
    if (sym.endsWith('.BK')) return 'thai-stock';
    if (sym.endsWith('.CRYPTO')) return 'crypto';
  }
  return 'us-stock';
}

const ASSET_TYPE_CONFIG: Record<
  string,
  { label: string; cssClass: string; color: string; lightColor: string }
> = {
  'us-stock': {
    label: 'U.S. Stock',
    cssClass: 'asset-type-tag asset-type-us-stock',
    color: '#60A5FA',
    lightColor: '#2563EB',
  },
  'thai-stock': {
    label: 'Thai Stock',
    cssClass: 'asset-type-tag asset-type-thai-stock',
    color: '#2DD4BF',
    lightColor: '#0F766E',
  },
  crypto: {
    label: 'Cryptocurrency',
    cssClass: 'asset-type-tag asset-type-crypto',
    color: '#FB923C',
    lightColor: '#C2410C',
  },
  'mutual-fund': {
    label: 'Mutual Fund',
    cssClass: 'asset-type-tag asset-type-mutual-fund',
    color: '#A78BFA',
    lightColor: '#7C3AED',
  },
  bond: {
    label: 'Bond',
    cssClass: 'asset-type-tag asset-type-bond',
    color: '#94A3B8',
    lightColor: '#475569',
  },
  'provident-fund': {
    label: 'Provident Fund',
    cssClass: 'asset-type-tag asset-type-provident-fund',
    color: '#FBBF24',
    lightColor: '#A16207',
  },
};

const ASSET_TYPE_LABELS: Record<AppLang, Record<string, string>> = {
  en: {
    'us-stock': 'U.S. Stock',
    'thai-stock': 'Thai Stock',
    crypto: 'Cryptocurrency',
    'mutual-fund': 'Mutual Fund',
    bond: 'Bond',
    'provident-fund': 'Provident Fund',
  },
  th: {
    'us-stock': 'หุ้นสหรัฐฯ',
    'thai-stock': 'หุ้นไทย',
    crypto: 'คริปโตเคอร์เรนซี',
    'mutual-fund': 'กองทุนรวม',
    bond: 'พันธบัตร',
    'provident-fund': 'กองทุนสำรองเลี้ยงชีพ',
  },
};

const UNIT_LABELS: Record<
  AppLang,
  { shares: string; share: string; units: string; unit: string; coins: string; coin: string }
> = {
  en: {
    shares: 'shares',
    share: 'share',
    units: 'units',
    unit: 'unit',
    coins: 'coins',
    coin: 'coin',
  },
  th: {
    shares: 'หุ้น',
    share: 'หุ้น',
    units: 'หน่วย',
    unit: 'หน่วย',
    coins: 'เหรียญ',
    coin: 'เหรียญ',
  },
};

export function getAssetTypeLabel(
  assetType?: string,
  symbol?: string,
  lang: AppLang = 'en'
): string {
  const type = getAssetType(assetType, symbol);
  const localized = ASSET_TYPE_LABELS[lang]?.[type];
  if (localized) {
    return localized;
  }
  if (ASSET_TYPE_CONFIG[type]) {
    return ASSET_TYPE_CONFIG[type].label;
  }
  return toProperCase(type.replace(/[-_]/g, ' '));
}

export function getAssetTypeClass(assetType?: string, symbol?: string): string {
  const type = getAssetType(assetType, symbol);
  if (ASSET_TYPE_CONFIG[type]) {
    return ASSET_TYPE_CONFIG[type].cssClass;
  }
  return `asset-type-tag asset-type-${type.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()}`;
}

export function getAssetColor(
  assetType?: string,
  symbol?: string,
  theme: 'dark' | 'light' = 'dark'
): string {
  const type = getAssetType(assetType, symbol);
  if (ASSET_TYPE_CONFIG[type]) {
    return theme === 'light' ? ASSET_TYPE_CONFIG[type].lightColor : ASSET_TYPE_CONFIG[type].color;
  }
  return theme === 'light' ? '#475569' : '#9ca3af';
}

export interface AssetTypeOption {
  id: string;
  label: string;
  count: number;
}

export function generateAssetTypeOptions(
  list: { assetType?: string; symbol: string }[],
  lang: AppLang = 'en'
): AssetTypeOption[] {
  const countByType: Record<string, number> = {
    all: list.length,
  };
  for (const type of KNOWN_ASSET_TYPES) {
    countByType[type] = 0;
  }

  for (const item of list) {
    const type = getAssetType(item.assetType, item.symbol);
    if (countByType[type] !== undefined) {
      countByType[type]++;
    } else {
      countByType[type] = 1;
    }
  }

  return [
    { id: 'all', label: lang === 'th' ? 'ทุกประเภท' : 'All Types', count: countByType['all'] },
    ...KNOWN_ASSET_TYPES.map((type) => ({
      id: type,
      label: getAssetTypeLabel(type, undefined, lang),
      count: countByType[type] || 0,
    })),
  ].filter((opt) => opt.id === 'all' || opt.count > 0);
}

export function getUnitLabel(symbol?: string, assetType?: string, lang: AppLang = 'en'): string {
  const type = getAssetType(assetType, symbol);
  const dict = UNIT_LABELS[lang] ?? UNIT_LABELS.en;
  if (type === 'crypto') return dict.coins;
  if (type === 'mutual-fund' || type === 'provident-fund') return dict.units;
  return dict.shares;
}

export function getUnitLabelSingular(
  symbol?: string,
  assetType?: string,
  lang: AppLang = 'en'
): string {
  const type = getAssetType(assetType, symbol);
  const dict = UNIT_LABELS[lang] ?? UNIT_LABELS.en;
  if (type === 'crypto') return dict.coin;
  if (type === 'mutual-fund' || type === 'provident-fund') return dict.unit;
  return dict.share;
}
