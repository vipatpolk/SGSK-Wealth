import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { I18nService } from './i18n.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { LocalizedDatePipe } from '../pipes/localized-date.pipe';
import { en } from '../i18n/en';
import { th } from '../i18n/th';

const LANG_STORAGE_KEY = 'sgsk_wealth_lang';

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  vi.stubGlobal('localStorage', mockStorage);
  return mockStorage;
}

@Component({
  standalone: true,
  imports: [TranslatePipe, LocalizedDatePipe],
  template: `
    <span id="pipe-text">{{ 'nav.dashboard' | t }}</span>
    <span id="pipe-param">{{ 'loading.titleTab' | t:{ tab: tabName() } }}</span>
    <span id="pipe-date">{{ dateStr() | ldate:'medium' }}</span>
  `,
})
class PipeHostComponent {
  readonly tabName = signal('All');
  readonly dateStr = signal('2026-11-15');
}

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    installMemoryLocalStorage();
    document.documentElement.lang = 'en';
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
    service.setLang('en');
    TestBed.flushEffects();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.lang = 'en';
  });

  it('should default to English on first visit', () => {
    expect(service.lang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should switch language, update html lang attribute, and persist to localStorage', () => {
    service.setLang('th');
    TestBed.flushEffects();
    expect(service.lang()).toBe('th');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('th');
    expect(document.documentElement.lang).toBe('th');

    service.setLang('en');
    TestBed.flushEffects();
    expect(service.lang()).toBe('en');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should restore persisted Thai language from localStorage on initialization', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(LANG_STORAGE_KEY, 'th');
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(I18nService);
    TestBed.flushEffects();
    expect(freshService.lang()).toBe('th');
    expect(document.documentElement.lang).toBe('th');
  });

  it('should translate keys and interpolate parameters in both EN and TH', () => {
    expect(service.t('nav.dashboard')).toBe('Dashboard');
    expect(service.t('loading.titleTab', { tab: 'All' })).toBe('Loading All');

    service.setLang('th');
    expect(service.t('nav.dashboard')).toBe(th['nav.dashboard']);
    expect(service.t('loading.titleTab', { tab: 'หุ้นไทย' })).toBe('กำลังโหลด หุ้นไทย');

    // Unknown key falls back to key string
    expect(service.t('nonexistent.translation.key')).toBe('nonexistent.translation.key');
  });

  it('should maintain 100% key parity between EN and TH translation dictionaries', () => {
    const enKeys = Object.keys(en).sort();
    const thKeys = Object.keys(th).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it('should format dates with Gregorian CE calendar in both EN and TH', () => {
    expect(service.formatDate('2026-11-15', 'medium')).toBe('Nov 15, 2026');
    expect(service.formatDate('2026-11', 'monthYear')).toBe('Nov 2026');
    expect(service.formatDate(null)).toBe('');
    expect(service.formatDate(undefined)).toBe('');
    expect(service.formatDate('not-a-date')).toBe('not-a-date');

    service.setLang('th');
    const thMedium = service.formatDate('2026-11-15', 'medium');
    expect(thMedium).toContain('2026');
    expect(thMedium).toContain('15');
    expect(thMedium).not.toContain('2569');

    const thMonthYear = service.formatDate('2026-11', 'monthYear');
    expect(thMonthYear).toContain('2026');
    expect(thMonthYear).not.toContain('2569');
  });
});

describe('TranslatePipe & LocalizedDatePipe', () => {
  let fixture: ComponentFixture<PipeHostComponent>;
  let i18n: I18nService;

  beforeEach(async () => {
    installMemoryLocalStorage();
    await TestBed.configureTestingModule({
      imports: [PipeHostComponent],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLang('en');
    fixture = TestBed.createComponent(PipeHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    i18n.setLang('en');
    vi.unstubAllGlobals();
  });

  it('should dynamically re-render translated strings and dates when language toggles', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#pipe-text')?.textContent?.trim()).toBe('Dashboard');
    expect(el.querySelector('#pipe-param')?.textContent?.trim()).toBe('Loading All');
    expect(el.querySelector('#pipe-date')?.textContent?.trim()).toBe('Nov 15, 2026');

    i18n.setLang('th');
    fixture.componentInstance.tabName.set('หุ้นไทย');
    fixture.detectChanges();

    expect(el.querySelector('#pipe-text')?.textContent?.trim()).toBe(th['nav.dashboard']);
    expect(el.querySelector('#pipe-param')?.textContent?.trim()).toBe('กำลังโหลด หุ้นไทย');
    const renderedDate = el.querySelector('#pipe-date')?.textContent?.trim() || '';
    expect(renderedDate).toContain('2026');
    expect(renderedDate).not.toContain('2569');
  });
});
