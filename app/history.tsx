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
  const undoLastRide = useTripStore((s) => s.undoLastRide);
  const setCurrentKm = usePlanStore((s) => s.setCurrentKm);

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}m`;
  };

  const handleDelete = (dayNumber: number, label: string) => {
    Alert.alert(
      label,
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

  const handleUndoLastRide = () => {
    const last = dayHistory[dayHistory.length - 1];
    if (!last) return;

    Alert.alert(
      t.undoLastDay,
      t.undoLastDayConfirm(last.goalName),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.undo,
          style: 'destructive',
          onPress: () => {
            const removed = undoLastRide();
            if (removed && removed.startKm !== undefined) {
              // Move current position back to the start of the undone ride
              setCurrentKm(removed.startKm);
            }
            router.replace('/');
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cumulative stats */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{t.totalProgress}</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {progress.completedKm.toFixed(0)}
              </Text>
              <Text style={styles.progressStatLabel}>km</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {progress.completedRides}
              </Text>
              <Text style={styles.progressStatLabel}>{t.rideCountUnit}</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {formatTime(progress.totalRidingMinutes)}
              </Text>
              <Text style={styles.progressStatLabel}>
                {t.totalRidingTime}
              </Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {progress.totalElevationM}
              </Text>
              <Text style={styles.progressStatLabel}>m</Text>
            </View>
          </View>
        </View>

        {/* Undo last ride button */}
        <TouchableOpacity
          style={styles.undoButton}
          onPress={handleUndoLastRide}
          activeOpacity={0.7}
        >
          <Text style={styles.undoButtonText}>{t.undoLastDay}</Text>
        </TouchableOpacity>

        {/* Ride list (most recent first) */}
        {[...dayHistory].reverse().map((record) => (
          <View key={record.dayNumber} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>{record.date}</Text>
              <TouchableOpacity
                onPress={() =>
                  handleDelete(record.dayNumber, record.goalName)
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteBtn}>{t.delete}</Text>
              </TouchableOpacity>
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
  dayDate: {
    fontSize: 13,
    fontWeight: '600',
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
