import { describe, it, expect } from 'vitest';
import type { ClosedPortfolioPosition, PortfolioPosition } from '@sgsk-wealth/contracts';
import { filterAndSortClosedPositions, filterAndSortOpenPositions } from '../holdings-filter.utils';

function makeOpenPos(overrides: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    symbol: 'AAPL',
    displaySymbol: 'AAPL',
    name: 'Apple Inc.',
    nameTh: '',
    assetType: 'us-stock',
    assetTypeLabel: 'US Stocks',
    totalShares: 10,
    totalCost: 1000,
    averageCost: 100,
    currentPrice: 120,
    holdingValue: 1200,
    unrealizedPL: 200,
    unrealizedPLPercent: 20,
    currency: 'USD',
    originalCurrency: 'USD',
    hasPrice: true,
    lots: [],
    ...overrides,
  };
}

function makeClosedPos(overrides: Partial<ClosedPortfolioPosition>): ClosedPortfolioPosition {
  return {
    symbol: 'MSFT',
    displaySymbol: 'MSFT',
    name: 'Microsoft',
    nameTh: '',
    assetType: 'us-stock',
    assetTypeLabel: 'US Stocks',
    totalShares: 5,
    closedShares: 5,
    totalCost: 1000,
    totalProceeds: 1300,
    realizedPL: 300,
    realizedPLPercent: 30,
    averageBuyPrice: 200,
    averageSellPrice: 260,
    currency: 'USD',
    originalCurrency: 'USD',
    lots: [],
    ...overrides,
  };
}

describe('holdings-filter.utils', () => {
  it('filters open positions by localized/raw name, display symbol, and sorts by pl/symbol', () => {
    const positions = [
      makeOpenPos({ symbol: 'PTT.BK', displaySymbol: 'PTT', name: 'ปตท.', nameTh: 'ปตท.', totalCost: 3000, unrealizedPLPercent: 10 }),
      makeOpenPos({ symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.', totalCost: 1000, unrealizedPLPercent: 35 }),
      makeOpenPos({ symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA Corp.', totalCost: 2000, unrealizedPLPercent: -5 }),
    ];
    const rawNames = new Map([['PTT.BK', 'PTT PCL']]);

    // Search via raw English name when localized name is Thai
    const matchedByRaw = filterAndSortOpenPositions(positions, rawNames, 'ptt pcl', 'totalCost', 'desc');
    expect(matchedByRaw.map((p) => p.symbol)).toEqual(['PTT.BK']);

    // Sort by PL descending
    const sortedByPl = filterAndSortOpenPositions(positions, rawNames, '', 'pl', 'desc');
    expect(sortedByPl.map((p) => p.symbol)).toEqual(['AAPL', 'PTT.BK', 'NVDA']);

    // Sort by symbol ascending
    const sortedBySym = filterAndSortOpenPositions(positions, rawNames, '', 'symbol', 'asc');
    expect(sortedBySym.map((p) => p.symbol)).toEqual(['AAPL', 'NVDA', 'PTT.BK']);
  });

  it('filters closed positions by asset class only on closed tab and sorts accurately', () => {
    const closed = [
      makeClosedPos({ symbol: 'AAPL', assetType: 'us-stock', realizedPL: 100, averageBuyPrice: 120 }),
      makeClosedPos({ symbol: 'AOT.BK', displaySymbol: 'AOT', assetType: 'thai-stock', realizedPL: 500, averageBuyPrice: 60 }),
    ];
    const rawNames = new Map<string, string>();

    const filteredClosedTab = filterAndSortClosedPositions(
      closed,
      rawNames,
      true,
      'thai-stock',
      '',
      'realizedPL',
      'desc',
    );
    expect(filteredClosedTab.map((c) => c.symbol)).toEqual(['AOT.BK']);

    // On non-closed tab, selectedClosedAssetType does not hide rows
    const unfilteredOnAllTab = filterAndSortClosedPositions(
      closed,
      rawNames,
      false,
      'thai-stock',
      '',
      'avgCost',
      'asc',
    );
    expect(unfilteredOnAllTab.map((c) => c.symbol)).toEqual(['AOT.BK', 'AAPL']);
  });
});
