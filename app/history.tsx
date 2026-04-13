import React from 'react';
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
import { useT } from '@/lib/i18n';

export default function HistoryScreen() {
  const t = useT();
  const dayHistory = useTripStore((s) => s.dayHistory);
  const getTotalProgress = useTripStore((s) => s.getTotalProgress);
  const deleteDayRecord = useTripStore((s) => s.deleteDayRecord);
  const undoLastDay = useTripStore((s) => s.undoLastDay);
  const setCurrentKm = usePlanStore((s) => s.setCurrentKm);
  const setDayNumber = usePlanStore((s) => s.setDayNumber);

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}m`;
  };

  const handleDelete = (dayNumber: number) => {
    Alert.alert(
      t.dayLabel(dayNumber),
      t.deleteRecordConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => deleteDayRecord(dayNumber),
        },
      ],
    );
  };

  const handleUndoLastDay = () => {
    const lastDay = dayHistory[dayHistory.length - 1];
    if (!lastDay) return;

    Alert.alert(
      t.undoLastDay,
      t.undoLastDayConfirm(lastDay.goalName),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.undo,
          style: 'destructive',
          onPress: () => {
            const removed = undoLastDay();
            if (removed) {
              // Revert planStore to the day that was undone
              setDayNumber(removed.dayNumber);
              // Revert position to the start of that day
              // The previous day's end km ≈ this day's start km
              const prevDay = dayHistory.find(
                (d) => d.dayNumber === removed.dayNumber - 1,
              );
              if (prevDay) {
                // Find the goal's km from tripPlan
                const tripPlan = useTripStore.getState().tripPlan;
                const prevSlot = tripPlan?.find(
                  (s) => s.dayNumber === prevDay.dayNumber,
                );
                if (prevSlot) {
                  setCurrentKm(prevSlot.endKm);
                }
              } else {
                setCurrentKm(0); // Back to start
              }
              router.replace('/');
            }
          },
        },
      ],
    );
  };

  if (dayHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>{t.noHistory}</Text>
          <Text style={styles.emptySub}>{t.noHistorySub}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = getTotalProgress();
  const totalRidingMinutes = dayHistory.reduce(
    (sum, d) => sum + d.ridingMinutes,
    0,
  );
  const totalElevation = dayHistory.reduce(
    (sum, d) => sum + d.elevationGainM,
    0,
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{t.totalProgress}</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress.totalKm > 0 ? Math.min(100, Math.round((progress.completedKm / progress.totalKm) * 100)) : 0}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {progress.completedKm.toFixed(0)}
              </Text>
              <Text style={styles.progressStatLabel}>km</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {progress.completedDays}
              </Text>
              <Text style={styles.progressStatLabel}>
                {t.completedDays}
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {formatTime(totalRidingMinutes)}
              </Text>
              <Text style={styles.progressStatLabel}>
                {t.totalRidingTime}
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {totalElevation}
              </Text>
              <Text style={styles.progressStatLabel}>m</Text>
            </View>
          </View>
        </View>

        {/* Undo last day button */}
        <TouchableOpacity
          style={styles.undoButton}
          onPress={handleUndoLastDay}
          activeOpacity={0.7}
        >
          <Text style={styles.undoButtonText}>{t.undoLastDay}</Text>
        </TouchableOpacity>

        {/* Day list */}
        {[...dayHistory].reverse().map((record) => (
          <View key={record.dayNumber} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  {t.dayLabel(record.dayNumber)}
                </Text>
              </View>
              <View style={styles.dayHeaderRight}>
                <Text style={styles.dayDate}>{record.date}</Text>
                <TouchableOpacity
                  onPress={() => handleDelete(record.dayNumber)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteBtn}>{t.delete}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.dayRoute}>
              {record.startName ?? '—'} → {record.goalName}
            </Text>

            <View style={styles.dayStats}>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatValue}>
                  {record.distanceKm.toFixed(1)}
                </Text>
                <Text style={styles.dayStatUnit}>km</Text>
              </View>
              <View style={styles.dayStatDivider} />
              <View style={styles.dayStat}>
                <Text style={styles.dayStatValue}>
                  {record.elevationGainM}
                </Text>
                <Text style={styles.dayStatUnit}>m</Text>
              </View>
              <View style={styles.dayStatDivider} />
              <View style={styles.dayStat}>
                <Text style={styles.dayStatValue}>
                  {formatTime(record.ridingMinutes)}
                </Text>
                <Text style={styles.dayStatUnit}></Text>
              </View>
            </View>

            {record.notes.length > 0 && (
              <View style={styles.dayNotes}>
                {record.notes.map((note, idx) => (
                  <Text key={idx} style={styles.dayNote}>
                    - {note}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: CyclingColors.textSecondary,
  },
  progressCard: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: CyclingColors.primaryLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: CyclingColors.primary,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  progressStatLabel: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  undoButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CyclingColors.accent,
    alignItems: 'center',
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.accent,
  },
  dayCard: {
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayBadge: {
    backgroundColor: CyclingColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  dayDate: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
  },
  deleteBtn: {
    fontSize: 12,
    color: CyclingColors.critical,
    fontWeight: '600',
  },
  dayRoute: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 10,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dayStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  dayStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  dayStatUnit: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
  },
  dayStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: CyclingColors.divider,
  },
  dayNotes: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: CyclingColors.divider,
    paddingTop: 8,
  },
  dayNote: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    lineHeight: 18,
  },
});
