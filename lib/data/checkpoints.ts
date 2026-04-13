/**
 * Checkpoint data operations.
 *
 * Loads checkpoints from static JSON data and provides
 * filtering/querying functions for supply planning and navigation.
 */

import type { Checkpoint, CheckpointType } from "@/lib/types";
import checkpointsData from "@/assets/data/checkpoints.json";

const checkpoints: Checkpoint[] = checkpointsData as Checkpoint[];

/** Supply-related checkpoint types */
const SUPPLY_TYPES: ReadonlySet<CheckpointType> = new Set([
  "seven_eleven",
  "family_mart",
  "hi_life",
  "ok_mart",
  "water",
  "food",
]);

/** Get all checkpoints */
export function getCheckpoints(): Checkpoint[] {
  return checkpoints;
}

/**
 * Get checkpoints within a km range.
 *
 * @param startKm - Start of range (inclusive)
 * @param endKm - End of range (inclusive)
 * @returns Checkpoints within [startKm, endKm], sorted by kmFromStart
 */
export function getCheckpointsInRange(
  startKm: number,
  endKm: number,
): Checkpoint[] {
  return checkpoints
    .filter((cp) => cp.kmFromStart >= startKm && cp.kmFromStart <= endKm)
    .sort((a, b) => a.kmFromStart - b.kmFromStart);
}

/**
 * Get supply-type checkpoints within a km range.
 * Supply types include convenience stores, water points, and food spots.
 *
 * @param startKm - Start of range (inclusive)
 * @param endKm - End of range (inclusive)
 * @returns Supply checkpoints within [startKm, endKm], sorted by kmFromStart
 */
export function getSupplyCheckpoints(
  startKm: number,
  endKm: number,
): Checkpoint[] {
  return checkpoints
    .filter(
      (cp) =>
        cp.kmFromStart >= startKm &&
        cp.kmFromStart <= endKm &&
        SUPPLY_TYPES.has(cp.type),
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart);
}

/**
 * Get the next checkpoint ahead of the current position.
 *
 * @param currentKm - Current position in km from start
 * @param type - Optional checkpoint type filter
 * @returns The next checkpoint ahead, or null if none found
 */
export function getNextCheckpoint(
  currentKm: number,
  type?: CheckpointType,
): Checkpoint | null {
  const ahead = checkpoints
    .filter(
      (cp) =>
        cp.kmFromStart > currentKm && (type === undefined || cp.type === type),
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  return ahead.length > 0 ? ahead[0] : null;
}
