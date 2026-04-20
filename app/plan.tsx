import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CyclingColors } from '@/constants/Colors';
import { useTripStore } from '@/lib/store/tripStore';
import { usePlanStore } from '@/lib/store/planStore';
import { useWaypointStore } from '@/lib/store/waypointStore';
import {
  autoGenerateTripPlan,
  recalculateFromDay,
  getTripStats,
} from '@/lib/logic/tripPlanner';
import TripDayCard from '@/components/plan/TripDayCard';
import DayEndpointPicker from '@/components/plan/DayEndpointPicker';
import WaypointList from '@/components/plan/WaypointList';
import WaypointPicker from '@/components/plan/WaypointPicker';
import type { GoalCandidate } from '@/lib/types';
import type { TripDaySlot } from '@/lib/store/tripStore';

const TARGET_DISTANCES = [60, 80, 100, 120];

export default function PlanScreen() {
  const currentKm = usePlanStore((s) => s.currentKm);
  const createTripPlan = useTripStore((s) => s.createTripPlan);
  const existingPlan = useTripStore((s) => s.tripPlan);
  const waypoints = useWaypointStore((s) => s.waypoints);

  const [targetDaily, setTargetDaily] = useState(80);
  const [plan, setPlan] = useState<TripDaySlot[]>(existingPlan ?? []);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [waypointPickerVisible, setWaypointPickerVisible] = useState(false);

  // Trip statistics
  const stats = useMemo(() => getTripStats(plan), [plan]);

  // Auto-generate the trip plan (waypoints with accommodation become forced endpoints)
  const handleAutoGenerate = useCallback(() => {
    const newPlan = autoGenerateTripPlan(currentKm, targetDaily, waypoints);
    setPlan(newPlan);
  }, [currentKm, targetDaily, waypoints]);

  // Open endpoint picker for a specific day
  const handleChangeGoal = useCallback((dayNumber: number) => {
    setEditingDay(dayNumber);
    setPickerVisible(true);
  }, []);

  // Select a new goal from the picker
  const handleSelectGoal = useCallback(
    (goal: GoalCandidate) => {
      if (editingDay == null) return;

      const newPlan = recalculateFromDay(
        plan,
        editingDay,
        goal,
        targetDaily,
        waypoints,
      );
      setPlan(newPlan);
      setPickerVisible(false);
      setEditingDay(null);
    },
    [plan, editingDay, targetDaily, waypoints],
  );

  // Toggle skip status
  const handleToggleSkip = useCallback(
    (dayNumber: number) => {
      setPlan((prev) =>
        prev.map((slot) =>
          slot.dayNumber === dayNumber
            ? {
                ...slot,
                status:
                  slot.status === 'skipped'
                    ? ('planned' as const)
                    : ('skipped' as const),
              }
            : slot,
        ),
      );
    },
    [],
  );

  // Commit the plan and navigate home
  const handleStartTrip = useCallback(() => {
    if (plan.length === 0) {
      Alert.alert(
        'プランがありません',
        'まず「自動生成」でプランを作成してください。',
      );
      return;
    }

    createTripPlan(plan);
    router.replace('/');
  }, [plan, createTripPlan]);

  // Get the editing day's startKm and currentGoalKm for the picker
  const editingSlot = useMemo(() => {
    if (editingDay == null) return null;
    return plan.find((s) => s.dayNumber === editingDay) ?? null;
  }, [plan, editingDay]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>旅程概要</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.totalDays}</Text>
              <Text style={styles.statBoxLabel}>日間</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.totalKm}</Text>
              <Text style={styles.statBoxLabel}>km</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>
                {stats.totalElevation.toLocaleString()}
              </Text>
              <Text style={styles.statBoxLabel}>m 獲得標高</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{stats.avgDailyKm}</Text>
              <Text style={styles.statBoxLabel}>km/日 平均</Text>
            </View>
          </View>
        </View>

        {/* Target distance selector */}
        <View style={styles.targetSection}>
          <Text style={styles.sectionLabel}>目標距離 / 日</Text>
          <View style={styles.targetRow}>
            {TARGET_DISTANCES.map((km) => {
              const isActive = targetDaily === km;
              return (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.targetButton,
                    isActive && styles.targetButtonActive,
                  ]}
                  onPress={() => setTargetDaily(km)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      isActive && styles.targetButtonTextActive,
                    ]}
                  >
                    {km}
                  </Text>
                  <Text
                    style={[
                      styles.targetButtonUnit,
                      isActive && styles.targetButtonUnitActive,
                    ]}
                  >
                    km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Waypoints section (BIWAICHI 風の立ち寄り地) */}
        <WaypointList
          onAddPress={() => setWaypointPickerVisible(true)}
        />

        {/* Auto-generate button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleAutoGenerate}
          activeOpacity={0.7}
        >
          <Text style={styles.generateButtonText}>
            自動生成
          </Text>
        </TouchableOpacity>

        {/* Day cards list */}
        {plan.length > 0 ? (
          <View style={styles.daysList}>
            <Text style={styles.sectionLabel}>日程プラン</Text>
            {plan.map((slot) => (
              <TripDayCard
                key={slot.dayNumber}
                slot={slot}
                onChangeGoal={handleChangeGoal}
                onToggleSkip={handleToggleSkip}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>
              「自動生成」を押してプランを作成してください
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {plan.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTrip}
            activeOpacity={0.7}
          >
            <Text style={styles.startButtonText}>
              トリップ開始 ({stats.totalDays}日間)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Endpoint picker modal */}
      {editingSlot && (
        <DayEndpointPicker
          visible={pickerVisible}
          dayNumber={editingSlot.dayNumber}
          startKm={editingSlot.startKm}
          currentGoalKm={editingSlot.endKm}
          onSelect={handleSelectGoal}
          onClose={() => {
            setPickerVisible(false);
            setEditingDay(null);
          }}
        />
      )}

      {/* Waypoint picker modal */}
      <WaypointPicker
        visible={waypointPickerVisible}
        onClose={() => setWaypointPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CyclingColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  // Stats card
  statsCard: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },

  // Target distance selector
  targetSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  targetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: CyclingColors.card,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: CyclingColors.cardBorder,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  targetButtonActive: {
    backgroundColor: CyclingColors.primary,
    borderColor: CyclingColors.primaryDark,
  },
  targetButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  targetButtonTextActive: {
    color: CyclingColors.white,
  },
  targetButtonUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  targetButtonUnitActive: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Generate button
  generateButton: {
    backgroundColor: CyclingColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: CyclingColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  generateButtonText: {
    color: CyclingColors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Day cards list
  daysList: {
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    color: CyclingColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: CyclingColors.card,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  startButton: {
    backgroundColor: CyclingColors.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: CyclingColors.successDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  startButtonText: {
    color: CyclingColors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
