/**
 * Hazard data operations.
 *
 * Loads hazards from static JSON data and provides
 * filtering/querying functions for safety advisories.
 */

import type { Hazard } from "@/lib/types";
import hazardsData from "@/assets/data/hazards.json";

const hazards: Hazard[] = hazardsData as Hazard[];

/** Get all hazards */
export function getHazards(): Hazard[] {
  return hazards;
}

/**
 * Get hazards that overlap with a km range.
 * A hazard is included if any part of it falls within [startKm, endKm].
 *
 * @param startKm - Start of range (inclusive)
 * @param endKm - End of range (inclusive)
 * @returns Hazards overlapping the range, sorted by startKm
 */
export function getHazardsInRange(startKm: number, endKm: number): Hazard[] {
  return hazards
    .filter(
      (hazard) => hazard.startKm <= endKm && hazard.endKm >= startKm,
    )
    .sort((a, b) => a.startKm - b.startKm);
}

/**
 * Get the active hazard at the current position, if any.
 * Returns the highest-severity hazard if multiple overlap.
 *
 * @param currentKm - Current position in km from start
 * @returns The most severe hazard at this position, or null if none
 */
export function getActiveHazard(currentKm: number): Hazard | null {
  const activeHazards = hazards
    .filter(
      (hazard) => currentKm >= hazard.startKm && currentKm <= hazard.endKm,
    )
    .sort((a, b) => b.severity - a.severity);

  return activeHazards.length > 0 ? activeHazards[0] : null;
}
