import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SupabaseStorageAdapter } from '@shared/config/supabase-config.token';
import { environment } from '../../environments/environment';

export type NativePlatform = 'ios' | 'android' | 'web';

export function resolveMobileApiBaseUrl(
  platform: NativePlatform,
  isProduction: boolean,
  endpoints: typeof environment = environment
): string {
  if (platform !== 'web' && isProduction) {
    return endpoints.nativeApiBaseUrl;
  }
  if (platform === 'android') {
    return endpoints.nativeAndroidApiBaseUrl;
  }
  if (platform === 'ios') {
    return endpoints.nativeIosApiBaseUrl;
  }
  return endpoints.apiBaseUrl;
}

@Injectable({
  providedIn: 'root',
})
export class NativePlatformService {
  getPlatform(): NativePlatform {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
    return 'web';
  }

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  resolveApiBaseUrl(): string {
    return resolveMobileApiBaseUrl(this.getPlatform(), environment.production);
  }

  async hideSplashScreen(): Promise<void> {
    if (!this.isNative()) return;
    try {
      await SplashScreen.hide();
    } catch {
      // Ignore on environments where SplashScreen is unavailable
    }
  }

  async syncStatusBar(theme: 'dark' | 'light'): Promise<void> {
    if (!this.isNative()) return;
    try {
      await StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light,
      });
      if (this.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: theme === 'dark' ? '#0b0d14' : '#ffffff',
        });
      }
    } catch {
      // Ignore status bar errors outside native container
    }
  }

  async triggerHapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.isNative()) return;
    try {
      const impactMap: Record<'light' | 'medium' | 'heavy', ImpactStyle> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: impactMap[style] });
    } catch {
      // Ignore haptics errors on unsupported devices
    }
  }

  async triggerHapticSelection(): Promise<void> {
    if (!this.isNative()) return;
    try {
      await Haptics.selectionChanged();
    } catch {
      // Ignore haptics errors on unsupported devices
    }
  }

  async registerBackButtonHandler(onBack: () => boolean | Promise<boolean>): Promise<PluginListenerHandle | null> {
    if (!this.isNative() || this.getPlatform() !== 'android') {
      return null;
    }
    try {
      return await App.addListener('backButton', async ({ canGoBack }) => {
        const handled = await onBack();
        if (handled) return;
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

  async getPreference(key: string): Promise<string | null> {
    try {
      if (this.isNative()) {
        const { value } = await Preferences.get({ key });
        if (value !== null) return value;
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // Ignore storage read errors
    }
    return null;
  }

  async setPreference(key: string, value: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      if (this.isNative()) {
        await Preferences.set({ key, value });
      }
    } catch {
      // Ignore storage write errors
    }
  }

  async removePreference(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      if (this.isNative()) {
        await Preferences.remove({ key });
      }
    } catch {
      // Ignore storage remove errors
    }
  }

  createSupabaseStorageAdapter(): SupabaseStorageAdapter {
    return {
      getItem: (key: string) => this.getPreference(key),
      setItem: (key: string, value: string) => this.setPreference(key, value),
      removeItem: (key: string) => this.removePreference(key),
    };
  }

  async openExternalAuthUrl(url: string): Promise<void> {
    if (this.isNative()) {
      await Browser.open({ url, presentationStyle: 'popover' });
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign(url);
    }
  }

  async closeExternalAuthUrl(): Promise<void> {
    if (!this.isNative()) return;
    try {
      await Browser.close();
    } catch {
      // Ignore if browser is already closed or unsupported
    }
  }

  async getInitialAuthUrl(): Promise<string | null> {
    if (!this.isNative()) return null;
    try {
      const launch = await App.getLaunchUrl();
      return launch?.url ?? null;
    } catch {
      return null;
    }
  }

  async registerAuthUrlListener(callback: (url: string) => void): Promise<() => void> {
    if (!this.isNative()) {
      return () => undefined;
    }
    try {
      const handle = await App.addListener('appUrlOpen', ({ url }) => {
        if (url) {
          void Browser.close().catch(() => undefined);
          callback(url);
        }
      });
      return () => {
        void handle.remove();
      };
    } catch {
      return () => undefined;
    }
  }
}
