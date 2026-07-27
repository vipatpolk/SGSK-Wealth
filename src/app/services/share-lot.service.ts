import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, ShareLot, SymbolSummary } from '../models/transaction.model';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { getSheetExportUrl, ASSET_TABS } from '../config/sheet.config';

export interface SheetResult {
  summaries: SymbolSummary[];
  totalCostByCurrency: Record<string, number>;
  totalSymbols: number;
  totalLots: number;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ShareLotService {
  private readonly http = inject(HttpClient);

  fetchSheet(gid: string): Observable<SheetResult> {
    const url = getSheetExportUrl(gid);

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((csv) => {
        const transactions = this.parseCsv(csv);
        const summaries = this.calculateFIFO(transactions);
        return this.buildResult(summaries);
      }),
      catchError(() => {
        return of({
          summaries: [],
          totalCostByCurrency: {},
          totalSymbols: 0,
          totalLots: 0,
          error: 'Failed to fetch data from Google Sheets. Make sure the sheet is publicly accessible.',
        });
      }),
    );
  }

  fetchAllSheets(): Observable<SheetResult> {
    const sheetTabs = ASSET_TABS.filter((t) => t.sheetGid !== '');

    const requests = sheetTabs.map((tab) =>
      this.http.get(getSheetExportUrl(tab.sheetGid), { responseType: 'text' }).pipe(
        map((csv) => this.parseCsv(csv)),
        catchError(() => of([] as Transaction[])),
      ),
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const allTransactions = results.flat();
        const summaries = this.calculateFIFO(allTransactions);
        return this.buildResult(summaries);
      }),
      catchError(() => {
        return of({
          summaries: [],
          totalCostByCurrency: {},
          totalSymbols: 0,
          totalLots: 0,
          error: 'Failed to fetch data from Google Sheets.',
        });
      }),
    );
  }

  private buildResult(summaries: SymbolSummary[]): SheetResult {
    const totalCostByCurrency: Record<string, number> = {};
    for (const s of summaries) {
      totalCostByCurrency[s.currency] = (totalCostByCurrency[s.currency] || 0) + s.totalCost;
    }

    return {
      summaries,
      totalCostByCurrency,
      totalSymbols: summaries.length,
      totalLots: summaries.reduce((sum, s) => sum + s.lots.length, 0),
      error: null,
    };
  }

  private parseCsv(csv: string): Transaction[] {
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

      transactions.push({ symbol, date, quantity, price, currency });
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

  private calculateFIFO(transactions: Transaction[]): SymbolSummary[] {
    const symbolMap = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      if (!symbolMap.has(tx.symbol)) {
        symbolMap.set(tx.symbol, []);
      }
      symbolMap.get(tx.symbol)!.push(tx);
    }

    const summaries: SymbolSummary[] = [];

    for (const [symbol, txs] of symbolMap) {
      txs.sort((a, b) => a.date.localeCompare(b.date));

      const currency = txs[0].currency;
      const lots: ShareLot[] = [];

      for (const tx of txs) {
        if (tx.quantity > 0) {
          lots.push({
            symbol: tx.symbol,
            purchaseDate: tx.date,
            quantity: tx.quantity,
            costBasis: tx.price,
            totalCost: tx.quantity * tx.price,
          });
        } else {
          let remaining = Math.abs(tx.quantity);

          for (let i = 0; i < lots.length && remaining > 0; i++) {
            if (lots[i].quantity <= 0) continue;

            if (lots[i].quantity <= remaining) {
              remaining -= lots[i].quantity;
              lots[i].quantity = 0;
              lots[i].totalCost = 0;
            } else {
              lots[i].quantity -= remaining;
              lots[i].totalCost = lots[i].quantity * lots[i].costBasis;
              remaining = 0;
            }
          }
        }
      }

      const remainingLots = lots.filter((lot) => lot.quantity > 0);

      if (remainingLots.length === 0) continue;

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
      });
    }

    summaries.sort((a, b) => b.totalCost - a.totalCost);

    return summaries;
  }
}
