// ============================================
// 環島コックピット - ライド履歴ストア
// 「n日目」の概念は持たず、セッション（= 1 ライド）単位で履歴を記録する。
// 旧 dayNumber フィールドは内部的な通番（sessionId 相当）として残してあり、
// 既存の永続化データとの互換性を保つ。
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from '@/lib/store/storage';

export type DayRecord = {
  /** Internal sequential session id. Not displayed in UI. */
  dayNumber: number;
  startName?: string;
  startKm?: number;
  endKm?: number;
  goalId: string;
  goalName: string;
  distanceKm: number;
  elevationGainM: number;
  ridingMinutes: number;
  date: string; // ISO date
  notes: string[];
};

export type TotalProgress = {
  completedKm: number;
  completedRides: number;
  totalRidingMinutes: number;
  totalElevationM: number;
};

type TripState = {
  dayHistory: DayRecord[];
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  completeDayRecord: (record: DayRecord) => void;
  deleteDayRecord: (dayNumber: number) => void;
  undoLastRide: () => DayRecord | null;
  getTotalProgress: () => TotalProgress;
  resetHistory: () => void;
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      dayHistory: [],
      _hasHydrated: false,

      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      completeDayRecord: (record: DayRecord) => {
        const { dayHistory } = get();
        set({ dayHistory: [...dayHistory, record] });
      },

      deleteDayRecord: (dayNumber: number) => {
        set({
          dayHistory: get().dayHistory.filter((r) => r.dayNumber !== dayNumber),
        });
      },

      undoLastRide: () => {
        const { dayHistory } = get();
        if (dayHistory.length === 0) return null;
        const last = dayHistory[dayHistory.length - 1];
        set({ dayHistory: dayHistory.slice(0, -1) });
        return last;
      },

      getTotalProgress: () => {
        const { dayHistory } = get();
        return {
          completedKm: dayHistory.reduce((s, r) => s + r.distanceKm, 0),
          completedRides: dayHistory.length,
          totalRidingMinutes: dayHistory.reduce(
            (s, r) => s + r.ridingMinutes,
            0,
          ),
          totalElevationM: dayHistory.reduce(
            (s, r) => s + r.elevationGainM,
            0,
          ),
        };
      },

      resetHistory: () => set({ dayHistory: [] }),
    }),
    {
      name: 'huandao-trip-store',
      storage: createJSONStorage(() => crossPlatformStorage),
      version: 2,
      partialize: (state) => ({ dayHistory: state.dayHistory }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
