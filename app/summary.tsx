import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CyclingColors } from '@/constants/Colors';
import { usePlanStore } from '@/lib/store/planStore';
import { useRideStore } from '@/lib/store/rideStore';
import { useTripStore } from '@/lib/store/tripStore';
import { getGoalCandidates } from '@/lib/data/goals';
import TripProgress from '@/components/summary/TripProgress';
import CumulativeStats from '@/components/summary/CumulativeStats';

export default function SummaryScreen() {
  const dayPlan = usePlanStore((s) => s.dayPlan);
  const selectedGoal = usePlanStore((s) => s.selectedGoal);
  const dayNumber = usePlanStore((s) => s.dayNumber);
  const advanceDay = usePlanStore((s) => s.advanceDay);
  const endRide = useRideStore((s) => s.endRide);
  const status = useRideStore((s) => s.status);

  const tripPlan = useTripStore((s) => s.tripPlan);
  const dayHistory = useTripStore((s) => s.dayHistory);

  // Androidバックボタン無効化
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Derive next day info from trip plan
  const nextDaySlot = tripPlan?.find((s) => s.dayNumber === dayNumber + 1);
  const progress = useTripStore.getState().getTotalProgress();

  const handleReturnHome = () => {
    // Record the completed day in tripStore before advancing
    if (dayPlan && selectedGoal) {
      // Find start location name from goals data
      const allGoals = getGoalCandidates();
      const startGoal = allGoals
        .filter((g) => g.kmFromStart <= dayPlan.startKm)
        .sort((a, b) => b.kmFromStart - a.kmFromStart)[0];
      const startName = startGoal?.nameZh || '台北';

      useTripStore.getState().completeDayRecord({
        dayNumber,
        startName,
        goalId: selectedGoal.id,
        goalName: selectedGoal.nameZh || selectedGoal.name,
        distanceKm: dayPlan.distanceKm,
        elevationGainM: dayPlan.elevationGainM,
        ridingMinutes: status.elapsedMinutes,
        date: new Date().toISOString().split('T')[0],
        notes: [...status.notes],
      });
    }

    endRide();
    advanceDay();
    router.replace('/');
  };

  // Format elapsed time
  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}m`;
  };

  // Build next button label
  const nextButtonLabel = nextDaySlot
    ? `次の日: ${nextDaySlot.goalNameZh || nextDaySlot.goalName} (${nextDaySlot.distanceKm.toFixed(0)}km)`
    : '次の日へ進む';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏁</Text>
          </View>
          <Text style={styles.title}>デイサマリー</Text>
          <Text style={styles.subtitle}>第 {dayNumber} 日 完了</Text>
        </View>

        {/* Today's completion card */}
        {dayPlan && selectedGoal && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>
              📍 {selectedGoal.nameZh} に到着
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {dayPlan.distanceKm.toFixed(1)}
                </Text>
                <Text style={styles.statUnit}>km</Text>
                <Text style={styles.statLabel}>走行距離</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {dayPlan.elevationGainM}
                </Text>
                <Text style={styles.statUnit}>m</Text>
                <Text style={styles.statLabel}>獲得標高</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatTime(status.elapsedMinutes)}
                </Text>
                <Text style={styles.statUnit}></Text>
                <Text style={styles.statLabel}>走行時間</Text>
              </View>
            </View>

            {/* Day breakdown: actual vs planned */}
            {nextDaySlot != null && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>Day {dayNumber} 内訳</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>計画距離</Text>
                  <Text style={styles.breakdownValue}>
                    {dayPlan.distanceKm.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>計画標高</Text>
                  <Text style={styles.breakdownValue}>
                    {dayPlan.elevationGainM} m
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>実走行時間</Text>
                  <Text style={styles.breakdownValue}>
                    {formatTime(status.elapsedMinutes)}
                  </Text>
                </View>
              </View>
            )}

            {/* Notes from the ride */}
            {status.notes.length > 0 && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>📝 走行メモ</Text>
                {status.notes.map((note, idx) => (
                  <View key={idx} style={styles.noteRow}>
                    <Text style={styles.noteBullet}>-</Text>
                    <Text style={styles.noteItem}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Trip progress timeline */}
        <TripProgress tripPlan={tripPlan} currentDayNumber={dayNumber} />

        {/* Cumulative stats */}
        <CumulativeStats
          dayHistory={dayHistory}
          totalKm={progress.totalKm}
          totalDays={progress.totalDays}
        />

        {/* Spacer for bottom button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => {
            Alert.alert(
              `第 ${dayNumber} 日を完了`,
              '記録を保存して次の日に進みますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '完了して進む', onPress: handleReturnHome },
              ],
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonIcon}>🏠</Text>
          <Text
            style={styles.homeButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {nextButtonLabel}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 16,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CyclingColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: CyclingColors.textSecondary,
    marginBottom: 8,
  },
  statsCard: {
    backgroundColor: CyclingColors.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  statUnit: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
    minHeight: 16,
  },
  statLabel: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    marginTop: 4,
  },
  breakdownSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
    paddingTop: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  notesSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
    paddingTop: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  noteRow: {
    flexDirection: 'row',
    paddingLeft: 4,
    marginBottom: 4,
  },
  noteBullet: {
    fontSize: 13,
    color: CyclingColors.textLight,
    marginRight: 6,
    lineHeight: 20,
  },
  noteItem: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CyclingColors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
  },
  homeButton: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: CyclingColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  homeButtonIcon: {
    fontSize: 20,
  },
  homeButtonText: {
    color: CyclingColors.white,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
});
