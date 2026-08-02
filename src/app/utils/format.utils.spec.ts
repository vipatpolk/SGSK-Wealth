import {
  getQuantityFormat,
  displaySymbol,
  getPriceFormat,
  getSymbolColor,
  getSymbolName,
  getAssetType,
  getAssetTypeLabel,
  getAssetTypeClass,
  normalizeAssetType,
} from './format.utils';

describe('FormatUtils', () => {
  describe('getQuantityFormat', () => {
    it('should format crypto quantities with up to 10 decimals', () => {
      expect(getQuantityFormat('BTC.CRYPTO')).toBe('1.0-10');
    });

    it('should format stock quantities with up to 7 decimals', () => {
      expect(getQuantityFormat('AAPL')).toBe('1.0-7');
      expect(getQuantityFormat('PTT.BK')).toBe('1.0-7');
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
    });
  });

  describe('getPriceFormat', () => {
    it('should return 1.2-2 for crypto', () => {
      expect(getPriceFormat('BTC.CRYPTO')).toBe('1.2-2');
    });

    it('should return 1.2-4 for stocks', () => {
      expect(getPriceFormat('AAPL')).toBe('1.2-4');
    });
  });

  describe('getSymbolColor', () => {
    it('should return configured colors for known symbols', () => {
      expect(getSymbolColor('AAPL')).toBe('#94a3b8');
      expect(getSymbolColor('BTC.CRYPTO')).toBe('#f7931a');
    });

    it('should fallback to default color for unknown symbols', () => {
      expect(getSymbolColor('UNKNOWN_SYM')).toBe('#6366f1');
    });
  });

  describe('getSymbolName', () => {
    it('should return static name when available', () => {
      expect(getSymbolName('AAPL')).toBe('Apple Inc.');
      expect(getSymbolName('tsp3-balancer')).toBe('TMB Smart Port 3 Balancer');
      expect(getSymbolName('TSP4-EXPLORER')).toBe('TMB Smart Port 4 Explorer');
      expect(getSymbolName('ES-GTECHSSF')).toBe('Eastspring Global Technology SSF');
      expect(getSymbolName('UOBSD-SSF')).toBe('UOB Smart Dividend SSF');
    });

    it('should format raw name with prefix stripping and proper case', () => {
      expect(getSymbolName('PTT.BK', 'PTT_PETROLEUM PUBLIC')).toBe('Petroleum Public');
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
      expect(getAssetType(undefined, 'SCBGOLDH-SSF')).toBe('mutual-fund');
      expect(getAssetType(undefined, 'ES-GTECHSSF')).toBe('mutual-fund');
      expect(getAssetType(undefined, 'UGSTAR-SSF-D')).toBe('mutual-fund');
    });

    it('should return appropriate labels for display', () => {
      expect(getAssetTypeLabel('us-stock')).toBe('U.S. Stock');
      expect(getAssetTypeLabel('thai-stock')).toBe('Thai Stock');
      expect(getAssetTypeLabel('crypto')).toBe('Cryptocurrency');
      expect(getAssetTypeLabel('mutual-fund')).toBe('Mutual Fund');
      expect(getAssetTypeLabel(undefined, 'BTC.CRYPTO')).toBe('Cryptocurrency');
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
  });
});
