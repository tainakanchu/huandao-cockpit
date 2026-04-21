import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import type { DifficultyLevel } from '@/lib/types';

type Props = {
  startName: string;
  endName: string;
  difficultyLevel: DifficultyLevel;
};

export default function DayHeader({
  startName,
  endName,
  difficultyLevel,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>ライド</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.white,
    letterSpacing: 0.5,
  },
  route: {
    fontSize: 18,
    fontWeight: '600',
    color: CyclingColors.white,
    letterSpacing: 0.5,
  },
});
