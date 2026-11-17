import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/backend',
});

export const MAX_BATCH_SIZE = new InjectionToken<number>('MAX_BATCH_SIZE', {
  providedIn: 'root',
  factory: () => 50,
});
