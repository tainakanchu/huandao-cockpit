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

  // Preserved from existing store for backward compatibility
  difficultyLevel: DifficultyLevel;
  riskSummary: RiskSummary | null;

  // Actions
  setCurrentKm: (km: number) => void;
  setDayNumber: (day: number) => void;
  selectGoal: (goal: GoalCandidate) => Promise<void>;
  refreshWeather: () => Promise<void>;
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


/**
 * ルート上の代表的な座標を生成する（始点と終点の間を線形補間）。
 * 実際のルートデータが利用可能になるまでの仮実装。
 */
function generateRoutePoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 5
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = numPoints === 1 ? 0 : i / (numPoints - 1);
    points.push({
      lat: startLat + t * (endLat - startLat),
      lng: startLng + t * (endLng - startLng),
    });
  }
  return points;
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
    const { currentKm, dayNumber } = get();

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
        elevationProfile
      );

      // 2. 天気データを取得
      try {
        const routePoints = generateRoutePoints(
          goal.lat,
          goal.lng,
          goal.lat,
          goal.lng,
          3
        );

        const weatherResult = await fetchRouteWeather(routePoints);

        dayPlan = {
          ...dayPlan,
          weather: weatherResult.segments,
        };

        set({ sunTimes: weatherResult.sun });

        // 3. Advisory cards を天気データ付きで再生成
        dayPlan = {
          ...dayPlan,
          advisoryCards: generateAdvisoryCards(dayPlan),
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
    const { dayPlan, selectedGoal, currentKm } = get();

    if (!dayPlan || !selectedGoal) {
      console.warn('[planStore] refreshWeather: no dayPlan or selectedGoal');
      return;
    }

    set({ isLoading: true });

    try {
      const routePoints = generateRoutePoints(
        selectedGoal.lat,
        selectedGoal.lng,
        selectedGoal.lat,
        selectedGoal.lng,
        3
      );

      const weatherResult = await fetchRouteWeather(routePoints);
      let updatedPlan: DayPlan = {
        ...dayPlan,
        weather: weatherResult.segments,
      };

      set({ sunTimes: weatherResult.sun });

      // Advisory cards を再生成
      updatedPlan = {
        ...updatedPlan,
        advisoryCards: generateAdvisoryCards(updatedPlan),
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
    });
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
