import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavService } from './nav.service';

describe('NavService', () => {
  let service: NavService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(NavService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should resolve SCBSFF correctly by falling back to project_info when class search returns non-matching items', async () => {
    let result: any;
    service.fetchFundNAVs(['SCBSFF']).subscribe((res) => {
      result = res;
    });

    // 1. Initial fund_class_name search returns items belonging to SCBSFFPLUS (no exact SCBSFF match)
    const req1 = httpMock.expectOne((req) => req.url.includes('fund_class_name=SCBSFF'));
    expect(req1.request.method).toBe('GET');
    req1.flush({
      items: [
        { proj_id: 'M0732_2556', proj_abbr_name: 'SCBSFFPLUS', fund_class_name: 'SCBSFFPLU(SSFE)' },
        { proj_id: 'M0732_2556', proj_abbr_name: 'SCBSFFPLUS', fund_class_name: 'SCBSFFPLUS-A' },
      ],
    });

    // 2. NavService falls back to project_info=SCBSFF
    const req2 = httpMock.expectOne((req) => req.url.includes('project_info=SCBSFF'));
    expect(req2.request.method).toBe('GET');
    req2.flush({
      items: [
        {
          proj_id: 'M0003_2539',
          proj_abbr_name: 'SCBSFF',
          proj_name_en: 'SCB Short Term Fixed Income Fund',
          fund_class_name: 'main',
        },
      ],
    });

    // 3. NavService fetches daily NAV for M0003_2539
    const req3 = httpMock.expectOne((req) => req.url.includes('proj_id=M0003_2539'));
    expect(req3.request.method).toBe('GET');
    req3.flush({
      items: [
        { proj_id: 'M0003_2539', fund_class_name: 'main', nav_date: '2026-07-31', last_val: 21.7135 },
        { proj_id: 'M0003_2539', fund_class_name: 'main', nav_date: '2026-07-30', last_val: 21.7133 },
      ],
    });

    // Wait a tick for delay / rxjs pipeline
    await new Promise((r) => setTimeout(r, 350));

    expect(result).toBeDefined();
    expect(result.has('SCBSFF')).toBe(true);
    const data = result.get('SCBSFF');
    expect(data.price).toBe(21.7135);
    expect(data.name).toBe('SCB Short Term Fixed Income Fund');
  });

  it('should resolve multi-class funds with exact fund_class_name match', async () => {
    let result: any;
    service.fetchFundNAVs(['SCBGOLDH-SSF']).subscribe((res) => {
      result = res;
    });

    // 1. fund_class_name search returns exact class match
    const req1 = httpMock.expectOne((req) => req.url.includes('fund_class_name=SCBGOLDH-SSF'));
    expect(req1.request.method).toBe('GET');
    req1.flush({
      items: [
        {
          proj_id: 'M0856_2553',
          proj_abbr_name: 'SCBGOLDHFUND',
          proj_name_en: 'SCB Gold THB Hedged Fund',
          fund_class_name: 'SCBGOLDH-SSF',
        },
      ],
    });

    // 2. NavService fetches daily NAV for M0856_2553
    const req2 = httpMock.expectOne((req) => req.url.includes('proj_id=M0856_2553'));
    expect(req2.request.method).toBe('GET');
    req2.flush({
      items: [
        { proj_id: 'M0856_2553', fund_class_name: 'SCBGOLDH-SSF', nav_date: '2026-07-31', last_val: 15.3633 },
      ],
    });

    await new Promise((r) => setTimeout(r, 350));

    expect(result).toBeDefined();
    expect(result.has('SCBGOLDH-SSF')).toBe(true);
    const data = result.get('SCBGOLDH-SSF');
    expect(data.price).toBe(15.3633);
  });
});
