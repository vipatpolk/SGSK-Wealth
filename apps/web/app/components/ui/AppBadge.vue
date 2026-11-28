<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent';
    color?: string;
  }>(),
  {
    tone: 'neutral',
    color: undefined,
  },
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-tight"
    :style="
      color
        ? { backgroundColor: `${color}18`, color, borderColor: `${color}38` }
        : undefined
    "
    :class="
      color
        ? ''
        : tone === 'positive'
          ? 'bg-[var(--color-pl-positive-soft)] text-[var(--color-pl-positive)] border-[var(--color-pl-positive-border)]'
          : tone === 'negative'
            ? 'bg-[var(--color-pl-negative-soft)] text-[var(--color-pl-negative)] border-[var(--color-pl-negative-border)]'
            : tone === 'warning'
              ? 'bg-[var(--color-financial-warning-soft)] text-[var(--color-financial-warning)] border-[var(--color-financial-warning-border)]'
              : tone === 'info' || tone === 'accent'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-financial-info-border)]'
                : 'bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
    "
  >
    <slot />
  </span>
</template>
