import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, ShareLot, SymbolSummary, ClosedShareLot, ClosedSymbolSummary } from '../models/transaction.model';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { getSheetExportUrl, ASSET_TABS } from '../config/sheet.config';
import { normalizeAssetType, getAssetType } from '../utils/format.utils';

export interface SheetResult {
  summaries: SymbolSummary[];
  closedSummaries: ClosedSymbolSummary[];
  totalCostByCurrency: Record<string, number>;
  totalProceedsByCurrency: Record<string, number>;
  totalRealizedPLByCurrency: Record<string, number>;
  totalSymbols: number;
  totalLots: number;
  error: string | null;
  isClosed?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShareLotService {
  private readonly http = inject(HttpClient);

  fetchSheet(gid: string): Observable<SheetResult> {
    const url = getSheetExportUrl(gid);
    const tab = ASSET_TABS.find((t) => t.sheetGid === gid);
    const isClosed = tab?.id === 'closed-position';
    const assetType = tab ? tab.id : 'unknown';

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((csv) => {
        const transactions = this.parseCsv(csv, assetType);
        const { summaries, closedSummaries } = this.calculateFIFO(transactions);
        return this.buildResult(summaries, closedSummaries, isClosed);
      }),
      catchError(() =>
        of(
          this.createEmptyResult(
            'Failed to fetch data from Google Sheets. Make sure the sheet is publicly accessible.',
            isClosed,
          ),
        ),
      ),
    );
  }

