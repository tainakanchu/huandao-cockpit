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
  ActivityIndicator,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { getGoalCandidates } from '@/lib/data/goals';
import { useT } from '@/lib/i18n';
import {
  detectCurrentPosition,
  PermissionDeniedError,
} from '@/lib/logic/detectCurrentPosition';
import type { GoalCandidate } from '@/lib/types';

type Props = {
  visible: boolean;
  currentKm: number;
  onSetPosition: (km: number, dayNumber?: number) => void;
  onClose: () => void;
};

const tierColors: Record<string, string> = {
  major: CyclingColors.primary,
  mid: CyclingColors.accent,
  minor: CyclingColors.textSecondary,
};

export default function PositionAdjuster({
  visible,
  currentKm,
  onSetPosition,
  onClose,
}: Props) {
  const t = useT();
  const [manualKm, setManualKm] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsConfirm, setGpsConfirm] = useState<{ km: number; detourKm: number } | null>(null);

  const handleUseGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const result = await detectCurrentPosition();
      const roundedKm = Math.round(result.km * 10) / 10;
      if (result.detourKm > 5) {
        setGpsConfirm({ km: roundedKm, detourKm: Math.round(result.detourKm) });
      } else {
        onSetPosition(roundedKm);
      }
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        setGpsError(t.gpsPermissionDenied);
      } else {
        setGpsError((err as Error).message || t.gpsTimeout);
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const tierLabel = (tier: string): string =>
    tier === 'major' ? t.tierMajor : tier === 'mid' ? t.tierMid : t.tierMinor;

  const sortedGoals = useMemo(() => {
    const all = getGoalCandidates();
    const filtered = all
      .filter((g) => g.tier === 'major' || g.tier === 'mid')
      .sort((a, b) => a.kmFromStart - b.kmFromStart);

    // Route is circular: Taipei (km 944) is also the start (km 0). Prepend a
    // synthetic start entry so users can rewind to KP 0.
    const taipei = all.find((g) => g.name.includes('Taipei'));
    if (taipei && !filtered.some((g) => g.kmFromStart === 0)) {
      filtered.unshift({
        ...taipei,
        id: 'start-taipei',
        name: 'Taipei / Songshan (Start)',
        nameZh: t.startPointName,
        kmFromStart: 0,
      });
    }

    return filtered;
  }, [t]);

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
              <Text style={styles.title}>{t.setPosition}</Text>
              <Text style={styles.currentPosition}>
                {t.current}: {currentKm} km
              </Text>
            </View>

            {/* GPS button */}
            <TouchableOpacity
              style={[
                styles.gpsButton,
                gpsLoading && styles.gpsButtonLoading,
              ]}
              onPress={handleUseGps}
              disabled={gpsLoading}
              activeOpacity={0.7}
            >
              {gpsLoading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={CyclingColors.white}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.gpsButtonText}>{t.gpsLocating}</Text>
                </>
              ) : (
                <Text style={styles.gpsButtonText}>{t.useGps}</Text>
              )}
            </TouchableOpacity>

            {gpsError && (
              <View style={styles.gpsErrorBox}>
                <Text style={styles.gpsErrorText}>{gpsError}</Text>
              </View>
            )}

            {/* Goal list */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {sortedGoals.map((goal) => {
                const tier = {
                  label: tierLabel(goal.tier),
                  color: tierColors[goal.tier] ?? tierColors.minor,
                };
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
                placeholder={t.enterKm}
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
                <Text style={styles.manualSubmitText}>{t.set}</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* GPS off-route confirm modal */}
      <Modal
        visible={gpsConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGpsConfirm(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>📍 GPS</Text>
            {gpsConfirm && (
              <Text style={styles.confirmBody}>
                {t.gpsOffRoute(gpsConfirm.detourKm)}
              </Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setGpsConfirm(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBtnCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnOk]}
                onPress={() => {
                  if (gpsConfirm) onSetPosition(gpsConfirm.km);
                  setGpsConfirm(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBtnOkText}>
                  {t.gpsOffRouteConfirm}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // GPS button
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: CyclingColors.primary,
  },
  gpsButtonLoading: {
    backgroundColor: CyclingColors.primaryDark,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.white,
  },
  gpsErrorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: CyclingColors.severity.criticalBg,
    borderRadius: 10,
  },
  gpsErrorText: {
    fontSize: 12,
    color: CyclingColors.severity.critical,
  },

  // GPS off-route confirm
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 6,
  },
  confirmBody: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: CyclingColors.background,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },
  confirmBtnOk: {
    backgroundColor: CyclingColors.primary,
  },
  confirmBtnOkText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.white,
  },
});
