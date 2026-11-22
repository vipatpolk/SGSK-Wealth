import type { SymbolTransaction } from '@sgsk-wealth/contracts';

export type TxTypeFilter = 'all' | 'buy' | 'sell' | 'exchange';
export type TxSortOrder = 'desc' | 'asc';

export interface TransactionTypeCounts {
  all: number;
  buy: number;
  sell: number;
  exchange: number;
}

export function isExchangeTransaction(tx: SymbolTransaction): boolean {
  return (
    tx.type === 'EXCHANGE' ||
    tx.type === 'EXCHANGE_IN' ||
    tx.type === 'EXCHANGE_OUT' ||
    !!tx.exchangeFrom ||
    !!tx.exchangeTo
  );
}

export function filterTransactionsByDateRange(
  txs: readonly SymbolTransaction[],
  startDate: string,
  endDate: string,
): SymbolTransaction[] {
  const start = startDate.trim();
  const end = endDate.trim();
  let result = [...txs];
  if (start) {
    result = result.filter((t) => (t.date ? t.date >= start : true));
  }
  if (end) {
    result = result.filter((t) => (t.date ? t.date <= end : true));
  }
  return result;
}

export function filterAndSortTransactions(
  txs: readonly SymbolTransaction[],
  typeFilter: TxTypeFilter,
  sortOrder: TxSortOrder,
): SymbolTransaction[] {
  let result = [...txs];

  if (typeFilter === 'buy') {
    result = result.filter((t) => t.type === 'BUY');
  } else if (typeFilter === 'sell') {
    result = result.filter((t) => t.type === 'SELL');
  } else if (typeFilter === 'exchange') {
    result = result.filter((t) => isExchangeTransaction(t));
  }

  result.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  return result;
}

export function computeTransactionTypeCounts(
  txs: readonly SymbolTransaction[],
): TransactionTypeCounts {
  let buy = 0;
  let sell = 0;
  let exchange = 0;

  for (const tx of txs) {
    if (tx.type === 'BUY') buy += 1;
    if (tx.type === 'SELL') sell += 1;
    if (isExchangeTransaction(tx)) exchange += 1;
  }

  return {
    all: txs.length,
    buy,
    sell,
    exchange,
  };
}

export function buildDisplayedPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}
