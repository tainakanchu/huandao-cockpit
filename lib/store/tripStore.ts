// ============================================
// 環島コックピット - トリップ管理ストア
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { crossPlatformStorage } from '@/lib/store/storage';

export type TripDaySlot = {
  dayNumber: number;
  startKm: number;
  endKm: number;
  goalId: string;
  goalName: string;
  goalNameZh: string;
  distanceKm: number;
  elevationGainM: number;
  status: 'planned' | 'active' | 'completed' | 'skipped';
};

export type DayRecord = {
  dayNumber: number;
  startName?: string;
  goalId: string;
  goalName: string;
  distanceKm: number;
  elevationGainM: number;
  ridingMinutes: number;
  date: string; // ISO date
  notes: string[];
};

type TripState = {
  tripPlan: TripDaySlot[] | null;
  tripStartDate: string | null;
  dayHistory: DayRecord[];
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (v: boolean) => void;
  createTripPlan: (daySlots: TripDaySlot[]) => void;
  updateDaySlot: (dayNumber: number, updates: Partial<TripDaySlot>) => void;
  completeDayRecord: (record: DayRecord) => void;
  markDayActive: (dayNumber: number) => void;
  markDaySkipped: (dayNumber: number) => void;
  getTotalProgress: () => {
    completedKm: number;
    totalKm: number;
    completedDays: number;
    totalDays: number;
  };
  getCurrentDaySlot: (dayNumber: number) => TripDaySlot | undefined;
  deleteDayRecord: (dayNumber: number) => void;
  undoLastDay: () => DayRecord | null;
  resetTrip: () => void;
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      // Initial state
      tripPlan: null,
      tripStartDate: null,
      dayHistory: [],
      _hasHydrated: false,

      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      createTripPlan: (daySlots: TripDaySlot[]) => {
        set({
          tripPlan: daySlots,
          tripStartDate: new Date().toISOString(),
          dayHistory: [],
        });
      },

      updateDaySlot: (dayNumber: number, updates: Partial<TripDaySlot>) => {
        const { tripPlan } = get();
        if (!tripPlan) return;

        set({
          tripPlan: tripPlan.map((slot) =>
            slot.dayNumber === dayNumber ? { ...slot, ...updates } : slot,
          ),
        });
      },

      completeDayRecord: (record: DayRecord) => {
        const { dayHistory, tripPlan } = get();

        // Add to history
        const updatedHistory = [...dayHistory, record];

        // Mark the corresponding slot as completed
        const updatedPlan = tripPlan?.map((slot) =>
          slot.dayNumber === record.dayNumber
            ? { ...slot, status: 'completed' as const }
            : slot,
        ) ?? null;

        set({
          dayHistory: updatedHistory,
          tripPlan: updatedPlan,
        });
      },

      markDayActive: (dayNumber: number) => {
        const { tripPlan } = get();
        if (!tripPlan) return;

        set({
          tripPlan: tripPlan.map((slot) =>
            slot.dayNumber === dayNumber
              ? { ...slot, status: 'active' as const }
              : slot,
          ),
        });
      },

      markDaySkipped: (dayNumber: number) => {
        const { tripPlan } = get();
        if (!tripPlan) return;

        set({
          tripPlan: tripPlan.map((slot) =>
            slot.dayNumber === dayNumber
              ? { ...slot, status: 'skipped' as const }
              : slot,
          ),
        });
      },

      getTotalProgress: () => {
        const { tripPlan, dayHistory } = get();

        const totalKm =
          tripPlan?.reduce((sum, slot) => sum + slot.distanceKm, 0) ?? 0;
        const totalDays = tripPlan?.length ?? 0;
        const completedKm = dayHistory.reduce(
          (sum, record) => sum + record.distanceKm,
          0,
        );
        const completedDays = dayHistory.length;

        return { completedKm, totalKm, completedDays, totalDays };
      },

      getCurrentDaySlot: (dayNumber: number) => {
        const { tripPlan } = get();
        return tripPlan?.find((slot) => slot.dayNumber === dayNumber);
      },

      deleteDayRecord: (dayNumber: number) => {
        const { dayHistory, tripPlan } = get();
        set({
          dayHistory: dayHistory.filter((r) => r.dayNumber !== dayNumber),
          tripPlan: tripPlan?.map((slot) =>
            slot.dayNumber === dayNumber
              ? { ...slot, status: 'planned' as const }
              : slot,
          ) ?? null,
        });
      },

      undoLastDay: () => {
        const { dayHistory, tripPlan } = get();
        if (dayHistory.length === 0) return null;

        const last = dayHistory[dayHistory.length - 1];

        set({
          dayHistory: dayHistory.slice(0, -1),
          tripPlan: tripPlan?.map((slot) =>
            slot.dayNumber === last.dayNumber
              ? { ...slot, status: 'planned' as const }
              : slot,
          ) ?? null,
        });

        return last;
      },

      resetTrip: () => {
        set({
          tripPlan: null,
          tripStartDate: null,
          dayHistory: [],
        });
      },
    }),
    {
      name: 'huandao-trip-store',
      storage: createJSONStorage(() => crossPlatformStorage),
      version: 1,
      partialize: (state) => ({
        tripPlan: state.tripPlan,
        tripStartDate: state.tripStartDate,
        dayHistory: state.dayHistory,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
