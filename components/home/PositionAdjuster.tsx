import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { getGoalCandidates } from '@/lib/data/goals';
import type { GoalCandidate } from '@/lib/types';

type Props = {
  visible: boolean;
  currentKm: number;
  onSetPosition: (km: number, dayNumber?: number) => void;
  onClose: () => void;
};

const tierLabels: Record<string, { label: string; color: string }> = {
  major: { label: '主要', color: CyclingColors.primary },
  mid: { label: '中間', color: CyclingColors.accent },
  minor: { label: '小規模', color: CyclingColors.textSecondary },
};

export default function PositionAdjuster({
  visible,
  currentKm,
  onSetPosition,
  onClose,
}: Props) {
  const [manualKm, setManualKm] = useState('');

  const sortedGoals = useMemo(() => {
    const all = getGoalCandidates();
    const filtered = all
      .filter((g) => g.tier === 'major' || g.tier === 'mid')
      .sort((a, b) => a.kmFromStart - b.kmFromStart);

    // ルートは環状: 台北（km 944）が終点だが出発点（km 0）でもある
    // km 0 にスタート地点エントリを追加
    const taipei = all.find((g) => g.name.includes('Taipei'));
    if (taipei && !filtered.some((g) => g.kmFromStart === 0)) {
      filtered.unshift({
        ...taipei,
        id: 'start-taipei',
        name: 'Taipei / Songshan (Start)',
        nameZh: '台北/松山（出発点）',
        kmFromStart: 0,
      });
    }

    return filtered;
  }, []);

  // Find the closest goal to currentKm for highlighting
  const closestGoalId = useMemo(() => {
    if (sortedGoals.length === 0) return null;
    let closest = sortedGoals[0];
    for (const goal of sortedGoals) {
      if (
        Math.abs(goal.kmFromStart - currentKm) <
        Math.abs(closest.kmFromStart - currentKm)
      ) {
        closest = goal;
      }
    }
    return closest.id;
  }, [sortedGoals, currentKm]);

  const handleManualSubmit = () => {
    const parsed = parseFloat(manualKm);
    if (!isNaN(parsed) && parsed >= 0) {
      onSetPosition(parsed);
      setManualKm('');
    }
  };

  const handleGoalTap = (goal: GoalCandidate) => {
    onSetPosition(goal.kmFromStart);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>現在位置を設定</Text>
              <Text style={styles.currentPosition}>
                現在: {currentKm} km
              </Text>
            </View>

            {/* Goal list */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {sortedGoals.map((goal) => {
                const tier = tierLabels[goal.tier] ?? tierLabels.minor;
                const isClosest = goal.id === closestGoalId;

                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalItem,
                      isClosest && styles.goalItemClosest,
                    ]}
                    onPress={() => handleGoalTap(goal)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalLeft}>
                      <View style={styles.goalNameRow}>
                        <Text
                          style={[
                            styles.goalName,
                            isClosest && styles.goalNameClosest,
                          ]}
                        >
                          {goal.nameZh}
                        </Text>
                        <Text style={styles.goalNameEn}>{goal.name}</Text>
                      </View>

                      <View style={styles.goalMeta}>
                        <View
                          style={[
                            styles.tierBadge,
                            { backgroundColor: tier.color + '20' },
                          ]}
                        >
                          <Text
                            style={[styles.tierText, { color: tier.color }]}
                          >
                            {tier.label}
                          </Text>
                        </View>

                        {goal.hasAccommodation && (
                          <Text style={styles.facilityIcon}>🏨</Text>
                        )}
                        {goal.hasConvenienceStore && (
                          <Text style={styles.facilityIcon}>🏪</Text>
                        )}
                        {goal.hasStation && (
                          <Text style={styles.facilityIcon}>🚉</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.goalRight}>
                      <Text style={styles.goalKm}>{goal.kmFromStart}</Text>
                      <Text style={styles.goalKmUnit}>km</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Manual km input */}
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="km を入力..."
                placeholderTextColor={CyclingColors.textLight}
                value={manualKm}
                onChangeText={setManualKm}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleManualSubmit}
              />
              <TouchableOpacity
                style={[
                  styles.manualSubmitButton,
                  (!manualKm || isNaN(parseFloat(manualKm))) &&
                    styles.manualSubmitDisabled,
                ]}
                onPress={handleManualSubmit}
                disabled={!manualKm || isNaN(parseFloat(manualKm))}
                activeOpacity={0.7}
              >
                <Text style={styles.manualSubmitText}>設定</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: CyclingColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
    marginBottom: 4,
  },
  currentPosition: {
    fontSize: 14,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalItemClosest: {
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
    fontSize: 15,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  goalNameClosest: {
    color: CyclingColors.primaryDark,
  },
  goalNameEn: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
  },
  facilityIcon: {
    fontSize: 13,
  },
  goalRight: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  goalKm: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  goalKmUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: CyclingColors.primary,
    marginTop: -2,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 44,
    backgroundColor: CyclingColors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: CyclingColors.textPrimary,
    borderWidth: 1,
    borderColor: CyclingColors.divider,
  },
  manualSubmitButton: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: CyclingColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitDisabled: {
    backgroundColor: CyclingColors.textLight,
  },
  manualSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: CyclingColors.white,
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },
});