  fetchAllSheets(): Observable<SheetResult> {
    const sheetTabs = ASSET_TABS.filter((t) => t.sheetGid !== '');

    const requests = sheetTabs.map((tab) =>
      this.http.get(getSheetExportUrl(tab.sheetGid), { responseType: 'text' }).pipe(
        map((csv) => this.parseCsv(csv, tab.id)),
        catchError(() => of([] as Transaction[])),
      ),
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const allTransactions = results.flat();
        const { summaries, closedSummaries } = this.calculateFIFO(allTransactions);
        return this.buildResult(summaries, closedSummaries, false);
      }),
      catchError(() =>
        of(this.createEmptyResult('Failed to fetch data from Google Sheets.', false)),
      ),
    );
  }

  private createEmptyResult(error: string, isClosed: boolean): SheetResult {
    return {
      summaries: [],
      closedSummaries: [],
      totalCostByCurrency: {},
      totalProceedsByCurrency: {},
      totalRealizedPLByCurrency: {},
      totalSymbols: 0,
      totalLots: 0,
      error,
      isClosed,
    };
  }

  private buildResult(
    summaries: SymbolSummary[],
    closedSummaries: ClosedSymbolSummary[],
    isClosed: boolean,
  ): SheetResult {
    const totalCostByCurrency: Record<string, number> = {};
    const totalProceedsByCurrency: Record<string, number> = {};
    const totalRealizedPLByCurrency: Record<string, number> = {};

    if (isClosed) {
      for (const s of closedSummaries) {
        totalCostByCurrency[s.currency] = (totalCostByCurrency[s.currency] || 0) + s.totalCost;
        totalProceedsByCurrency[s.currency] = (totalProceedsByCurrency[s.currency] || 0) + s.totalProceeds;
        totalRealizedPLByCurrency[s.currency] = (totalRealizedPLByCurrency[s.currency] || 0) + s.realizedPL;
      }

      return {
        summaries,
        closedSummaries,
        totalCostByCurrency,
        totalProceedsByCurrency,
        totalRealizedPLByCurrency,
        totalSymbols: closedSummaries.length,
        totalLots: 0,
        error: null,
        isClosed: true,
      };
    }

    for (const s of summaries) {
      totalCostByCurrency[s.currency] = (totalCostByCurrency[s.currency] || 0) + s.totalCost;
    }

    for (const s of closedSummaries) {
      totalProceedsByCurrency[s.currency] = (totalProceedsByCurrency[s.currency] || 0) + s.totalProceeds;
      totalRealizedPLByCurrency[s.currency] = (totalRealizedPLByCurrency[s.currency] || 0) + s.realizedPL;
    }

    return {
      summaries,
      closedSummaries,
      totalCostByCurrency,
      totalProceedsByCurrency,
      totalRealizedPLByCurrency,
      totalSymbols: summaries.length,
      totalLots: summaries.reduce((sum, s) => sum + s.lots.length, 0),
      error: null,
      isClosed: false,
    };
  }

  private parseCsv(csv: string, tabAssetType: string): Transaction[] {
    const lines = csv
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const header = this.parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const symFound = this.findColumnIndex(header, 'symbol');
    const symbolIdx = symFound !== -1 ? symFound : 0;
    const dateFound = this.findColumnIndex(header, 'date');
    const dateIdx = dateFound !== -1 ? dateFound : 1;
    const qtyFound = this.findColumnIndex(header, 'quantity', 'qty');
    const qtyIdx = qtyFound !== -1 ? qtyFound : 2;
    const priceFound = this.findColumnIndex(header, 'price');
    const priceIdx = priceFound !== -1 ? priceFound : 3;
    const currFound = this.findColumnIndex(header, 'currency', 'curr');
    const currIdx = currFound !== -1 ? currFound : 4;
    const typeIdx = this.findColumnIndex(header, 'type', 'asset', 'assettype', 'asset type');

    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length < 5) continue;

      const symbol = fields[symbolIdx]?.trim();
      const date = fields[dateIdx]?.trim();
      const quantity = parseFloat(fields[qtyIdx]?.trim());
      const price = parseFloat(fields[priceIdx]?.trim().replace(/,/g, ''));
      const currency = fields[currIdx]?.trim() || 'USD';

      if (!symbol || isNaN(quantity) || isNaN(price)) continue;

      const rawType = typeIdx !== -1 && fields[typeIdx] ? fields[typeIdx].trim() : '';
      const parsedType = rawType ? normalizeAssetType(rawType) : null;
      const assetType = parsedType || getAssetType(tabAssetType, symbol);

      transactions.push({ symbol, date, quantity, price, currency, assetType });
    }

    return transactions;
  }

  private findColumnIndex(header: string[], ...names: string[]): number {
    return header.findIndex(h => names.some(n => n === h || h.includes(n)));
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }

    fields.push(current);
    return fields;
  }

  private calculateFIFO(transactions: Transaction[]): {
    summaries: SymbolSummary[];
    closedSummaries: ClosedSymbolSummary[];
  } {
    const symbolMap = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      if (!symbolMap.has(tx.symbol)) {
        symbolMap.set(tx.symbol, []);
      }
      symbolMap.get(tx.symbol)!.push(tx);
    }

    const summaries: SymbolSummary[] = [];
    const closedSummaries: ClosedSymbolSummary[] = [];
    const EPSILON = 1e-7;

    for (const [symbol, txs] of symbolMap) {
      txs.sort((a, b) => a.date.localeCompare(b.date));

      const currency = txs[0].currency;
      const assetType = txs[0].assetType;
      const openLots: ShareLot[] = [];
      const closedLots: ClosedShareLot[] = [];

      for (const tx of txs) {
        if (tx.quantity > 0) {
          openLots.push({
            symbol: tx.symbol,
            purchaseDate: tx.date,
            quantity: tx.quantity,
            costBasis: tx.price,
            totalCost: tx.quantity * tx.price,
            assetType: tx.assetType,
          });
        } else {
          let remainingToSell = Math.abs(tx.quantity);
          const sellPrice = tx.price;
          const sellDate = tx.date;

          for (let i = 0; i < openLots.length && remainingToSell > EPSILON; i++) {
            const lot = openLots[i];
            if (lot.quantity <= EPSILON) continue;

            const matchedQty = Math.min(lot.quantity, remainingToSell);
            const buyCost = matchedQty * lot.costBasis;
            const sellProceeds = matchedQty * sellPrice;
            const realizedPL = sellProceeds - buyCost;
            const realizedPLPercent = buyCost > 0 ? (realizedPL / buyCost) * 100 : 0;

            closedLots.push({
              symbol: tx.symbol,
              purchaseDate: lot.purchaseDate,
              closeDate: sellDate,
              quantity: matchedQty,
              costBasis: lot.costBasis,
              sellPrice,
              totalCost: buyCost,
              totalProceeds: sellProceeds,
              realizedPL,
              realizedPLPercent,
              currency: tx.currency,
              assetType: tx.assetType,
            });

            lot.quantity -= matchedQty;
            lot.totalCost = lot.quantity * lot.costBasis;
            remainingToSell -= matchedQty;
          }
        }
      }

      const remainingLots = openLots.filter((lot) => lot.quantity > EPSILON);

      if (remainingLots.length > 0) {
        summaries.push(this.createOpenSummary(symbol, currency, assetType, remainingLots));
      } else if (closedLots.length > 0) {
        closedSummaries.push(this.createClosedSummary(symbol, currency, assetType, closedLots));
      }
    }

    summaries.sort((a, b) => b.totalCost - a.totalCost);
    closedSummaries.sort((a, b) => b.realizedPL - a.realizedPL);

    return { summaries, closedSummaries };
  }
  private createOpenSummary(symbol: string, currency: string, assetType: string, lots: ShareLot[]): SymbolSummary {
    const totalShares = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const totalCost = lots.reduce((sum, lot) => sum + lot.totalCost, 0);
    const averageCost = totalShares > 0 ? totalCost / totalShares : 0;

    return {
      symbol,
      totalShares,
      totalCost,
      averageCost,
      currency,
      lots,
      assetType,
    };
  }

  private createClosedSummary(symbol: string, currency: string, assetType: string, lots: ClosedShareLot[]): ClosedSymbolSummary {
    const closedShares = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const totalShares = 0;
    const totalCost = lots.reduce((sum, lot) => sum + lot.totalCost, 0);
    const totalProceeds = lots.reduce((sum, lot) => sum + lot.totalProceeds, 0);
    const realizedPL = totalProceeds - totalCost;
    const realizedPLPercent = totalCost > 0 ? (realizedPL / totalCost) * 100 : 0;
    const averageBuyPrice = closedShares > 0 ? totalCost / closedShares : 0;
    const averageSellPrice = closedShares > 0 ? totalProceeds / closedShares : 0;

    return {
      symbol,
      totalShares,
      closedShares,
      totalCost,
      totalProceeds,
      realizedPL,
      realizedPLPercent,
      averageBuyPrice,
      averageSellPrice,
      currency,
      lots,
      assetType,
    };
  }
}
