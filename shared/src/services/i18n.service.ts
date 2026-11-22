import { Injectable, effect, signal } from '@angular/core';
import type { AppLang } from '../../../packages/contracts/src/common.model';
import { en, TranslationKey } from '../i18n/en';
import { th } from '../i18n/th';

export type { AppLang };

export const LANG_STORAGE_KEY = 'sgsk_wealth_lang';

const DICTIONARIES: Record<AppLang, Record<TranslationKey, string>> = {
  en,
  th,
};

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  readonly lang = signal<AppLang>(this.loadInitialLang());

  constructor() {
    effect(() => {
      const current = this.lang();
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = current;
      }
    });
  }

  private loadInitialLang(): AppLang {
    if (typeof localStorage !== 'undefined' && localStorage != null) {
      try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved === 'th' || saved === 'en') {
          return saved;
        }
      } catch {
        // Ignore storage read errors
      }
    }
    return 'en';
  }

  setLang(lang: AppLang): void {
    this.lang.set(lang);
    if (typeof localStorage !== 'undefined' && localStorage != null) {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore storage write errors
      }
    }
  }

  t(key: TranslationKey | string, params?: Record<string, string | number>): string {
    const activeLang = this.lang();
    const dict = DICTIONARIES[activeLang] as Record<string, string>;
    const fallback = en as Record<string, string>;
    let text = dict[key] ?? fallback[key] ?? key;

    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }
    }
    return text;
  }

  /**
   * Format date string/Date strictly using Gregorian calendar year (CE)
   * even when Thai language ('th') is active.
   */
  formatDate(
    value: string | Date | number | null | undefined,
    style: 'medium' | 'short' | 'monthYear' = 'medium'
  ): string {
    if (value === null || value === undefined || value === '') return '';

    const activeLang = this.lang();
    const locale = activeLang === 'th' ? 'th-TH-u-ca-gregory' : 'en-US';

    let parsedDate: Date | null = null;
    if (value instanceof Date) {
      parsedDate = isNaN(value.getTime()) ? null : value;
    } else if (typeof value === 'number') {
      const d = new Date(value);
      parsedDate = isNaN(d.getTime()) ? null : d;
    } else {
      const str = String(value).trim();
      const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
      const isoMonthMatch = /^(\d{4})-(\d{2})$/.exec(str);
      if (isoDateMatch) {
        parsedDate = new Date(
          parseInt(isoDateMatch[1], 10),
          parseInt(isoDateMatch[2], 10) - 1,
          parseInt(isoDateMatch[3], 10)
        );
      } else if (isoMonthMatch) {
        parsedDate = new Date(
          parseInt(isoMonthMatch[1], 10),
          parseInt(isoMonthMatch[2], 10) - 1,
          1
        );
        style = 'monthYear';
      } else {
        const d = new Date(str);
        parsedDate = isNaN(d.getTime()) ? null : d;
      }
    }

    if (!parsedDate) return String(value);

    const options: Intl.DateTimeFormatOptions =
      style === 'monthYear'
        ? { month: 'short', year: 'numeric' }
        : style === 'short'
          ? { day: 'numeric', month: 'short', year: '2-digit' }
          : { day: 'numeric', month: 'short', year: 'numeric' };

    return new Intl.DateTimeFormat(locale, options).format(parsedDate);
  }

  formatMonthYear(year: number, monthIndex: number): string {
    const locale = this.lang() === 'th' ? 'th-TH-u-ca-gregory' : 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(year, monthIndex, 1)
    );
  }
}
