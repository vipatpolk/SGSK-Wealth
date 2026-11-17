import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackendRequest =
    req.url.includes('/api/backend') ||
    req.url.startsWith('/share-lot') ||
    req.url.startsWith('/price') ||
    req.url.startsWith('/nav');

  if (isBackendRequest) {
    const headers: Record<string, string> = {
      'X-App-Source': 'SGSK-Wealth',
      'X-Requested-With': 'SGSK-Wealth-Client',
    };

    if (environment.apiKey) {
      headers['X-API-Key'] = environment.apiKey;
    }

    const authReq = req.clone({ setHeaders: headers });
    return next(authReq);
  }
  return next(req);
};
