// ============================================
// 環島コックピット - i18n ストア & フック
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from '@/lib/store/storage';
import translations, { type Locale } from './translations';

type I18nState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'ja',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'huandao-i18n',
      storage: createJSONStorage(() => crossPlatformStorage),
    }
  )
);

/** 現在のロケールに対応する翻訳オブジェクトを返すフック */
export function useT() {
  const locale = useI18nStore((s) => s.locale);
  return translations[locale];
}

export { type Locale } from './translations';
