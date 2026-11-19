import { describe, expect, it } from 'vitest';
import { LocalTransaction } from '@shared/models/local-portfolio.model';
import { PriceData } from '@shared/services/price.service';
import {
  buildLocalDividendResponse,
  buildLocalHoldingsResponse,
  parseLocalTransactionsCsv,
  processLocalTransactionsFifo,
} from '@shared/utils/local-fifo.utils';

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
    // Remaining lot: 5 shares from Feb lot @ (120*10 + 10)/10 = 121/share => totalCost 605
    expect(open.averageCost).toBeCloseTo(121, 4);
    expect(open.totalCost).toBeCloseTo(605, 4);

    expect(fifo.closedSummaries.length).toBe(1);
    const closed = fifo.closedSummaries[0];
    expect(closed.closedShares).toBeCloseTo(15, 6);
    // Sold 10*101 + 5*121 = 1615 cost; net proceeds = 15*150 - 15 = 2235; realizedPL = 620
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
    // AAPL: cost 1800 USD * 35 = 63000 THB, value 2000 * 35 = 70000 THB
    // PTT: cost 3000 THB, value 3500 THB
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
    // AAPL gross = 10 USD (WHT 1.5 USD, net 8.5 USD)
    // PTT gross = 200 THB / 35 = 5.7143 USD (WHT 10% = 0.5714 USD, net 5.1429 USD)
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
});
