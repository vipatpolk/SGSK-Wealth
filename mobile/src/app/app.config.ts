import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { API_BASE_URL, MAX_BATCH_SIZE } from '@shared/config/api-config.token';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { mobileAuthInterceptor } from './interceptors/mobile-auth.interceptor';
import { NativePlatformService } from './services/native-platform.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mobileAuthInterceptor])),
    {
      provide: API_BASE_URL,
      useFactory: () => inject(NativePlatformService).resolveApiBaseUrl(),
    },
    { provide: MAX_BATCH_SIZE, useValue: environment.maxBatchSize },
  ],
};
