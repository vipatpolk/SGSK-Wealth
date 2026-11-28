<script setup lang="ts">
const props = defineProps<{
  label: string;
  amount: number;
  exchangeRate: number;
  highlight?: 'positive' | 'negative' | 'neutral';
}>();

const { settings } = useUserSettings();

const formatted = computed(() => {
  if (settings.value.privacyMode) return '••••••';
  const symbol = settings.value.currency === 'THB' ? '฿' : '$';
  const sign = props.amount < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(props.amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

const valueClass = computed(() => {
  if (props.highlight === 'positive') return 'text-emerald-400';
  if (props.highlight === 'negative') return 'text-rose-400';
  return 'text-[var(--color-text-primary)]';
});
</script>

<template>
  <div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
    <p class="text-xs font-medium text-[var(--color-text-secondary)]">{{ label }}</p>
    <p class="mt-1 text-xl font-semibold tracking-tight" :class="valueClass">{{ formatted }}</p>
    <SecondaryCurrency :amount="amount" :exchange-rate="exchangeRate" class="mt-1 block" />
  </div>
</template>
