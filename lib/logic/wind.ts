// ============================================
// 風スコア計算
// ============================================

import type { DayPlan } from "@/lib/types";
import { calcBearing, effectiveWindComponent } from "@/lib/geo/bearing";
import { getCoordinateAtKm } from "@/lib/data/route";

/**
 * Calculate wind score (0-100) for a DayPlan.
 *
 * Higher score = worse conditions (stronger headwind).
 * 0 = strong tailwind, 50 = no wind, 100 = extreme headwind.
 *
 * Uses the bearing from the plan's starting route position to its goal.
 *
 * If no weather data is available, returns 50 (neutral).
 */
export function calcWindScore(plan: DayPlan): number {
  const weather = plan.weather;

  if (!weather || weather.length === 0) {
    return 50; // No data, assume moderate
  }

  const start = getCoordinateAtKm(plan.startKm);
  const goal = getCoordinateAtKm(plan.endKm);
  if (!start || !goal) return 50;
  const routeBearing = calcBearing(start.lat, start.lng, goal.lat, goal.lng);

  let totalHeadwind = 0;
  for (const seg of weather) {
    const effective = effectiveWindComponent(
      routeBearing,
      seg.windDirectionDeg,
      seg.windSpeedKmh
    );

    // effective > 0 means tailwind (good), < 0 means headwind (bad)
    // We want the score to reflect headwind severity
    totalHeadwind += -effective; // flip sign so headwind is positive
  }

  const avgHeadwind = totalHeadwind / weather.length;

  // Map headwind value to 0-100 score
  // -30 km/h tailwind -> 0 score
  //   0 km/h no wind  -> 50 score
  // +15 km/h headwind -> 75 score
  // +30 km/h headwind -> 100 score
  const score = Math.round(((avgHeadwind + 30) / 60) * 100);
  return Math.max(0, Math.min(100, score));
}
