import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { provideIonicAngular } from '@ionic/angular';
import { API_BASE_URL, MAX_BATCH_SIZE } from '@shared/config/api-config.token';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { mobileAuthInterceptor } from './interceptors/mobile-auth.interceptor';
import { NativePlatformService } from './services/native-platform.service';

export function resolveIonicMode(
  platform: string = Capacitor.getPlatform(),
  search: string = typeof window !== 'undefined' ? window.location.search : '',
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): 'ios' | 'md' {
  if (platform === 'android') return 'md';
  if (platform === 'ios') return 'ios';
  const modeMatch = /[?&]ionic:mode=(md|ios)\b/i.exec(search);
  if (modeMatch) {
    return modeMatch[1].toLowerCase() as 'ios' | 'md';
  }
  return /android/i.test(userAgent) ? 'md' : 'ios';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({
      mode: resolveIonicMode(),
      animated: true,
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mobileAuthInterceptor])),
    {
      provide: API_BASE_URL,
      useFactory: () => inject(NativePlatformService).resolveApiBaseUrl(),
    },
    { provide: MAX_BATCH_SIZE, useValue: environment.maxBatchSize },
  ],
};
