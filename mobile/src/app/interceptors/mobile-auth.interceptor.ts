import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const mobileAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackendRequest =
    req.url.includes('/api/backend') ||
    req.url.startsWith('/share-lot') ||
    req.url.startsWith('/price') ||
    req.url.startsWith('/nav');

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
