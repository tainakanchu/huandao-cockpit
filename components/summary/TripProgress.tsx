import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { CyclingColors } from '@/constants/Colors';

type TripDaySlot = {
  dayNumber: number;
  startKm: number;
  endKm: number;
  goalId: string;
  goalName: string;
  goalNameZh: string;
  distanceKm: number;
  elevationGainM: number;
  status: 'planned' | 'active' | 'completed' | 'skipped';
};

type Props = {
  tripPlan: TripDaySlot[] | null;
  currentDayNumber: number;
};

const STATUS_COLORS: Record<TripDaySlot['status'], string> = {
  completed: CyclingColors.success,
  active: CyclingColors.primary,
  planned: CyclingColors.textLight,
  skipped: CyclingColors.accent,
};

const STATUS_EMOJI: Record<TripDaySlot['status'], string> = {
  completed: '',
  active: '',
  planned: '',
  skipped: '',
};

const BAR_HEIGHT = 28;
const GAP = 2;
const BORDER_RADIUS = 6;

export default function TripProgress({ tripPlan, currentDayNumber }: Props) {
  if (!tripPlan || tripPlan.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>旅程タイムライン</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>
            旅程プランがまだ設定されていません
          </Text>
        </View>
      </View>
    );
  }

  const totalDays = tripPlan.length;
  const completedDays = tripPlan.filter((d) => d.status === 'completed').length;
  const startCity = tripPlan[0].goalNameZh || tripPlan[0].goalName;
  const endCity =
    tripPlan[totalDays - 1].goalNameZh || tripPlan[totalDays - 1].goalName;

  // Calculate SVG width - we use 100% of parent via onLayout,
  // but for SVG viewBox we use a fixed coordinate system
  const SVG_WIDTH = 320;
  const segmentWidth = (SVG_WIDTH - GAP * (totalDays - 1)) / totalDays;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>旅程タイムライン</Text>
        <Text style={styles.progressLabel}>
          {completedDays}/{totalDays} 日完了
        </Text>
      </View>

      {/* City labels above bar */}
      <View style={styles.cityRow}>
        <Text style={styles.cityLabel} numberOfLines={1}>
          {startCity}
        </Text>
        <Text style={[styles.cityLabel, styles.cityLabelEnd]} numberOfLines={1}>
          {endCity}
        </Text>
      </View>

      {/* SVG progress bar */}
      <View style={styles.barContainer}>
        <Svg
          width="100%"
          height={BAR_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${BAR_HEIGHT}`}
          preserveAspectRatio="none"
        >
          {tripPlan.map((slot, index) => {
            const x = index * (segmentWidth + GAP);
            const color = STATUS_COLORS[slot.status];
            const isFirst = index === 0;
            const isLast = index === totalDays - 1;

            return (
              <Rect
                key={slot.dayNumber}
                x={x}
                y={0}
                width={segmentWidth}
                height={BAR_HEIGHT}
                fill={color}
                rx={isFirst || isLast ? BORDER_RADIUS : 2}
                ry={isFirst || isLast ? BORDER_RADIUS : 2}
                opacity={slot.status === 'planned' ? 0.4 : 1}
              />
            );
          })}
        </Svg>
      </View>

      {/* Day numbers below bar */}
      <View style={styles.dayNumberRow}>
        {tripPlan.map((slot) => (
          <View key={slot.dayNumber} style={[styles.dayNumberItem, { flex: 1 }]}>
            <Text
              style={[
                styles.dayNumber,
                slot.dayNumber === currentDayNumber && styles.dayNumberActive,
                slot.status === 'completed' && styles.dayNumberCompleted,
                slot.status === 'skipped' && styles.dayNumberSkipped,
              ]}
            >
              {slot.dayNumber}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: CyclingColors.success },
            ]}
          />
          <Text style={styles.legendText}>完了</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: CyclingColors.primary },
            ]}
          />
          <Text style={styles.legendText}>走行中</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: CyclingColors.textLight, opacity: 0.4 },
            ]}
          />
          <Text style={styles.legendText}>予定</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: CyclingColors.accent },
            ]}
          />
          <Text style={styles.legendText}>スキップ</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.primary,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    maxWidth: '45%',
  },
  cityLabelEnd: {
    textAlign: 'right',
  },
  barContainer: {
    width: '100%',
    marginBottom: 4,
  },
  dayNumberRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayNumberItem: {
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 9,
    color: CyclingColors.textLight,
    fontWeight: '500',
  },
  dayNumberActive: {
    color: CyclingColors.primary,
    fontWeight: '800',
    fontSize: 10,
  },
  dayNumberCompleted: {
    color: CyclingColors.success,
    fontWeight: '600',
  },
  dayNumberSkipped: {
    color: CyclingColors.accent,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: CyclingColors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
  },
});
