import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { CyclingColors } from '@/constants/Colors';
import { getDifficultyLevel } from '@/lib/logic/difficulty';
import { getRouteElevationProfile, getElevationAtKm } from '@/lib/data/route';
import { getGoalCandidates } from '@/lib/data/goals';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import type { TripDaySlot } from '@/lib/store/tripStore';

type Props = {
  slot: TripDaySlot;
  onChangeGoal: (dayNumber: number) => void;
  onToggleSkip?: (dayNumber: number) => void;
  isActive?: boolean;
};

const STATUS_COLORS: Record<TripDaySlot['status'], string> = {
  planned: CyclingColors.textLight,
  active: CyclingColors.primary,
  completed: CyclingColors.success,
  skipped: CyclingColors.accent,
};

const STATUS_LABELS: Record<TripDaySlot['status'], string> = {
  planned: '計画済',
  active: '🔵 走行中',
  completed: '✅ 完了',
  skipped: '⏭️ スキップ',
};

/**
 * Calculate a simplified difficulty level from distance and elevation.
 * This avoids needing a full DayPlan for the trip planner view.
 */
function estimateDifficulty(distanceKm: number, elevationGainM: number) {
  // Distance score: 60km=0, 120km=50, 160+=100
  let distScore = 0;
  if (distanceKm > 60) {
    distScore = Math.min(100, ((distanceKm - 60) / 100) * 100);
  }
  // Elevation score: 0m=0, 2000m=100
  const elevScore = Math.min(100, (elevationGainM / 2000) * 100);

  // Simplified weighted average (distance 50%, elevation 50%)
  const score = Math.round(distScore * 0.5 + elevScore * 0.5);
  return getDifficultyLevel(score);
}

export default function TripDayCard({
  slot,
  onChangeGoal,
  onToggleSkip,
  isActive = false,
}: Props) {
  const borderColor = STATUS_COLORS[slot.status];
  const difficultyLevel = useMemo(
    () => estimateDifficulty(slot.distanceKm, slot.elevationGainM),
    [slot.distanceKm, slot.elevationGainM],
  );

  // Look up the goal to get facility info
  const goalInfo = useMemo(() => {
    const goals = getGoalCandidates();
    return goals.find((g) => g.id === slot.goalId);
  }, [slot.goalId]);

  // Look up start city name
  const startCityName = useMemo(() => {
    if (slot.startKm === 0) return '台北/松山';
    const goals = getGoalCandidates();
    // Find the goal closest to startKm
    const startGoal = goals
      .filter((g) => Math.abs(g.kmFromStart - slot.startKm) < 1)
      .sort(
        (a, b) =>
          Math.abs(a.kmFromStart - slot.startKm) -
          Math.abs(b.kmFromStart - slot.startKm),
      )[0];
    return startGoal?.nameZh ?? `KP ${slot.startKm.toFixed(0)}`;
  }, [slot.startKm]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: borderColor },
        isActive && styles.cardActive,
      ]}
      onPress={() => onChangeGoal(slot.dayNumber)}
      activeOpacity={0.7}
    >
      {/* Header row: Day number + status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dayNumber}>Day {slot.dayNumber}</Text>
          <Text style={styles.routeLabel}>
            {startCityName} → {slot.goalNameZh}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[styles.statusText, { color: borderColor }]}
          >
            {STATUS_LABELS[slot.status]}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{slot.distanceKm.toFixed(0)}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{slot.elevationGainM}</Text>
          <Text style={styles.statUnit}>m ↑</Text>
        </View>
        <View style={styles.statDivider} />
        <DifficultyBadge level={difficultyLevel} />
      </View>

      {/* Mini elevation bar */}
      <MiniElevationBar startKm={slot.startKm} endKm={slot.endKm} />

      {/* Facility & warning row */}
      <View style={styles.facilityRow}>
        <View style={styles.facilityIcons}>
          {goalInfo?.hasAccommodation && (
            <Text style={styles.facilityIcon}>🏨</Text>
          )}
          {goalInfo?.hasConvenienceStore && (
            <Text style={styles.facilityIcon}>🏪</Text>
          )}
          {goalInfo?.hasStation && (
            <Text style={styles.facilityIcon}>🚉</Text>
          )}
        </View>

        {!goalInfo?.hasAccommodation && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>⚠️ 宿泊なし</Text>
          </View>
        )}

        {onToggleSkip && slot.status === 'planned' && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => onToggleSkip(slot.dayNumber)}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>スキップ</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/** A thin horizontal SVG bar showing relative elevation for the segment */
function MiniElevationBar({
  startKm,
  endKm,
}: {
  startKm: number;
  endKm: number;
}) {
  const barWidth = 310;
  const barHeight = 28;
  const padding = { top: 2, bottom: 2, left: 0, right: 0 };
  const chartW = barWidth - padding.left - padding.right;
  const chartH = barHeight - padding.top - padding.bottom;

  const pathData = useMemo(() => {
    const profile = getRouteElevationProfile();
    const filtered = profile
      .filter((p) => p.km >= startKm && p.km <= endKm)
      .sort((a, b) => a.km - b.km);

    // Build points including start and end
    const pts: { km: number; elev: number }[] = [];
    const startElev = getElevationAtKm(startKm);
    pts.push({ km: startKm, elev: startElev });

    for (const p of filtered) {
      if (p.km > startKm && p.km < endKm) {
        pts.push({ km: p.km, elev: p.elevationM });
      }
    }

    const endElev = getElevationAtKm(endKm);
    pts.push({ km: endKm, elev: endElev });

    if (pts.length < 2) return '';

    const elevs = pts.map((p) => p.elev);
    let minE = Math.min(...elevs);
    let maxE = Math.max(...elevs);
    const range = maxE - minE || 50;
    minE = Math.max(0, minE - range * 0.1);
    maxE = maxE + range * 0.15;

    const xScale = (km: number) =>
      ((km - startKm) / (endKm - startKm)) * chartW;
    const yScale = (elev: number) =>
      chartH - ((elev - minE) / (maxE - minE)) * chartH;

    const linePoints = pts.map((p) => `${xScale(p.km)},${yScale(p.elev)}`);
    const linePath = `M ${linePoints.join(' L ')}`;
    const areaPath = `${linePath} L ${xScale(pts[pts.length - 1].km)},${chartH} L ${xScale(pts[0].km)},${chartH} Z`;

    return { linePath, areaPath };
  }, [startKm, endKm]);

  if (!pathData) return null;

  return (
    <View style={styles.elevationBar}>
      <Svg width={barWidth} height={barHeight}>
        <Defs>
          <LinearGradient id="miniElevGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0%"
              stopColor={CyclingColors.primary}
              stopOpacity={0.25}
            />
            <Stop
              offset="100%"
              stopColor={CyclingColors.primary}
              stopOpacity={0.05}
            />
          </LinearGradient>
        </Defs>
        <Svg
          x={padding.left}
          y={padding.top}
          width={chartW}
          height={chartH}
        >
          <Path d={pathData.areaPath} fill="url(#miniElevGrad)" />
          <Path
            d={pathData.linePath}
            fill="none"
            stroke={CyclingColors.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: CyclingColors.textLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: CyclingColors.primary,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: CyclingColors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: CyclingColors.divider,
  },
  elevationBar: {
    marginVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: CyclingColors.background,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  facilityIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  facilityIcon: {
    fontSize: 16,
  },
  warningBadge: {
    backgroundColor: CyclingColors.severity.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.severity.warning,
  },
  skipButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CyclingColors.textLight,
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
});
