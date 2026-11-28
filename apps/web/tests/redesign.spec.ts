import { describe, expect, it } from 'vitest';
import { formatDisplayDate, formatMoney, formatPercent, formatSignedMoney } from '../app/composables/useFormatters';

describe('Nuxt Redesign Formatters & Safety Guards', () => {
  it('formats money, signed money, and percent safely on finite and non-finite inputs', () => {
    expect(formatMoney(1250.5, 'USD')).toBe('$1,250.50');
    expect(formatMoney(Number.NaN, 'THB')).toBe('฿0.00');
    expect(formatSignedMoney(-45.2, 'USD')).toBe('-$45.20');
    expect(formatSignedMoney(45.2, 'THB')).toBe('+฿45.20');
    expect(formatPercent(12.345)).toBe('+12.35%');
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('+0.00%');
  });

  it('formats ISO dates cleanly in EN and TH locales', () => {
    expect(formatDisplayDate('2024-01-15', 'en')).toContain('Jan');
    expect(formatDisplayDate('2024-01-15', 'en')).toContain('2024');
    expect(formatDisplayDate('', 'en')).toBe('');
  });
});
