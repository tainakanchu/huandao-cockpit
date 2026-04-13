// ============================================
// アドバイザリーカード生成
// ============================================

import type { DayPlan, AdvisoryCard } from "@/lib/types";
import { calcWindScore } from "@/lib/logic/wind";

/**
 * Generate up to 3 advisory cards for a DayPlan, sorted by priority.
 *
 * Checks for:
 * 1. Wind conditions
 * 2. Climbing hazards
 * 3. Heat risk
 * 4. Rain risk
 * 5. Supply gaps
 * 6. Traffic/danger hazards
 */
export function generateAdvisoryCards(plan: DayPlan): AdvisoryCard[] {
  const cards: AdvisoryCard[] = [];

  // Wind card
  const windCard = generateWindCard(plan);
  if (windCard) cards.push(windCard);

  // Climb card
  const climbCard = generateClimbCard(plan);
  if (climbCard) cards.push(climbCard);

  // Heat card
  const heatCard = generateHeatCard(plan);
  if (heatCard) cards.push(heatCard);

  // Rain card
  const rainCard = generateRainCard(plan);
  if (rainCard) cards.push(rainCard);

  // Supply gap card
  const supplyCard = generateSupplyCard(plan);
  if (supplyCard) cards.push(supplyCard);

  // Danger card (traffic, tunnels)
  const dangerCard = generateDangerCard(plan);
  if (dangerCard) cards.push(dangerCard);

  // Sort by priority (lower = more urgent) and return top 3
  cards.sort((a, b) => a.priority - b.priority);
  return cards.slice(0, 3);
}

/**
 * Check if the estimated arrival time is dangerously close to or after sunset.
 *
 * @param eta         Estimated time of arrival
 * @param sunsetTime  Sunset time for that day
 * @returns           An advisory card if there's a sunset risk, null otherwise
 */
export function checkSunsetRisk(
  eta: Date,
  sunsetTime: Date
): AdvisoryCard | null {
  const minutesBeforeSunset =
    (sunsetTime.getTime() - eta.getTime()) / (1000 * 60);

  if (minutesBeforeSunset < 0) {
    // Arriving after sunset
    const minutesAfter = Math.abs(Math.round(minutesBeforeSunset));
    return {
      id: "sunset-critical",
      priority: 1,
      type: "time",
      title: "日没後の到着",
      body: `現在のペースでは日没の約 ${minutesAfter} 分後に到着する見込みです。本日の走行距離を短縮するか、ペースを上げることを検討してください。台湾の幹線道路での夜間走行は非常に危険です。`,
      severity: "critical",
    };
  }

  if (minutesBeforeSunset < 30) {
    return {
      id: "sunset-warning",
      priority: 2,
      type: "time",
      title: "日没リスク",
      body: `到着予定は日没のわずか ${Math.round(minutesBeforeSunset)} 分前です。ペースを維持するか、早めの停止を検討してください。`,
      severity: "warning",
    };
  }

  if (minutesBeforeSunset < 60) {
    return {
      id: "sunset-info",
      priority: 4,
      type: "time",
      title: "日照時間に注意",
      body: `到着予定は日没の約 ${Math.round(minutesBeforeSunset)} 分前です。ペースに注意してください。`,
      severity: "info",
    };
  }

  return null;
}

/**
 * Generate a wind advisory card if wind conditions are significant.
 */
export function generateWindCard(plan: DayPlan): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const windScore = calcWindScore(plan);
  const maxWind = Math.max(...weather.map((s) => s.windSpeedKmh));

  if (windScore >= 70) {
    return {
      id: "wind-critical",
      priority: 1,
      type: "wind",
      title: "強い向かい風",
      body: `最大 ${Math.round(maxWind)} km/h の強い向かい風が予想されます。大幅なペースダウンが見込まれます。待機またはルート変更を検討してください。`,
      severity: "critical",
    };
  }

  if (windScore >= 50) {
    return {
      id: "wind-warning",
      priority: 3,
      type: "wind",
      title: "中程度の向かい風",
      body: `最大 ${Math.round(maxWind)} km/h の向かい風が予想されます。時間と体力に余裕を持ってください。`,
      severity: "warning",
    };
  }

  if (windScore <= 20 && maxWind >= 10) {
    return {
      id: "wind-tailwind",
      priority: 5,
      type: "wind",
      title: "追い風",
      body: `本日は最大 ${Math.round(maxWind)} km/h の追い風が期待できます。距離を稼ぐ好条件です。`,
      severity: "info",
    };
  }

  return null;
}

// ── Internal card generators ──────────────────────────────────────

/**
 * Generate climb advisory card.
 */
function generateClimbCard(plan: DayPlan): AdvisoryCard | null {
  if (plan.elevationGainM < 500) return null;

  const climbHazards = plan.hazards.filter((h) => h.type === "climb");
  const maxSeverity = climbHazards.length > 0
    ? Math.max(...climbHazards.map((h) => h.severity))
    : 0;

  if (plan.elevationGainM >= 1500 || maxSeverity >= 4) {
    return {
      id: "climb-critical",
      priority: 1,
      type: "climb",
      title: "大きな登坂日",
      body: `合計獲得標高: ${Math.round(plan.elevationGainM)} m。${climbHazards.length > 0 ? climbHazards[0].message : "ペース配分に注意し、十分な食料と水を確保してください。"}`,
      severity: "critical",
    };
  }

  if (plan.elevationGainM >= 800 || maxSeverity >= 3) {
    return {
      id: "climb-warning",
      priority: 3,
      type: "climb",
      title: "かなりの登坂",
      body: `合計獲得標高: ${Math.round(plan.elevationGainM)} m。時間に余裕を持ち、登坂では体力を温存してください。`,
      severity: "warning",
    };
  }

  return {
    id: "climb-info",
    priority: 5,
    type: "climb",
    title: "中程度の登坂",
    body: `本日の合計獲得標高: ${Math.round(plan.elevationGainM)} m。`,
    severity: "info",
  };
}

