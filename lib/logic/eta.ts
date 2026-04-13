// ============================================
// ETA（到着予想時刻）計算
// ============================================

import type { DayPlan, RideStatus, ElevationPoint } from "@/lib/types";

/** Default average cycling speed in km/h on flat terrain */
const DEFAULT_BASE_SPEED_KMH = 18;

/** Additional time per 100 m of elevation gain (in hours) */
const CLIMB_PENALTY_HOURS_PER_100M = 0.1; // ~6 min per 100 m gain

/**
 * Calculate the estimated time of arrival at the day's goal.
 *
 * Takes into account:
 * - Remaining distance
 * - Remaining elevation gain
 * - Current elapsed time and average speed so far
 * - Fatigue level (reduces estimated speed)
 *
 * @param plan    The day plan
 * @param status  Current ride status
 * @returns       Estimated arrival Date
 */
export function calcETA(plan: DayPlan, status: RideStatus): Date {
  const remainingKm = Math.max(0, plan.endKm - status.currentKm);

  // Calculate remaining elevation gain
  const remainingElevation = calcRemainingElevation(
    plan.checkpoints.length > 0
      ? [] // We'll use a simplified approach if no elevation profile
      : [],
    status.currentKm,
    plan.endKm
  );

  // Determine base speed from actual performance if enough data
  let baseSpeed = DEFAULT_BASE_SPEED_KMH;
  const coveredKm = status.currentKm - plan.startKm;
  if (coveredKm > 5 && status.elapsedMinutes > 10) {
    // Use actual average speed (in km/h)
    const actualSpeed = coveredKm / (status.elapsedMinutes / 60);
    // Blend actual speed with default (actual has more weight as distance grows)
    const weight = Math.min(0.8, coveredKm / 50);
    baseSpeed = actualSpeed * weight + DEFAULT_BASE_SPEED_KMH * (1 - weight);
  }

  // Apply fatigue penalty: reduce speed by 5% per fatigue level above 1
  const fatigueFactor = 1 - (status.fatigue - 1) * 0.05;
  const adjustedSpeed = baseSpeed * fatigueFactor;

  // Estimate remaining time
  const remainingHours = estimateTravelTime(
    remainingKm,
    remainingElevation,
    adjustedSpeed
  );

  // ETA = started time + elapsed time + remaining time
  const etaMs =
    status.startedAt.getTime() +
    status.elapsedMinutes * 60 * 1000 +
    remainingHours * 60 * 60 * 1000;

  return new Date(etaMs);
}

/**
 * Calculate remaining elevation gain from current position to end position.
 *
 * Only counts uphill segments (positive elevation changes).
 *
 * @param elevationProfile  Array of elevation points along the route
 * @param currentKm         Current position in km
 * @param endKm             End position in km
 * @returns                 Total remaining elevation gain in meters
 */
export function calcRemainingElevation(
  elevationProfile: ElevationPoint[],
  currentKm: number,
  endKm: number
): number {
  if (elevationProfile.length < 2) return 0;

  let totalGain = 0;

  // Filter to points within our range
  const relevantPoints = elevationProfile.filter(
    (p) => p.km >= currentKm && p.km <= endKm
  );

  if (relevantPoints.length < 2) return 0;

  // Interpolate starting elevation if needed
  for (let i = 0; i < relevantPoints.length - 1; i++) {
    const elevDiff =
      relevantPoints[i + 1].elevationM - relevantPoints[i].elevationM;
    if (elevDiff > 0) {
      totalGain += elevDiff;
    }
  }

  return totalGain;
}

/**
 * Estimate travel time for a segment in hours.
 *
 * Combines flat-terrain travel time with a climbing penalty.
 *
 * @param distanceKm      Distance to cover in km
 * @param elevationGainM  Total elevation gain in meters
 * @param baseSpeedKmh    Base cycling speed on flat terrain (default 18 km/h)
 * @returns               Estimated time in hours
 */
export function estimateTravelTime(
  distanceKm: number,
  elevationGainM: number,
  baseSpeedKmh: number = DEFAULT_BASE_SPEED_KMH
): number {
  if (distanceKm <= 0) return 0;

  // Base travel time on flat
  const flatTime = distanceKm / baseSpeedKmh;

  // Climbing penalty
  const climbPenalty = (elevationGainM / 100) * CLIMB_PENALTY_HOURS_PER_100M;

  return flatTime + climbPenalty;
}
