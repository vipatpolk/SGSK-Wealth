<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    padded?: boolean;
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    padded: true,
  },
);
</script>

<template>
  <section
    class="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-colors"
    :class="padded ? 'p-4 sm:p-5' : ''"
  >
    <header v-if="title || $slots.header || $slots.actions" class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div v-if="title || subtitle || $slots.header" class="min-w-0">
        <slot name="header">
          <h3 v-if="title" class="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 text-xs text-[var(--color-text-muted)]">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
