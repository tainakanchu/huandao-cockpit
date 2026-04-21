// ============================================
// アドバイザリーカード生成（i18n 対応）
// ============================================

import type { DayPlan, AdvisoryCard } from "@/lib/types";
import { calcWindScore } from "@/lib/logic/wind";
import translations, { type Locale } from "@/lib/i18n/translations";

type T = (typeof translations)[Locale];

/**
 * Generate up to 3 advisory cards for a DayPlan, sorted by priority.
 */
export function generateAdvisoryCards(
  plan: DayPlan,
  locale: Locale = 'ja',
): AdvisoryCard[] {
  const t = translations[locale];
  const cards: AdvisoryCard[] = [];

  const windCard = generateWindCard(plan, t);
  if (windCard) cards.push(windCard);

  const climbCard = generateClimbCard(plan, t);
  if (climbCard) cards.push(climbCard);

  const heatCard = generateHeatCard(plan, t);
  if (heatCard) cards.push(heatCard);

  const rainCard = generateRainCard(plan, t);
  if (rainCard) cards.push(rainCard);

  const supplyCard = generateSupplyCard(plan, t);
  if (supplyCard) cards.push(supplyCard);

  const dangerCard = generateDangerCard(plan, t);
  if (dangerCard) cards.push(dangerCard);

  cards.sort((a, b) => a.priority - b.priority);
  return cards.slice(0, 3);
}

export function checkSunsetRisk(
  eta: Date,
  sunsetTime: Date,
  locale: Locale = 'ja',
): AdvisoryCard | null {
  const t = translations[locale];
  const minutesBeforeSunset =
    (sunsetTime.getTime() - eta.getTime()) / (1000 * 60);

  if (minutesBeforeSunset < 0) {
    const minutesAfter = Math.abs(Math.round(minutesBeforeSunset));
    return {
      id: "sunset-critical",
      priority: 1,
      type: "time",
      title: t.advArrivingAfterDark,
      body: t.bodySunsetCritical(minutesAfter),
      severity: "critical",
    };
  }

  if (minutesBeforeSunset < 30) {
    return {
      id: "sunset-warning",
      priority: 2,
      type: "time",
      title: t.advSunsetRisk,
      body: t.bodySunsetWarning(Math.round(minutesBeforeSunset)),
      severity: "warning",
    };
  }

  if (minutesBeforeSunset < 60) {
    return {
      id: "sunset-info",
      priority: 4,
      type: "time",
      title: t.advMonitorDaylight,
      body: t.bodySunsetInfo(Math.round(minutesBeforeSunset)),
      severity: "info",
    };
  }

  return null;
}

export function generateWindCard(plan: DayPlan, t: T): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const windScore = calcWindScore(plan);
  const maxWind = Math.max(...weather.map((s) => s.windSpeedKmh));

  if (windScore >= 70) {
    return {
      id: "wind-critical",
      priority: 1,
      type: "wind",
      title: t.advStrongHeadwind,
      body: t.bodyStrongHeadwind(Math.round(maxWind)),
      severity: "critical",
    };
  }

  if (windScore >= 50) {
    return {
      id: "wind-warning",
      priority: 3,
      type: "wind",
      title: t.advModerateHeadwind,
      body: t.bodyModerateHeadwind(Math.round(maxWind)),
      severity: "warning",
    };
  }

  if (windScore <= 20 && maxWind >= 10) {
    return {
      id: "wind-tailwind",
      priority: 5,
      type: "wind",
      title: t.advTailwind,
      body: t.bodyTailwind(Math.round(maxWind)),
      severity: "info",
    };
  }

  return null;
}

function generateClimbCard(plan: DayPlan, t: T): AdvisoryCard | null {
  if (plan.elevationGainM < 500) return null;

  const climbHazards = plan.hazards.filter((h) => h.type === "climb");
  const maxSeverity =
    climbHazards.length > 0
      ? Math.max(...climbHazards.map((h) => h.severity))
      : 0;

  if (plan.elevationGainM >= 1500 || maxSeverity >= 4) {
    const extra =
      climbHazards.length > 0
        ? climbHazards[0].message
        : t.bodyClimbCriticalDefault;
    return {
      id: "climb-critical",
      priority: 1,
      type: "climb",
      title: t.advMajorClimbing,
      body: t.bodyClimbCritical(Math.round(plan.elevationGainM), extra),
      severity: "critical",
    };
  }

  if (plan.elevationGainM >= 800 || maxSeverity >= 3) {
    return {
      id: "climb-warning",
      priority: 3,
      type: "climb",
      title: t.advSignificantClimbing,
      body: t.bodyClimbWarning(Math.round(plan.elevationGainM)),
      severity: "warning",
    };
  }

  return {
    id: "climb-info",
    priority: 5,
    type: "climb",
    title: t.advModerateClimbing,
    body: t.bodyClimbInfo(Math.round(plan.elevationGainM)),
    severity: "info",
  };
}

