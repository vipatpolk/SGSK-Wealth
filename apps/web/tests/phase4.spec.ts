import { describe, expect, it } from 'vitest';
import {
  buildLocalHoldingsResponse,
  convertToSecondaryCurrency,
  getSecondaryCurrency,
  SAMPLE_LOCAL_TRANSACTIONS,
} from '@sgsk-wealth/domain';

describe('Phase 4 Nuxt domain integration', () => {
  it('computes secondary currency conversions via @sgsk-wealth/domain', () => {
    expect(getSecondaryCurrency('THB')).toBe('USD');
    expect(getSecondaryCurrency('USD')).toBe('THB');
    expect(convertToSecondaryCurrency(3500, 'THB', 35)).toBeCloseTo(100, 6);
    expect(convertToSecondaryCurrency(100, 'USD', 35)).toBeCloseTo(3500, 6);
  });

  it('builds local guest portfolio holdings from sample transactions', () => {
    const txs = SAMPLE_LOCAL_TRANSACTIONS.map((tx, idx) => ({
      ...tx,
      id: `sample-${idx}`,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    const holdings = buildLocalHoldingsResponse(txs, 'all', 'THB', new Map(), 35, 'en');
    expect(holdings.openPositions.length).toBeGreaterThan(0);
    expect(holdings.currency).toBe('THB');
  });
});
