import {
  DEFAULT_USER_SETTINGS,
  type AnnualDividendSummary,
  type AppLang,
  type AssetClassPerformance,
  type AssetTypeDividendSummary,
  type ClosedPortfolioPosition,
  type ClosedShareLot,
  type CurrencyExposure,
  type DividendRecord,
  type HoldingConcentration,
  type LocalTransaction,
  type MonthlyDividendSummary,
  type PortfolioAllocationResponse,
  type PortfolioDividendResponse,
  type PortfolioHoldingLot,
  type PortfolioHoldingsResponse,
  type PortfolioPerformanceResponse,
  type PortfolioPosition,
  type PortfolioSummary,
  type PriceData,
  type RebalanceRecommendation,
  type ShareLot,
  type SymbolDividendSummary,
  type SymbolPerformance,
  type SymbolTransaction,
  type SymbolTransactionSummary,
  type TargetAllocation,
} from '@sgsk-wealth/contracts';
import {
  convertCurrency,
  displaySymbol,
  getAssetType,
  getAssetTypeLabel,
  getSymbolName,
  normalizeAssetType,
} from './format.utils';

const EPSILON = 1e-7;
const DEFAULT_FX_RATE = 34.5;

const WHT_RATES: Record<string, number> = {
  'thai-stock': 0.1,
  'mutual-fund': 0.1,
  'us-stock': 0.15,
  bond: 0.15,
};

export const SAMPLE_LOCAL_TRANSACTIONS: Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    symbol: 'AAPL',
    date: '2025-01-15',
    quantity: 10,
    price: 185,
    currency: 'USD',
    assetType: 'us-stock',
    txType: 'BUY',
    fee: 2.5,
    note: 'Core US tech allocation',
  },
  {
    symbol: 'NVDA',
    date: '2025-03-10',
    quantity: 8,
    price: 118,
    currency: 'USD',
    assetType: 'us-stock',
    txType: 'BUY',
    fee: 2.0,
  },
  {
    symbol: 'PTT.BK',
    date: '2025-02-05',
    quantity: 500,
    price: 32.5,
    currency: 'THB',
    assetType: 'thai-stock',
    txType: 'BUY',
    fee: 26,
  },
  {
    symbol: 'BTC.CRYPTO',
    date: '2025-04-01',
    quantity: 0.025,
    price: 2950000,
    currency: 'THB',
    assetType: 'crypto',
    txType: 'BUY',
    fee: 185,
  },
  {
    symbol: 'MSFT',
    date: '2024-09-01',
    quantity: 5,
    price: 410,
    currency: 'USD',
    assetType: 'us-stock',
    txType: 'BUY',
    fee: 2,
  },
  {
    symbol: 'MSFT',
    date: '2025-02-20',
    quantity: -5,
    price: 448,
    currency: 'USD',
    assetType: 'us-stock',
    txType: 'SELL',
    fee: 2,
  },
  {
    symbol: 'PTT.BK',
    date: '2025-04-25',
    quantity: 500,
    price: 1.3,
    currency: 'THB',
    assetType: 'thai-stock',
    txType: 'DIVIDEND',
  },
  {
    symbol: 'AAPL',
    date: '2025-05-15',
    quantity: 10,
    price: 0.26,
    currency: 'USD',
    assetType: 'us-stock',
    txType: 'DIVIDEND',
  },
];

function parseCsvRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\r') {
      if (cleanText[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
}

export function parseLocalTransactionsCsv(
  csvText: string,
  defaultAssetType = 'us-stock'
): Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const findIdx = (...names: string[]): number => {
    const exact = header.findIndex((h) => names.some((n) => h === n));
    if (exact !== -1) return exact;
    return header.findIndex((h) => names.some((n) => h.includes(n)));
  };

  const symIdx = Math.max(0, findIdx('symbol', 'ticker'));
  const dateIdx = Math.max(1, findIdx('date'));
  const qtyIdx = Math.max(2, findIdx('quantity', 'qty', 'shares', 'units'));
  const priceIdx = Math.max(3, findIdx('price'));
  const currIdx = Math.max(4, findIdx('currency', 'curr'));
  const feeIdx = findIdx('fee', 'commission', 'comm', 'brokerage');
  const assetIdx = findIdx('assettype', 'asset type', 'asset');
  const txTypeIdx = findIdx('transaction type', 'tx_type', 'txtype', 'action', 'type');
  const exFromIdx = findIdx('exchange from', 'exchange_from', 'switch from', 'from');
  const exToIdx = findIdx('exchange to', 'exchange_to', 'switch to', 'to');
  const noteIdx = findIdx('note', 'memo', 'remark');

  const out: Omit<LocalTransaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 5) continue;

    const symbol = (cols[symIdx] || '').trim().toUpperCase();
    const date = (cols[dateIdx] || '').trim();
    const quantity = Number((cols[qtyIdx] || '').replace(/,/g, ''));
    const price = Number((cols[priceIdx] || '').replace(/,/g, ''));

    if (
      !symbol ||
      !date ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(price) ||
      quantity === 0
    ) {
      continue;
    }

    const currencyRaw = (cols[currIdx] || 'USD').trim().toUpperCase();
    const currency = currencyRaw === 'THB' ? 'THB' : 'USD';
    const feeVal =
      feeIdx !== -1 && cols[feeIdx] ? Number(cols[feeIdx].replace(/,/g, '')) : undefined;
    const rawAsset = assetIdx !== -1 ? cols[assetIdx] : '';
    const parsedAsset = rawAsset ? normalizeAssetType(rawAsset) : null;
    const assetType = parsedAsset || getAssetType(defaultAssetType, symbol);
    const rawTxType =
      txTypeIdx !== -1 && cols[txTypeIdx] ? cols[txTypeIdx].trim().toUpperCase() : undefined;
    const exchangeFrom = exFromIdx !== -1 && cols[exFromIdx] ? cols[exFromIdx].trim() : undefined;
    const exchangeTo = exToIdx !== -1 && cols[exToIdx] ? cols[exToIdx].trim() : undefined;
    const note = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx].trim() : undefined;

    out.push({
      symbol,
      date,
      quantity,
      price,
      currency,
      assetType,
      txType: rawTxType || (quantity < 0 ? 'SELL' : 'BUY'),
      fee: feeVal !== undefined && !Number.isNaN(feeVal) ? feeVal : undefined,
      exchangeFrom,
      exchangeTo,
      note,
    });
  }

  return out;
}

function parseCalendarDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseSortDate(dateStr: string): string {
  const s = (dateStr || '').trim();
  if (!s) return '';

  // Matches Rust ShareLotService::parse_sort_date order: %Y-%m-%d, %Y/%m/%d, %d/%m/%Y, %d.%m.%Y, %m/%d/%Y
  const ymd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (ymd) {
    const parsed = parseCalendarDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
    if (parsed) return parsed;
  }

  const dmySlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (dmySlash) {
    const parsedDmy = parseCalendarDate(Number(dmySlash[3]), Number(dmySlash[2]), Number(dmySlash[1]));
    if (parsedDmy) return parsedDmy;
    const parsedMdy = parseCalendarDate(Number(dmySlash[3]), Number(dmySlash[1]), Number(dmySlash[2]));
    if (parsedMdy) return parsedMdy;
  }

  const dmyDot = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (dmyDot) {
    const parsed = parseCalendarDate(Number(dmyDot[3]), Number(dmyDot[2]), Number(dmyDot[1]));
    if (parsed) return parsed;
  }

  return s;
}

function isInflowTx(tx: LocalTransaction): boolean {
  const tt = (tx.txType || '').toUpperCase();
  if (tt.includes('DIVIDEND') || tt === 'DIV') return false;
  if (
    tx.exchangeTo ||
    tt.includes('SELL') ||
    tt.includes('OUT') ||
    tt.includes('EX-OUT') ||
    tt.includes('SW-OUT')
  ) {
    return false;
  }
  if (
    tx.exchangeFrom ||
    tt.includes('BUY') ||
    tt.includes('IN') ||
    tt.includes('EX-IN') ||
    tt.includes('SW-IN')
  ) {
    return true;
  }
  return tx.quantity >= 0;
}

function classifyTx(
  tx: LocalTransaction
): { type: SymbolTransaction['type']; isExchange: boolean } {
  const tt = (tx.txType || '').toUpperCase();
  if (tt.includes('DIVIDEND') || tt === 'DIV' || tt.includes('INCOME') || tt.includes('DISTRIBUTION')) {
    return { type: 'DIVIDEND', isExchange: false };
  }
  if (
    tx.exchangeTo ||
    ['EXCHANGE_OUT', 'EXCHANGE OUT', 'EXCHNAGE OUT', 'SWITCH_OUT', 'SWITCH OUT', 'EX-OUT', 'SW-OUT'].some((kw) =>
      tt.includes(kw)
    )
  ) {
    return { type: 'EXCHANGE_OUT', isExchange: true };
  }
  if (
    tx.exchangeFrom ||
    ['EXCHANGE_IN', 'EXCHANGE IN', 'EXCHNAGE IN', 'SWITCH_IN', 'SWITCH IN', 'EX-IN', 'SW-IN'].some((kw) =>
      tt.includes(kw)
    )
  ) {
    return { type: 'EXCHANGE_IN', isExchange: true };
  }
  if (tt.includes('SELL') || tx.quantity < 0) {
    return { type: 'SELL', isExchange: false };
  }
  return { type: 'BUY', isExchange: false };
}

interface InternalOpenSummary {
  symbol: string;
  assetType: string;
  currency: string;
  totalShares: number;
  totalCost: number;
  averageCost: number;
  lots: ShareLot[];
  employeeShares?: number;
  employerShares?: number;
  employeeContribution?: number;
  employeeEarnings?: number;
  employerMatching?: number;
  employerEarnings?: number;
  pvdFundName?: string;
}

interface InternalClosedSummary {
  symbol: string;
  assetType: string;
  currency: string;
  closedShares: number;
  totalCost: number;
  totalProceeds: number;
  realizedPL: number;
  realizedPLPercent: number;
  averageBuyPrice: number;
  averageSellPrice: number;
  lots: ClosedShareLot[];
}

