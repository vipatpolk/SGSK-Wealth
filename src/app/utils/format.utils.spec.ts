import { getQuantityFormat, displaySymbol, getPriceFormat, getSymbolColor, getSymbolName } from './format.utils';

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
    });

    it('should format raw name with prefix stripping and proper case', () => {
      expect(getSymbolName('PTT.BK', 'PTT_PETROLEUM PUBLIC')).toBe('Petroleum Public');
    });
  });
});