/**
 * Generate heat advisory card.
 */
function generateHeatCard(plan: DayPlan): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const maxFeelsLike = Math.max(...weather.map((s) => s.feelsLikeC));

  if (maxFeelsLike >= 38) {
    return {
      id: "heat-critical",
      priority: 1,
      type: "heat",
      title: "酷暑警報",
      body: `体感温度は最高 ${Math.round(maxFeelsLike)}°C に達する見込みです。ピーク時間帯（11:00〜14:00）は休憩してください。水分補給を大幅に増やしてください。`,
      severity: "critical",
    };
  }

  if (maxFeelsLike >= 34) {
    return {
      id: "heat-warning",
      priority: 3,
      type: "heat",
      title: "暑さ注意",
      body: `体感温度は最高 ${Math.round(maxFeelsLike)}°C に達する見込みです。早朝に出発し、日陰で休憩を取り、こまめに水分補給してください。`,
      severity: "warning",
    };
  }

  return null;
}

/**
 * Generate rain advisory card.
 */
function generateRainCard(plan: DayPlan): AdvisoryCard | null {
  const weather = plan.weather;
  if (!weather || weather.length === 0) return null;

  const maxPrecipProb = Math.max(
    ...weather.map((s) => s.precipitationProbability)
  );
  const totalPrecip = weather.reduce((sum, s) => sum + s.precipitationMm, 0);

  if (totalPrecip >= 20 || maxPrecipProb >= 80) {
    return {
      id: "rain-critical",
      priority: 2,
      type: "rain",
      title: "大雨予報",
      body: `最大 ${totalPrecip.toFixed(0)} mm の降雨が予想されます（確率 ${maxPrecipProb}%）。路面が滑りやすくなります。レインギアの準備または待機を検討してください。`,
      severity: "critical",
    };
  }

  if (totalPrecip >= 5 || maxPrecipProb >= 50) {
    return {
      id: "rain-warning",
      priority: 3,
      type: "rain",
      title: "降雨の可能性",
      body: `降雨が予想されます（確率 ${maxPrecipProb}%、約 ${totalPrecip.toFixed(0)} mm）。レインギアを準備し、下り坂では注意してください。`,
      severity: "warning",
    };
  }

  if (maxPrecipProb >= 30) {
    return {
      id: "rain-info",
      priority: 5,
      type: "rain",
      title: "にわか雨の可能性",
      body: `降水確率 ${maxPrecipProb}%。レインギアの準備を検討してください。`,
      severity: "info",
    };
  }

  return null;
}

/**
 * Generate supply gap advisory card.
 */
function generateSupplyCard(plan: DayPlan): AdvisoryCard | null {
  // Check for supply-type checkpoints in the day
  const supplyTypes = new Set([
    "seven_eleven",
    "family_mart",
    "hi_life",
    "ok_mart",
    "water",
    "food",
  ]);

  const supplyPoints = plan.checkpoints.filter((cp) =>
    supplyTypes.has(cp.type)
  );

  if (supplyPoints.length === 0) {
    return {
      id: "supply-critical",
      priority: 1,
      type: "supply",
      title: "補給ポイントなし",
      body: "本日のルート上にコンビニや水源がありません。出発時にすべての食料と水を携行してください。",
      severity: "critical",
    };
  }

  // Check for gaps
  const sorted = [...supplyPoints].sort(
    (a, b) => a.kmFromStart - b.kmFromStart
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
      title: "長い補給空白区間",
      body: `${Math.round(maxGap)} km にわたって補給ポイントがありません。この区間に入る前に十分に補給してください。`,
      severity: "critical",
    };
  }

  if (maxGap >= 25) {
    return {
      id: "supply-gap-info",
      priority: 4,
      type: "supply",
      title: "補給空白区間",
      body: `${Math.round(maxGap)} km にわたって補給ポイントがありません。補給計画を立ててください。`,
      severity: "warning",
    };
  }

  return null;
}

/**
 * Generate danger advisory for traffic/tunnel hazards.
 */
function generateDangerCard(plan: DayPlan): AdvisoryCard | null {
  const dangerHazards = plan.hazards.filter(
    (h) => h.type === "traffic" || h.type === "tunnel"
  );

  if (dangerHazards.length === 0) return null;

  const maxSeverity = Math.max(...dangerHazards.map((h) => h.severity));

  if (maxSeverity >= 4) {
    const worst = dangerHazards.find((h) => h.severity === maxSeverity)!;
    return {
      id: `danger-${worst.id}`,
      priority: 2,
      type: "danger",
      title: "危険区間",
      body: worst.message,
      severity: "critical",
    };
  }

  if (maxSeverity >= 3) {
    return {
      id: "danger-warning",
      priority: 4,
      type: "danger",
      title: "前方注意",
      body: `本日のルートに ${dangerHazards.length} 箇所の危険区間があります。交通量の多い区間やトンネルでは十分注意してください。`,
      severity: "warning",
    };
  }

  return null;
}
