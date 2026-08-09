import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PriceData {
  symbol: string;
  name?: string;
  price: number;
  currency: string;
}

@Injectable({
  providedIn: 'root',
})
export class PriceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/backend/price';

  fetchPricesAndRate(
    summaries: { symbol: string; assetType?: string }[],
  ): Observable<{ prices: Map<string, PriceData>; rate: number }> {
    return this.http.post<{ prices: { [key: string]: PriceData }; rate: number }>(
      `${this.baseUrl}/fetch-prices`, 
      { summaries }
    ).pipe(
      map((response) => {
        const priceMap = new Map<string, PriceData>();
        if (response && response.prices) {
          for (const key of Object.keys(response.prices)) {
            priceMap.set(key, response.prices[key]);
          }
        }
        return { prices: priceMap, rate: response ? response.rate : 1 };
      })
    );
  }

  fetchExchangeRate(fromCurrency: string = 'USD', toCurrency: string = 'THB'): Observable<number> {
    return this.http.get<{ rate: number }>(
      `${this.baseUrl}/exchange-rate?from_currency=${fromCurrency}&to_currency=${toCurrency}`
    ).pipe(
      map(res => res ? res.rate : 1)
    );
  }
}
