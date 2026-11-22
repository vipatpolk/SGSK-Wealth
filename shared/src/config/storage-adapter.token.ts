import { InjectionToken } from '@angular/core';

export interface KeyValueStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
  getItemSync?(key: string): string | null;
}

export class WebLocalStorageAdapter implements KeyValueStorageAdapter {
  getItemSync(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore storage read errors in restricted environments
    }
    return null;
  }

  getItem(key: string): string | null {
    return this.getItemSync(key);
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage write errors in restricted environments
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage remove errors in restricted environments
    }
  }
}

export const KEY_VALUE_STORAGE_ADAPTER = new InjectionToken<KeyValueStorageAdapter>(
  'KEY_VALUE_STORAGE_ADAPTER',
  {
    providedIn: 'root',
    factory: () => new WebLocalStorageAdapter(),
  }
);
