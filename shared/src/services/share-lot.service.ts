import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../config/api-config.token';
import {
  ApiResult,
  apiErr,
  apiOk,
  mapHttpErrorToApiFailure,
} from '../models/api-result.model';
import {
  ClosedSymbolSummary,
  SheetResult,
  SymbolSummary,
  SymbolTransactionSummary,
  Transaction,
} from '../models/transaction.model';

export type { SheetResult };

@Injectable({
  providedIn: 'root',
})
export class ShareLotService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private get baseUrl(): string {
    return `${this.apiBaseUrl}/share-lot`;
  }

  fetchSheet(tabId: string): Observable<ApiResult<SheetResult>> {
    return this.http.get<SheetResult>(`${this.baseUrl}/sheet/${tabId}`).pipe(
      map((res) =>
        res?.error
          ? apiErr('upstream', 502, res.error, true)
          : apiOk(res)
      ),
      catchError((err) =>
        of(mapHttpErrorToApiFailure(err, 'Failed to fetch data from backend.'))
      )
    );
  }

  fetchAllSheets(): Observable<ApiResult<SheetResult>> {
    return this.http.get<SheetResult>(`${this.baseUrl}/sheets`).pipe(
      map((res) =>
        res?.error
          ? apiErr('upstream', 502, res.error, true)
          : apiOk(res)
      ),
      catchError((err) =>
        of(mapHttpErrorToApiFailure(err, 'Failed to fetch data from backend.'))
      )
    );
  }
}
