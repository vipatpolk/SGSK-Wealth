<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string;
    subtext?: string;
    tone?: 'default' | 'positive' | 'negative';
    masked?: boolean;
    secondaryAmount?: number;
    exchangeRate?: number;
    hasRate?: boolean;
    secondarySigned?: boolean;
    displayCurrency?: string;
  }>(),
  {
    subtext: undefined,
    tone: 'default',
    masked: false,
    secondaryAmount: undefined,
    exchangeRate: 0,
    hasRate: false,
    secondarySigned: false,
    displayCurrency: undefined,
  },
);
</script>

<template>
  <div class="kpi-card flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3.5 sm:p-4">
    <span class="kpi-label text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{{ label }}</span>
    <span
      class="font-mono text-lg font-bold tracking-tight sm:text-xl"
      :class="[
        masked ? 'privacy-mask' : '',
        tone === 'positive'
          ? 'pl-positive'
          : tone === 'negative'
            ? 'pl-negative'
            : 'text-[var(--color-text-primary)]',
      ]"
    >
      {{ value }}
    </span>
    <SecondaryCurrency
      v-if="secondaryAmount !== undefined && (hasRate || exchangeRate > 0)"
      :amount="secondaryAmount"
      :exchange-rate="exchangeRate"
      :has-rate="hasRate"
      :signed="secondarySigned"
      :display-currency="displayCurrency"
      variant="kpi"
    />
    <span v-if="subtext" class="text-[11px] text-[var(--color-text-muted)]">{{ subtext }}</span>
    <slot />
  </div>
</template>