function generateHeatCard(plan: DayPlan, t: T): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const maxFeelsLike = Math.max(...weather.map((s) => s.feelsLikeC));

  if (maxFeelsLike >= 38) {
    return {
      id: "heat-critical",
      priority: 1,
      type: "heat",
      title: t.advExtremeHeat,
      body: t.bodyHeatCritical(Math.round(maxFeelsLike)),
      severity: "critical",
    };
  }

  if (maxFeelsLike >= 34) {
    return {
      id: "heat-warning",
      priority: 3,
      type: "heat",
      title: t.advHeatAdvisory,
      body: t.bodyHeatWarning(Math.round(maxFeelsLike)),
      severity: "warning",
    };
  }

  return null;
}

function generateRainCard(plan: DayPlan, t: T): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const maxPrecipProb = Math.max(
    ...weather.map((s) => s.precipitationProbability),
  );
  const totalPrecip = weather.reduce((sum, s) => sum + s.precipitationMm, 0);

  if (totalPrecip >= 20 || maxPrecipProb >= 80) {
    return {
      id: "rain-critical",
      priority: 2,
      type: "rain",
      title: t.advHeavyRain,
      body: t.bodyRainCritical(Number(totalPrecip.toFixed(0)), maxPrecipProb),
      severity: "critical",
    };
  }

  if (totalPrecip >= 5 || maxPrecipProb >= 50) {
    return {
      id: "rain-warning",
      priority: 3,
      type: "rain",
      title: t.advRainLikely,
      body: t.bodyRainWarning(maxPrecipProb, Number(totalPrecip.toFixed(0))),
      severity: "warning",
    };
  }

  if (maxPrecipProb >= 30) {
    return {
      id: "rain-info",
      priority: 5,
      type: "rain",
      title: t.advPossibleShowers,
      body: t.bodyRainInfo(maxPrecipProb),
      severity: "info",
    };
  }

  return null;
}

function generateSupplyCard(plan: DayPlan, t: T): AdvisoryCard | null {
  const supplyTypes = new Set([
    "seven_eleven",
    "family_mart",
    "hi_life",
    "ok_mart",
    "water",
    "food",
  ]);

  const supplyPoints = plan.checkpoints.filter((cp) =>
    supplyTypes.has(cp.type),
  );

  if (supplyPoints.length === 0) {
    return {
      id: "supply-critical",
      priority: 1,
      type: "supply",
      title: t.advNoSupply,
      body: t.bodyNoSupply,
      severity: "critical",
    };
  }

  const sorted = [...supplyPoints].sort(
    (a, b) => a.kmFromStart - b.kmFromStart,
  );

  let maxGap = sorted[0].kmFromStart - plan.startKm;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].kmFromStart - sorted[i].kmFromStart;
    if (gap > maxGap) maxGap = gap;
  }
  const lastGap = plan.endKm - sorted[sorted.length - 1].kmFromStart;
  if (lastGap > maxGap) maxGap = lastGap;

  if (maxGap >= 40) {
    return {
      id: "supply-gap-warning",
      priority: 2,
      type: "supply",
      title: t.advLongSupplyGap,
      body: t.bodyLongSupplyGap(Math.round(maxGap)),
      severity: "critical",
    };
  }

  if (maxGap >= 25) {
    return {
      id: "supply-gap-info",
      priority: 4,
      type: "supply",
      title: t.advSupplyGap,
      body: t.bodySupplyGap(Math.round(maxGap)),
      severity: "warning",
    };
  }

  return null;
}

function generateDangerCard(plan: DayPlan, t: T): AdvisoryCard | null {
  const dangerHazards = plan.hazards.filter(
    (h) => h.type === "traffic" || h.type === "tunnel",
  );

  if (dangerHazards.length === 0) return null;

  const maxSeverity = Math.max(...dangerHazards.map((h) => h.severity));

  if (maxSeverity >= 4) {
    const worst = dangerHazards.find((h) => h.severity === maxSeverity)!;
    return {
      id: `danger-${worst.id}`,
      priority: 2,
      type: "danger",
      title: t.advDangerousSection,
      body: worst.message,
      severity: "critical",
    };
  }

  if (maxSeverity >= 3) {
    return {
      id: "danger-warning",
      priority: 4,
      type: "danger",
      title: t.advCautionAhead,
      body: t.bodyCautionAhead(dangerHazards.length),
      severity: "warning",
    };
  }

  return null;
}
