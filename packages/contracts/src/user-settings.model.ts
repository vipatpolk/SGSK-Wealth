import { AppLang } from './common.model';
import { TargetAllocation } from './transaction.model';

export type AppCurrency = 'THB' | 'USD';
export type AppTheme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type SettingsSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface UserSettings {
  currency: AppCurrency;
  language: AppLang;
  theme: AppTheme;
  privacyMode: boolean;
  targetAllocations: TargetAllocation;
  rebalanceTargets: Record<string, number>;
  updatedAt?: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  currency: 'THB',
  language: 'en',
  theme: 'dark',
  privacyMode: false,
  targetAllocations: {
    'us-stock': 40,
    'thai-stock': 30,
    crypto: 15,
    'mutual-fund': 15,
    bond: 0,
    'provident-fund': 0,
  },
  rebalanceTargets: {},
};
