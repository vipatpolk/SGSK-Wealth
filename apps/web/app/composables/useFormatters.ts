export function formatMoney(amount: number, currency: string = 'THB'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const sym = currency.toUpperCase() === 'USD' ? '$' : '฿';
  const sign = safe < 0 ? '-' : '';
  return `${sign}${sym}${Math.abs(safe).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedMoney(amount: number, currency: string = 'THB'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const prefix = safe >= 0 ? '+' : '';
  return `${prefix}${formatMoney(safe, currency)}`;
}

export function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const prefix = safe >= 0 ? '+' : '';
  return `${prefix}${safe.toFixed(2)}%`;
}

export function formatDisplayDate(dateStr: string, lang: 'en' | 'th' = 'en'): string {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
