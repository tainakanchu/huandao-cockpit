// ============================================
// 環島コックピット - DayPlan ストア
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  DayPlan,
  GoalCandidate,
  WeatherSegment,
  SunTimes,
  DifficultyLevel,
  RiskSummary,
} from '@/lib/types';
import { fetchRouteWeather } from '@/lib/api/weather';
import { generateDayPlan } from '@/lib/logic/dayplan';
import { generateAdvisoryCards } from '@/lib/logic/advisory';
import { useI18nStore } from '@/lib/i18n';
import { getCheckpointsInRange } from '@/lib/data/checkpoints';
import { getHazardsInRange } from '@/lib/data/hazards';
import { getRouteElevationProfile } from '@/lib/data/route';
import { crossPlatformStorage } from '@/lib/store/storage';

type PlanState = {
  // State
  currentKm: number;
  dayNumber: number;
  selectedGoal: GoalCandidate | null;
  dayPlan: DayPlan | null;
  sunTimes: SunTimes | null;
  isLoading: boolean;
  /** Target ride date (local). Used to pick which day's weather / sun data to display. */
  rideDate: Date;

  // Preserved from existing store for backward compatibility
  difficultyLevel: DifficultyLevel;
  riskSummary: RiskSummary | null;

  // Actions
  setCurrentKm: (km: number) => void;
  setDayNumber: (day: number) => void;
  selectGoal: (goal: GoalCandidate) => Promise<void>;
  refreshWeather: () => Promise<void>;
  setRideDate: (date: Date) => Promise<void>;
  resetDay: () => void;
  advanceDay: () => void;

  // Preserved setters for backward compatibility
  clearGoal: () => void;
  setDayPlan: (plan: DayPlan) => void;
  setSunTimes: (times: SunTimes) => void;
  setDifficultyLevel: (level: DifficultyLevel) => void;
  setRiskSummary: (risks: RiskSummary) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};


/** Returns a Date at local midnight of today. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
  // Initial state
  currentKm: 0,
  dayNumber: 1,
  selectedGoal: null,
  dayPlan: null,
  sunTimes: null,
  isLoading: false,
  rideDate: startOfToday(),
  difficultyLevel: 'Easy',
  riskSummary: null,
  _hasHydrated: false,
  setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

  setCurrentKm: (km: number) => {
    set({ currentKm: km });
  },

  setDayNumber: (day: number) => {
    set({ dayNumber: day });
  },

  selectGoal: async (goal: GoalCandidate) => {
    const { currentKm, dayNumber, rideDate } = get();

    set({ selectedGoal: goal, isLoading: true });

    try {
      const checkpoints = getCheckpointsInRange(currentKm, goal.kmFromStart);
      const hazards = getHazardsInRange(currentKm, goal.kmFromStart);
      const elevationProfile = getRouteElevationProfile();

      // 1. DayPlan を生成
      let dayPlan = generateDayPlan(
        dayNumber,
        currentKm,
        goal,
        checkpoints,
        hazards,
        elevationProfile,
        useI18nStore.getState().locale,
      );

      // 2. 天気データを取得
      try {
        const weatherResult = await fetchRouteWeather(goal, {
          targetDate: rideDate,
        });

        dayPlan = {
          ...dayPlan,
          weather: weatherResult.segments,
        };

        set({ sunTimes: weatherResult.sun });

        // 3. Advisory cards を天気データ付きで再生成
        dayPlan = {
          ...dayPlan,
          advisoryCards: generateAdvisoryCards(
            dayPlan,
            useI18nStore.getState().locale,
          ),
        };
      } catch (weatherError) {
        console.warn(
          '[planStore] Weather fetch failed, continuing without weather data:',
          weatherError
        );
      }

      set({ dayPlan, isLoading: false });
    } catch (error) {
      console.error('[planStore] selectGoal failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  refreshWeather: async () => {
    const { dayPlan, selectedGoal, rideDate } = get();

    if (!dayPlan || !selectedGoal) {
      console.warn('[planStore] refreshWeather: no dayPlan or selectedGoal');
      return;
    }

    set({ isLoading: true });

    try {
      const weatherResult = await fetchRouteWeather(selectedGoal, {
        targetDate: rideDate,
      });
      let updatedPlan: DayPlan = {
        ...dayPlan,
        weather: weatherResult.segments,
      };

      set({ sunTimes: weatherResult.sun });

      // Advisory cards を再生成
      updatedPlan = {
        ...updatedPlan,
        advisoryCards: generateAdvisoryCards(
          updatedPlan,
          useI18nStore.getState().locale,
        ),
      };

      set({ dayPlan: updatedPlan, isLoading: false });
    } catch (error) {
      console.error('[planStore] refreshWeather failed:', error);
      set({ isLoading: false });
    }
  },

  resetDay: () => {
    set({
      selectedGoal: null,
      dayPlan: null,
      sunTimes: null,
      isLoading: false,
    });
  },

  advanceDay: () => {
    const { dayPlan, dayNumber } = get();

    const nextKm = dayPlan?.endKm ?? get().currentKm;

    set({
      dayNumber: dayNumber + 1,
      currentKm: nextKm,
      selectedGoal: null,
      dayPlan: null,
      sunTimes: null,
      isLoading: false,
      rideDate: startOfToday(),
    });
  },

  setRideDate: async (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    set({ rideDate: normalized });
    // Re-fetch weather for the newly chosen date if a goal is already selected.
    const { selectedGoal, refreshWeather } = get();
    if (selectedGoal) {
      await refreshWeather();
    }
  },

  // Backward-compatible setters
  clearGoal: () => set({ selectedGoal: null, dayPlan: null }),
  setDayPlan: (plan: DayPlan) => set({ dayPlan: plan }),
  setSunTimes: (times: SunTimes) => set({ sunTimes: times }),
  setDifficultyLevel: (level: DifficultyLevel) =>
    set({ difficultyLevel: level }),
  setRiskSummary: (risks: RiskSummary) => set({ riskSummary: risks }),
}),
    {
      name: 'huandao-plan-store',
      storage: createJSONStorage(() => crossPlatformStorage),
      version: 1,
      partialize: (state) => ({
        currentKm: state.currentKm,
        dayNumber: state.dayNumber,
        selectedGoal: state.selectedGoal,
        difficultyLevel: state.difficultyLevel,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
