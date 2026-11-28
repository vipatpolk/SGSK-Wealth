<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'fullscreen' | 'inline';
    statusTag?: string;
    title?: string;
    subtitle?: string;
  }>(),
  { variant: 'fullscreen', title: 'Loading Portfolio', statusTag: 'Portfolio Engine', subtitle: '' },
);
</script>

<template>
  <div
    :id="variant === 'fullscreen' ? 'loading-state' : undefined"
    :aria-label="title || 'Loading'"
    role="status"
    aria-live="polite"
    class="flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)] text-center"
    :class="variant === 'fullscreen' ? 'fixed inset-0 z-[var(--z-modal)]' : 'py-16'"
  >
    <div class="relative flex h-20 w-20 items-center justify-center">
      <div class="absolute inset-0 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
      <div class="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg">
        <img src="/brand-logo.png" alt="SGSK Wealth" class="h-9 w-9 object-contain" />
      </div>
    </div>
  </div>
</template>
