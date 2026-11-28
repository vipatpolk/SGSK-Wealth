import { App, type PluginListenerHandle } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export type NativePlatform = 'ios' | 'android' | 'web';

export const DEFAULT_NATIVE_PROD_API_BASE_URL = 'https://sgsk-wealth.vercel.app/api/backend';

export function resolveNativeApiBaseUrl(
  platform: NativePlatform,
  configuredBaseUrl: string = '/api/v1',
  isProd: boolean = false,
  nativeProdApiBaseUrl: string = DEFAULT_NATIVE_PROD_API_BASE_URL,
): string {
  const trimmed = configuredBaseUrl.trim().replace(/\/$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const suffix = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (platform === 'android' || platform === 'ios') {
    if (isProd) {
      const prodBase = nativeProdApiBaseUrl.trim().replace(/\/$/, '');
      if (prodBase.startsWith('http://') || prodBase.startsWith('https://')) {
        return prodBase;
      }
      return DEFAULT_NATIVE_PROD_API_BASE_URL;
    }
    return platform === 'android'
      ? `http://10.0.2.2:8000${suffix}`
      : `http://127.0.0.1:8000${suffix}`;
  }
  return suffix || '/api/v1';
}

export function statusBarBackgroundColor(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? '#0B1220' : '#FFFFFF';
}

export function useNativePlatform() {
  function getPlatform(): NativePlatform {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') return platform;
    return 'web';
  }

  function isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  function resolveApiBaseUrl(
    configuredBaseUrl: string = '/api/v1',
    nativeProdApiBaseUrl?: string,
  ): string {
    const config = useRuntimeConfig();
    const prodNativeUrl =
      nativeProdApiBaseUrl ||
      String(config.public.nativeApiBaseUrl || DEFAULT_NATIVE_PROD_API_BASE_URL);
    return resolveNativeApiBaseUrl(getPlatform(), configuredBaseUrl, !import.meta.dev, prodNativeUrl);
  }

  async function hideSplashScreen(): Promise<void> {
    if (!isNative()) return;
    try {
      await SplashScreen.hide();
    } catch {
      // Ignore outside native shell
    }
  }

  async function syncStatusBar(theme: 'dark' | 'light'): Promise<void> {
    if (!isNative()) return;
    try {
      await StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light,
      });
      if (getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: statusBarBackgroundColor(theme),
        });
      }
    } catch {
      // Ignore outside native shell
    }
  }

  async function triggerHapticSelection(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.selectionChanged();
    } catch {
      // Ignore on unsupported devices
    }
  }

  async function triggerHapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!isNative()) return;
    try {
      const map: Record<'light' | 'medium' | 'heavy', ImpactStyle> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: map[style] });
    } catch {
      // Ignore on unsupported devices
    }
  }

  async function registerBackButtonHandler(
    onBack: () => boolean | Promise<boolean>,
  ): Promise<PluginListenerHandle | null> {
    if (!isNative() || getPlatform() !== 'android') return null;
    try {
      return await App.addListener('backButton', async ({ canGoBack }) => {
        if (await onBack()) return;
        if (canGoBack) {
          window.history.back();
        } else {
          await App.minimizeApp();
        }
      });
    } catch {
      return null;
    }
  }

  async function getPreference(key: string): Promise<string | null> {
    try {
      if (isNative()) {
        const { value } = await Preferences.get({ key });
        if (value !== null) return value;
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  async function setPreference(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      if (isNative()) {
        await Preferences.set({ key, value });
      }
    } catch {
      // Ignore storage errors
    }
  }

  async function removePreference(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      if (isNative()) {
        await Preferences.remove({ key });
      }
    } catch {
      // Ignore storage errors
    }
  }

  return {
    getPlatform,
    isNative,
    resolveApiBaseUrl,
    hideSplashScreen,
    syncStatusBar,
    triggerHapticSelection,
    triggerHapticImpact,
    registerBackButtonHandler,
    getPreference,
    setPreference,
    removePreference,
  };
}
