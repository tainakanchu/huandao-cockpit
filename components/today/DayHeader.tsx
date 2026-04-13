import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import type { DifficultyLevel } from '@/lib/types';

type Props = {
  dayNumber: number;
  startName: string;
  endName: string;
  difficultyLevel: DifficultyLevel;
};

export default function DayHeader({
  dayNumber,
  startName,
  endName,
  difficultyLevel,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayLabel}>DAY</Text>
          <Text style={styles.dayNumber}>{dayNumber}</Text>
        </View>
        <DifficultyBadge level={difficultyLevel} />
      </View>

      <Text style={styles.route}>
        {startName} → {endName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: CyclingColors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.primaryLight,
    letterSpacing: 1,
  },
  dayNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: CyclingColors.white,
  },
  route: {
    fontSize: 18,
    fontWeight: '600',
    color: CyclingColors.white,
    letterSpacing: 0.5,
  },
});
