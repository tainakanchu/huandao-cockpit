// ============================================
// 風スコア計算
// ============================================

import type { DayPlan } from "@/lib/types";
import { effectiveWindComponent } from "@/lib/geo/bearing";

/**
 * Calculate wind score (0-100) for a DayPlan.
 *
 * Higher score = worse conditions (stronger headwind).
 * 0 = strong tailwind or no wind, 100 = extreme headwind.
 *
 * Uses the weather segments in the DayPlan to compute the average
 * effective wind component along the route. We assume the route bearing
 * can be approximated from each weather segment's location relative to
 * the previous one, but since we don't have full route geometry here,
 * we use a simplified approach based on consecutive weather points.
 *
 * If no weather data is available, returns 50 (neutral).
 */
export function calcWindScore(plan: DayPlan): number {
  const weather = plan.weather;

  if (!weather || weather.length === 0) {
    return 50; // No data, assume moderate
  }

  // If we have only one weather segment, use a simplified approach
  // estimating the route bearing from start/end or assuming a general direction
  if (weather.length === 1) {
    const seg = weather[0];
    // Without route bearing info, we can't determine headwind vs tailwind precisely.
    // Use wind speed alone: stronger wind = higher score
    const windScore = Math.min(100, (seg.windSpeedKmh / 50) * 100);
    return Math.round(windScore);
  }

  // For multiple weather segments, estimate route bearing between consecutive
  // weather points and compute effective wind component for each
  let totalHeadwind = 0;
  let count = 0;

  for (let i = 0; i < weather.length; i++) {
    const seg = weather[i];

    // Estimate route bearing from this segment to the next (or from prev to this)
    let routeBearing: number;
    if (i < weather.length - 1) {
      const next = weather[i + 1];
      routeBearing = approximateBearing(seg.lat, seg.lng, next.lat, next.lng);
    } else {
      const prev = weather[i - 1];
      routeBearing = approximateBearing(prev.lat, prev.lng, seg.lat, seg.lng);
    }

    const effective = effectiveWindComponent(
      routeBearing,
      seg.windDirectionDeg,
      seg.windSpeedKmh
    );

    // effective > 0 means tailwind (good), < 0 means headwind (bad)
    // We want the score to reflect headwind severity
    totalHeadwind += -effective; // flip sign so headwind is positive
    count++;
  }

  const avgHeadwind = totalHeadwind / count;

  // Map headwind value to 0-100 score
  // -30 km/h tailwind -> 0 score
  //   0 km/h no wind  -> 30 score
  // +15 km/h headwind -> 60 score
  // +30 km/h headwind -> 100 score
  const score = Math.round(((avgHeadwind + 30) / 60) * 100);
  return Math.max(0, Math.min(100, score));
}

/**
 * Quick bearing approximation between two points.
 * (Duplicated here to avoid circular dependency with geo/bearing
 *  while keeping the module self-contained for the simple case.)
 */
function approximateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const x = Math.sin(dLng) * Math.cos(phi2);
  const y =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}
