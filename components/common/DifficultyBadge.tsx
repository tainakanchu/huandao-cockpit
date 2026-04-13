import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { DifficultyLevel } from '@/lib/types';

type Props = {
  level: DifficultyLevel;
};

const labels: Record<DifficultyLevel, string> = {
  Easy: 'やさしい',
  Moderate: 'ふつう',
  Hard: 'きつい',
  Critical: '危険',
};

export default function DifficultyBadge({ level }: Props) {
  const bgColor = CyclingColors.difficulty[level];

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{labels[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: CyclingColors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
