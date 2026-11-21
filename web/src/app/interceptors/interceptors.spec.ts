import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '@shared/services/auth.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from '@app/interceptors/error.interceptor';

describe('HTTP Interceptors', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    authService.session.set(null);
    httpMock.verify();
  });

  it('should attach X-API-Key and application signature headers to backend API requests', async () => {
    const promise = firstValueFrom(http.get('/api/backend/share-lot/sheets'));

    const req = httpMock.expectOne('/api/backend/share-lot/sheets');
    expect(req.request.headers.has('X-API-Key')).toBe(true);
    expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);
    expect(req.request.headers.get('X-App-Source')).toBe('SGSK-Wealth');
    expect(req.request.headers.get('X-Requested-With')).toBe('SGSK-Wealth-Client');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
    await promise;
  });

  it('should attach Authorization Bearer token when session is active', async () => {
    authService.session.set({
      access_token: 'jwt-owner-token',
      user: { id: 'u1', email: 'vipatpolk@gmail.com' },
    } as any);

    const promise = firstValueFrom(http.get('/api/backend/portfolio/holdings'));
    const req = httpMock.expectOne('/api/backend/portfolio/holdings');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-owner-token');

    req.flush({});
    await promise;
  });

  it('should handle 401 and 403 error responses gracefully via errorInterceptor', async () => {
    const promise401 = firstValueFrom(http.get('/api/backend/share-lot/sheets'));
    const req401 = httpMock.expectOne('/api/backend/share-lot/sheets');
    req401.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expect(promise401).rejects.toMatchObject({ status: 401 });

    const promise403 = firstValueFrom(http.get('/api/backend/portfolio/holdings'));
    const req403 = httpMock.expectOne('/api/backend/portfolio/holdings');
    req403.flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    await expect(promise403).rejects.toMatchObject({ status: 403 });
  });
});
