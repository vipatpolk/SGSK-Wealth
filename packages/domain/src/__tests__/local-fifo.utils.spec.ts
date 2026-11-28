import { describe, expect, it } from 'vitest';
import type { LocalTransaction, PriceData } from '@sgsk-wealth/contracts';
import {
  buildLocalAllocationResponse,
  buildLocalDividendResponse,
  buildLocalHoldingsResponse,
  buildLocalPerformanceResponse,
  parseLocalTransactionsCsv,
  processLocalTransactionsFifo,
} from '../local-fifo.utils';

function makeTx(
  overrides: Partial<LocalTransaction> & Pick<LocalTransaction, 'symbol' | 'date' | 'quantity' | 'price'>
): LocalTransaction {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    currency: 'USD',
    assetType: 'us-stock',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('local-fifo.utils', () => {
  it('computes FIFO lots, partial sell realized P&L, and fee inclusion', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 100, fee: 10, txType: 'BUY' }),
      makeTx({ symbol: 'AAPL', date: '2025-02-10', quantity: 10, price: 120, fee: 10, txType: 'BUY' }),
      makeTx({ symbol: 'AAPL', date: '2025-03-15', quantity: -15, price: 150, fee: 15, txType: 'SELL' }),
    ];

    const fifo = processLocalTransactionsFifo(txs);
    expect(fifo.openSummaries.length).toBe(1);
    const open = fifo.openSummaries[0];
    expect(open.symbol).toBe('AAPL');
    expect(open.totalShares).toBeCloseTo(5, 6);
    expect(open.averageCost).toBeCloseTo(121, 4);
    expect(open.totalCost).toBeCloseTo(605, 4);

    expect(fifo.closedSummaries.length).toBe(1);
    const closed = fifo.closedSummaries[0];
    expect(closed.closedShares).toBeCloseTo(15, 6);
    expect(closed.totalCost).toBeCloseTo(1615, 4);
    expect(closed.totalProceeds).toBeCloseTo(2235, 4);
    expect(closed.realizedPL).toBeCloseTo(620, 4);
  });

  it('builds localized holdings response with market prices and currency conversion', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 180, currency: 'USD', assetType: 'us-stock' }),
      makeTx({ symbol: 'PTT.BK', date: '2025-01-12', quantity: 100, price: 30, currency: 'THB', assetType: 'thai-stock' }),
    ];

    const prices = new Map<string, PriceData>([
      ['AAPL', { symbol: 'AAPL', price: 200, currency: 'USD', name: 'Apple Inc.', nameTh: '' }],
      ['PTT.BK', { symbol: 'PTT.BK', price: 35, currency: 'THB', name: 'PTT', nameTh: 'ปตท.' }],
    ]);

    const res = buildLocalHoldingsResponse(txs, 'all', 'THB', prices, 35, 'th');
    expect(res.error).toBeNull();
    expect(res.openPositions.length).toBe(2);
    expect(res.summary.openInvested).toBeCloseTo(66000, 2);
    expect(res.summary.totalValue).toBeCloseTo(73500, 2);
    expect(res.summary.totalUnrealizedPL).toBeCloseTo(7500, 2);
    const ptt = res.openPositions.find((p) => p.symbol === 'PTT.BK');
    expect(ptt?.nameTh).toBe('ปตท.');
  });

  it('calculates dividend withholding taxes across Thai (10%) and US (15%) holdings', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 180, currency: 'USD', assetType: 'us-stock', txType: 'BUY' }),
      makeTx({ symbol: 'AAPL', date: '2025-05-01', quantity: 10, price: 1.0, currency: 'USD', assetType: 'us-stock', txType: 'DIVIDEND' }),
      makeTx({ symbol: 'PTT.BK', date: '2025-01-10', quantity: 100, price: 30, currency: 'THB', assetType: 'thai-stock', txType: 'BUY' }),
      makeTx({ symbol: 'PTT.BK', date: '2025-04-20', quantity: 100, price: 2.0, currency: 'THB', assetType: 'thai-stock', txType: 'DIVIDEND' }),
    ];

    const divRes = buildLocalDividendResponse(txs, 'USD', new Map(), 35, 'en');
    expect(divRes.records.length).toBe(2);
    expect(divRes.totalGrossDividends).toBeCloseTo(10 + 200 / 35, 3);
    expect(divRes.totalWithholdingTax).toBeCloseTo(1.5 + 20 / 35, 3);
    expect(divRes.totalNetDividends).toBeCloseTo(8.5 + 180 / 35, 3);
  });

  it('parses CSV transaction rows with headers into normalized inputs', () => {
    const csv = [
      'Symbol,Date,Quantity,Price,Currency,Fee,Asset Type,Transaction Type',
      'aapl,2025-01-15,10,185.00,USD,2.5,us-stock,BUY',
      'aapl,2025-02-20,4,205.00,USD,1.5,us-stock,SELL',
    ].join('\n');

    const rows = parseLocalTransactionsCsv(csv);
    expect(rows.length).toBe(2);
    expect(rows[0].symbol).toBe('AAPL');
    expect(rows[0].quantity).toBe(10);
    expect(rows[0].fee).toBe(2.5);
    expect(rows[1].txType).toBe('SELL');
    expect(rows[1].quantity).toBe(4);
  });

  it('builds local performance analytics across open and closed symbols with date filtering', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 100, currency: 'USD', assetType: 'us-stock', txType: 'BUY' }),
      makeTx({ symbol: 'PTT.BK', date: '2025-02-01', quantity: 100, price: 35, currency: 'THB', assetType: 'thai-stock', txType: 'BUY' }),
      makeTx({ symbol: 'MSFT', date: '2024-06-01', quantity: 5, price: 300, currency: 'USD', assetType: 'us-stock', txType: 'BUY' }),
      makeTx({ symbol: 'MSFT', date: '2024-12-01', quantity: -5, price: 360, currency: 'USD', assetType: 'us-stock', txType: 'SELL' }),
    ];

    const prices = new Map<string, PriceData>([
      ['AAPL', { symbol: 'AAPL', price: 130, currency: 'USD', name: 'Apple Inc.' }],
      ['PTT.BK', { symbol: 'PTT.BK', price: 30, currency: 'THB', name: 'PTT' }],
    ]);

    const perf = buildLocalPerformanceResponse(txs, 'ALL', '', '', 'USD', prices, 35, 'en');
    expect(perf.error).toBeNull();
    expect(perf.symbolPerformance.length).toBe(3);
    expect(perf.assetTypePerformance.length).toBe(2);
    expect(perf.topGainers.map((g) => g.symbol)).toEqual(['AAPL', 'MSFT']);
    expect(perf.topLosers.map((l) => l.symbol)).toEqual(['PTT.BK']);

    const ytdPerf = buildLocalPerformanceResponse(txs, 'CUSTOM', '2025-01-01', '2025-12-31', 'USD', prices, 35, 'en');
    expect(ytdPerf.symbolPerformance.length).toBe(2);
  });

  it('builds local allocation recommendations, currency exposure, and concentration', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 100, currency: 'USD', assetType: 'us-stock', txType: 'BUY' }),
      makeTx({ symbol: 'PTT.BK', date: '2025-02-01', quantity: 1000, price: 35, currency: 'THB', assetType: 'thai-stock', txType: 'BUY' }),
    ];

    const prices = new Map<string, PriceData>([
      ['AAPL', { symbol: 'AAPL', price: 150, currency: 'USD', name: 'Apple Inc.' }],
      ['PTT.BK', { symbol: 'PTT.BK', price: 35, currency: 'THB', name: 'PTT' }],
    ]);

    const alloc = buildLocalAllocationResponse(txs, { 'us-stock': 60, 'thai-stock': 40, crypto: 0, 'mutual-fund': 0, bond: 0, 'provident-fund': 0 }, 'USD', prices, 35, 'en');
    expect(alloc.error).toBeNull();
    // AAPL: 1500 USD (60%), PTT: 35000 THB / 35 = 1000 USD (40%), total = 2500 USD
    expect(alloc.totalPortfolioValue).toBeCloseTo(2500, 2);
    expect(alloc.currencyExposure.usdPercent).toBeCloseTo(60, 2);
    expect(alloc.currencyExposure.thbPercent).toBeCloseTo(40, 2);
    expect(alloc.holdingsConcentration.map((h) => h.symbol)).toEqual(['AAPL', 'PTT.BK']);

    const usRec = alloc.recommendations.find((r) => r.assetType === 'us-stock');
    expect(usRec?.action).toBe('BALANCED');
  });

  it('excludes provident-fund snapshots from transactionSummaries while preserving openSummaries', () => {
    const txs: LocalTransaction[] = [
      makeTx({ symbol: 'AAPL', date: '2025-01-10', quantity: 10, price: 100, currency: 'USD', assetType: 'us-stock', txType: 'BUY' }),
      makeTx({ symbol: 'PVDSP500', date: '2025-01-10', quantity: 500, price: 12, currency: 'THB', assetType: 'provident-fund', txType: 'BUY' }),
    ];

    const { openSummaries, transactionSummaries } = processLocalTransactionsFifo(txs);
    expect(openSummaries.some((s) => s.symbol === 'AAPL')).toBe(true);
    expect(openSummaries.some((s) => s.symbol === 'PVDSP500')).toBe(true);
    expect(transactionSummaries.map((s) => s.symbol)).toEqual(['AAPL']);
  });
});
