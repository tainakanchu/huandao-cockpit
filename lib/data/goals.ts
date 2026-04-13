/**
 * Goal candidate data operations.
 *
 * Loads goal candidates from the static JSON data and provides
 * filtering/querying functions for the trip planning engine.
 */

import type { GoalCandidate } from "@/lib/types";
import goalsData from "@/assets/data/goals.json";

const goals: GoalCandidate[] = goalsData as GoalCandidate[];

/** Get all goal candidates */
export function getGoalCandidates(): GoalCandidate[] {
  return goals;
}

/**
 * Get goals within a distance range ahead of the current position.
 *
 * @param currentKm - Current position in km from start
 * @param minDistance - Minimum distance ahead (km)
 * @param maxDistance - Maximum distance ahead (km)
 * @returns Goal candidates within [currentKm + minDistance, currentKm + maxDistance]
 */
export function getGoalsInRange(
  currentKm: number,
  minDistance: number,
  maxDistance: number,
): GoalCandidate[] {
  const minKm = currentKm + minDistance;
  const maxKm = currentKm + maxDistance;

  return goals.filter(
    (goal) => goal.kmFromStart >= minKm && goal.kmFromStart <= maxKm,
  );
}

/**
 * Find the nearest goal to a target distance ahead.
 *
 * @param currentKm - Current position in km from start
 * @param targetDistance - Desired distance ahead (km)
 * @returns The goal closest to the target distance, or null if none ahead
 */
export function getNearestGoalForDistance(
  currentKm: number,
  targetDistance: number,
): GoalCandidate | null {
  const targetKm = currentKm + targetDistance;
  const goalsAhead = goals.filter((goal) => goal.kmFromStart > currentKm);

  if (goalsAhead.length === 0) return null;

  return goalsAhead.reduce((nearest, goal) => {
    const currentDiff = Math.abs(goal.kmFromStart - targetKm);
    const nearestDiff = Math.abs(nearest.kmFromStart - targetKm);
    return currentDiff < nearestDiff ? goal : nearest;
  });
}

/**
 * Filter goals by tier level.
 *
 * @param tier - The tier to filter by: "major", "mid", or "minor"
 * @returns Goal candidates matching the specified tier
 */
export function getGoalsByTier(
  tier: GoalCandidate["tier"],
): GoalCandidate[] {
  return goals.filter((goal) => goal.tier === tier);
}

/**
 * Find the nearest goal with accommodation relative to a given km position.
 *
 * Searches both ahead and behind the given position and returns the closest
 * goal that has accommodation available.
 *
 * @param kmFromStart - Reference km position
 * @returns The nearest goal with accommodation, or null if none found
 */
export function getNearestAccommodationGoal(
  kmFromStart: number,
): GoalCandidate | null {
  const withAccommodation = goals.filter((g) => g.hasAccommodation);
  if (withAccommodation.length === 0) return null;

  return withAccommodation.reduce((nearest, goal) => {
    const currentDiff = Math.abs(goal.kmFromStart - kmFromStart);
    const nearestDiff = Math.abs(nearest.kmFromStart - kmFromStart);
    return currentDiff < nearestDiff ? goal : nearest;
  });
}
