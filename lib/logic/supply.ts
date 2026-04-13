// ============================================
// 補給リスク分析
// ============================================

import type {
  Checkpoint,
  GoalCandidate,
  Hazard,
  AdvisoryCard,
  SupplyPoint,
  SupplyRecommendation,
  RideStatus,
} from "@/lib/types";
import guideData from "@/assets/data/guide-data.json";

/** Checkpoint types that count as supply points */
const SUPPLY_TYPES = new Set([
  "seven_eleven",
  "family_mart",
  "hi_life",
  "ok_mart",
  "water",
  "food",
]);

/** Threshold in km beyond which a gap between supply points is concerning */
const SUPPLY_GAP_WARNING_KM = 25;

/** Threshold in km beyond which a supply gap is critical */
const SUPPLY_GAP_CRITICAL_KM = 40;

/**
 * Detect gaps in supply points along a route segment.
 * Returns an array of gaps where the distance between consecutive supply
 * points exceeds SUPPLY_GAP_WARNING_KM.
 */
export function detectSupplyGaps(
  checkpoints: Checkpoint[],
  startKm: number,
  endKm: number
): {
  startKm: number;
  endKm: number;
  distanceKm: number;
  lastSupplyName: string;
}[] {
  // Filter to supply-type checkpoints within range, sorted by km
  const supplyPoints = checkpoints
    .filter(
      (cp) =>
        SUPPLY_TYPES.has(cp.type) &&
        cp.kmFromStart >= startKm &&
        cp.kmFromStart <= endKm
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  const gaps: {
    startKm: number;
    endKm: number;
    distanceKm: number;
    lastSupplyName: string;
  }[] = [];

  // Check gap from route start to first supply point
  if (supplyPoints.length === 0) {
    const distance = endKm - startKm;
    if (distance > SUPPLY_GAP_WARNING_KM) {
      gaps.push({
        startKm,
        endKm,
        distanceKm: distance,
        lastSupplyName: "出発地点",
      });
    }
    return gaps;
  }

  // Gap from start to first supply
  const firstGap = supplyPoints[0].kmFromStart - startKm;
  if (firstGap > SUPPLY_GAP_WARNING_KM) {
    gaps.push({
      startKm,
      endKm: supplyPoints[0].kmFromStart,
      distanceKm: firstGap,
      lastSupplyName: "出発地点",
    });
  }

  // Gaps between consecutive supply points
  for (let i = 0; i < supplyPoints.length - 1; i++) {
    const gap = supplyPoints[i + 1].kmFromStart - supplyPoints[i].kmFromStart;
    if (gap > SUPPLY_GAP_WARNING_KM) {
      gaps.push({
        startKm: supplyPoints[i].kmFromStart,
        endKm: supplyPoints[i + 1].kmFromStart,
        distanceKm: gap,
        lastSupplyName: supplyPoints[i].name,
      });
    }
  }

  // Gap from last supply to end
  const lastGap = endKm - supplyPoints[supplyPoints.length - 1].kmFromStart;
  if (lastGap > SUPPLY_GAP_WARNING_KM) {
    gaps.push({
      startKm: supplyPoints[supplyPoints.length - 1].kmFromStart,
      endKm,
      distanceKm: lastGap,
      lastSupplyName: supplyPoints[supplyPoints.length - 1].name,
    });
  }

  return gaps;
}

/**
 * Generate supply alerts based on current ride status.
 *
 * Creates advisory cards for:
 * - Low water level with no supply ahead within 10 km
 * - Upcoming supply gaps
 * - Low supply hazard zones
 */
export function calcSupplyAlerts(
  currentKm: number,
  checkpoints: Checkpoint[],
  waterLevel: RideStatus["waterLevel"],
  hazards: Hazard[]
): AdvisoryCard[] {
  const alerts: AdvisoryCard[] = [];

  // Find next supply point ahead
  const nextSupply = checkpoints
    .filter(
      (cp) => SUPPLY_TYPES.has(cp.type) && cp.kmFromStart > currentKm
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart)[0];

  const distToNextSupply = nextSupply
    ? nextSupply.kmFromStart - currentKm
    : Infinity;

  // Alert: Low water with no nearby supply
  if (waterLevel === "low" && distToNextSupply > 10) {
    alerts.push({
      id: `supply-water-low-${currentKm}`,
      priority: 1,
      type: "supply",
      title: "水残量低下",
      body: nextSupply
        ? `水の残量が少なくなっています。次の補給は ${nextSupply.name}（${distToNextSupply.toFixed(1)} km 先）です。節水を検討してください。`
        : "水の残量が少なく、前方に補給ポイントが見つかりません。引き返すことを検討してください。",
      severity: "critical",
    });
  } else if (waterLevel === "half" && distToNextSupply > 20) {
    alerts.push({
      id: `supply-water-half-${currentKm}`,
      priority: 3,
      type: "supply",
      title: "水の補充を計画",
      body: nextSupply
        ? `次の補給は ${nextSupply.name}（${distToNextSupply.toFixed(1)} km 先）です。次の機会に水を補充してください。`
        : "前方に補給ポイントが見つかりません。水の残量に注意してください。",
      severity: "warning",
    });
  }

  // Alert: Entering a supply gap
  if (distToNextSupply > SUPPLY_GAP_WARNING_KM) {
    const severity = distToNextSupply > SUPPLY_GAP_CRITICAL_KM ? "critical" : "warning";
    alerts.push({
      id: `supply-gap-${currentKm}`,
      priority: severity === "critical" ? 1 : 2,
      type: "supply",
      title: "前方に補給空白区間",
      body: nextSupply
        ? `${nextSupply.name} まで ${distToNextSupply.toFixed(1)} km 補給ポイントがありません。先に進む前に補給してください。`
        : `このルート区間の前方に補給ポイントが見つかりません。`,
      severity,
    });
  }

  // Alert: Low supply hazard zones ahead
  const lowSupplyHazards = hazards.filter(
    (h) =>
      h.type === "low_supply" &&
      h.endKm > currentKm &&
      h.startKm < currentKm + 50 // look ahead 50 km
  );

  for (const hazard of lowSupplyHazards) {
    const distToHazard = Math.max(0, hazard.startKm - currentKm);
    alerts.push({
      id: `supply-hazard-${hazard.id}`,
      priority: hazard.severity >= 4 ? 2 : 3,
      type: "supply",
      title: "補給困難ゾーン",
      body:
        distToHazard > 0
          ? `${hazard.message} ${distToHazard.toFixed(1)} km 先から開始（km ${hazard.startKm.toFixed(0)}〜${hazard.endKm.toFixed(0)}）。`
          : `${hazard.message} 現在このゾーン内です（km ${hazard.startKm.toFixed(0)}〜${hazard.endKm.toFixed(0)}）。`,
      severity: hazard.severity >= 4 ? "critical" : "warning",
    });
  }

  // Sort by priority (lower number = higher priority)
  return alerts.sort((a, b) => a.priority - b.priority);
}

/** Target interval between recommended supply stops (km) */
const SUPPLY_INTERVAL_KM = 15;

/**
 * Generate a supply plan for a day segment.
 *
 * Selects strategically important supply points from all available checkpoints:
 * - First supply point near the start
 * - Points spaced at ~15km intervals for water refill
 * - Meal stop near the midpoint
 * - Last supply before any gap >25km
 * - Final supply point of the day
 *
 * Typically produces 5-10 points per day instead of listing every store.
 *
 * @param goals  Optional goals (towns) to prefer for meal stops
 */
export function generateSupplyPlan(
  checkpoints: Checkpoint[],
  startKm: number,
  endKm: number,
  goals?: GoalCandidate[]
): SupplyPoint[] {
  const dayDistance = endKm - startKm;

  // Filter and sort supply checkpoints for this day
  const daySupply = checkpoints
    .filter(
      (cp) =>
        SUPPLY_TYPES.has(cp.type) &&
        cp.kmFromStart >= startKm &&
        cp.kmFromStart <= endKm
    )
    .sort((a, b) => a.kmFromStart - b.kmFromStart);

  if (daySupply.length === 0) {
    return [];
  }

  // --- 1. Identify must-pick points ---
  const midKm = startKm + dayDistance / 2;
  const gaps = detectSupplyGaps(checkpoints, startKm, endKm);
  const finalBeforeGapKms = new Set(gaps.map((g) => g.startKm));

  // Towns along today's route (excluding start/end)
  const routeTowns = (goals ?? []).filter(
    (g) => g.kmFromStart > startKm + 5 && g.kmFromStart < endKm - 5
  );

  // Meal candidate: prefer a supply point near a town close to the midpoint
  let mealIdx = 0;
  let mealTown: GoalCandidate | undefined;

  if (routeTowns.length > 0) {
    // Find the town closest to the midpoint
    const bestTown = routeTowns.reduce((best, town) =>
      Math.abs(town.kmFromStart - midKm) < Math.abs(best.kmFromStart - midKm)
        ? town
        : best
    );
    // Find the supply point closest to that town
    let minDist = Infinity;
    for (let i = 0; i < daySupply.length; i++) {
      if (!isConvenienceStoreOrFood(daySupply[i].type)) continue;
      const dist = Math.abs(daySupply[i].kmFromStart - bestTown.kmFromStart);
      if (dist < minDist) {
        minDist = dist;
        mealIdx = i;
        mealTown = bestTown;
      }
    }
  } else {
    // Fallback: convenience store closest to midpoint
    let minMidDist = Infinity;
    for (let i = 0; i < daySupply.length; i++) {
      if (!isConvenienceStoreOrFood(daySupply[i].type)) continue;
      const dist = Math.abs(daySupply[i].kmFromStart - midKm);
      if (dist < minMidDist) {
        minMidDist = dist;
        mealIdx = i;
      }
    }
  }

  // Indices that must be included
  const mustPick = new Set<number>();
  mustPick.add(0);                        // first
  mustPick.add(daySupply.length - 1);     // last (final)
  mustPick.add(mealIdx);                  // meal

  // Before-gap points
  for (let i = 0; i < daySupply.length; i++) {
    if (finalBeforeGapKms.has(daySupply[i].kmFromStart)) {
      mustPick.add(i);
    }
  }

  // --- 2. Fill at ~15km intervals ---
  let lastPickedKm = startKm;
  for (let i = 0; i < daySupply.length; i++) {
    if (mustPick.has(i)) {
      lastPickedKm = daySupply[i].kmFromStart;
      continue;
    }
    if (daySupply[i].kmFromStart - lastPickedKm >= SUPPLY_INTERVAL_KM) {
      mustPick.add(i);
      lastPickedKm = daySupply[i].kmFromStart;
    }
  }

  // --- 3. Build plan from selected points ---
  const selectedIndices = Array.from(mustPick).sort((a, b) => a - b);
  const plan: SupplyPoint[] = [];

  for (const idx of selectedIndices) {
    const cp = daySupply[idx];
    const kmFromDayStart = cp.kmFromStart - startKm;

    let recommended: SupplyRecommendation;
    let reason: string;

    if (idx === daySupply.length - 1) {
      recommended = "final";
      reason = "本日最後の補給ポイント。水と食料を十分に補充してください。";
    } else if (finalBeforeGapKms.has(cp.kmFromStart)) {
      recommended = "final";
      const gap = gaps.find((g) => g.startKm === cp.kmFromStart);
      reason = `${gap?.distanceKm.toFixed(0)} km の補給空白区間の前。十分に補充してください。`;
    } else if (idx === mealIdx) {
      recommended = "meal";
      reason = mealTown
        ? `${mealTown.nameZh}付近。町で食事休憩に最適。`
        : "本日の中間地点付近。食事休憩に最適。";
    } else if (cp.type === "water") {
      recommended = "water";
      reason = "水の補充ポイント。";
    } else {
      // Find distance to next selected point
      const nextSelectedIdx = selectedIndices.find((si) => si > idx);
      if (nextSelectedIdx !== undefined) {
        const distToNext = daySupply[nextSelectedIdx].kmFromStart - cp.kmFromStart;
        recommended = "water";
        reason = `次の補給まで ${distToNext.toFixed(0)} km。水を補充してください。`;
      } else {
        recommended = "light";
        reason = "任意の軽い立ち寄り。";
      }
    }

    // Attach local food info if the checkpoint is in the food's km range
    let localFood: string | undefined;
    for (const food of guideData.localFood) {
      if (cp.kmFromStart >= food.kmRange[0] && cp.kmFromStart <= food.kmRange[1]) {
        localFood = `${food.name}: ${food.description}`;
        break;
      }
    }

    plan.push({ checkpoint: cp, kmFromDayStart, recommended, reason, localFood });
  }

  return plan;
}

/**
 * Calculate a supply gap score (0-100) for difficulty calculation.
 *
 * 0 = supply points every few km, no gaps.
 * 100 = extremely long gaps with no supply.
 */
export function calcSupplyGapScore(
  checkpoints: Checkpoint[],
  startKm: number,
  endKm: number
): number {
  const gaps = detectSupplyGaps(checkpoints, startKm, endKm);

  if (gaps.length === 0) {
    // Check if there are any supply points at all
    const hasSupply = checkpoints.some(
      (cp) =>
        SUPPLY_TYPES.has(cp.type) &&
        cp.kmFromStart >= startKm &&
        cp.kmFromStart <= endKm
    );
    return hasSupply ? 0 : 80; // No supply points at all is very bad
  }

  // Score based on the worst gap
  const worstGap = Math.max(...gaps.map((g) => g.distanceKm));

  // 25 km gap -> ~30 score, 40 km gap -> ~60 score, 60+ km gap -> ~100 score
  const score = ((worstGap - SUPPLY_GAP_WARNING_KM) / 35) * 100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Check if a checkpoint type is a convenience store or food */
function isConvenienceStoreOrFood(type: string): boolean {
  return [
    "seven_eleven",
    "family_mart",
    "hi_life",
    "ok_mart",
    "food",
  ].includes(type);
}
