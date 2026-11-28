<script setup lang="ts">
import { convertToSecondaryCurrency, getSecondaryCurrency } from '@sgsk-wealth/domain';

const props = withDefaults(
  defineProps<{
    amount: number;
    exchangeRate: number;
    displayCurrency?: string;
    hasRate?: boolean;
    variant?: 'inline' | 'kpi' | 'header' | 'compact' | 'table' | 'hero' | 'default';
    signed?: boolean;
    parens?: boolean;
    digitsInfo?: string;
  }>(),
  {
    displayCurrency: undefined,
    hasRate: true,
    variant: 'default',
    signed: false,
    parens: false,
    digitsInfo: '1.2-2',
  },
);

const { settings } = useUserSettings();

const baseCurrency = computed(() =>
  (props.displayCurrency || settings.value.currency).toUpperCase() === 'USD' ? 'USD' : 'THB',
);
const secondaryCurrency = computed(() => getSecondaryCurrency(baseCurrency.value));
const converted = computed(() =>
  convertToSecondaryCurrency(props.amount, baseCurrency.value, props.exchangeRate),
);

const fractionDigits = computed(() => (props.digitsInfo === '1.0-0' ? 0 : 2));

const formatted = computed(() => {
  if (settings.value.privacyMode) return '••••••';
  const sym = secondaryCurrency.value === 'THB' ? '฿' : '$';
  const val = Number.isFinite(converted.value) ? converted.value : 0;
  const sign = props.signed ? (val >= 0 ? '+' : '-') : val < 0 ? '-' : '';
  const body = `${sign}${sym}${Math.abs(val).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits.value,
    maximumFractionDigits: fractionDigits.value,
  })}`;
  return props.parens ? `(≈ ${body})` : `≈ ${body}`;
});
</script>

<template>
  <span
    v-if="hasRate || exchangeRate > 0"
    class="secondary-currency privacy-mask font-mono text-[11px] font-medium text-[var(--color-text-muted)]"
    :class="variant === 'hero' ? 'text-xs' : ''"
  >
    {{ formatted }}
  </span>
</template>
