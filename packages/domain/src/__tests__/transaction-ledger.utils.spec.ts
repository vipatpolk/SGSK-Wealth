import { describe, it, expect } from 'vitest';
import type { SymbolTransaction } from '@sgsk-wealth/contracts';
import {
  buildDisplayedPageNumbers,
  computeTransactionTypeCounts,
  filterAndSortTransactions,
  filterTransactionsByDateRange,
  isExchangeTransaction,
} from '../transaction-ledger.utils';

function makeTx(overrides: Partial<SymbolTransaction>): SymbolTransaction {
  return {
    id: 'tx-1',
    symbol: 'AAPL',
    date: '2026-01-10',
    type: 'BUY',
    quantity: 10,
    rawQuantity: 10,
    price: 100,
    totalAmount: 1000,
    currency: 'USD',
    assetType: 'us-stock',
    runningShares: 10,
    runningTotalCost: 1000,
    runningAverageCost: 100,
    ...overrides,
  };
}

describe('transaction-ledger.utils', () => {
  it('filters by date range, transaction type, computes counts, and sorts by date', () => {
    const txs: SymbolTransaction[] = [
      makeTx({ id: '1', date: '2026-01-05', type: 'BUY' }),
      makeTx({ id: '2', date: '2026-02-10', type: 'SELL' }),
      makeTx({ id: '3', date: '2026-03-15', type: 'EXCHANGE_OUT', exchangeFrom: 'FA', exchangeTo: 'FB' }),
      makeTx({ id: '4', date: '2026-04-01', type: 'BUY' }),
    ];

    expect(isExchangeTransaction(txs[2])).toBe(true);
    expect(isExchangeTransaction(txs[0])).toBe(false);

    const ranged = filterTransactionsByDateRange(txs, '2026-01-10', '2026-03-31');
    expect(ranged.map((t) => t.id)).toEqual(['2', '3']);

    expect(computeTransactionTypeCounts(txs)).toEqual({
      all: 4,
      buy: 2,
      sell: 1,
      exchange: 1,
    });

    const buysDesc = filterAndSortTransactions(txs, 'buy', 'desc');
    expect(buysDesc.map((t) => t.id)).toEqual(['4', '1']);

    const exchangesAsc = filterAndSortTransactions(txs, 'exchange', 'asc');
    expect(exchangesAsc.map((t) => t.id)).toEqual(['3']);
  });

  it('builds compact pagination ranges with ellipsis across boundaries', () => {
    expect(buildDisplayedPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildDisplayedPageNumbers(2, 10)).toEqual([1, 2, 3, 4, 5, '...', 10]);
    expect(buildDisplayedPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(buildDisplayedPageNumbers(9, 10)).toEqual([1, '...', 6, 7, 8, 9, 10]);
  });
});
