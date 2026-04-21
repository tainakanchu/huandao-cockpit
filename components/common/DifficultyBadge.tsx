import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';
import type { DifficultyLevel } from '@/lib/types';

type Props = {
  level: DifficultyLevel;
};

export default function DifficultyBadge({ level }: Props) {
  const t = useT();
  const label =
    level === 'Easy'
      ? t.diffEasy
      : level === 'Moderate'
        ? t.diffModerate
        : level === 'Hard'
          ? t.diffHard
          : t.diffCritical;
  const bgColor = CyclingColors.difficulty[level];

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
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
