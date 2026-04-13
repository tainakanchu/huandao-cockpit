import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { CyclingColors } from '@/constants/Colors';

type DayRecord = {
  dayNumber: number;
  goalId: string;
  goalName: string;
  distanceKm: number;
  elevationGainM: number;
  ridingMinutes: number;
  date: string;
  notes: string[];
};

type Props = {
  dayHistory: DayRecord[];
  totalKm: number;
  totalDays: number;
};

const PROGRESS_BAR_WIDTH = 280;
const PROGRESS_BAR_HEIGHT = 12;

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h${mins.toString().padStart(2, '0')}m`;
}

export default function CumulativeStats({
  dayHistory,
  totalKm,
  totalDays,
}: Props) {
  const completedKm = dayHistory.reduce((sum, d) => sum + d.distanceKm, 0);
  const completedDays = dayHistory.length;
  const totalRidingMinutes = dayHistory.reduce(
    (sum, d) => sum + d.ridingMinutes,
    0
  );
  const totalElevation = dayHistory.reduce(
    (sum, d) => sum + d.elevationGainM,
    0
  );
  const avgDailyDistance =
    completedDays > 0 ? completedKm / completedDays : 0;

  const kmProgress = totalKm > 0 ? Math.min(completedKm / totalKm, 1) : 0;
  const kmProgressPercent = Math.round(kmProgress * 100);

  const metrics = [
    {
      icon: '🚴',
      label: '走行距離',
      value: `${completedKm.toFixed(1)}`,
      unit: 'km',
      sub: `/ ${totalKm.toFixed(0)} km`,
    },
    {
      icon: '📅',
      label: '完了日数',
      value: `${completedDays}`,
      unit: '日',
      sub: `/ ${totalDays} 日`,
    },
    {
      icon: '📊',
      label: '平均日距離',
      value: `${avgDailyDistance.toFixed(1)}`,
      unit: 'km/日',
      sub: '',
    },
    {
      icon: '⏱️',
      label: '総走行時間',
      value: formatDuration(totalRidingMinutes),
      unit: '',
      sub: '',
    },
    {
      icon: '⛰️',
      label: '総獲得標高',
      value: `${totalElevation.toLocaleString()}`,
      unit: 'm',
      sub: '',
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>累計スタッツ</Text>

      {/* Distance progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {completedKm.toFixed(1)} / {totalKm.toFixed(0)} km
          </Text>
          <Text style={styles.progressPercent}>{kmProgressPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Svg
            width="100%"
            height={PROGRESS_BAR_HEIGHT}
            viewBox={`0 0 ${PROGRESS_BAR_WIDTH} ${PROGRESS_BAR_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={PROGRESS_BAR_WIDTH}
              height={PROGRESS_BAR_HEIGHT}
              fill={CyclingColors.divider}
              rx={PROGRESS_BAR_HEIGHT / 2}
              ry={PROGRESS_BAR_HEIGHT / 2}
            />
            {/* Filled */}
            {kmProgress > 0 && (
              <Rect
                x={0}
                y={0}
                width={PROGRESS_BAR_WIDTH * kmProgress}
                height={PROGRESS_BAR_HEIGHT}
                fill={CyclingColors.success}
                rx={PROGRESS_BAR_HEIGHT / 2}
                ry={PROGRESS_BAR_HEIGHT / 2}
              />
            )}
          </Svg>
        </View>
      </View>

      {/* Metrics grid */}
      <View style={styles.grid}>
        {metrics.map((m, idx) => (
          <View key={idx} style={styles.metricItem}>
            <Text style={styles.metricIcon}>{m.icon}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{m.value}</Text>
              {m.unit !== '' && (
                <Text style={styles.metricUnit}>{m.unit}</Text>
              )}
            </View>
            {m.sub !== '' && <Text style={styles.metricSub}>{m.sub}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: CyclingColors.success,
  },
  progressBarContainer: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
    paddingTop: 12,
  },
  metricItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginBottom: 2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  metricSub: {
    fontSize: 10,
    color: CyclingColors.textLight,
    marginTop: 1,
  },
});
