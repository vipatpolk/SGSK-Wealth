import { describe, expect, it } from 'vitest';
import type { LocalTransaction } from '@sgsk-wealth/contracts';
import { convertCurrency } from '../format.utils';
import {
  parseLocalTransactionsCsv,
  processLocalTransactionsFifo,
} from '../local-fifo.utils';
import rawParityFixtures from '../../../../fixtures/accounting/fifo_scenarios.json';

interface ParityFixtureRoot {
  schemaVersion: string;
  fifoScenarios: {
    id: string;
    description: string;
    exchangeRateUsdToThb: number;
    transactions: {
      symbol: string;
      date: string;
      quantity: number;
      price: number;
      fee?: number;
      currency: 'USD' | 'THB';
      assetType: string;
      txType?: string;
      exchangeFrom?: string;
      exchangeTo?: string;
    }[];
    expected: {
      tolerance: number;
      totalCostInThb?: number;
      totalCostInUsd?: number;
      bySymbol: {
        symbol: string;
        buyCount: number;
        sellCount: number;
        exchangeCount: number;
        transactionCount: number;
        netShares: number;
        realizedPL: number;
        openLots: {
          purchaseDate: string;
          quantity: number;
          costBasis: number;
          totalCost: number;
        }[];
        closedLots: {
          purchaseDate: string;
          closeDate: string;
          quantity: number;
          costBasis: number;
          sellPrice: number;
          realizedPL: number;
        }[];
      }[];
    };
  }[];
  csvScenarios: {
    id: string;
    defaultAssetType: string;
    csvText: string;
    expectedSymbols: string[];
  }[];
}

const fixtures = rawParityFixtures as unknown as ParityFixtureRoot;

describe('Accounting Parity (Rust <-> TypeScript shared fixtures)', () => {
  it('loads all 12 mandatory accounting scenarios', () => {
    expect(fixtures.fifoScenarios.length).toBe(11);
    expect(fixtures.csvScenarios.length).toBe(1);
  });

  for (const scenario of fixtures.fifoScenarios) {
    it(`[FIFO] ${scenario.id}: ${scenario.description}`, () => {
      const localTxs: LocalTransaction[] = scenario.transactions.map((tx, idx) => ({
        id: `${scenario.id}-${idx + 1}`,
        symbol: tx.symbol,
        date: tx.date,
        quantity: tx.quantity,
        price: tx.price,
        fee: tx.fee,
        currency: tx.currency,
        assetType: tx.assetType,
        txType: tx.txType,
        exchangeFrom: tx.exchangeFrom,
        exchangeTo: tx.exchangeTo,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }));

      const { openSummaries, closedSummaries, transactionSummaries } =
        processLocalTransactionsFifo(localTxs);
      const tol = scenario.expected.tolerance;

      for (const expSym of scenario.expected.bySymbol) {
        const txSum = transactionSummaries.find((s) => s.symbol === expSym.symbol);
        expect(txSum, `missing transaction summary for ${expSym.symbol}`).toBeDefined();
        expect(txSum!.buyCount).toBe(expSym.buyCount);
        expect(txSum!.sellCount).toBe(expSym.sellCount);
        expect(txSum!.exchangeCount).toBe(expSym.exchangeCount);
        expect(txSum!.totalTransactions).toBe(expSym.transactionCount);
        expect(Math.abs(txSum!.netShares - expSym.netShares)).toBeLessThanOrEqual(tol);
        expect(Math.abs(txSum!.realizedPL - expSym.realizedPL)).toBeLessThanOrEqual(tol);

        const actualOpenLots =
          openSummaries.find((s) => s.symbol === expSym.symbol)?.lots ?? [];
        expect(actualOpenLots.length).toBe(expSym.openLots.length);
        actualOpenLots.forEach((lot, i) => {
          const expectedLot = expSym.openLots[i];
          expect(lot.purchaseDate).toBe(expectedLot.purchaseDate);
          expect(Math.abs(lot.quantity - expectedLot.quantity)).toBeLessThanOrEqual(tol);
          expect(Math.abs(lot.costBasis - expectedLot.costBasis)).toBeLessThanOrEqual(tol);
          expect(Math.abs(lot.totalCost - expectedLot.totalCost)).toBeLessThanOrEqual(tol);
        });

        const actualClosedLots =
          closedSummaries.find((s) => s.symbol === expSym.symbol)?.lots ?? [];
        expect(actualClosedLots.length).toBe(expSym.closedLots.length);
        actualClosedLots.forEach((lot, i) => {
          const expectedLot = expSym.closedLots[i];
          expect(lot.purchaseDate).toBe(expectedLot.purchaseDate);
          expect(lot.closeDate).toBe(expectedLot.closeDate);
          expect(Math.abs(lot.quantity - expectedLot.quantity)).toBeLessThanOrEqual(tol);
          expect(Math.abs(lot.costBasis - expectedLot.costBasis)).toBeLessThanOrEqual(tol);
          expect(Math.abs(lot.sellPrice - expectedLot.sellPrice)).toBeLessThanOrEqual(tol);
          expect(Math.abs(lot.realizedPL - expectedLot.realizedPL)).toBeLessThanOrEqual(tol);
        });
      }

      if (scenario.expected.totalCostInThb !== undefined) {
        const totalThb = openSummaries.reduce(
          (sum, s) =>
            sum +
            convertCurrency(s.totalCost, s.currency, 'THB', scenario.exchangeRateUsdToThb),
          0
        );
        expect(Math.abs(totalThb - scenario.expected.totalCostInThb)).toBeLessThanOrEqual(tol);
      }

      if (scenario.expected.totalCostInUsd !== undefined) {
        const totalUsd = openSummaries.reduce(
          (sum, s) =>
            sum +
            convertCurrency(s.totalCost, s.currency, 'USD', scenario.exchangeRateUsdToThb),
          0
        );
        expect(Math.abs(totalUsd - scenario.expected.totalCostInUsd)).toBeLessThanOrEqual(tol);
      }
    });
  }

  for (const csvCase of fixtures.csvScenarios) {
    it(`[CSV] ${csvCase.id}`, () => {
      const parsed = parseLocalTransactionsCsv(csvCase.csvText, csvCase.defaultAssetType);
      expect(parsed.map((t) => t.symbol)).toEqual(csvCase.expectedSymbols);
    });
  }
});
