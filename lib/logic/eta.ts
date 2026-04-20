// ============================================
// ETA（到着予想時刻）計算
// ============================================
//
// 実測値ベースのチューニング:
//   琵琶湖一周の実走行ログ 77.16 km / 04:32:43 = 17.0 km/h
//   → DEFAULT_BASE_SPEED_KMH = 17
//
// 「走行時間（moving）」と「所要時間（total = moving + 休憩）」を分離して返す。
// 休憩時間は 経由地 + 距離ベースの自動食事時間 から推定。

import type { DayPlan, RideStatus, ElevationPoint, Waypoint } from "@/lib/types";

/** Realistic moving average on mixed terrain, based on real ride logs (km/h). */
export const DEFAULT_BASE_SPEED_KMH = 17;

/** Additional time per 100 m of elevation gain (in hours). */
export const CLIMB_PENALTY_HOURS_PER_100M = 0.1; // ~6 min per 100 m

/** Default meal duration in minutes (lunch / dinner style). */
const MEAL_MINUTES = 60;

/** Default quick-stop duration per non-food waypoint (sightseeing, rest, etc). */
const QUICK_STOP_MINUTES = 20;

/** Auto-assume one meal per this many km if no food-category waypoint is set. */
const AUTO_MEAL_EVERY_KM = 50;

export type TravelEstimate = {
  /** Pure riding time (hours). */
  movingHours: number;
  /** Meals + waypoint stops (hours). */
  stopHours: number;
  /** movingHours + stopHours (hours). */
  totalHours: number;
};

export type TravelEstimateOpts = {
  /** Override base speed for this estimate. */
  baseSpeedKmh?: number;
  /** Total non-accommodation waypoints visited on this segment (food + sightseeing). */
  waypointCount?: number;
  /** Subset of waypointCount that are meals (food category). They replace auto-meals 1:1. */
  foodWaypointCount?: number;
};

/**
 * Estimate travel time for a segment.
 *
 * Returns moving time, stop time, and total. Stop time includes:
 * - Meals: max(auto-meal-from-distance, foodWaypointCount) × MEAL_MINUTES
 * - Quick stops: non-food waypoints × QUICK_STOP_MINUTES
 */
export function estimateTravelTime(
  distanceKm: number,
  elevationGainM: number,
  opts: TravelEstimateOpts = {}
): TravelEstimate {
  if (distanceKm <= 0) {
    return { movingHours: 0, stopHours: 0, totalHours: 0 };
  }

  const baseSpeed = opts.baseSpeedKmh ?? DEFAULT_BASE_SPEED_KMH;

  // Moving time
  const flatHours = distanceKm / baseSpeed;
  const climbPenalty = (elevationGainM / 100) * CLIMB_PENALTY_HOURS_PER_100M;
  const movingHours = flatHours + climbPenalty;

  // Stop time
  const waypointCount = Math.max(0, opts.waypointCount ?? 0);
  const foodWp = Math.max(0, Math.min(waypointCount, opts.foodWaypointCount ?? 0));
  const nonFoodWp = waypointCount - foodWp;

  const autoMeals = Math.max(
    0,
    Math.floor(distanceKm / AUTO_MEAL_EVERY_KM) - foodWp,
  );
  const mealCount = foodWp + autoMeals;

  const mealMinutes = mealCount * MEAL_MINUTES;
  const quickStopMinutes = nonFoodWp * QUICK_STOP_MINUTES;
  const stopHours = (mealMinutes + quickStopMinutes) / 60;

  return {
    movingHours,
    stopHours,
    totalHours: movingHours + stopHours,
  };
}

/**
 * Legacy helper: returns only moving hours.
 * New code should prefer `estimateTravelTime` for the full breakdown.
 */
export function estimateMovingHours(
  distanceKm: number,
  elevationGainM: number,
  baseSpeedKmh: number = DEFAULT_BASE_SPEED_KMH,
): number {
  return estimateTravelTime(distanceKm, elevationGainM, { baseSpeedKmh })
    .movingHours;
}

/**
 * Count waypoints inside a km range, with a breakdown of food vs non-food.
 * Excludes the segment endpoints themselves to avoid double-counting the goal.
 */
export function countWaypointsInRange(
  waypoints: Waypoint[],
  startKm: number,
  endKm: number,
): { total: number; food: number } {
  const inRange = waypoints.filter(
    (w) => w.kmFromStart > startKm + 0.5 && w.kmFromStart < endKm - 0.5,
  );
  const food = inRange.filter((w) => w.category === 'food').length;
  return { total: inRange.length, food };
}

/**
 * Calculate the estimated time of arrival at the day's goal while riding.
 *
 * Based on:
 * - Remaining distance and elevation
 * - Current elapsed time vs. distance covered (actual speed blends into the default)
 * - Fatigue level (reduces speed)
 *
 * This represents MOVING ETA only — stop time must be added separately by the
 * caller if they want wall-clock arrival.
 */
export function calcETA(plan: DayPlan, status: RideStatus): Date {
  const remainingKm = Math.max(0, plan.endKm - status.currentKm);

  const remainingElevation = calcRemainingElevation(
    plan.checkpoints.length > 0 ? [] : [],
    status.currentKm,
    plan.endKm,
  );

  // Blend actual observed speed with the default as coverage grows.
  let baseSpeed = DEFAULT_BASE_SPEED_KMH;
  const coveredKm = status.currentKm - plan.startKm;
  if (coveredKm > 5 && status.elapsedMinutes > 10) {
    const actualSpeed = coveredKm / (status.elapsedMinutes / 60);
    const weight = Math.min(0.8, coveredKm / 50);
    baseSpeed = actualSpeed * weight + DEFAULT_BASE_SPEED_KMH * (1 - weight);
  }

  const fatigueFactor = 1 - (status.fatigue - 1) * 0.05;
  const adjustedSpeed = baseSpeed * fatigueFactor;

  const remainingHours = estimateMovingHours(
    remainingKm,
    remainingElevation,
    adjustedSpeed,
  );

  const etaMs =
    status.startedAt.getTime() +
    status.elapsedMinutes * 60 * 1000 +
    remainingHours * 60 * 60 * 1000;

  return new Date(etaMs);
}

/**
 * Calculate remaining elevation gain between two km positions.
 */
export function calcRemainingElevation(
  elevationProfile: ElevationPoint[],
  currentKm: number,
  endKm: number,
): number {
  if (elevationProfile.length < 2) return 0;

  const relevantPoints = elevationProfile.filter(
    (p) => p.km >= currentKm && p.km <= endKm,
  );
  if (relevantPoints.length < 2) return 0;

  let totalGain = 0;
  for (let i = 0; i < relevantPoints.length - 1; i++) {
    const diff = relevantPoints[i + 1].elevationM - relevantPoints[i].elevationM;
    if (diff > 0) totalGain += diff;
  }
  return totalGain;
}
