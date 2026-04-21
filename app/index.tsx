import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CyclingColors } from '@/constants/Colors';
import { usePlanStore } from '@/lib/store/planStore';
import { useTripStore } from '@/lib/store/tripStore';
import { getGoalCandidates, getNearestAccommodationGoal } from '@/lib/data/goals';
import GoalSelector from '@/components/home/GoalSelector';
import DistanceQuickPick from '@/components/home/DistanceQuickPick';
import PositionAdjuster from '@/components/home/PositionAdjuster';
import RouteMap from '@/components/common/RouteMap';
import type { TotalProgress } from '@/lib/store/tripStore';
import { VERSION } from '@/lib/version';
import { useT } from '@/lib/i18n';
import type { GoalCandidate } from '@/lib/types';

export default function HomeScreen() {
  const t = useT();
  const currentKm = usePlanStore((s) => s.currentKm);
  const selectGoal = usePlanStore((s) => s.selectGoal);
  const setCurrentKm = usePlanStore((s) => s.setCurrentKm);
  const isLoading = usePlanStore((s) => s.isLoading);

  const dayHistory = useTripStore((s) => s.dayHistory);
  const getTotalProgress = useTripStore((s) => s.getTotalProgress);

  const [showMinor, setShowMinor] = useState(false);
  const [activeDistance, setActiveDistance] = useState<number | undefined>(
    undefined
  );
  const [positionModalVisible, setPositionModalVisible] = useState(false);

  const allGoals = useMemo(() => {
    try {
      return getGoalCandidates();
    } catch {
      return [];
    }
  }, []);

  // Filter goals: only those ahead of current position
  const filteredGoals = useMemo(() => {
    let goals = allGoals.filter((g) => g.kmFromStart > currentKm);

    if (!showMinor) {
      goals = goals.filter((g) => g.tier === 'major' || g.tier === 'mid');
    }

    // Sort by distance from current position
    goals.sort((a, b) => a.kmFromStart - b.kmFromStart);

    return goals;
  }, [allGoals, currentKm, showMinor]);

  const handleDistancePick = useCallback((km: number) => {
    setActiveDistance((prev) => (prev === km ? undefined : km));
  }, []);

  const proceedWithGoal = useCallback(
    async (goal: GoalCandidate) => {
      try {
        await selectGoal(goal);
        router.push('/today');
      } catch (error) {
        console.error('Goal selection failed:', error);
      }
    },
    [selectGoal]
  );

  const handleGoalSelect = useCallback(
    (goal: GoalCandidate) => {
      if (!goal.hasAccommodation) {
        const nearestAccom = getNearestAccommodationGoal(goal.kmFromStart);
        const nearestInfo = nearestAccom
          ? `${nearestAccom.nameZh} (${nearestAccom.kmFromStart}km)`
          : t.noInfo;

        Alert.alert(
          t.noAccommodationTitle,
          t.noAccommodationMessage(goal.nameZh, nearestInfo),
          [
            {
              text: t.selectAlternative,
              style: 'cancel',
            },
            {
              text: t.selectAnyway,
              onPress: () => proceedWithGoal(goal),
            },
          ]
        );
        return;
      }

      proceedWithGoal(goal);
    },
    [proceedWithGoal, t]
  );

  const handleSetPosition = useCallback(
    (km: number) => {
      setCurrentKm(km);
      setPositionModalVisible(false);
    },
    [setCurrentKm]
  );

  // Find current position name
  const currentPositionName = useMemo(() => {
    const beforeCurrent = allGoals
      .filter((g) => g.kmFromStart <= currentKm)
      .sort((a, b) => b.kmFromStart - a.kmFromStart);
    return beforeCurrent.length > 0
      ? beforeCurrent[0].nameZh
      : t.startDefaultName;
  }, [allGoals, currentKm, t]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CyclingColors.primary} />
        <Text style={styles.loadingText}>{t.generatingPlan}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Current Position - tap to open position adjuster */}
      <TouchableOpacity
        style={styles.positionBar}
        onPress={() => setPositionModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.positionLeft}>
          <Text style={styles.positionIcon}>📍</Text>
          <View>
            <Text style={styles.positionLabel}>{t.currentPosition}</Text>
            <Text style={styles.positionName}>
              {currentPositionName} ({currentKm} km)
            </Text>
          </View>
        </View>
        <Text style={styles.positionEditHint}>{t.change}</Text>
      </TouchableOpacity>

      {/* Position Adjuster Modal */}
      <PositionAdjuster
        visible={positionModalVisible}
        currentKm={currentKm}
        onSetPosition={handleSetPosition}
        onClose={() => setPositionModalVisible(false)}
      />

      {/* Route map overview */}
      <RouteMap
        mode="full"
        currentKm={currentKm}
        title={null}
        height={140}
      />

      {/* History button + cumulative stats */}
      <View style={styles.tripSection}>
        <TouchableOpacity
          style={styles.historyRow}
          onPress={() => router.push('/history')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyRowIcon}>📖</Text>
          <View style={styles.historyRowBody}>
            <Text style={styles.historyRowTitle}>{t.history}</Text>
            {dayHistory.length > 0 ? (() => {
              const p: TotalProgress = getTotalProgress();
              return (
                <Text style={styles.historyRowSub}>
                  {t.historySummary(p.completedRides, p.completedKm.toFixed(0))}
                </Text>
              );
            })() : (
              <Text style={styles.historyRowSub}>{t.historyEmptyHint}</Text>
            )}
          </View>
          <Text style={styles.historyRowArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Distance Quick Pick */}
      <DistanceQuickPick
        onSelect={handleDistancePick}
        activeDistance={activeDistance}
      />

      {/* Goal header row */}
      <View style={styles.goalHeader}>
        <Text style={styles.goalHeaderTitle}>{t.goalCandidates}</Text>
        <TouchableOpacity
          onPress={() => setShowMinor(!showMinor)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            {showMinor ? t.showMajorOnly : t.showMore}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Goal List */}
      {filteredGoals.length > 0 ? (
        <GoalSelector
          goals={filteredGoals}
          currentKm={currentKm}
          onSelect={handleGoalSelect}
          highlightDistance={activeDistance}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚴</Text>
          <Text style={styles.emptyText}>
            {t.noGoalsAhead}
          </Text>
        </View>
      )}

      {/* Version footer */}
      <Text style={styles.versionFooter}>v {VERSION}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CyclingColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: CyclingColors.textSecondary,
  },
  positionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CyclingColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CyclingColors.divider,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  positionIcon: {
    fontSize: 24,
  },
  positionLabel: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  positionName: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  positionEditHint: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  goalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  showMoreText: {
    fontSize: 14,
    color: CyclingColors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: CyclingColors.textSecondary,
  },

  // History entry
  tripSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CyclingColors.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  historyRowIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  historyRowBody: {
    flex: 1,
  },
  historyRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  historyRowSub: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  historyRowArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.primary,
  },
  versionFooter: {
    fontSize: 10,
    color: CyclingColors.textLight,
    textAlign: 'center',
    paddingVertical: 6,
    fontFamily: 'SpaceMono',
  },
});
