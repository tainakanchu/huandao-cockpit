// ============================================
// 環島コックピット - 経由地 (Waypoint) ストア
// BIWAICHI Cycling Navi 風の「ベースルート + 任意経由地」モデル。
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Waypoint } from '@/lib/types';
import { crossPlatformStorage } from '@/lib/store/storage';

const MAX_WAYPOINTS = 10; // BIWAICHI 同様、最大10件

type WaypointState = {
  waypoints: Waypoint[];
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  addWaypoint: (wp: Omit<Waypoint, 'id'>) => boolean;
  removeWaypoint: (id: string) => void;
  toggleWaypointBySource: (
    sourceType: Waypoint['sourceType'],
    sourceId: string,
    makeWaypoint: () => Omit<Waypoint, 'id'>,
  ) => void;
  updateWaypointNote: (id: string, note: string) => void;
  clearWaypoints: () => void;
  getWaypointsInRange: (startKm: number, endKm: number) => Waypoint[];
  isAddedBySource: (sourceType: Waypoint['sourceType'], sourceId: string) => boolean;
  getWaypointCount: () => number;
};

function nextId(): string {
  return `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortByKm(a: Waypoint, b: Waypoint): number {
  return a.kmFromStart - b.kmFromStart;
}

export const useWaypointStore = create<WaypointState>()(
  persist(
    (set, get) => ({
      waypoints: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addWaypoint: (wp) => {
        const current = get().waypoints;
        if (current.length >= MAX_WAYPOINTS) return false;

        // Prevent duplicate from same source
        if (
          wp.sourceId &&
          current.some(
            (w) =>
              w.sourceType === wp.sourceType && w.sourceId === wp.sourceId,
          )
        ) {
          return false;
        }

        const added: Waypoint = { ...wp, id: nextId() };
        const next = [...current, added].sort(sortByKm);
        set({ waypoints: next });
        return true;
      },

      removeWaypoint: (id) => {
        set({ waypoints: get().waypoints.filter((w) => w.id !== id) });
      },

      toggleWaypointBySource: (sourceType, sourceId, makeWaypoint) => {
        const current = get().waypoints;
        const existing = current.find(
          (w) => w.sourceType === sourceType && w.sourceId === sourceId,
        );
        if (existing) {
          set({ waypoints: current.filter((w) => w.id !== existing.id) });
          return;
        }
        if (current.length >= MAX_WAYPOINTS) return;
        const added: Waypoint = { ...makeWaypoint(), id: nextId() };
        set({ waypoints: [...current, added].sort(sortByKm) });
      },

      updateWaypointNote: (id, note) => {
        set({
          waypoints: get().waypoints.map((w) =>
            w.id === id ? { ...w, note } : w,
          ),
        });
      },

      clearWaypoints: () => set({ waypoints: [] }),

      getWaypointsInRange: (startKm, endKm) => {
        return get().waypoints.filter(
          (w) => w.kmFromStart >= startKm && w.kmFromStart <= endKm,
        );
      },

      isAddedBySource: (sourceType, sourceId) => {
        return get().waypoints.some(
          (w) => w.sourceType === sourceType && w.sourceId === sourceId,
        );
      },

      getWaypointCount: () => get().waypoints.length,
    }),
    {
      name: 'huandao-waypoint-store',
      storage: createJSONStorage(() => crossPlatformStorage),
      version: 1,
      partialize: (state) => ({ waypoints: state.waypoints }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const WAYPOINT_LIMIT = MAX_WAYPOINTS;
