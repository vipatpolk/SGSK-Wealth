import type { AppLang } from '@sgsk-wealth/contracts';
import { en } from '~/i18n/en';
import { th } from '~/i18n/th';

const DICTIONARY: Record<AppLang, Record<string, string>> = {
  en,
  th,
};

export function translateKey(
  lang: AppLang,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = DICTIONARY[lang]?.[key] ?? DICTIONARY.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function useI18n() {
  const { settings } = useUserSettings();
  const t = (key: string, params?: Record<string, string | number>) =>
    translateKey(settings.value.language, key, params);
  return { t, language: computed(() => settings.value.language) };
}
