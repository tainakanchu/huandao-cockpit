import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { usePlanStore } from '@/lib/store/planStore';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function chipLabel(offset: number, date: Date): { main: string; sub: string } {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const weekday = DAY_LABELS[date.getDay()];
  if (offset === 0) return { main: '今日', sub: `${mm}/${dd}(${weekday})` };
  if (offset === 1) return { main: '明日', sub: `${mm}/${dd}(${weekday})` };
  return { main: `+${offset}日`, sub: `${mm}/${dd}(${weekday})` };
}

export default function RideDateChips() {
  const rideDate = usePlanStore((s) => s.rideDate);
  const setRideDate = usePlanStore((s) => s.setRideDate);
  const isLoading = usePlanStore((s) => s.isLoading);

  const chips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Open-Meteo は無料枠で概ね 7 日先まで予報可能
    return Array.from({ length: 7 }, (_, offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return { offset, date: d };
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>走る日</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips.map(({ offset, date }) => {
          const active = sameDay(date, rideDate);
          const { main, sub } = chipLabel(offset, date);
          return (
            <TouchableOpacity
              key={offset}
              style={[styles.chip, active && styles.chipActive]}
              disabled={isLoading}
              onPress={() => {
                if (!active) setRideDate(date).catch(() => {});
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.chipMain, active && styles.chipMainActive]}
              >
                {main}
              </Text>
              <Text
                style={[styles.chipSub, active && styles.chipSubActive]}
              >
                {sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  row: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: CyclingColors.card,
    borderWidth: 1.5,
    borderColor: CyclingColors.cardBorder,
    alignItems: 'center',
    minWidth: 64,
  },
  chipActive: {
    backgroundColor: CyclingColors.primary,
    borderColor: CyclingColors.primaryDark,
  },
  chipMain: {
    fontSize: 13,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  chipMainActive: {
    color: CyclingColors.white,
  },
  chipSub: {
    fontSize: 10,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  chipSubActive: {
    color: CyclingColors.white,
    opacity: 0.8,
  },
});
