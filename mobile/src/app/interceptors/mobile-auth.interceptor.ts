import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const mobileAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const configuredNativeBases = [
    environment.nativeApiBaseUrl,
    environment.nativeAndroidApiBaseUrl,
    environment.nativeIosApiBaseUrl,
  ].filter(Boolean);

  const isBackendRequest =
    req.url.includes('/api/backend') ||
    configuredNativeBases.some((base) => req.url.startsWith(base)) ||
    ['/share-lot', '/price', '/nav', '/portfolio', '/tools', '/icon'].some((prefix) =>
      req.url.startsWith(prefix),
    );

  if (!isBackendRequest) {
    return next(req);
  }

  const headers: Record<string, string> = {
    'X-App-Source': 'SGSK-Wealth-Mobile',
    'X-Requested-With': 'SGSK-Wealth-Capacitor',
  };

  if (environment.apiKey) {
    headers['X-API-Key'] = environment.apiKey;
  }

  return next(req.clone({ setHeaders: headers }));
};
