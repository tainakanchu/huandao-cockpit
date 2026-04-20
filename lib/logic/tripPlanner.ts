// ============================================
// 環島コックピット - トリッププランナーロジック
// ============================================

import type { GoalCandidate, Waypoint } from '@/lib/types';
import type { TripDaySlot } from '@/lib/store/tripStore';
import { getGoalCandidates } from '@/lib/data/goals';
import { getElevationGain } from '@/lib/data/route';

const TOTAL_ROUTE_KM = 946;

/**
 * Accommodation-capable waypoints act as forced day endpoints.
 * BIWAICHI 風: ユーザーが指定した宿泊系経由地は必ずその日の終点になる。
 */
function extractAnchors(waypoints: Waypoint[] | undefined): Waypoint[] {
  if (!waypoints || waypoints.length === 0) return [];
  return waypoints
    .filter((w) => w.category === 'accommodation')
    .sort((a, b) => a.kmFromStart - b.kmFromStart);
}

/**
 * Auto-generate a balanced multi-day trip plan.
 * Prefer goals with accommodation, balanced ~80-100km/day.
 *
 * If `waypoints` includes accommodation-type entries, those become forced day endpoints
 * (BIWAICHI 風の「立ち寄り宿泊地」指定)。
 */
export function autoGenerateTripPlan(
  startKm: number = 0,
  targetDailyKm: number = 80,
  waypoints?: Waypoint[],
): TripDaySlot[] {
  const anchors = extractAnchors(waypoints).filter(
    (a) => a.kmFromStart > startKm,
  );

  if (anchors.length === 0) {
    return autoGenerateTripPlanPlain(startKm, targetDailyKm);
  }

  // Anchored planning: build day segments between startKm and each anchor,
  // then from the last anchor to the route end.
  const result: TripDaySlot[] = [];
  let cursorKm = startKm;
  let dayCounter = 1;

  for (const anchor of anchors) {
    const segment = fillSegment(
      cursorKm,
      anchor.kmFromStart,
      targetDailyKm,
      dayCounter,
      { forceEndGoal: toPseudoGoal(anchor) },
    );
    result.push(...segment);
    if (segment.length > 0) {
      dayCounter = segment[segment.length - 1].dayNumber + 1;
      cursorKm = segment[segment.length - 1].endKm;
    } else {
      cursorKm = anchor.kmFromStart;
    }
  }

  // Final leg from last anchor to route end
  if (cursorKm < TOTAL_ROUTE_KM - 10) {
    const tail = autoGenerateTripPlanPlain(cursorKm, targetDailyKm).map(
      (slot, i) => ({ ...slot, dayNumber: dayCounter + i }),
    );
    result.push(...tail);
  }

  return result;
}

function toPseudoGoal(waypoint: Waypoint): GoalCandidate {
  return {
    id: waypoint.sourceId ?? waypoint.id,
    name: waypoint.name,
    nameZh: waypoint.nameZh ?? waypoint.name,
    kmFromStart: waypoint.kmFromStart,
    lat: waypoint.lat,
    lng: waypoint.lng,
    tier: 'mid',
    hasAccommodation: true,
    hasConvenienceStore: false,
    hasStation: false,
  };
}

/**
 * Fill a km segment [fromKm, toKm] with day slots, using accommodation goals
 * as intermediate endpoints. The final day MUST end at toKm, using `forceEndGoal`.
 */
