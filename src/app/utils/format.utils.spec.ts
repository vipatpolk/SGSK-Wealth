import {
  getQuantityFormat,
  displaySymbol,
  toYahooSymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  resolveSymbolName,
  convertCurrency,
  getAssetType,
  getAssetTypeLabel,
  getAssetTypeClass,
  normalizeAssetType,
} from './format.utils';

describe('FormatUtils', () => {
  describe('getQuantityFormat', () => {
    it('should format crypto quantities with up to 10 decimals', () => {
      expect(getQuantityFormat('BTC.CRYPTO')).toBe('1.0-10');
      expect(getQuantityFormat('ETH.CRYPTO')).toBe('1.0-10');
      expect(getQuantityFormat('ADA', 'crypto')).toBe('1.0-10');
    });

    it('should format stock quantities with up to 7 decimals', () => {
      expect(getQuantityFormat('AAPL')).toBe('1.0-7');
      expect(getQuantityFormat('PTT.BK')).toBe('1.0-7');
      expect(getQuantityFormat('ES-GTECHSSF.BKFUND')).toBe('1.0-7');
    });
  });

  describe('toYahooSymbol', () => {
    it('should convert dot share classes to hyphens for US stocks', () => {
      expect(toYahooSymbol('BRK.B')).toBe('BRK-B');
      expect(toYahooSymbol('BRK.A')).toBe('BRK-A');
      expect(toYahooSymbol('BF.B')).toBe('BF-B');
      expect(toYahooSymbol('BF.A')).toBe('BF-A');
    });

    it('should convert slash share classes to hyphens', () => {
      expect(toYahooSymbol('BRK/B')).toBe('BRK-B');
    });

    it('should preserve Thai stock .BK suffix', () => {
      expect(toYahooSymbol('PTT.BK')).toBe('PTT.BK');
      expect(toYahooSymbol('3BBIF.BK')).toBe('3BBIF.BK');
      expect(toYahooSymbol('CPF.BK')).toBe('CPF.BK');
    });

    it('should strip .BKFUND and .CRYPTO suffixes', () => {
      expect(toYahooSymbol('ES-GTECHSSF.BKFUND')).toBe('ES-GTECHSSF');
      expect(toYahooSymbol('SCBSFF.BKFUND')).toBe('SCBSFF');
      expect(toYahooSymbol('BTC.CRYPTO')).toBe('BTC');
    });

    it('should preserve regular stock symbols', () => {
      expect(toYahooSymbol('AAPL')).toBe('AAPL');
      expect(toYahooSymbol('VOO')).toBe('VOO');
      expect(toYahooSymbol('NVDA')).toBe('NVDA');
      expect(toYahooSymbol('USDTHB=X')).toBe('USDTHB=X');
      expect(toYahooSymbol('^GSPC')).toBe('^GSPC');
    });

    it('should handle empty or whitespace symbols', () => {
      expect(toYahooSymbol('')).toBe('');
      expect(toYahooSymbol('   ')).toBe('');
    });
  });

  describe('displaySymbol', () => {
    it('should strip .BK suffix', () => {
      expect(displaySymbol('PTT.BK')).toBe('PTT');
    });

    it('should strip .CRYPTO suffix', () => {
      expect(displaySymbol('BTC.CRYPTO')).toBe('BTC');
    });

    it('should strip .BKFUND suffix', () => {
      expect(displaySymbol('ES-GTECHSSF.BKFUND')).toBe('ES-GTECHSSF');
      expect(displaySymbol('SCBSFF.BKFUND')).toBe('SCBSFF');
      expect(displaySymbol('SCBGOLDH-SSF.BKFUND')).toBe('SCBGOLDH-SSF');
      expect(displaySymbol('UGSTAR-SSF-D.BKFUND')).toBe('UGSTAR-SSF-D');
    });

    it('should leave regular symbols intact', () => {
      expect(displaySymbol('AAPL')).toBe('AAPL');
      expect(displaySymbol('VOO')).toBe('VOO');
      expect(displaySymbol('ETH')).toBe('ETH');
      expect(displaySymbol('ADA')).toBe('ADA');
    });
  });

  describe('getPriceFormat', () => {
    it('should return 1.2-2 for crypto', () => {
      expect(getPriceFormat('BTC.CRYPTO')).toBe('1.2-2');
      expect(getPriceFormat('ETH.CRYPTO')).toBe('1.2-2');
      expect(getPriceFormat('ADA', 'crypto')).toBe('1.2-2');
    });

    it('should return 1.2-4 for stocks and funds', () => {
      expect(getPriceFormat('AAPL')).toBe('1.2-4');
      expect(getPriceFormat('ES-GTECHSSF.BKFUND')).toBe('1.2-4');
    });
  });

  describe('getSymbolColor', () => {
    it('should return a valid 6-digit hex color for any symbol', () => {
      const hexPattern = /^#[0-9a-f]{6}$/i;
      expect(getSymbolColor('AAPL')).toMatch(hexPattern);
      expect(getSymbolColor('BTC.CRYPTO')).toMatch(hexPattern);
      expect(getSymbolColor('PTT.BK')).toMatch(hexPattern);
      expect(getSymbolColor('ES-GTECHSSF.BKFUND')).toMatch(hexPattern);
      expect(getSymbolColor('UNKNOWN_SYM_12345')).toMatch(hexPattern);
    });

    it('should be deterministic and consistent for the same symbol regardless of suffix or casing', () => {
      expect(getSymbolColor('BTC.CRYPTO')).toBe(getSymbolColor('BTC'));
      expect(getSymbolColor('btc.crypto')).toBe(getSymbolColor('BTC'));
      expect(getSymbolColor('PTT.BK')).toBe(getSymbolColor('PTT'));
      expect(getSymbolColor('ES-GTECHSSF.BKFUND')).toBe(getSymbolColor('ES-GTECHSSF'));
      expect(getSymbolColor('AAPL')).toBe(getSymbolColor('aapl'));
    });

    it('should fallback gracefully for empty symbols', () => {
      expect(getSymbolColor('')).toBe('#6366f1');
    });
  });

  describe('getSymbolName', () => {
    it('should return empty string when rawName is empty or missing', () => {
      expect(getSymbolName('AAPL')).toBe('');
      expect(getSymbolName('AAPL', '')).toBe('');
      expect(getSymbolName('AAPL', '   ')).toBe('');
    });

    it('should preserve formatted raw name provided from API', () => {
      expect(getSymbolName('AAPL', 'Apple Inc.')).toBe('Apple Inc.');
      expect(getSymbolName('SCBSFF', 'SCB Short Term Fixed Income Fund')).toBe('SCB Short Term Fixed Income Fund');
      expect(getSymbolName('SCBSFF.BKFUND', 'SCB Short Term Fixed Income Fund')).toBe('SCB Short Term Fixed Income Fund');
      expect(getSymbolName('BTC', 'Bitcoin')).toBe('Bitcoin');
    });

    it('should format all-caps raw names to proper case dynamically', () => {
      expect(getSymbolName('TSLA', 'TESLA, INC.')).toBe('Tesla, Inc.');
      expect(getSymbolName('NVDA', 'NVIDIA CORPORATION')).toBe('Nvidia Corporation');
    });

    it('should format raw name with prefix stripping for Thai stocks dynamically', () => {
      expect(getSymbolName('PTT.BK', 'PTT_PETROLEUM PUBLIC')).toBe('Petroleum Public');
      expect(getSymbolName('TISCO.BK', 'TISCO_TISCO FINANCIAL GROUP')).toBe('Tisco Financial Group');
    });

    it('should dynamically strip pair and currency suffixes from crypto names', () => {
      expect(getSymbolName('BTC.CRYPTO', 'Bitcoin USD')).toBe('Bitcoin');
      expect(getSymbolName('PAXG.CRYPTO', 'PAX Gold USD')).toBe('PAX Gold');
      expect(getSymbolName('ADA.CRYPTO', 'Cardano USD')).toBe('Cardano');
      expect(getSymbolName('USDT.CRYPTO', 'Tether USD')).toBe('Tether');
      expect(getSymbolName('DOT.CRYPTO', 'Polkadot USDT')).toBe('Polkadot');
    });
  });

  describe('resolveSymbolName', () => {
    const pricesMap = new Map<string, { name?: string }>([
      ['AAPL', { name: 'Apple Inc.' }],
      ['PTT.BK', { name: 'PTT_PETROLEUM PUBLIC' }],
      ['BTC.CRYPTO', { name: 'Bitcoin USD' }],
      ['SCBSFF.BKFUND', { name: 'SCB Short Term Fixed Income Fund' }],
    ]);

    it('should resolve exact symbol name from price map', () => {
      expect(resolveSymbolName('AAPL', pricesMap)).toBe('Apple Inc.');
      expect(resolveSymbolName('PTT.BK', pricesMap)).toBe('Petroleum Public');
    });

    it('should resolve symbol name with suffix variations fallback', () => {
      expect(resolveSymbolName('BTC', pricesMap)).toBe('Bitcoin');
      expect(resolveSymbolName('SCBSFF', pricesMap)).toBe('SCB Short Term Fixed Income Fund');
    });

    it('should return empty string if map is missing or symbol not found', () => {
      expect(resolveSymbolName('UNKNOWN', pricesMap)).toBe('');
      expect(resolveSymbolName('AAPL', undefined)).toBe('');
      expect(resolveSymbolName('', pricesMap)).toBe('');
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount if from and to currencies match or both normalize to USD', () => {
      expect(convertCurrency(100, 'USD', 'USD', 35)).toBe(100);
      expect(convertCurrency(100, 'THB', 'THB', 35)).toBe(100);
      expect(convertCurrency(100, 'USDT', 'USD', 35)).toBe(100);
    });

    it('should convert USD to THB using exchange rate', () => {
      expect(convertCurrency(10, 'USD', 'THB', 35)).toBe(350);
      expect(convertCurrency(10, 'USDT', 'THB', 35)).toBe(350);
    });

    it('should convert THB to USD using exchange rate', () => {
      expect(convertCurrency(350, 'THB', 'USD', 35)).toBe(10);
    });

    it('should return original amount if exchange rate is invalid', () => {
      expect(convertCurrency(100, 'USD', 'THB', 0)).toBe(100);
      expect(convertCurrency(100, 'USD', 'THB', -1)).toBe(100);
    });
  });

  describe('getAssetType and labels', () => {
    it('should correctly identify asset types from explicit assetType string', () => {
      expect(getAssetType('us-stock')).toBe('us-stock');
      expect(getAssetType('thai-stock')).toBe('thai-stock');
      expect(getAssetType('crypto')).toBe('crypto');
      expect(getAssetType('mutual-fund')).toBe('mutual-fund');
    });

    it('should correctly infer asset types from symbol when assetType is missing or generic', () => {
      expect(getAssetType(undefined, 'AAPL')).toBe('us-stock');
      expect(getAssetType(undefined, 'CPALL.BK')).toBe('thai-stock');
      expect(getAssetType(undefined, 'ETH.CRYPTO')).toBe('crypto');
      expect(getAssetType(undefined, 'ES-GTECHSSF.BKFUND')).toBe('mutual-fund');
      expect(getAssetType(undefined, 'SCBSFF.BKFUND')).toBe('mutual-fund');
    });

    it('should correctly identify asset types when assetType is provided from data source', () => {
      expect(getAssetType('crypto', 'BTC')).toBe('crypto');
      expect(getAssetType('crypto', 'ETH')).toBe('crypto');
      expect(getAssetType('crypto', 'ADA')).toBe('crypto');
      expect(getAssetType('mutual-fund', 'SCBGOLDH-SSF')).toBe('mutual-fund');
      expect(getAssetType('mutual-fund', 'ES-GTECHSSF')).toBe('mutual-fund');
      expect(getAssetType('Mutual Fund', 'UGSTAR-SSF-D')).toBe('mutual-fund');
      expect(getAssetType('fund', 'SCBSFF')).toBe('mutual-fund');
      expect(getAssetType('Mutual Fund', 'SCBSFF.BKFUND')).toBe('mutual-fund');
    });

    it('should return appropriate labels for display', () => {
      expect(getAssetTypeLabel('us-stock')).toBe('U.S. Stock');
      expect(getAssetTypeLabel('thai-stock')).toBe('Thai Stock');
      expect(getAssetTypeLabel('crypto')).toBe('Cryptocurrency');
      expect(getAssetTypeLabel('mutual-fund')).toBe('Mutual Fund');
      expect(getAssetTypeLabel(undefined, 'BTC.CRYPTO')).toBe('Cryptocurrency');
      expect(getAssetTypeLabel(undefined, 'ES-GTECHSSF.BKFUND')).toBe('Mutual Fund');
      expect(getAssetTypeLabel('crypto', 'ADA')).toBe('Cryptocurrency');
    });

    it('should return appropriate CSS classes', () => {
      expect(getAssetTypeClass('us-stock')).toBe('asset-type-tag asset-type-us-stock');
      expect(getAssetTypeClass('thai-stock')).toBe('asset-type-tag asset-type-thai-stock');
      expect(getAssetTypeClass('crypto')).toBe('asset-type-tag asset-type-crypto');
      expect(getAssetTypeClass('mutual-fund')).toBe('asset-type-tag asset-type-mutual-fund');
      expect(getAssetTypeClass(undefined, 'ES-GTECHSSF.BKFUND')).toBe('asset-type-tag asset-type-mutual-fund');
    });

    it('should normalize raw type strings from Google Sheets', () => {
      expect(normalizeAssetType('Thai Stock')).toBe('thai-stock');
      expect(normalizeAssetType('U.S. Stock')).toBe('us-stock');
      expect(normalizeAssetType('Cryptocurrency')).toBe('crypto');
      expect(normalizeAssetType('Mutual Fund')).toBe('mutual-fund');
      expect(normalizeAssetType('')).toBeNull();
    });

    it('should handle raw type string inputs in getAssetType', () => {
      expect(getAssetType('Thai Stock')).toBe('thai-stock');
      expect(getAssetType('U.S. Stock')).toBe('us-stock');
      expect(getAssetType('Cryptocurrency')).toBe('crypto');
      expect(getAssetType('Mutual Fund')).toBe('mutual-fund');
    });
  });
});
