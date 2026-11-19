import { Injectable, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { SUPABASE_CONFIG } from '../config/supabase-config.token';
import { TargetAllocation } from '../models/transaction.model';
import {
  AppCurrency,
  AppTheme,
  DEFAULT_USER_SETTINGS,
  SettingsSyncStatus,
} from '../models/user-settings.model';
import { AuthService } from './auth.service';
import { AppLang, I18nService } from './i18n.service';

export const THEME_STORAGE_KEY = 'sgsk_wealth_theme';
export const LEGACY_THEME_STORAGE_KEY = 'sharelot_theme';
export const CURRENCY_STORAGE_KEY = 'sgsk_wealth_currency';
export const PRIVACY_STORAGE_KEY = 'sgsk_wealth_privacy_mode';
export const LEGACY_PRIVACY_STORAGE_KEY = 'sharelot_privacy_mode';
export const TARGET_ALLOCATION_STORAGE_KEY = 'sgsk_wealth_target_allocation';
export const LEGACY_TARGET_ALLOCATION_STORAGE_KEY = 'sharelot_target_allocation';
export const REBALANCE_TARGETS_STORAGE_KEY = 'sgsk_wealth_tools_rebalance_targets';
export const LEGACY_REBALANCE_TARGETS_STORAGE_KEY = 'sharelot_tools_rebalance_targets';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly supabaseConfig = inject(SUPABASE_CONFIG, { optional: true });

  readonly displayCurrency = signal<AppCurrency>(this.loadInitialCurrency());
  readonly theme = signal<AppTheme>(this.loadInitialTheme());
  readonly privacyMode = signal<boolean>(this.loadInitialPrivacy());
  readonly targetAllocations = signal<TargetAllocation>(this.loadInitialTargetAllocations());
  readonly rebalanceTargets = signal<Record<string, number>>(this.loadInitialRebalanceTargets());
  readonly syncStatus = signal<SettingsSyncStatus>('local');

  private syncDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private lastHydratedUserId: string | null = null;
  private isHydratingFromRemote = false;

  constructor() {
    this.applyThemeDom(this.theme());
    this.applyPrivacyDom(this.privacyMode());
    void this.hydrateNativePreferences();

    effect(() => {
      const user = this.authService.user();
      if (!user) {
        this.lastHydratedUserId = null;
        this.syncStatus.set('local');
        return;
      }
      if (this.lastHydratedUserId !== user.id) {
        this.lastHydratedUserId = user.id;
        untracked(() => {
          void this.syncOnSignIn(user.id);
        });
      }
    });
  }

  private async hydrateNativePreferences(): Promise<void> {
    if (!this.supabaseConfig?.storage) return;
    try {
      const [savedTheme, savedCurrency, savedPrivacy, savedLang] = await Promise.all([
        this.supabaseConfig.storage.getItem(THEME_STORAGE_KEY),
        this.supabaseConfig.storage.getItem(CURRENCY_STORAGE_KEY),
        this.supabaseConfig.storage.getItem(PRIVACY_STORAGE_KEY),
        this.supabaseConfig.storage.getItem('sgsk_wealth_lang'),
      ]);

      if (!this.authService.isAuthenticated()) {
        if (savedTheme === 'dark' || savedTheme === 'light') {
          this.setTheme(savedTheme, false);
        }
        if (savedCurrency === 'THB' || savedCurrency === 'USD') {
          this.setCurrency(savedCurrency, false);
        }
        if (savedPrivacy === 'true' || savedPrivacy === 'false') {
          this.setPrivacyMode(savedPrivacy === 'true', false);
        }
        if (savedLang === 'en' || savedLang === 'th') {
          this.i18n.setLang(savedLang);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  setCurrency(currency: AppCurrency, scheduleCloudSync = true): void {
    this.displayCurrency.set(currency);
    this.persistValue(CURRENCY_STORAGE_KEY, currency);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  toggleCurrency(): void {
    this.setCurrency(this.displayCurrency() === 'THB' ? 'USD' : 'THB');
  }

  setLang(lang: AppLang, scheduleCloudSync = true): void {
    this.i18n.setLang(lang);
    this.persistValue('sgsk_wealth_lang', lang);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  toggleLang(): void {
    this.setLang(this.i18n.lang() === 'en' ? 'th' : 'en');
  }

  setTheme(theme: AppTheme, scheduleCloudSync = true): void {
    this.theme.set(theme);
    this.applyThemeDom(theme);
    this.persistValue(THEME_STORAGE_KEY, theme);
    this.persistValue(LEGACY_THEME_STORAGE_KEY, theme);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setPrivacyMode(privacy: boolean, scheduleCloudSync = true): void {
    this.privacyMode.set(privacy);
    this.applyPrivacyDom(privacy);
    const serialized = privacy ? 'true' : 'false';
    this.persistValue(PRIVACY_STORAGE_KEY, serialized);
    this.persistValue(LEGACY_PRIVACY_STORAGE_KEY, serialized);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  togglePrivacyMode(): void {
    this.setPrivacyMode(!this.privacyMode());
  }

  setTargetAllocations(targets: TargetAllocation, scheduleCloudSync = true): void {
    this.targetAllocations.set(targets);
    const json = JSON.stringify(targets);
    this.persistValue(TARGET_ALLOCATION_STORAGE_KEY, json);
    this.persistValue(LEGACY_TARGET_ALLOCATION_STORAGE_KEY, json);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  setRebalanceTargets(targets: Record<string, number>, scheduleCloudSync = true): void {
    this.rebalanceTargets.set(targets);
    const json = JSON.stringify(targets);
    this.persistValue(REBALANCE_TARGETS_STORAGE_KEY, json);
    this.persistValue(LEGACY_REBALANCE_TARGETS_STORAGE_KEY, json);
    if (scheduleCloudSync) {
      this.scheduleRemoteSync();
    }
  }

  private async syncOnSignIn(userId: string): Promise<void> {
    const client =
      this.authService.getSupabaseClient() ?? (await this.authService.getSupabaseClientAsync());
    if (!client) return;

    this.syncStatus.set('syncing');
    try {
      const { data, error } = await client
        .from('user_settings')
        .select(
          'currency, language, theme, privacy_mode, target_allocations, rebalance_targets, created_at, updated_at'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        this.syncStatus.set('error');
        return;
      }

      if (!data || data['created_at'] === data['updated_at']) {
        // Fresh account row: seed Supabase with user's current local preferences
        await this.pushToSupabase(userId);
        return;
      }

      this.isHydratingFromRemote = true;
      try {
        const remoteCurr = data['currency'];
        if (remoteCurr === 'THB' || remoteCurr === 'USD') {
          this.setCurrency(remoteCurr, false);
        }
        const remoteLang = data['language'];
        if (remoteLang === 'en' || remoteLang === 'th') {
          this.setLang(remoteLang, false);
        }
        const remoteTheme = data['theme'];
        if (remoteTheme === 'dark' || remoteTheme === 'light') {
          this.setTheme(remoteTheme, false);
        }
        if (typeof data['privacy_mode'] === 'boolean') {
          this.setPrivacyMode(data['privacy_mode'], false);
        }
        const remoteAlloc = data['target_allocations'];
        if (remoteAlloc && typeof remoteAlloc === 'object' && Object.keys(remoteAlloc).length > 0) {
          this.setTargetAllocations(remoteAlloc as TargetAllocation, false);
        }
        const remoteRebalance = data['rebalance_targets'];
        if (
          remoteRebalance &&
          typeof remoteRebalance === 'object' &&
          Object.keys(remoteRebalance).length > 0
        ) {
          this.setRebalanceTargets(remoteRebalance as Record<string, number>, false);
        }
      } finally {
        this.isHydratingFromRemote = false;
      }
      this.syncStatus.set('synced');
    } catch {
      this.syncStatus.set('error');
    }
  }

  private scheduleRemoteSync(): void {
    if (this.isHydratingFromRemote) return;
    const user = this.authService.user();
    if (!user || !this.authService.isConfigured) {
      this.syncStatus.set('local');
      return;
    }

    if (this.syncDebounceHandle !== null) {
      clearTimeout(this.syncDebounceHandle);
    }
    this.syncStatus.set('syncing');
    this.syncDebounceHandle = setTimeout(() => {
      this.syncDebounceHandle = null;
      void this.pushToSupabase(user.id);
    }, 300);
  }

  private async pushToSupabase(userId: string): Promise<void> {
    const client =
      this.authService.getSupabaseClient() ?? (await this.authService.getSupabaseClientAsync());
    if (!client) return;
    try {
      const { error } = await client.from('user_settings').upsert(
        {
          user_id: userId,
          currency: this.displayCurrency(),
          language: this.i18n.lang(),
          theme: this.theme(),
          privacy_mode: this.privacyMode(),
          target_allocations: this.targetAllocations(),
          rebalance_targets: this.rebalanceTargets(),
        },
        { onConflict: 'user_id' }
      );
      this.syncStatus.set(error ? 'error' : 'synced');
    } catch {
      this.syncStatus.set('error');
    }
  }

  private applyThemeDom(theme: AppTheme): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('ion-palette-dark', theme === 'dark');
    }
  }

  private applyPrivacyDom(privacy: boolean): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-privacy', privacy ? 'true' : 'false');
    }
  }

  private loadInitialCurrency(): AppCurrency {
    const saved = this.readLocal(CURRENCY_STORAGE_KEY);
    return saved === 'USD' || saved === 'THB' ? saved : DEFAULT_USER_SETTINGS.currency;
  }

  private loadInitialTheme(): AppTheme {
    const saved = this.readLocal(THEME_STORAGE_KEY) || this.readLocal(LEGACY_THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : DEFAULT_USER_SETTINGS.theme;
  }

  private loadInitialPrivacy(): boolean {
    const saved = this.readLocal(PRIVACY_STORAGE_KEY) || this.readLocal(LEGACY_PRIVACY_STORAGE_KEY);
    return saved === 'true';
  }

  private loadInitialTargetAllocations(): TargetAllocation {
    const saved =
      this.readLocal(TARGET_ALLOCATION_STORAGE_KEY) ||
      this.readLocal(LEGACY_TARGET_ALLOCATION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed as TargetAllocation;
        }
      } catch {
        // Fallback to default
      }
    }
    return { ...DEFAULT_USER_SETTINGS.targetAllocations };
  }

  private loadInitialRebalanceTargets(): Record<string, number> {
    const saved =
      this.readLocal(REBALANCE_TARGETS_STORAGE_KEY) ||
      this.readLocal(LEGACY_REBALANCE_TARGETS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, number>;
        }
      } catch {
        // Fallback to empty
      }
    }
    return {};
  }

  private readLocal(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore storage read errors
    }
    return null;
  }

  private persistValue(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage != null) {
        localStorage.setItem(key, value);
      }
      if (this.supabaseConfig?.storage) {
        void this.supabaseConfig.storage.setItem(key, value);
      }
    } catch {
      // Ignore storage write errors
    }
  }

  ngOnDestroy(): void {
    if (this.syncDebounceHandle !== null) {
      clearTimeout(this.syncDebounceHandle);
    }
  }
}
