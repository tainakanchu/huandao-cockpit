import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { DayRecord, TotalProgress } from '@/lib/store/tripStore';

type Props = {
  dayHistory: DayRecord[];
  progress: TotalProgress;
};

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h${mins.toString().padStart(2, '0')}m`;
}

export default function CumulativeStats({ dayHistory, progress }: Props) {
  const avgDistance =
    progress.completedRides > 0
      ? progress.completedKm / progress.completedRides
      : 0;

  const metrics = [
    {
      icon: '🚴',
      label: '累計距離',
      value: `${progress.completedKm.toFixed(1)}`,
      unit: 'km',
    },
    {
      icon: '📅',
      label: 'ライド回数',
      value: `${progress.completedRides}`,
      unit: '回',
    },
    {
      icon: '📊',
      label: '平均距離',
      value: `${avgDistance.toFixed(1)}`,
      unit: 'km',
    },
    {
      icon: '⏱️',
      label: '総走行時間',
      value: formatDuration(progress.totalRidingMinutes),
      unit: '',
    },
    {
      icon: '⛰️',
      label: '総獲得標高',
      value: `${progress.totalElevationM.toLocaleString()}`,
      unit: 'm',
    },
  ];

  if (dayHistory.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>累計スタッツ</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});