export function processLocalTransactionsFifo(transactions: LocalTransaction[]): {
  openSummaries: InternalOpenSummary[];
  closedSummaries: InternalClosedSummary[];
  transactionSummaries: SymbolTransactionSummary[];
} {
  const bySymbol = new Map<string, LocalTransaction[]>();
  for (const tx of transactions) {
    const key = tx.symbol.trim().toUpperCase();
    const list = bySymbol.get(key) || [];
    list.push({ ...tx, symbol: key });
    bySymbol.set(key, list);
  }

  const openSummaries: InternalOpenSummary[] = [];
  const closedSummaries: InternalClosedSummary[] = [];
  const transactionSummaries: SymbolTransactionSummary[] = [];

  for (const [symbol, list] of bySymbol.entries()) {
    const sorted = [...list].sort((a, b) => {
      const dateCmp = parseSortDate(a.date).localeCompare(parseSortDate(b.date));
      if (dateCmp !== 0) return dateCmp;
      return (isInflowTx(a) ? 0 : 1) - (isInflowTx(b) ? 0 : 1);
    });

    const currency = sorted[0].currency || 'USD';
    const assetType = getAssetType(sorted[0].assetType, symbol);

    const openLots: ShareLot[] = [];
    const closedLots: ClosedShareLot[] = [];
    const processedTx: SymbolTransaction[] = [];

    let runningShares = 0;
    let runningTotalCost = 0;
    let totalBuyShares = 0;
    let totalSellShares = 0;
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let buyCount = 0;
    let sellCount = 0;
    let exchangeCount = 0;
    let totalRealizedPL = 0;
    let totalRealizedCostBasis = 0;

    sorted.forEach((tx, idx) => {
      const qty = Math.abs(tx.quantity);
      const price = tx.price;
      const fee = tx.fee ?? 0;
      const txId = tx.id || `${symbol}-${tx.date}-${idx + 1}`;
      const { type: txType, isExchange } = classifyTx(tx);
      if (isExchange) exchangeCount++;

      if (txType === 'DIVIDEND') {
        const runningAvg = runningShares > 0 ? runningTotalCost / runningShares : 0;
        processedTx.push({
          id: txId,
          symbol,
          date: tx.date,
          type: 'DIVIDEND',
          quantity: qty,
          rawQuantity: tx.quantity,
          price,
          totalAmount: qty * price,
          currency: tx.currency,
          assetType: tx.assetType,
          runningShares,
          runningTotalCost,
          runningAverageCost: runningAvg,
          exchangeFrom: tx.exchangeFrom,
          exchangeTo: tx.exchangeTo,
        });
        return;
      }

      if (txType === 'BUY' || txType === 'EXCHANGE_IN') {
        if (!isExchange) buyCount++;
        const totalAmount = qty * price + fee;
        const lotCostBasis = qty > 0 ? totalAmount / qty : price;
        totalBuyShares += qty;
        totalBuyAmount += totalAmount;
        runningShares += qty;
        runningTotalCost += totalAmount;
        const runningAvg = runningShares > 0 ? runningTotalCost / runningShares : 0;

        openLots.push({
          symbol,
          purchaseDate: tx.date,
          quantity: qty,
          costBasis: lotCostBasis,
          totalCost: totalAmount,
          assetType,
          note: tx.note,
        });

        processedTx.push({
          id: txId,
          symbol,
          date: tx.date,
          type: txType,
          quantity: qty,
          rawQuantity: tx.quantity,
          price,
          totalAmount,
          currency: tx.currency,
          assetType,
          runningShares,
          runningTotalCost,
          runningAverageCost: runningAvg,
          exchangeFrom: tx.exchangeFrom,
          exchangeTo: tx.exchangeTo,
        });
      } else {
        if (!isExchange) sellCount++;
        const grossProceeds = qty * price;
        const netProceeds = Math.max(0, grossProceeds - fee);
        const effectiveSellPrice = qty > 0 ? netProceeds / qty : price;
        totalSellShares += qty;
        totalSellAmount += netProceeds;

        let remainingToSell = qty;
        let matchedCost = 0;
        let matchedProceeds = 0;
        let matchedQtyTotal = 0;

        for (const lot of openLots) {
          if (remainingToSell <= EPSILON) break;
          if (lot.quantity <= EPSILON) continue;

          const matchedQty = Math.min(lot.quantity, remainingToSell);
          const buyCost = matchedQty * lot.costBasis;
          const sellProceeds = matchedQty * effectiveSellPrice;
          const lotRealizedPL = sellProceeds - buyCost;
          const lotRealizedPLPct = buyCost > 0 ? (lotRealizedPL / buyCost) * 100 : 0;

          closedLots.push({
            symbol,
            purchaseDate: lot.purchaseDate,
            closeDate: tx.date,
            quantity: matchedQty,
            costBasis: lot.costBasis,
            sellPrice: effectiveSellPrice,
            totalCost: buyCost,
            totalProceeds: sellProceeds,
            realizedPL: lotRealizedPL,
            realizedPLPercent: lotRealizedPLPct,
            currency: tx.currency,
            assetType,
          });

          lot.quantity -= matchedQty;
          lot.totalCost = lot.quantity * lot.costBasis;
          remainingToSell -= matchedQty;
          matchedCost += buyCost;
          matchedProceeds += sellProceeds;
          matchedQtyTotal += matchedQty;
        }

        let txRealizedPL: number | undefined;
        let txRealizedPLPct: number | undefined;
        if (matchedQtyTotal > EPSILON) {
          txRealizedPL = matchedProceeds - matchedCost;
          txRealizedPLPct = matchedCost > 0 ? (txRealizedPL / matchedCost) * 100 : 0;
          totalRealizedPL += txRealizedPL;
          totalRealizedCostBasis += matchedCost;
        }

        runningShares = Math.max(0, runningShares - qty);
        runningTotalCost = Math.max(0, runningTotalCost - matchedCost);
        if (runningShares <= EPSILON) {
          runningShares = 0;
          runningTotalCost = 0;
        }
        const runningAvg = runningShares > 0 ? runningTotalCost / runningShares : 0;

        processedTx.push({
          id: txId,
          symbol,
          date: tx.date,
          type: txType,
          quantity: qty,
          rawQuantity: tx.quantity,
          price,
          totalAmount: netProceeds,
          currency: tx.currency,
          assetType,
          runningShares,
          runningTotalCost,
          runningAverageCost: runningAvg,
          realizedPL: txRealizedPL,
          realizedPLPercent: txRealizedPLPct,
          exchangeFrom: tx.exchangeFrom,
          exchangeTo: tx.exchangeTo,
        });
      }
    });

    const remainingLots = openLots.filter((lot) => lot.quantity > EPSILON);
    if (remainingLots.length > 0) {
      const totalShares = remainingLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalCost = remainingLots.reduce((sum, lot) => sum + lot.totalCost, 0);
      const avgCost = totalShares > 0 ? totalCost / totalShares : 0;

      const empContrib = sorted.reduce((acc, t) => acc + (t.employeeContribution ?? 0), 0);
      const empEarnings = sorted.reduce((acc, t) => acc + (t.employeeEarnings ?? 0), 0);
      const emprMatch = sorted.reduce((acc, t) => acc + (t.employerMatching ?? 0), 0);
      const emprEarnings = sorted.reduce((acc, t) => acc + (t.employerEarnings ?? 0), 0);
      const pvdFundName = sorted.find((t) => t.pvdFundName)?.pvdFundName;

      openSummaries.push({
        symbol,
        assetType,
        currency,
        totalShares,
        totalCost,
        averageCost: avgCost,
        lots: remainingLots,
        employeeContribution: empContrib > 0 ? empContrib : undefined,
        employeeEarnings: empEarnings !== 0 ? empEarnings : undefined,
        employerMatching: emprMatch > 0 ? emprMatch : undefined,
        employerEarnings: emprEarnings !== 0 ? emprEarnings : undefined,
        pvdFundName,
      });
    }

    if (closedLots.length > 0) {
      const closedShares = closedLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalCost = closedLots.reduce((sum, lot) => sum + lot.totalCost, 0);
      const totalProceeds = closedLots.reduce((sum, lot) => sum + lot.totalProceeds, 0);
      const realizedPL = totalProceeds - totalCost;
      const realizedPLPercent = totalCost > 0 ? (realizedPL / totalCost) * 100 : 0;

      closedSummaries.push({
        symbol,
        assetType,
        currency,
        closedShares,
        totalCost,
        totalProceeds,
        realizedPL,
        realizedPLPercent,
        averageBuyPrice: closedShares > 0 ? totalCost / closedShares : 0,
        averageSellPrice: closedShares > 0 ? totalProceeds / closedShares : 0,
        lots: closedLots,
      });
    }

    const avgBuy = totalBuyShares > 0 ? totalBuyAmount / totalBuyShares : 0;
    const avgSell = totalSellShares > 0 ? totalSellAmount / totalSellShares : 0;
    const overallRealizedPct =
      totalRealizedCostBasis > 0 ? (totalRealizedPL / totalRealizedCostBasis) * 100 : 0;

    transactionSummaries.push({
      symbol,
      assetType,
      currency,
      totalTransactions: sorted.length,
      buyCount,
      sellCount,
      exchangeCount,
      totalBuyShares,
      totalSellShares,
      totalBuyAmount,
      totalSellAmount,
      averageBuyPrice: avgBuy,
      averageSellPrice: avgSell,
      netShares: runningShares,
      netInvested: runningTotalCost,
      currentStatus: runningShares > EPSILON ? 'OPEN' : 'CLOSED',
      realizedPL: totalRealizedPL,
      realizedPLPercent: overallRealizedPct,
      firstTradeDate: sorted[0].date,
      lastTradeDate: sorted[sorted.length - 1].date,
      transactions: processedTx,
    });
  }

  openSummaries.sort((a, b) => b.totalCost - a.totalCost);
  closedSummaries.sort((a, b) => b.realizedPL - a.realizedPL);
  transactionSummaries.sort(
    (a, b) => b.totalTransactions - a.totalTransactions || a.symbol.localeCompare(b.symbol)
  );

  return { openSummaries, closedSummaries, transactionSummaries };
}

