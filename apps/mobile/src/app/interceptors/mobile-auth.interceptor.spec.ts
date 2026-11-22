import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@shared/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { mobileAuthInterceptor } from './mobile-auth.interceptor';

describe('mobileAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mobileAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    authService.session.set(null);
  });

  afterEach(() => {
    authService.session.set(null);
    httpMock.verify();
  });

  it('attaches mobile signature, X-API-Key, and Bearer token when authenticated', async () => {
    authService.session.set({
      access_token: 'mobile-jwt-token',
      user: { id: 'u1', email: 'vipatpolk@gmail.com' },
    } as any);

    const promise = firstValueFrom(http.get('/api/backend/auth/me'));
    const req = httpMock.expectOne('/api/backend/auth/me');
    expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);
    expect(req.request.headers.get('X-App-Source')).toBe('SGSK-Wealth-Mobile');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mobile-jwt-token');

    req.flush({ authenticated: true });
    await promise;
  });

  it('omits Authorization header for guest requests', async () => {
    const promise = firstValueFrom(http.get('/api/backend/price/batch'));
    const req = httpMock.expectOne('/api/backend/price/batch');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await promise;
  });
});
