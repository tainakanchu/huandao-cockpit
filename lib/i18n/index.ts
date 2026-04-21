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
      setLocale: (locale) => {
        set({ locale });
        // Lazy-import to avoid circular dep (planStore imports from i18n).
        // When locale changes and a plan is active, regenerate so advisory /
        // supply reasons are in the new language.
        import('@/lib/store/planStore').then(({ usePlanStore }) => {
          if (usePlanStore.getState().selectedGoal) {
            usePlanStore.getState().refreshWeather().catch(() => {});
          }
        });
      },
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
