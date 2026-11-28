<script setup lang="ts">
import { displaySymbol, getSymbolColor } from '@sgsk-wealth/domain';

const props = withDefaults(
  defineProps<{
    symbol: string;
    assetType?: string;
    size?: number;
    shape?: 'circle' | 'rounded';
    alt?: string;
  }>(),
  {
    assetType: '',
    size: 36,
    shape: 'rounded',
    alt: '',
  },
);

const config = useRuntimeConfig();
const nativePlatform = useNativePlatform();
const baseUrl = nativePlatform.resolveApiBaseUrl(String(config.public.apiBaseUrl || '/api/v1'));

const isLoaded = ref(false);
const hasError = ref(false);

const cleanSymbol = computed(() => displaySymbol(props.symbol || '').trim());
const monogram = computed(() => cleanSymbol.value.slice(0, 3).toUpperCase() || '?');
const brandColor = computed(() => getSymbolColor(props.symbol || ''));
const isMutualFund = computed(
  () =>
    props.assetType === 'mutual-fund' ||
    props.assetType === 'provident-fund' ||
    props.symbol.toUpperCase().endsWith('.FUND') ||
    props.symbol.toUpperCase().endsWith('.BKFUND'),
);
const iconUrl = computed(() =>
  cleanSymbol.value ? `${baseUrl}/icon/${encodeURIComponent(props.symbol)}` : '',
);
const fontSize = computed(() => Math.max(10, Math.round(props.size * 0.34)));

watch(
  () => props.symbol,
  () => {
    isLoaded.value = false;
    hasError.value = false;
  },
);
</script>

<template>
  <div
    class="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
    :class="shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-sm)]'"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
    :aria-label="alt || symbol"
  >
    <img
      v-if="iconUrl && !hasError"
      :src="iconUrl"
      :alt="alt || symbol"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-contain transition-opacity duration-150"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
      @load="isLoaded = true"
      @error="hasError = true"
    />

    <template v-if="hasError || !iconUrl || !isLoaded">
      <div
        v-if="isMutualFund"
        class="absolute inset-0 flex items-center justify-center border"
        :class="shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-sm)]'"
        :style="{
          backgroundColor: `${brandColor}18`,
          color: brandColor,
          borderColor: `${brandColor}30`,
        }"
        :title="`Mutual Fund: ${symbol}`"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-[58%] w-[58%]">
          <path d="M3 21h18" />
          <path d="M3 10h18" />
          <path d="M5 6l7-3 7 3" />
          <path d="M4 10v11" />
          <path d="M20 10v11" />
          <path d="M8 14v4" />
          <path d="M12 14v4" />
          <path d="M16 14v4" />
        </svg>
      </div>
      <div
        v-else
        class="symbol-monogram absolute inset-0 flex items-center justify-center border font-mono font-bold"
        :class="shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-sm)]'"
        :style="{
          backgroundColor: `${brandColor}18`,
          color: brandColor,
          borderColor: `${brandColor}35`,
        }"
      >
        {{ ` ${monogram} ` }}
      </div>
    </template>
  </div>
</template>
