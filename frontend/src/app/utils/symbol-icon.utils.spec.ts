import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanTickerForUrl,
  getBackendSymbolIconUrl,
  getSymbolLogoConfig,
  getSymbolMonogram,
  isLogoUrlFailed,
  markLogoUrlFailed,
  isLogoUrlLoaded,
  markLogoUrlLoaded,
  clearLogoCache,
} from './symbol-icon.utils';

describe('symbol-icon.utils', () => {
  beforeEach(() => {
    clearLogoCache();
  });

  describe('cleanTickerForUrl', () => {
    it('strips .CRYPTO suffix', () => {
      expect(cleanTickerForUrl('BTC.CRYPTO')).toBe('BTC');
    });

    it('strips .BK suffix', () => {
      expect(cleanTickerForUrl('PTT.BK')).toBe('PTT');
    });

    it('strips .FUND suffix', () => {
      expect(cleanTickerForUrl('SCBBLN.FUND')).toBe('SCBBLN');
    });

    it('replaces dot in multi-class stock with dash', () => {
      expect(cleanTickerForUrl('BRK.B')).toBe('BRK-B');
    });
  });

  describe('getBackendSymbolIconUrl', () => {
    it('constructs backend icon endpoint URL with resolved asset type', () => {
      expect(getBackendSymbolIconUrl('AAPL', 'us-stock')).toBe(
        '/api/backend/icon/AAPL?asset_type=us-stock'
      );
      expect(getBackendSymbolIconUrl('PTT.BK', 'thai-stock')).toBe(
        '/api/backend/icon/PTT.BK?asset_type=thai-stock'
      );
      expect(getBackendSymbolIconUrl('SCBBLN.FUND')).toBe(
        '/api/backend/icon/SCBBLN.FUND?asset_type=mutual-fund'
      );
    });

    it('returns null for empty or null symbol', () => {
      expect(getBackendSymbolIconUrl('')).toBeNull();
      expect(getBackendSymbolIconUrl(null)).toBeNull();
      expect(getBackendSymbolIconUrl(undefined)).toBeNull();
    });
  });

  describe('getSymbolLogoConfig', () => {
    it('resolves crypto logo URL to backend endpoint', () => {
      const config = getSymbolLogoConfig('BTC.CRYPTO');
      expect(config.isMutualFund).toBe(false);
      expect(config.primaryUrl).toBe('/api/backend/icon/BTC.CRYPTO?asset_type=crypto');
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('BTC');
    });

    it('resolves Thai stock logo URL to backend endpoint', () => {
      const config = getSymbolLogoConfig('PTT.BK');
      expect(config.isMutualFund).toBe(false);
      expect(config.primaryUrl).toBe('/api/backend/icon/PTT.BK?asset_type=thai-stock');
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('PTT');
    });

    it('resolves US stock logo URL to backend endpoint', () => {
      const config = getSymbolLogoConfig('AAPL');
      expect(config.isMutualFund).toBe(false);
      expect(config.primaryUrl).toBe('/api/backend/icon/AAPL?asset_type=us-stock');
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('AA');
    });

    it('returns isMutualFund: true and backend icon URL for Thai mutual funds', () => {
      const config = getSymbolLogoConfig('SCBBLN.FUND');
      expect(config.isMutualFund).toBe(true);
      expect(config.primaryUrl).toBe('/api/backend/icon/SCBBLN.FUND?asset_type=mutual-fund');
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('SC');
    });

    it('returns isMutualFund: true and backend icon URL for Provident Funds', () => {
      const config = getSymbolLogoConfig('PVDSP500', 'provident-fund');
      expect(config.isMutualFund).toBe(true);
      expect(config.primaryUrl).toBe('/api/backend/icon/PVDSP500?asset_type=provident-fund');
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('PV');
    });

    it('handles empty symbol safely', () => {
      const config = getSymbolLogoConfig('');
      expect(config.primaryUrl).toBeNull();
      expect(config.secondaryUrl).toBeNull();
      expect(config.monogram).toBe('?');
    });
  });

  describe('getSymbolMonogram', () => {
    it('returns short tickers directly', () => {
      expect(getSymbolMonogram('BTC')).toBe('BTC');
      expect(getSymbolMonogram('PTT.BK')).toBe('PTT');
      expect(getSymbolMonogram('V')).toBe('V');
    });

    it('returns first 2 letters for longer tickers', () => {
      expect(getSymbolMonogram('AAPL')).toBe('AA');
      expect(getSymbolMonogram('MSFT')).toBe('MS');
      expect(getSymbolMonogram('ES-GTECHSSF.FUND')).toBe('ES');
    });
  });

  describe('URL Caches', () => {
    it('marks and checks failed URLs', () => {
      const testUrl = '/api/backend/icon/FAIL?asset_type=us-stock';
      expect(isLogoUrlFailed(testUrl)).toBe(false);
      markLogoUrlFailed(testUrl);
      expect(isLogoUrlFailed(testUrl)).toBe(true);
    });

    it('marks and checks loaded URLs', () => {
      const testUrl = '/api/backend/icon/AAPL?asset_type=us-stock';
      expect(isLogoUrlLoaded(testUrl)).toBe(false);
      markLogoUrlLoaded(testUrl);
      expect(isLogoUrlLoaded(testUrl)).toBe(true);
    });

    it('clears caches cleanly', () => {
      const testUrl = '/api/backend/icon/TEST?asset_type=us-stock';
      markLogoUrlFailed(testUrl);
      markLogoUrlLoaded(testUrl);
      clearLogoCache();
      expect(isLogoUrlFailed(testUrl)).toBe(false);
      expect(isLogoUrlLoaded(testUrl)).toBe(false);
    });
  });
});
