import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PriceData } from './price.service';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/backend/nav';

  fetchFundNAVs(symbols: string[]): Observable<Map<string, PriceData>> {
    return this.http.post<{ [key: string]: PriceData }>(`${this.baseUrl}/fetch`, { symbols }).pipe(
      map((response) => {
        const priceMap = new Map<string, PriceData>();
        if (response) {
          for (const key of Object.keys(response)) {
            priceMap.set(key, response[key]);
          }
        }
        return priceMap;
      })
    );
  }
}
