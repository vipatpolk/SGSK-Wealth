import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, ShareLot, SymbolSummary, ClosedShareLot, ClosedSymbolSummary } from '../models/transaction.model';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { getSheetExportUrl, ASSET_TABS } from '../config/sheet.config';

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

    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length < 5) continue;

      const symbol = fields[0].trim();
      const date = fields[1].trim();
      const quantity = parseFloat(fields[2].trim());
      const price = parseFloat(fields[3].trim().replace(/,/g, ''));
      const currency = fields[4].trim();

      if (!symbol || isNaN(quantity) || isNaN(price)) continue;

      let assetType = tabAssetType;
      if (tabAssetType === 'closed-position') {
        if (symbol.endsWith('.BK')) {
          assetType = 'thai-stock';
        } else if (symbol.endsWith('.CRYPTO')) {
          assetType = 'crypto';
        } else {
          assetType = 'us-stock';
        }
      }

      transactions.push({ symbol, date, quantity, price, currency, assetType });
    }

    return transactions;
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
        const totalShares = remainingLots.reduce((sum, lot) => sum + lot.quantity, 0);
        const totalCost = remainingLots.reduce((sum, lot) => sum + lot.totalCost, 0);
        const averageCost = totalShares > 0 ? totalCost / totalShares : 0;

        summaries.push({
          symbol,
          totalShares,
          totalCost,
          averageCost,
          currency,
          lots: remainingLots,
          assetType,
        });
      } else if (closedLots.length > 0) {
        const closedShares = closedLots.reduce((sum, lot) => sum + lot.quantity, 0);
        const totalShares = 0;
        const totalCost = closedLots.reduce((sum, lot) => sum + lot.totalCost, 0);
        const totalProceeds = closedLots.reduce((sum, lot) => sum + lot.totalProceeds, 0);
        const realizedPL = totalProceeds - totalCost;
        const realizedPLPercent = totalCost > 0 ? (realizedPL / totalCost) * 100 : 0;
        const averageBuyPrice = closedShares > 0 ? totalCost / closedShares : 0;
        const averageSellPrice = closedShares > 0 ? totalProceeds / closedShares : 0;

        closedSummaries.push({
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
          lots: closedLots,
          assetType,
        });
      }
    }

    summaries.sort((a, b) => b.totalCost - a.totalCost);
    closedSummaries.sort((a, b) => b.realizedPL - a.realizedPL);

    return { summaries, closedSummaries };
  }
}