export function buildLocalHoldingsResponse(
  transactions: LocalTransaction[],
  tabId: string = 'all',
  currency: 'USD' | 'THB' = 'THB',
  pricesMap: Map<string, PriceData> = new Map(),
  exchangeRate: number = DEFAULT_FX_RATE,
  lang: AppLang = 'en'
): PortfolioHoldingsResponse {
  const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_FX_RATE;
  const { openSummaries, closedSummaries, transactionSummaries } =
    processLocalTransactionsFifo(transactions);

  const isClosedTab = tabId === 'closed-position';
  const isAllTab = tabId === 'all';

  const filteredOpen = isClosedTab
    ? []
    : isAllTab
      ? openSummaries
      : openSummaries.filter((s) => getAssetType(s.assetType, s.symbol) === tabId);

  const filteredClosed = isAllTab || isClosedTab
    ? closedSummaries
    : closedSummaries.filter((s) => getAssetType(s.assetType, s.symbol) === tabId);

  let openInvested = 0;
  let totalValue = 0;

  const openPositions: PortfolioPosition[] = filteredOpen.map((s) => {
    const pd = pricesMap.get(s.symbol);
    const hasPrice = Boolean(pd && pd.price > 0);
    const liveNativePrice = hasPrice && pd ? pd.price : s.averageCost;
    const priceOrigCurrency = hasPrice && pd?.currency ? pd.currency : s.currency;

    const currentPrice = convertCurrency(liveNativePrice, priceOrigCurrency, currency, rate);
    const totalCost = convertCurrency(s.totalCost, s.currency, currency, rate);
    const averageCost = s.totalShares > 0 ? totalCost / s.totalShares : 0;
    const holdingValue = s.totalShares * currentPrice;
    const unrealizedPL = holdingValue - totalCost;
    const unrealizedPLPercent = totalCost > 0 ? (unrealizedPL / totalCost) * 100 : 0;

    openInvested += totalCost;
    totalValue += holdingValue;

    const lots: PortfolioHoldingLot[] = s.lots.map((lot) => {
      const lotCost = convertCurrency(lot.totalCost, s.currency, currency, rate);
      const lotCostBasis = lot.quantity > 0 ? lotCost / lot.quantity : 0;
      const lotVal = lot.quantity * currentPrice;
      const lotPL = lotVal - lotCost;
      const lotPLPct = lotCost > 0 ? (lotPL / lotCost) * 100 : 0;
      return {
        purchaseDate: lot.purchaseDate,
        quantity: lot.quantity,
        costBasis: lotCostBasis,
        totalCost: lotCost,
        currentPrice,
        holdingValue: lotVal,
        unrealizedPL: lotPL,
        unrealizedPLPercent: lotPLPct,
        assetType: s.assetType,
        currency,
        originalCostBasis: lot.costBasis,
        originalCurrency: s.currency,
        note: lot.note,
      };
    });

    return {
      symbol: s.symbol,
      displaySymbol: displaySymbol(s.symbol),
      name: getSymbolName(s.symbol, pd?.name || '', lang, pd?.nameTh || '', s.assetType) || s.symbol,
      nameTh: pd?.nameTh || '',
      assetType: s.assetType,
      assetTypeLabel: getAssetTypeLabel(s.assetType, s.symbol, lang),
      totalShares: s.totalShares,
      totalCost,
      averageCost,
      currentPrice,
      holdingValue,
      unrealizedPL,
      unrealizedPLPercent,
      currency,
      originalCurrency: s.currency,
      hasPrice,
      lots,
      employeeContribution: s.employeeContribution,
      employeeEarnings: s.employeeEarnings,
      employerMatching: s.employerMatching,
      employerEarnings: s.employerEarnings,
      pvdFundName: s.pvdFundName,
    };
  });

  let closedInvested = 0;
  let totalRealizedPL = 0;

  const closedPositions: ClosedPortfolioPosition[] = filteredClosed.map((c) => {
    const pd = pricesMap.get(c.symbol);
    const totalCost = convertCurrency(c.totalCost, c.currency, currency, rate);
    const totalProceeds = convertCurrency(c.totalProceeds, c.currency, currency, rate);
    const realizedPL = totalProceeds - totalCost;
    const realizedPLPercent = totalCost > 0 ? (realizedPL / totalCost) * 100 : 0;

    closedInvested += totalCost;
    totalRealizedPL += realizedPL;

    return {
      symbol: c.symbol,
      displaySymbol: displaySymbol(c.symbol),
      name: getSymbolName(c.symbol, pd?.name || '', lang, pd?.nameTh || '', c.assetType) || c.symbol,
      nameTh: pd?.nameTh || '',
      assetType: c.assetType,
      assetTypeLabel: getAssetTypeLabel(c.assetType, c.symbol, lang),
      totalShares: 0,
      closedShares: c.closedShares,
      totalCost,
      totalProceeds,
      realizedPL,
      realizedPLPercent,
      averageBuyPrice: c.closedShares > 0 ? totalCost / c.closedShares : 0,
      averageSellPrice: c.closedShares > 0 ? totalProceeds / c.closedShares : 0,
      currency,
      originalCurrency: c.currency,
      lots: c.lots.map((l) => ({
        ...l,
        costBasis: convertCurrency(l.costBasis, l.currency, currency, rate),
        sellPrice: convertCurrency(l.sellPrice, l.currency, currency, rate),
        totalCost: convertCurrency(l.totalCost, l.currency, currency, rate),
        totalProceeds: convertCurrency(l.totalProceeds, l.currency, currency, rate),
        realizedPL: convertCurrency(l.realizedPL, l.currency, currency, rate),
        currency,
      })),
    };
  });

  const totalUnrealizedPL = totalValue - openInvested;
  const totalUnrealizedPLPercent = openInvested > 0 ? (totalUnrealizedPL / openInvested) * 100 : 0;
  const totalRealizedPLPercent = closedInvested > 0 ? (totalRealizedPL / closedInvested) * 100 : 0;
  const totalInvested = isClosedTab ? closedInvested : openInvested;
  const totalReturn = totalUnrealizedPL + totalRealizedPL;
  const denom = openInvested + closedInvested;
  const totalReturnPercent = denom > 0 ? (totalReturn / denom) * 100 : 0;

  const summary: PortfolioSummary = {
    totalInvested,
    totalValue,
    openInvested,
    closedInvested,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    totalRealizedPL,
    totalRealizedPLPercent,
    totalReturn,
    totalReturnPercent,
  };

  return {
    currency,
    exchangeRate: transactions.length > 0 ? rate : exchangeRate > 0 ? exchangeRate : 0,
    tabId,
    summary,
    openPositions,
    closedPositions,
    transactionSummaries,
    rawTransactions: transactions,
    error: null,
  };
}

