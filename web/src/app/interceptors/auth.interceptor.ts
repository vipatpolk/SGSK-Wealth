import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@shared/services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService, { optional: true });
  const isBackendRequest =
    req.url.includes('/api/backend') ||
    req.url.startsWith('/share-lot') ||
    req.url.startsWith('/price') ||
    req.url.startsWith('/nav') ||
    req.url.startsWith('/portfolio') ||
    req.url.startsWith('/auth');

  if (isBackendRequest) {
    const headers: Record<string, string> = {
      'X-App-Source': 'SGSK-Wealth',
      'X-Requested-With': 'SGSK-Wealth-Client',
    };

    if (environment.apiKey) {
      headers['X-API-Key'] = environment.apiKey;
    }

    const token = authService?.getAccessToken();
    if (token && !req.headers.has('Authorization')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const authReq = req.clone({ setHeaders: headers });
    return next(authReq);
  }
  return next(req);
};
