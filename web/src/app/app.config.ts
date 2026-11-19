import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL, MAX_BATCH_SIZE } from '@shared/config/api-config.token';
import { SUPABASE_CONFIG } from '@shared/config/supabase-config.token';
import { AuthService } from '@shared/services/auth.service';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAppInitializer(() => {
      inject(AuthService).captureInitialCallbackUrl();
    }),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: MAX_BATCH_SIZE, useValue: environment.maxBatchSize },
    {
      provide: SUPABASE_CONFIG,
      useFactory: () => ({
        url: environment.supabaseUrl,
        publishableKey: environment.supabasePublishableKey,
        redirectUrl:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : 'http://localhost:4200/auth/callback',
        isNative: false,
      }),
    },
  ],
};