export function buildLocalDividendResponse(
  transactions: LocalTransaction[],
  currency: 'USD' | 'THB' = 'THB',
  pricesMap: Map<string, PriceData> = new Map(),
  exchangeRate: number = DEFAULT_FX_RATE,
  lang: AppLang = 'en'
): PortfolioDividendResponse {
  const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_FX_RATE;
  const holdings = buildLocalHoldingsResponse(transactions, 'all', currency, pricesMap, rate, lang);

  const divTxs = transactions
    .filter((tx) => classifyTx(tx).type === 'DIVIDEND')
    .sort((a, b) => b.date.localeCompare(a.date));

  const records: DividendRecord[] = [];
  let totalGrossDividends = 0;
  let totalNetDividends = 0;
  let totalWithholdingTax = 0;

  const annualMap = new Map<number, AnnualDividendSummary>();
  const monthlyMap = new Map<string, MonthlyDividendSummary>();
  const assetTypeMap = new Map<string, AssetTypeDividendSummary>();
  const symbolMap = new Map<string, SymbolDividendSummary>();
  const assetTypeSymbols = new Map<string, Set<string>>();

  for (const tx of divTxs) {
    const symbol = tx.symbol.trim().toUpperCase();
    const assetType = getAssetType(tx.assetType, symbol);
    const whtRate = WHT_RATES[assetType] ?? 0.15;
    const shares = Math.abs(tx.quantity);
    const dps = tx.price;
    const grossNative = shares * dps;
    const whtNative = grossNative * whtRate;
    const netNative = grossNative - whtNative;

    const gross = convertCurrency(grossNative, tx.currency, currency, rate);
    const wht = convertCurrency(whtNative, tx.currency, currency, rate);
    const net = convertCurrency(netNative, tx.currency, currency, rate);

    totalGrossDividends += gross;
    totalWithholdingTax += wht;
    totalNetDividends += net;

    records.push({
      id: tx.id,
      symbol,
      displaySymbol: displaySymbol(symbol),
      date: tx.date,
      assetType,
      assetTypeLabel: getAssetTypeLabel(assetType, symbol, lang),
      shares,
      dividendPerShare: dps,
      grossAmount: grossNative,
      withholdingTax: whtNative,
      withholdingTaxRate: whtRate * 100,
      netAmount: netNative,
      currency: tx.currency,
      convertedNetAmount: net,
      convertedGrossAmount: gross,
      convertedWithholdingTax: wht,
    });

    const year = Number(tx.date.slice(0, 4)) || new Date().getFullYear();
    const month = Number(tx.date.slice(5, 7)) || 1;
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

    const monthEntry = monthlyMap.get(yearMonth) || {
      yearMonth,
      year,
      month,
      grossAmount: 0,
      netAmount: 0,
      withholdingTax: 0,
      byAssetType: {},
      recordCount: 0,
    };
    monthEntry.grossAmount += gross;
    monthEntry.netAmount += net;
    monthEntry.withholdingTax += wht;
    monthEntry.byAssetType[assetType] = (monthEntry.byAssetType[assetType] || 0) + net;
    monthEntry.recordCount += 1;
    monthlyMap.set(yearMonth, monthEntry);

    const yearEntry = annualMap.get(year) || {
      year,
      grossAmount: 0,
      netAmount: 0,
      withholdingTax: 0,
      byAssetType: {},
      recordCount: 0,
      monthlyBreakdown: [],
    };
    yearEntry.grossAmount += gross;
    yearEntry.netAmount += net;
    yearEntry.withholdingTax += wht;
    yearEntry.byAssetType[assetType] = (yearEntry.byAssetType[assetType] || 0) + net;
    yearEntry.recordCount += 1;
    annualMap.set(year, yearEntry);

    const symSet = assetTypeSymbols.get(assetType) || new Set<string>();
    symSet.add(symbol);
    assetTypeSymbols.set(assetType, symSet);

    const atEntry = assetTypeMap.get(assetType) || {
      assetType,
      assetTypeLabel: getAssetTypeLabel(assetType, undefined, lang),
      totalGrossDividends: 0,
      totalNetDividends: 0,
      totalWithholdingTax: 0,
      percentageOfTotal: 0,
      symbolCount: 0,
      recordCount: 0,
      totalCostBasis: 0,
      currentValue: 0,
      projectedAnnualDividends: 0,
      yieldOnCostPercent: 0,
      currentYieldPercent: 0,
    };
    atEntry.totalGrossDividends += gross;
    atEntry.totalNetDividends += net;
    atEntry.totalWithholdingTax += wht;
    atEntry.recordCount += 1;
    atEntry.symbolCount = symSet.size;
    assetTypeMap.set(assetType, atEntry);

    const pos = holdings.openPositions.find((p) => p.symbol === symbol);
    const pd = pricesMap.get(symbol);
    const symEntry = symbolMap.get(symbol) || {
      symbol,
      displaySymbol: displaySymbol(symbol),
      name:
        pos?.name ||
        getSymbolName(symbol, pd?.name || '', lang, pd?.nameTh || '', assetType) ||
        symbol,
      nameTh: pos?.nameTh || pd?.nameTh || '',
      assetType,
      assetTypeLabel: getAssetTypeLabel(assetType, symbol, lang),
      currency: tx.currency,
      totalGrossDividends: 0,
      totalNetDividends: 0,
      totalWithholdingTax: 0,
      convertedNetDividends: 0,
      convertedGrossDividends: 0,
      convertedWithholdingTax: 0,
      dividendCount: 0,
      firstDividendDate: tx.date,
      lastDividendDate: tx.date,
      currentShares: pos?.totalShares ?? 0,
      currentCostBasis: pos?.totalCost ?? 0,
      currentValue: pos?.holdingValue ?? 0,
      trailingAnnualDPS: 0,
      currentYieldPercent: 0,
      yieldOnCostPercent: 0,
      projectedAnnualIncome: 0,
      recentDistributions: [],
    };
    symEntry.totalGrossDividends += grossNative;
    symEntry.totalNetDividends += netNative;
    symEntry.totalWithholdingTax += whtNative;
    symEntry.convertedNetDividends += net;
    symEntry.convertedGrossDividends += gross;
    symEntry.convertedWithholdingTax += wht;
    symEntry.dividendCount += 1;
    if (tx.date < symEntry.firstDividendDate) symEntry.firstDividendDate = tx.date;
    if (tx.date > symEntry.lastDividendDate) symEntry.lastDividendDate = tx.date;
    symbolMap.set(symbol, symEntry);
  }

  for (const symEntry of symbolMap.values()) {
    symEntry.yieldOnCostPercent =
      symEntry.currentCostBasis > 0
        ? (symEntry.convertedNetDividends / symEntry.currentCostBasis) * 100
        : 0;
    symEntry.currentYieldPercent =
      symEntry.currentValue > 0 ? (symEntry.convertedNetDividends / symEntry.currentValue) * 100 : 0;
    symEntry.projectedAnnualIncome = symEntry.convertedNetDividends;
  }

  for (const atEntry of assetTypeMap.values()) {
    atEntry.percentageOfTotal =
      totalNetDividends > 0 ? (atEntry.totalNetDividends / totalNetDividends) * 100 : 0;
  }

  const monthlyDividends = [...monthlyMap.values()].sort((a, b) =>
    a.yearMonth.localeCompare(b.yearMonth)
  );
  const annualDividends = [...annualMap.values()]
    .map((a) => ({
      ...a,
      monthlyBreakdown: monthlyDividends.filter((m) => m.year === a.year),
    }))
    .sort((a, b) => b.year - a.year);

  const openCost = holdings.summary.openInvested;
  const openValue = holdings.summary.totalValue;

  return {
    currency,
    exchangeRate: rate,
    totalGrossDividends,
    totalNetDividends,
    totalWithholdingTax,
    effectiveTaxRate:
      totalGrossDividends > 0 ? (totalWithholdingTax / totalGrossDividends) * 100 : 0,
    projectedAnnualDividends: totalNetDividends,
    portfolioDividendYield: openValue > 0 ? (totalNetDividends / openValue) * 100 : 0,
    portfolioYieldOnCost: openCost > 0 ? (totalNetDividends / openCost) * 100 : 0,
    annualDividends,
    monthlyDividends,
    assetTypeSummaries: [...assetTypeMap.values()].sort(
      (a, b) => b.totalNetDividends - a.totalNetDividends
    ),
    symbolSummaries: [...symbolMap.values()].sort(
      (a, b) => b.convertedNetDividends - a.convertedNetDividends
    ),
    records,
    error: null,
  };
}

