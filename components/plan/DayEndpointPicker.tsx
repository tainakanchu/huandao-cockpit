import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { getGoalCandidates } from '@/lib/data/goals';
import { getElevationGain } from '@/lib/data/route';
import type { GoalCandidate } from '@/lib/types';

type Props = {
  visible: boolean;
  dayNumber: number;
  startKm: number;
  currentGoalKm: number;
  onSelect: (goal: GoalCandidate) => void;
  onClose: () => void;
};

const tierLabels: Record<string, { label: string; color: string }> = {
  major: { label: '主要', color: CyclingColors.primary },
  mid: { label: '中間', color: CyclingColors.accent },
  minor: { label: '小規模', color: CyclingColors.textSecondary },
};

export default function DayEndpointPicker({
  visible,
  dayNumber,
  startKm,
  currentGoalKm,
  onSelect,
  onClose,
}: Props) {
  const filteredGoals = useMemo(() => {
    const allGoals = getGoalCandidates();
    return allGoals
      .filter((g) => g.kmFromStart > startKm)
      .sort((a, b) => a.kmFromStart - b.kmFromStart);
  }, [startKm]);

  const renderItem = ({ item }: { item: GoalCandidate }) => {
    const distanceFromStart = Math.round(item.kmFromStart - startKm);
    const elevGain = getElevationGain(startKm, item.kmFromStart);
    const isCurrent = Math.abs(item.kmFromStart - currentGoalKm) < 1;
    const tier = tierLabels[item.tier] ?? tierLabels.minor;

    return (
      <TouchableOpacity
        style={[
          styles.goalItem,
          item.hasAccommodation && styles.goalItemAccommodation,
          isCurrent && styles.goalItemCurrent,
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.goalLeft}>
          <View style={styles.goalNameRow}>
            <Text style={styles.goalName}>{item.nameZh}</Text>
            <Text style={styles.goalNameEn}>{item.name}</Text>
          </View>

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
              {item.hasAccommodation ? (
                <Text style={styles.facilityIcon}>🏨</Text>
              ) : (
                <View style={styles.noAccomBadge}>
                  <Text style={styles.noAccomText}>⚠️ 宿泊なし</Text>
                </View>
              )}
              {item.hasConvenienceStore && (
                <Text style={styles.facilityIcon}>🏪</Text>
              )}
              {item.hasStation && (
                <Text style={styles.facilityIcon}>🚉</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.goalRight}>
          <Text style={styles.goalDistance}>{distanceFromStart}</Text>
          <Text style={styles.goalDistanceUnit}>km</Text>
          <Text style={styles.goalElevation}>+{elevGain}m</Text>
          {isCurrent && (
            <Text style={styles.currentLabel}>現在</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Day {dayNumber} のゴールを変更
            </Text>
            <Text style={styles.headerSubtitle}>
              出発地点: KP {startKm.toFixed(0)}km
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        {/* Goal list */}
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CyclingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CyclingColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CyclingColors.divider,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: CyclingColors.background,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.primary,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
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
  goalItemAccommodation: {
    borderColor: CyclingColors.success + '40',
  },
  goalItemCurrent: {
    borderColor: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight + '30',
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
    flexWrap: 'wrap',
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
    gap: 4,
    alignItems: 'center',
  },
  facilityIcon: {
    fontSize: 14,
  },
  noAccomBadge: {
    backgroundColor: CyclingColors.severity.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noAccomText: {
    fontSize: 10,
    fontWeight: '600',
    color: CyclingColors.severity.warning,
  },
  goalRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  goalDistance: {
    fontSize: 24,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  goalDistanceUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.primary,
    marginTop: -3,
  },
  goalElevation: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: CyclingColors.primary,
    marginTop: 4,
    backgroundColor: CyclingColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
