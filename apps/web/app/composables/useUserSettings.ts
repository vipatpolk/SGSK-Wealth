import type { AppCurrency, AppLang, AppTheme } from '@sgsk-wealth/contracts';

export interface NuxtUserSettings {
  currency: AppCurrency;
  language: AppLang;
  theme: AppTheme;
  privacyMode: boolean;
  targetAllocations?: Record<string, number>;
  rebalanceTargets?: Record<string, Record<string, number>>;
}

export type SettingsSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

const STORAGE_KEY = 'sgsk_nuxt_settings_v1';

const DEFAULT_SETTINGS: NuxtUserSettings = {
  currency: 'THB',
  language: 'en',
  theme: 'dark',
  privacyMode: false,
};

function resolveDomTheme(theme: AppTheme): 'dark' | 'light' {
  if (theme === 'system' && typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme === 'light' ? 'light' : 'dark';
}

function applySettingsToDom(s: NuxtUserSettings) {
  if (typeof document === 'undefined') return;
  const resolved = resolveDomTheme(s.theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = s.theme;
  document.documentElement.dataset.privacy = s.privacyMode ? 'true' : 'false';
  document.documentElement.lang = s.language;
  void useNativePlatform().syncStatusBar(resolved);
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function useUserSettings() {
  const settings = useState<NuxtUserSettings>('user-settings', () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
        const legacyTheme = localStorage.getItem('sgsk_wealth_theme') as AppTheme | null;
        const legacyLang = localStorage.getItem('sgsk_wealth_lang') as AppLang | null;
        return {
          ...DEFAULT_SETTINGS,
          ...(legacyTheme ? { theme: legacyTheme } : {}),
          ...(legacyLang ? { language: legacyLang } : {}),
        };
      } catch {
        // Ignore malformed localStorage
      }
    }
    return { ...DEFAULT_SETTINGS };
  });

  const syncStatus = useState<SettingsSyncStatus>('user-settings-sync', () => 'local');

  if (typeof document !== 'undefined') {
    applySettingsToDom(settings.value);
  }

  async function pushToSupabase(userId: string) {
    const client = useAuth().getSupabaseClient();
    if (!client) {
      syncStatus.value = 'local';
      return;
    }
    syncStatus.value = 'syncing';
    try {
      const payload = {
        user_id: userId,
        currency: settings.value.currency,
        language: settings.value.language,
        theme: settings.value.theme,
        privacy_mode: settings.value.privacyMode,
        ...(settings.value.targetAllocations ? { target_allocations: settings.value.targetAllocations } : {}),
        ...(settings.value.rebalanceTargets ? { rebalance_targets: settings.value.rebalanceTargets } : {}),
      };
      let { error } = await client.from('user_settings').upsert(payload, { onConflict: 'user_id' });
      if (error && payload.theme === 'system') {
        const fallback = await client
          .from('user_settings')
          .upsert({ ...payload, theme: resolveDomTheme(settings.value.theme) }, { onConflict: 'user_id' });
        error = fallback.error;
      }
      syncStatus.value = error ? 'error' : 'synced';
    } catch {
      syncStatus.value = 'error';
    }
  }

  async function syncOnSignIn(userId: string | null) {
    if (!userId) {
      syncStatus.value = 'local';
      return;
    }
    const client = useAuth().getSupabaseClient();
    if (!client) {
      syncStatus.value = 'local';
      return;
    }
    syncStatus.value = 'syncing';
    try {
      const { data, error } = await client
        .from('user_settings')
        .select('currency, language, theme, privacy_mode, target_allocations, rebalance_targets, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        syncStatus.value = 'error';
        return;
      }

      if (!data || data.created_at === data.updated_at) {
        await pushToSupabase(userId);
        return;
      }

      settings.value = {
        currency: (data.currency as AppCurrency) || settings.value.currency,
        language: (data.language as AppLang) || settings.value.language,
        theme: (data.theme as AppTheme) || settings.value.theme,
        privacyMode: typeof data.privacy_mode === 'boolean' ? data.privacy_mode : settings.value.privacyMode,
        targetAllocations:
          (data.target_allocations as Record<string, number> | null) ?? settings.value.targetAllocations,
        rebalanceTargets:
          (data.rebalance_targets as Record<string, Record<string, number>> | null) ?? settings.value.rebalanceTargets,
      };
      const serialized = JSON.stringify(settings.value);
      void useNativePlatform().setPreference(STORAGE_KEY, serialized);
      applySettingsToDom(settings.value);
      syncStatus.value = 'synced';
    } catch {
      syncStatus.value = 'error';
    }
  }

  function persist() {
    const serialized = JSON.stringify(settings.value);
    void useNativePlatform().setPreference(STORAGE_KEY, serialized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sgsk_wealth_theme', settings.value.theme);
      localStorage.setItem('sgsk_wealth_lang', settings.value.language);
    }
    applySettingsToDom(settings.value);

    const { authState } = useAuth();
    if (authState.value.authenticated && authState.value.userId) {
      const uid = authState.value.userId;
      syncStatus.value = 'syncing';
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(() => {
        void pushToSupabase(uid);
      }, 300);
    }
  }

  function setCurrency(currency: AppCurrency) {
    settings.value.currency = currency;
    persist();
  }

  function toggleCurrency() {
    setCurrency(settings.value.currency === 'THB' ? 'USD' : 'THB');
  }

  function setLanguage(language: AppLang) {
    settings.value.language = language;
    persist();
  }

  function toggleLanguage() {
    setLanguage(settings.value.language === 'en' ? 'th' : 'en');
  }

  function setTheme(theme: AppTheme) {
    settings.value.theme = theme;
    persist();
  }

  function toggleTheme() {
    setTheme(settings.value.theme === 'dark' ? 'light' : 'dark');
  }

  function togglePrivacyMode() {
    settings.value.privacyMode = !settings.value.privacyMode;
    persist();
  }

  function setTargetAllocations(targets: Record<string, number>) {
    settings.value.targetAllocations = { ...targets };
    persist();
  }

  function setRebalanceTargets(targets: Record<string, Record<string, number>>) {
    settings.value.rebalanceTargets = { ...targets };
    persist();
  }

  return {
    settings,
    syncStatus,
    syncOnSignIn,
    setCurrency,
    toggleCurrency,
    setLanguage,
    toggleLanguage,
    setTheme,
    toggleTheme,
    togglePrivacyMode,
    setTargetAllocations,
    setRebalanceTargets,
  };
}