export function buildLocalPerformanceResponse(
  transactions: LocalTransaction[],
  timeframe: string = 'ALL',
  startDate: string = '',
  endDate: string = '',
  currency: 'USD' | 'THB' = 'THB',
  pricesMap: Map<string, PriceData> = new Map(),
  exchangeRate: number = DEFAULT_FX_RATE,
  lang: AppLang = 'en'
): PortfolioPerformanceResponse {
  const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_FX_RATE;
  const start = parseSortDate(startDate);
  const end = parseSortDate(endDate);
  const filteredTxs = transactions.filter((tx) => {
    const d = parseSortDate(tx.date);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });

  if (filteredTxs.length === 0) {
    return {
      timeframe,
      startDate,
      endDate,
      currency,
      exchangeRate: transactions.length > 0 ? rate : exchangeRate > 0 ? exchangeRate : 0,
      summary: {
        totalInvested: 0,
        totalValue: 0,
        openInvested: 0,
        closedInvested: 0,
        totalUnrealizedPL: 0,
        totalUnrealizedPLPercent: 0,
        totalRealizedPL: 0,
        totalRealizedPLPercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      },
      assetTypePerformance: [],
      topGainers: [],
      topLosers: [],
      symbolPerformance: [],
      error: null,
    };
  }

  const holdings = buildLocalHoldingsResponse(filteredTxs, 'all', currency, pricesMap, rate, lang);

  interface SymbolAcc {
    symbol: string;
    displaySymbol: string;
    name: string;
    nameTh?: string;
    assetType: string;
    assetTypeLabel: string;
    hasOpen: boolean;
    hasClosed: boolean;
    investedCost: number;
    currentValue: number;
    unrealizedPL: number;
    realizedPL: number;
    hasPrice: boolean;
  }

  const symAcc = new Map<string, SymbolAcc>();
  for (const pos of holdings.openPositions) {
    symAcc.set(pos.symbol, {
      symbol: pos.symbol,
      displaySymbol: pos.displaySymbol,
      name: pos.name,
      nameTh: pos.nameTh,
      assetType: pos.assetType,
      assetTypeLabel: pos.assetTypeLabel,
      hasOpen: true,
      hasClosed: false,
      investedCost: pos.totalCost,
      currentValue: pos.holdingValue,
      unrealizedPL: pos.unrealizedPL,
      realizedPL: 0,
      hasPrice: pos.hasPrice,
    });
  }

  for (const closed of holdings.closedPositions) {
    const existing = symAcc.get(closed.symbol);
    if (existing) {
      existing.hasClosed = true;
      existing.investedCost += closed.totalCost;
      existing.realizedPL += closed.realizedPL;
    } else {
      symAcc.set(closed.symbol, {
        symbol: closed.symbol,
        displaySymbol: closed.displaySymbol,
        name: closed.name,
        nameTh: closed.nameTh,
        assetType: closed.assetType,
        assetTypeLabel: closed.assetTypeLabel,
        hasOpen: false,
        hasClosed: true,
        investedCost: closed.totalCost,
        currentValue: 0,
        unrealizedPL: 0,
        realizedPL: closed.realizedPL,
        hasPrice: false,
      });
    }
  }

  const classMap = new Map<string, AssetClassPerformance>();
  const symbolPerformance: SymbolPerformance[] = [];

  for (const s of symAcc.values()) {
    const totalReturn = s.unrealizedPL + s.realizedPL;
    const totalReturnPercent = s.investedCost > 0 ? (totalReturn / s.investedCost) * 100 : 0;
    const status: SymbolPerformance['status'] =
      s.hasOpen && s.hasClosed ? 'BOTH' : s.hasOpen ? 'OPEN' : 'CLOSED';

    symbolPerformance.push({
      symbol: s.symbol,
      displaySymbol: s.displaySymbol,
      name: s.name,
      nameTh: s.nameTh,
      assetType: s.assetType,
      assetTypeLabel: s.assetTypeLabel,
      status,
      investedCost: s.investedCost,
      currentValue: s.currentValue,
      unrealizedPL: s.unrealizedPL,
      realizedPL: s.realizedPL,
      totalReturnAmount: totalReturn,
      totalReturn,
      totalReturnPercent,
      hasPrice: s.hasPrice,
    });

    const ac = classMap.get(s.assetType) || {
      assetType: s.assetType,
      label: getAssetTypeLabel(s.assetType, undefined, lang),
      investedCost: 0,
      currentValue: 0,
      unrealizedPL: 0,
      realizedPL: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      openSymbolCount: 0,
      closedSymbolCount: 0,
    };
    ac.investedCost += s.investedCost;
    ac.currentValue += s.currentValue;
    ac.unrealizedPL += s.unrealizedPL;
    ac.realizedPL += s.realizedPL;
    if (s.hasOpen) ac.openSymbolCount += 1;
    if (s.hasClosed) ac.closedSymbolCount += 1;
    classMap.set(s.assetType, ac);
  }

  const assetTypePerformance = [...classMap.values()]
    .map((ac) => {
      const totalReturn = ac.unrealizedPL + ac.realizedPL;
      return {
        ...ac,
        totalReturn,
        totalReturnPercent: ac.investedCost > 0 ? (totalReturn / ac.investedCost) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);

  symbolPerformance.sort((a, b) => b.totalReturn - a.totalReturn);

  const topGainers = symbolPerformance
    .filter((s) => s.totalReturn > 0)
    .slice(0, 5);
  const topLosers = [...symbolPerformance]
    .filter((s) => s.totalReturn < 0)
    .sort((a, b) => a.totalReturn - b.totalReturn)
    .slice(0, 5);

  return {
    timeframe,
    startDate,
    endDate,
    currency,
    exchangeRate: rate,
    summary: holdings.summary,
    assetTypePerformance,
    topGainers,
    topLosers,
    symbolPerformance,
    error: null,
  };
}

export function buildLocalAllocationResponse(
  transactions: LocalTransaction[],
  targetAllocation?: TargetAllocation,
  currency: 'USD' | 'THB' = 'THB',
  pricesMap: Map<string, PriceData> = new Map(),
  exchangeRate: number = DEFAULT_FX_RATE,
  lang: AppLang = 'en'
): PortfolioAllocationResponse {
  const rate = exchangeRate > 0 ? exchangeRate : DEFAULT_FX_RATE;
  const holdings = buildLocalHoldingsResponse(transactions, 'all', currency, pricesMap, rate, lang);

  if (holdings.openPositions.length === 0) {
    return {
      currency,
      exchangeRate: transactions.length > 0 ? rate : exchangeRate > 0 ? exchangeRate : 0,
      totalPortfolioValue: 0,
      recommendations: [],
      currencyExposure: { usd: 0, thb: 0, usdPercent: 0, thbPercent: 0 },
      holdingsConcentration: [],
      error: null,
    };
  }

  const classTotals = new Map<string, number>();
  let totalPortfolioValue = 0;
  let usd = 0;
  let thb = 0;

  for (const pos of holdings.openPositions) {
    totalPortfolioValue += pos.holdingValue;
    classTotals.set(pos.assetType, (classTotals.get(pos.assetType) || 0) + pos.holdingValue);

    const origCurrency = (pos.originalCurrency || 'USD').toUpperCase();
    if (origCurrency === 'USD' || origCurrency === 'USDT') {
      usd += pos.holdingValue;
    } else if (origCurrency === 'THB') {
      thb += pos.holdingValue;
    }
  }

  const exposureTotal = usd + thb;
  const currencyExposure: CurrencyExposure = {
    usd,
    thb,
    usdPercent: exposureTotal > 0 ? (usd / exposureTotal) * 100 : 0,
    thbPercent: exposureTotal > 0 ? (thb / exposureTotal) * 100 : 0,
  };

  const holdingsConcentration: HoldingConcentration[] = holdings.openPositions
    .map((pos) => {
      const classVal = classTotals.get(pos.assetType) || 0;
      return {
        symbol: pos.symbol,
        displaySymbol: pos.displaySymbol,
        name: pos.name,
        nameTh: pos.nameTh,
        assetType: pos.assetType,
        value: pos.holdingValue,
        portfolioPercent: totalPortfolioValue > 0 ? (pos.holdingValue / totalPortfolioValue) * 100 : 0,
        classPercent: classVal > 0 ? (pos.holdingValue / classVal) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const mergedTargets: TargetAllocation = {
    ...DEFAULT_USER_SETTINGS.targetAllocations,
    ...targetAllocation,
  };
  const defaultKeys = Object.keys(DEFAULT_USER_SETTINGS.targetAllocations);
  const extraKeys = Object.keys({
    ...Object.fromEntries(classTotals.entries()),
    ...mergedTargets,
  }).filter((k) => !defaultKeys.includes(k));
  const orderedKeys = [...defaultKeys, ...extraKeys];

  const recommendations: RebalanceRecommendation[] = orderedKeys.map((assetType) => {
    const currentValue = classTotals.get(assetType) || 0;
    const actualPercent = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
    const targetPercent = mergedTargets[assetType] || 0;
    const targetValue = (targetPercent / 100) * totalPortfolioValue;
    const rebalanceAmount = targetValue - currentValue;
    const deviationPercent = actualPercent - targetPercent;
    const action: RebalanceRecommendation['action'] =
      Math.abs(rebalanceAmount) < 0.01 ? 'BALANCED' : rebalanceAmount > 0 ? 'BUY' : 'SELL';

    return {
      assetType,
      label: getAssetTypeLabel(assetType, undefined, lang),
      currentValue,
      actualPercent,
      targetPercent,
      rebalanceAmount,
      deviationPercent,
      action,
    };
  });

  return {
    currency,
    exchangeRate: rate,
    totalPortfolioValue,
    recommendations,
    currencyExposure,
    holdingsConcentration,
    error: null,
  };
}
