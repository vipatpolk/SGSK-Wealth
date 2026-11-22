import type { ClosedPortfolioPosition, PortfolioPosition } from '@sgsk-wealth/contracts';
import { getAssetType } from './format.utils';

export type HoldingsSortDirection = 'asc' | 'desc';

export function filterAndSortOpenPositions(
  positions: readonly PortfolioPosition[],
  rawNameBySymbol: ReadonlyMap<string, string>,
  searchQuery: string,
  sortField: string,
  sortDirection: HoldingsSortDirection,
): PortfolioPosition[] {
  const query = searchQuery.trim().toUpperCase();
  const list = query
    ? positions.filter(
        (s) =>
          s.symbol.toUpperCase().includes(query) ||
          s.displaySymbol.toUpperCase().includes(query) ||
          s.name.toUpperCase().includes(query) ||
          (s.nameTh || '').toUpperCase().includes(query) ||
          (rawNameBySymbol.get(s.symbol) || '').toUpperCase().includes(query),
      )
    : [...positions];

  const dir = sortDirection === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    if (sortField === 'symbol') {
      const va = a.symbol;
      const vb = b.symbol;
      return dir * (va < vb ? -1 : va > vb ? 1 : 0);
    }

    let va = a.totalCost;
    let vb = b.totalCost;
    switch (sortField) {
      case 'totalCost':
        va = a.totalCost;
        vb = b.totalCost;
        break;
      case 'avgCost':
        va = a.averageCost;
        vb = b.averageCost;
        break;
      case 'holdingValue':
        va = a.holdingValue;
        vb = b.holdingValue;
        break;
      case 'pl':
        va = a.unrealizedPLPercent;
        vb = b.unrealizedPLPercent;
        break;
      default:
        va = a.totalCost;
        vb = b.totalCost;
        break;
    }

    return dir * (va - vb);
  });

  return list;
}

export function filterAndSortClosedPositions(
  positions: readonly ClosedPortfolioPosition[],
  rawNameBySymbol: ReadonlyMap<string, string>,
  isClosedTab: boolean,
  selectedAssetType: string,
  searchQuery: string,
  sortField: string,
  sortDirection: HoldingsSortDirection,
): ClosedPortfolioPosition[] {
  let list = [...positions];

  if (isClosedTab && selectedAssetType !== 'all') {
    list = list.filter((s) => getAssetType(s.assetType, s.symbol) === selectedAssetType);
  }

  const query = searchQuery.trim().toUpperCase();
  if (query) {
    list = list.filter(
      (s) =>
        s.symbol.toUpperCase().includes(query) ||
        s.displaySymbol.toUpperCase().includes(query) ||
        s.name.toUpperCase().includes(query) ||
        (s.nameTh || '').toUpperCase().includes(query) ||
        (rawNameBySymbol.get(s.symbol) || '').toUpperCase().includes(query),
    );
  }

  const dir = sortDirection === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    if (sortField === 'symbol') {
      const va = a.symbol;
      const vb = b.symbol;
      return dir * (va < vb ? -1 : va > vb ? 1 : 0);
    }

    let va = a.realizedPL;
    let vb = b.realizedPL;
    switch (sortField) {
      case 'totalCost':
        va = a.totalCost;
        vb = b.totalCost;
        break;
      case 'avgCost':
        va = a.averageBuyPrice;
        vb = b.averageBuyPrice;
        break;
      case 'holdingValue':
      case 'totalProceeds':
        va = a.totalProceeds;
        vb = b.totalProceeds;
        break;
      case 'realizedPL':
        va = a.realizedPL;
        vb = b.realizedPL;
        break;
      case 'pl':
        va = a.realizedPLPercent;
        vb = b.realizedPLPercent;
        break;
      case 'totalShares':
      case 'closedShares':
        va = a.closedShares;
        vb = b.closedShares;
        break;
      default:
        va = a.realizedPL;
        vb = b.realizedPL;
        break;
    }

    return dir * (va - vb);
  });

  return list;
}
