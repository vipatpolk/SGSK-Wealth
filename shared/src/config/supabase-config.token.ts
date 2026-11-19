import { InjectionToken } from '@angular/core';

export interface SupabaseStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface SupabaseAppConfig {
  url: string;
  publishableKey: string;
  redirectUrl: string;
  isNative?: boolean;
  storage?: SupabaseStorageAdapter;
  openExternalUrl?: (url: string) => Promise<void>;
  closeExternalUrl?: () => Promise<void>;
  getInitialAuthUrl?: () => Promise<string | null>;
  registerAppUrlOpen?: (callback: (url: string) => void) => Promise<(() => void) | null>;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseAppConfig>('SUPABASE_CONFIG');
