// ============================================
// DayPlan（日別走行計画）生成
// ============================================

import type {
  DayPlan,
  GoalCandidate,
  ElevationPoint,
  Checkpoint,
  Hazard,
} from "@/lib/types";
import { generateAdvisoryCards } from "@/lib/logic/advisory";
import { generateSupplyPlan } from "@/lib/logic/supply";
import { getGoalCandidates } from "@/lib/data/goals";
import type { Locale } from "@/lib/i18n";

/**
 * Generate a DayPlan from a start position to a selected goal.
 *
 * Filters checkpoints and hazards to the day's range, calculates
 * elevation gain, generates supply plan and advisory cards.
 *
 * @param dayNumber         Day number (1-indexed)
 * @param startKm           Starting km on the route
 * @param goal              Selected goal candidate
 * @param allCheckpoints    All checkpoints on the route
 * @param allHazards        All hazards on the route
 * @param elevationProfile  Full elevation profile of the route
 * @returns                 A complete DayPlan
 */
export function generateDayPlan(
  dayNumber: number,
  startKm: number,
  goal: GoalCandidate,
  allCheckpoints: Checkpoint[],
  allHazards: Hazard[],
  elevationProfile: ElevationPoint[],
  locale: Locale = 'ja',
): DayPlan {
  const endKm = goal.kmFromStart;
  const distanceKm = endKm - startKm;

  // Filter checkpoints within this day's range
  const checkpoints = allCheckpoints
    .filter((cp) => cp.kmFromStart >= startKm && cp.kmFromStart <= endKm)
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  // Filter hazards that overlap with this day's range
  const hazards = allHazards
    .filter((h) => h.endKm > startKm && h.startKm < endKm)
    .sort((a, b) => a.startKm - b.startKm);

  // Calculate elevation gain from elevation profile
  const elevationGainM = calcElevationGain(elevationProfile, startKm, endKm);

  // Generate supply plan (pass goals for town-aware meal recommendations)
  const supplyPlan = generateSupplyPlan(
    allCheckpoints,
    startKm,
    endKm,
    getGoalCandidates(),
    locale,
  );

  // Build the plan (without advisory cards first, since they need the plan)
  const plan: DayPlan = {
    dayNumber,
    startKm,
    endKm,
    distanceKm,
    elevationGainM,
    checkpoints,
    hazards,
    advisoryCards: [],
    supplyPlan,
    weather: undefined,
  };

  // Generate advisory cards based on the plan
  plan.advisoryCards = generateAdvisoryCards(plan, locale);

  return plan;
}

/**
 * Calculate total elevation gain (uphill only) for a segment of the route.
 *
 * @param elevationProfile  Array of elevation points
 * @param startKm           Start of segment in km
 * @param endKm             End of segment in km
 * @returns                 Total uphill elevation gain in meters
 */
function calcElevationGain(
  elevationProfile: ElevationPoint[],
  startKm: number,
  endKm: number
): number {
  // Get elevation points within range
  const points = elevationProfile.filter(
    (p) => p.km >= startKm && p.km <= endKm
  );

  if (points.length < 2) return 0;

  // Sort by km to ensure correct order
  points.sort((a, b) => a.km - b.km);

  // Interpolate start elevation if the first point doesn't exactly match startKm
  let totalGain = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const diff = points[i + 1].elevationM - points[i].elevationM;
    if (diff > 0) {
      totalGain += diff;
    }
  }

  return totalGain;
}
