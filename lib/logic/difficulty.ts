// ============================================
// 難易度スコア計算
// ============================================

import type { DayPlan, DifficultyLevel } from "@/lib/types";
import { calcWindScore } from "@/lib/logic/wind";
import { calcSupplyGapScore } from "@/lib/logic/supply";

/**
 * Calculate the difficulty score for a DayPlan.
 *
 * Weighted factors (total = 100%):
 *   Distance:  30%
 *   Elevation: 25%
 *   Wind:      20%
 *   Heat:      10%
 *   Supply:    10%
 *   Danger:     5%
 *
 * Each factor is normalized to 0-100, then the weighted sum gives the final score.
 *
 * @returns A score from 0 to 100
 */
export function calcDifficultyScore(plan: DayPlan): number {
  const distanceScore = calcDistanceScore(plan.distanceKm);
  const elevationScore = calcElevationScore(plan.elevationGainM, plan.distanceKm);
  const windScore = calcWindScore(plan);
  const heatScore = calcHeatScore(plan);
  const supplyScore = calcSupplyGapScore(
    plan.checkpoints,
    plan.startKm,
    plan.endKm
  );
  const dangerScore = calcDangerScore(plan);

  const weighted =
    distanceScore * 0.3 +
    elevationScore * 0.25 +
    windScore * 0.2 +
    heatScore * 0.1 +
    supplyScore * 0.1 +
    dangerScore * 0.05;

  return Math.round(Math.max(0, Math.min(100, weighted)));
}

/**
 * Map a numeric difficulty score to a DifficultyLevel label.
 *
 *   0-29:  Easy
 *   30-49: Moderate
 *   50-69: Hard
 *   70+:   Critical
 */
export function getDifficultyLevel(score: number): DifficultyLevel {
  if (score < 30) return "Easy";
  if (score < 50) return "Moderate";
  if (score < 70) return "Hard";
  return "Critical";
}

// ── Internal scoring helpers ──────────────────────────────────────

/**
 * Distance score: 0-100
 * 60 km = 0, 120 km = 50, 160+ km = 100
 */
function calcDistanceScore(distanceKm: number): number {
  if (distanceKm <= 60) return 0;
  if (distanceKm >= 160) return 100;
  return ((distanceKm - 60) / 100) * 100;
}

/**
 * Elevation score based on total climb and ratio.
 * 0 m = 0, 500 m = 30, 1000 m = 60, 2000+ m = 100
 */
function calcElevationScore(
  elevationGainM: number,
  _distanceKm: number
): number {
  if (elevationGainM <= 0) return 0;
  if (elevationGainM >= 2000) return 100;
  return (elevationGainM / 2000) * 100;
}

/**
 * Heat score: based on max feels-like temperature from weather segments.
 * <30°C = 0, 30-35°C = linear 0-60, 35-40°C = linear 60-100
 */
function calcHeatScore(plan: DayPlan): number {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return 30; // Default moderate

  const maxFeelsLike = Math.max(...weather.map((s) => s.feelsLikeC));

  if (maxFeelsLike <= 30) return 0;
  if (maxFeelsLike <= 35) return ((maxFeelsLike - 30) / 5) * 60;
  if (maxFeelsLike <= 40) return 60 + ((maxFeelsLike - 35) / 5) * 40;
  return 100;
}

/**
 * Danger score: based on hazards in the day segment.
 * Uses the sum of hazard severities, capped and normalized.
 */
function calcDangerScore(plan: DayPlan): number {
  if (plan.hazards.length === 0) return 0;

  // Sum severities of relevant hazards (traffic, tunnel, etc.)
  const dangerTypes = new Set(["traffic", "tunnel", "wind_exposure"]);
  const totalSeverity = plan.hazards
    .filter((h) => dangerTypes.has(h.type))
    .reduce((sum, h) => sum + h.severity, 0);

  // Normalize: severity sum of 10 -> 100
  return Math.min(100, (totalSeverity / 10) * 100);
}
