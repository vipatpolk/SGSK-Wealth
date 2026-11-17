import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { environment } from '../../environments/environment';

export type NativePlatform = 'ios' | 'android' | 'web';

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
    const platform = this.getPlatform();
    if (platform === 'android') {
      return environment.nativeAndroidApiBaseUrl;
    }
    if (platform === 'ios') {
      return environment.nativeIosApiBaseUrl;
    }
    return environment.apiBaseUrl;
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
          color: theme === 'dark' ? '#0b0d14' : '#f5f7fa',
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
}
