import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { GoalCandidate } from '@/lib/types';

type Props = {
  goals: GoalCandidate[];
  currentKm: number;
  onSelect: (goal: GoalCandidate) => void;
  highlightDistance?: number;
};

const tierLabels: Record<string, { label: string; color: string }> = {
  major: { label: '主要', color: CyclingColors.primary },
  mid: { label: '中間', color: CyclingColors.accent },
  minor: { label: '小規模', color: CyclingColors.textSecondary },
};

export default function GoalSelector({
  goals,
  currentKm,
  onSelect,
  highlightDistance,
}: Props) {
  const renderItem = ({ item }: { item: GoalCandidate }) => {
    const distanceFromCurrent = item.kmFromStart - currentKm;
    const isHighlighted =
      highlightDistance !== undefined &&
      Math.abs(distanceFromCurrent - highlightDistance) <= 10;
    const tier = tierLabels[item.tier] ?? tierLabels.minor;

    const noAccommodation = !item.hasAccommodation;

    return (
      <TouchableOpacity
        style={[
          styles.goalItem,
          isHighlighted && styles.goalItemHighlighted,
          noAccommodation && styles.goalItemNoAccom,
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.goalLeft}>
          <View style={styles.goalNameRow}>
            <Text style={styles.goalName}>{item.nameZh}</Text>
            <Text style={styles.goalNameEn}>{item.name}</Text>
          </View>

          {noAccommodation && (
            <Text style={styles.noAccomWarning}>⚠️ 宿泊なし</Text>
          )}

          <View style={styles.goalMeta}>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: tier.color + '20' },
              ]}
            >
              <Text style={[styles.tierText, { color: tier.color }]}>
                {tier.label}
              </Text>
            </View>

            <View style={styles.facilityIcons}>
              {item.hasConvenienceStore && (
                <Text style={styles.facilityIcon}>🏪</Text>
              )}
              {item.hasAccommodation && (
                <Text style={styles.facilityIcon}>🏨</Text>
              )}
              {item.hasStation && (
                <Text style={styles.facilityIcon}>🚉</Text>
              )}
            </View>
          </View>

          {item.note && (
            <Text style={styles.goalNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>

        <View style={styles.goalRight}>
          <Text style={styles.goalDistance}>
            {distanceFromCurrent.toFixed(0)}
          </Text>
          <Text style={styles.goalDistanceUnit}>km</Text>
          <Text style={styles.goalKmMark}>
            KP {item.kmFromStart}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={goals}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  goalItem: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalItemHighlighted: {
    borderColor: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight + '30',
  },
  goalItemNoAccom: {
    borderLeftWidth: 4,
    borderLeftColor: CyclingColors.accent,
    opacity: 0.85,
  },
  noAccomWarning: {
    fontSize: 11,
    color: CyclingColors.accent,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalLeft: {
    flex: 1,
  },
  goalNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  goalName: {
    fontSize: 17,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  goalNameEn: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  facilityIcons: {
    flexDirection: 'row',
    gap: 2,
  },
  facilityIcon: {
    fontSize: 14,
  },
  goalNote: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  goalRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  goalDistance: {
    fontSize: 28,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  goalDistanceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.primary,
    marginTop: -4,
  },
  goalKmMark: {
    fontSize: 10,
    color: CyclingColors.textLight,
    marginTop: 4,
  },
});
