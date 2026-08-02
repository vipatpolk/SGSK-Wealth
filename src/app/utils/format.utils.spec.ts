import {
  getQuantityFormat,
  displaySymbol,
  toYahooSymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  getAssetType,
  getAssetTypeLabel,
  getAssetTypeClass,
  normalizeAssetType,
  isCryptoSymbol,
} from './format.utils';

describe('FormatUtils', () => {
  describe('getQuantityFormat', () => {
    it('should format crypto quantities with up to 10 decimals', () => {
      expect(getQuantityFormat('BTC.CRYPTO')).toBe('1.0-10');
      expect(getQuantityFormat('ETH')).toBe('1.0-10');
      expect(getQuantityFormat('ADA')).toBe('1.0-10');
    });

    it('should format stock quantities with up to 7 decimals', () => {
      expect(getQuantityFormat('AAPL')).toBe('1.0-7');
      expect(getQuantityFormat('PTT.BK')).toBe('1.0-7');
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
      expect(getPriceFormat('ETH')).toBe('1.2-2');
      expect(getPriceFormat('ADA')).toBe('1.2-2');
    });

    it('should return 1.2-4 for stocks', () => {
      expect(getPriceFormat('AAPL')).toBe('1.2-4');
    });
  });

  describe('getSymbolColor', () => {
    it('should return configured colors for known symbols', () => {
      expect(getSymbolColor('AAPL')).toBe('#94a3b8');
      expect(getSymbolColor('BTC.CRYPTO')).toBe('#f7931a');
      expect(getSymbolColor('ETH')).toBe('#627eea');
      expect(getSymbolColor('ADA')).toBe('#0033ad');
      expect(getSymbolColor('BNB')).toBe('#f3ba2f');
      expect(getSymbolColor('DOT')).toBe('#e6007a');
    });

    it('should fallback to default color for unknown symbols', () => {
      expect(getSymbolColor('UNKNOWN_SYM')).toBe('#6366f1');
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
      expect(getSymbolName('BTC', 'Bitcoin')).toBe('Bitcoin');
    });

    it('should format all-caps raw names to proper case', () => {
      expect(getSymbolName('TSLA', 'TESLA, INC.')).toBe('Tesla, Inc.');
      expect(getSymbolName('NVDA', 'NVIDIA CORPORATION')).toBe('Nvidia Corporation');
    });

    it('should format raw name with prefix stripping for Thai stocks', () => {
      expect(getSymbolName('PTT.BK', 'PTT_PETROLEUM PUBLIC')).toBe('Petroleum Public');
      expect(getSymbolName('TISCO.BK', 'TISCO_TISCO FINANCIAL GROUP')).toBe('Tisco Financial Group');
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
      expect(getAssetType(undefined, 'ETH')).toBe('crypto');
      expect(getAssetType(undefined, 'ADA')).toBe('crypto');
    });

    it('should correctly identify mutual funds when assetType is provided from data source', () => {
      expect(getAssetType('mutual-fund', 'SCBGOLDH-SSF')).toBe('mutual-fund');
      expect(getAssetType('mutual-fund', 'ES-GTECHSSF')).toBe('mutual-fund');
      expect(getAssetType('Mutual Fund', 'UGSTAR-SSF-D')).toBe('mutual-fund');
      expect(getAssetType('fund', 'SCBSFF')).toBe('mutual-fund');
    });

    it('should return appropriate labels for display', () => {
      expect(getAssetTypeLabel('us-stock')).toBe('U.S. Stock');
      expect(getAssetTypeLabel('thai-stock')).toBe('Thai Stock');
      expect(getAssetTypeLabel('crypto')).toBe('Cryptocurrency');
      expect(getAssetTypeLabel('mutual-fund')).toBe('Mutual Fund');
      expect(getAssetTypeLabel(undefined, 'BTC.CRYPTO')).toBe('Cryptocurrency');
      expect(getAssetTypeLabel(undefined, 'ADA')).toBe('Cryptocurrency');
    });

    it('should return appropriate CSS classes', () => {
      expect(getAssetTypeClass('us-stock')).toBe('asset-type-tag asset-type-us-stock');
      expect(getAssetTypeClass('thai-stock')).toBe('asset-type-tag asset-type-thai-stock');
      expect(getAssetTypeClass('crypto')).toBe('asset-type-tag asset-type-crypto');
      expect(getAssetTypeClass('mutual-fund')).toBe('asset-type-tag asset-type-mutual-fund');
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

    it('should detect crypto symbols via isCryptoSymbol', () => {
      expect(isCryptoSymbol('BTC.CRYPTO')).toBe(true);
      expect(isCryptoSymbol('ETH')).toBe(true);
      expect(isCryptoSymbol('ADA')).toBe(true);
      expect(isCryptoSymbol('AAPL')).toBe(false);
      expect(isCryptoSymbol('PTT.BK')).toBe(false);
    });
  });
});