function fillSegment(
  fromKm: number,
  toKm: number,
  targetDailyKm: number,
  startDayNumber: number,
  opts: { forceEndGoal: GoalCandidate },
): TripDaySlot[] {
  const segmentLength = toKm - fromKm;
  if (segmentLength <= 0) return [];

  // If the segment is short enough, make it a single day.
  if (segmentLength <= targetDailyKm + 20) {
    const distanceKm = Math.round(segmentLength * 10) / 10;
    const elevationGainM = getElevationGain(fromKm, toKm);
    return [
      {
        dayNumber: startDayNumber,
        startKm: fromKm,
        endKm: toKm,
        goalId: opts.forceEndGoal.id,
        goalName: opts.forceEndGoal.name,
        goalNameZh: opts.forceEndGoal.nameZh,
        distanceKm,
        elevationGainM,
        status: 'planned',
      },
    ];
  }

  // Long segment: insert intermediate accommodation days, then force-end at toKm.
  const allGoals = getGoalCandidates();
  const intermediateGoals = allGoals
    .filter(
      (g) =>
        g.hasAccommodation &&
        g.kmFromStart > fromKm &&
        g.kmFromStart < toKm - 10,
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  const result: TripDaySlot[] = [];
  let cursor = fromKm;
  let day = startDayNumber;
  const tolerance = 20;

  while (cursor < toKm - (targetDailyKm + tolerance)) {
    const target = cursor + targetDailyKm;
    const candidates = intermediateGoals.filter(
      (g) =>
        g.kmFromStart > cursor &&
        g.kmFromStart >= target - tolerance &&
        g.kmFromStart <= target + tolerance,
    );

    let picked: GoalCandidate | null = null;
    if (candidates.length > 0) {
      picked = candidates.reduce((best, c) =>
        scoreGoal(c, target) > scoreGoal(best, target) ? c : best,
      );
    } else {
      const ahead = intermediateGoals.filter((g) => g.kmFromStart > cursor);
      if (ahead.length === 0) break;
      picked = ahead.reduce((closest, g) =>
        Math.abs(g.kmFromStart - target) < Math.abs(closest.kmFromStart - target)
          ? g
          : closest,
      );
    }

    if (!picked || picked.kmFromStart <= cursor) break;

    const distanceKm = Math.round((picked.kmFromStart - cursor) * 10) / 10;
    const elevationGainM = getElevationGain(cursor, picked.kmFromStart);
    result.push({
      dayNumber: day,
      startKm: cursor,
      endKm: picked.kmFromStart,
      goalId: picked.id,
      goalName: picked.name,
      goalNameZh: picked.nameZh,
      distanceKm,
      elevationGainM,
      status: 'planned',
    });

    cursor = picked.kmFromStart;
    day += 1;
    if (distanceKm < 1) break;
  }

  // Final day of this segment forced to end at the anchor (toKm)
  const finalDistance = Math.round((toKm - cursor) * 10) / 10;
  const finalElev = getElevationGain(cursor, toKm);
  result.push({
    dayNumber: day,
    startKm: cursor,
    endKm: toKm,
    goalId: opts.forceEndGoal.id,
    goalName: opts.forceEndGoal.name,
    goalNameZh: opts.forceEndGoal.nameZh,
    distanceKm: finalDistance,
    elevationGainM: finalElev,
    status: 'planned',
  });

  return result;
}

/**
 * Plain auto-generation without waypoint anchors (original behavior).
 */
function autoGenerateTripPlanPlain(
  startKm: number,
  targetDailyKm: number,
): TripDaySlot[] {
  const allGoals = getGoalCandidates();

  // 1. Get all goals with accommodation, sorted by kmFromStart
  const accommodationGoals = allGoals
    .filter((g) => g.hasAccommodation && g.kmFromStart > startKm)
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  if (accommodationGoals.length === 0) {
    return [];
  }

  const plan: TripDaySlot[] = [];
  let currentKm = startKm;
  let dayNumber = 1;
  const tolerance = 20; // Accept goals within targetDailyKm +/- 20km

  while (currentKm < TOTAL_ROUTE_KM - 10) {
    const targetKm = currentKm + targetDailyKm;
    const minKm = currentKm + targetDailyKm - tolerance;
    const maxKm = currentKm + targetDailyKm + tolerance;

    // 2. Find candidate goals within the acceptable range
    const candidates = accommodationGoals.filter(
      (g) => g.kmFromStart >= minKm && g.kmFromStart <= maxKm && g.kmFromStart > currentKm,
    );

    let bestGoal: GoalCandidate | null = null;

    if (candidates.length > 0) {
      // 3. Score candidates: prefer closer to target, then 'major' tier, then 'mid'
      bestGoal = candidates.reduce((best, candidate) => {
        const bestScore = scoreGoal(best, targetKm);
        const candidateScore = scoreGoal(candidate, targetKm);
        return candidateScore > bestScore ? candidate : best;
      });
    } else {
      // No candidates in range - find the nearest accommodation goal ahead
      const goalsAhead = accommodationGoals.filter(
        (g) => g.kmFromStart > currentKm,
      );

      if (goalsAhead.length === 0) {
        // No more accommodation goals - use the final point
        break;
      }

      // Pick the closest one to the target
      bestGoal = goalsAhead.reduce((nearest, g) => {
        const nearestDiff = Math.abs(g.kmFromStart - targetKm);
        const gDiff = Math.abs(g.kmFromStart - targetKm);
        return gDiff < nearestDiff ? g : nearest;
      });
    }

    if (!bestGoal) break;

    const distanceKm = Math.round((bestGoal.kmFromStart - currentKm) * 10) / 10;
    const elevationGainM = getElevationGain(currentKm, bestGoal.kmFromStart);

    plan.push({
      dayNumber,
      startKm: currentKm,
      endKm: bestGoal.kmFromStart,
      goalId: bestGoal.id,
      goalName: bestGoal.name,
      goalNameZh: bestGoal.nameZh,
      distanceKm,
      elevationGainM,
      status: 'planned',
    });

    currentKm = bestGoal.kmFromStart;
    dayNumber++;

    // Safety check: prevent infinite loop if we're not making progress
    if (distanceKm < 1) break;
  }

  // Handle the final leg back to Taipei (if the route is circular)
  const lastEndKm = plan.length > 0 ? plan[plan.length - 1].endKm : startKm;
  if (lastEndKm < TOTAL_ROUTE_KM - 10) {
    // Find a final goal near the end of the route
    const finalGoals = allGoals
      .filter((g) => g.hasAccommodation && g.kmFromStart > lastEndKm)
      .sort((a, b) => b.kmFromStart - a.kmFromStart);

    if (finalGoals.length > 0) {
      const finalGoal = finalGoals[0];
      const distanceKm =
        Math.round((finalGoal.kmFromStart - lastEndKm) * 10) / 10;
      const elevationGainM = getElevationGain(lastEndKm, finalGoal.kmFromStart);

      plan.push({
        dayNumber,
        startKm: lastEndKm,
        endKm: finalGoal.kmFromStart,
        goalId: finalGoal.id,
        goalName: finalGoal.name,
        goalNameZh: finalGoal.nameZh,
        distanceKm,
        elevationGainM,
        status: 'planned',
      });
    }
  }

  return plan;
}

/**
 * Recalculate a trip plan from a given day onward.
 * Used when the user changes a day's endpoint.
 */
export function recalculateFromDay(
  existingPlan: TripDaySlot[],
  fromDayNumber: number,
  newGoal: GoalCandidate,
  targetDailyKm: number = 80,
  waypoints?: Waypoint[],
): TripDaySlot[] {
  // Keep all days before fromDayNumber
  const keptDays = existingPlan.filter(
    (slot) => slot.dayNumber < fromDayNumber,
  );

  // Determine startKm for the modified day
  const prevDay = keptDays[keptDays.length - 1];
  const dayStartKm = prevDay ? prevDay.endKm : 0;

  // Create the modified day
  const distanceKm =
    Math.round((newGoal.kmFromStart - dayStartKm) * 10) / 10;
  const elevationGainM = getElevationGain(dayStartKm, newGoal.kmFromStart);

  const modifiedDay: TripDaySlot = {
    dayNumber: fromDayNumber,
    startKm: dayStartKm,
    endKm: newGoal.kmFromStart,
    goalId: newGoal.id,
    goalName: newGoal.name,
    goalNameZh: newGoal.nameZh,
    distanceKm,
    elevationGainM,
    status: 'planned',
  };

  // Auto-generate remaining days from the new endpoint, skipping waypoints
  // already behind the new endpoint.
  const remainingWaypoints = waypoints?.filter(
    (w) => w.kmFromStart > newGoal.kmFromStart,
  );
  const remainingDays = autoGenerateTripPlan(
    newGoal.kmFromStart,
    targetDailyKm,
    remainingWaypoints,
  );

  // Renumber remaining days
  const renumberedRemaining = remainingDays.map((slot, index) => ({
    ...slot,
    dayNumber: fromDayNumber + 1 + index,
  }));

  return [...keptDays, modifiedDay, ...renumberedRemaining];
}

/**
 * Score a goal candidate for selection.
 * Higher score = better candidate.
 */
function scoreGoal(goal: GoalCandidate, targetKm: number): number {
  // Distance score: closer to target is better (max 100, decreases by 2 per km away)
  const distanceFromTarget = Math.abs(goal.kmFromStart - targetKm);
  const distanceScore = Math.max(0, 100 - distanceFromTarget * 2);

  // Tier bonus
  let tierBonus = 0;
  if (goal.tier === 'major') tierBonus = 30;
  else if (goal.tier === 'mid') tierBonus = 15;

  return distanceScore + tierBonus;
}

/**
 * Get total trip statistics from a plan.
 */
export function getTripStats(plan: TripDaySlot[]) {
  const totalDays = plan.length;
  const totalKm = plan.reduce((sum, slot) => sum + slot.distanceKm, 0);
  const totalElevation = plan.reduce(
    (sum, slot) => sum + slot.elevationGainM,
    0,
  );
  const avgDailyKm = totalDays > 0 ? totalKm / totalDays : 0;

  return {
    totalDays,
    totalKm: Math.round(totalKm),
    totalElevation: Math.round(totalElevation),
    avgDailyKm: Math.round(avgDailyKm),
  };
}
