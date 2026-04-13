// ============================================
// 環島コックピット - 走行状態ストア
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  RideStatus,
  WaterLevel,
  EnergyLevel,
  FatigueLevel,
  Checkpoint,
} from '@/lib/types';
import { crossPlatformStorage } from '@/lib/store/storage';

type RideState = {
  // State
  isRiding: boolean;
  status: RideStatus;

  // Next events (preserved from existing store)
  nextCheckpoint: Checkpoint | null;
  secondCheckpoint: Checkpoint | null;
  distanceToNext: number;
  distanceToSecond: number;

  // ETA (preserved from existing store)
  currentEta: Date | null;
  plannedEta: Date | null;

  // Actions
  startRide: (startKm: number) => void;
  endRide: () => void;
  updatePosition: (lat: number, lng: number, km: number) => void;
  setWaterLevel: (level: WaterLevel) => void;
  setEnergyLevel: (level: EnergyLevel) => void;
  setFatigue: (level: FatigueLevel) => void;
  addNote: (note: string) => void;
  resetWater: () => void;

  // Preserved setters for backward compatibility
  setNextCheckpoint: (cp: Checkpoint | null, distance: number) => void;
  setSecondCheckpoint: (cp: Checkpoint | null, distance: number) => void;
  setCurrentEta: (eta: Date | null) => void;
  setPlannedEta: (eta: Date | null) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
};

const createDefaultStatus = (): RideStatus => ({
  currentLat: 0,
  currentLng: 0,
  currentKm: 0,
  startedAt: new Date(),
  elapsedMinutes: 0,
  waterLevel: 'full',
  energyLevel: 5,
  fatigue: 1,
  notes: [],
});

/**
 * 経過時間を分単位で計算する。
 */
function computeElapsedMinutes(startedAt: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
}

export const useRideStore = create<RideState>()(
  persist(
    (set, get) => ({
  // Initial state
  isRiding: false,
  status: createDefaultStatus(),
  nextCheckpoint: null,
  secondCheckpoint: null,
  distanceToNext: 0,
  distanceToSecond: 0,
  currentEta: null,
  plannedEta: null,
  _hasHydrated: false,
  setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

  startRide: (startKm: number) => {
    const now = new Date();
    set({
      isRiding: true,
      status: {
        ...createDefaultStatus(),
        currentKm: startKm,
        startedAt: now,
        elapsedMinutes: 0,
      },
    });
  },

  endRide: () => {
    const { status } = get();
    set({
      isRiding: false,
      status: {
        ...status,
        elapsedMinutes: computeElapsedMinutes(status.startedAt),
      },
    });
  },

  updatePosition: (lat: number, lng: number, km: number) => {
    const { status } = get();
    set({
      status: {
        ...status,
        currentLat: lat,
        currentLng: lng,
        currentKm: km,
        elapsedMinutes: computeElapsedMinutes(status.startedAt),
      },
    });
  },

  setWaterLevel: (level: WaterLevel) => {
    const { status } = get();
    set({
      status: {
        ...status,
        waterLevel: level,
      },
    });
  },

  setEnergyLevel: (level: EnergyLevel) => {
    const { status } = get();
    set({
      status: {
        ...status,
        energyLevel: level,
      },
    });
  },

  setFatigue: (level: FatigueLevel) => {
    const { status } = get();
    set({
      status: {
        ...status,
        fatigue: level,
      },
    });
  },

  addNote: (note: string) => {
    const { status } = get();
    set({
      status: {
        ...status,
        notes: [...status.notes, note],
      },
    });
  },

  resetWater: () => {
    const { status } = get();
    set({
      status: {
        ...status,
        waterLevel: 'full',
      },
    });
  },

  // Backward-compatible setters
  setNextCheckpoint: (cp: Checkpoint | null, distance: number) =>
    set({ nextCheckpoint: cp, distanceToNext: distance }),
  setSecondCheckpoint: (cp: Checkpoint | null, distance: number) =>
    set({ secondCheckpoint: cp, distanceToSecond: distance }),
  setCurrentEta: (eta: Date | null) => set({ currentEta: eta }),
  setPlannedEta: (eta: Date | null) => set({ plannedEta: eta }),
}),
    {
      name: 'huandao-ride-store',
      storage: createJSONStorage(() => crossPlatformStorage),
      version: 1,
      partialize: (state) => ({
        isRiding: state.isRiding,
        status: {
          currentKm: state.status.currentKm,
          startedAt: state.status.startedAt.toISOString(),
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Record<string, unknown> | undefined;
        if (!persisted) return currentState;

        const persistedStatus = persisted.status as
          | { currentKm?: number; startedAt?: string }
          | undefined;

        return {
          ...currentState,
          isRiding: (persisted.isRiding as boolean) ?? currentState.isRiding,
          status: {
            ...currentState.status,
            currentKm: persistedStatus?.currentKm ?? currentState.status.currentKm,
            startedAt: persistedStatus?.startedAt
              ? new Date(persistedStatus.startedAt)
              : currentState.status.startedAt,
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
