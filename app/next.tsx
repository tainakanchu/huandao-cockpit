import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CyclingColors } from '@/constants/Colors';
import { usePlanStore } from '@/lib/store/planStore';
import { useRideStore } from '@/lib/store/rideStore';
import { useLocationTracking } from '@/lib/hooks/useLocationTracking';
import NextEventCard from '@/components/next/NextEventCard';
import ConditionPanel from '@/components/next/ConditionPanel';
import QuickActions from '@/components/next/QuickActions';
import AlertModal from '@/components/common/AlertModal';
import { useT } from '@/lib/i18n';
import type { AdvisoryCard } from '@/lib/types';

export default function NextScreen() {
  const t = useT();
  const dayPlan = usePlanStore((s) => s.dayPlan);
  const selectedGoal = usePlanStore((s) => s.selectedGoal);
  const sunTimes = usePlanStore((s) => s.sunTimes);

  const isRiding = useRideStore((s) => s.isRiding);
  const startRide = useRideStore((s) => s.startRide);
  const currentEta = useRideStore((s) => s.currentEta);
  const plannedEta = useRideStore((s) => s.plannedEta);
  const resetWater = useRideStore((s) => s.resetWater);
  const addNote = useRideStore((s) => s.addNote);

  const currentKm = useRideStore((s) => s.status.currentKm);

  const [alertCard, setAlertCard] = useState<AdvisoryCard | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  // Androidバックボタン無効化（走行中は誤操作防止）
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // GPS追跡を開始（走行中のみ）
  const { hasPermission, isTracking } = useLocationTracking(isRiding);

  // Auto-start ride if not already riding
  React.useEffect(() => {
    if (!isRiding && dayPlan) {
      startRide(dayPlan.startKm);
    }
  }, [isRiding, dayPlan, startRide]);

  // GPS位置に基づいて次のチェックポイントを算出
  const displayNext = useMemo(() => {
    if (!dayPlan) return { checkpoint: null, distance: 0 };
    const upcoming = dayPlan.checkpoints.filter(
      (cp) => cp.kmFromStart > currentKm,
    );
    if (upcoming.length > 0) {
      return {
        checkpoint: upcoming[0],
        distance: upcoming[0].kmFromStart - currentKm,
      };
    }
    return { checkpoint: null, distance: 0 };
  }, [dayPlan, currentKm]);

  const displaySecond = useMemo(() => {
    if (!dayPlan) return { checkpoint: null, distance: 0 };
    const upcoming = dayPlan.checkpoints.filter(
      (cp) => cp.kmFromStart > currentKm,
    );
    if (upcoming.length > 1) {
      return {
        checkpoint: upcoming[1],
        distance: upcoming[1].kmFromStart - currentKm,
      };
    }
    return { checkpoint: null, distance: 0 };
  }, [dayPlan, currentKm]);

  // Get current weather for wind info
  const currentWeather = useMemo(() => {
    if (!dayPlan?.weather || dayPlan.weather.length === 0) return null;
    const currentHour = new Date().getHours();
    // Find closest hour
    return dayPlan.weather.reduce((closest, w) =>
      Math.abs(w.hour - currentHour) < Math.abs(closest.hour - currentHour) ? w : closest
    );
  }, [dayPlan]);

  // Alert banner: show highest priority advisory
  const topAlert = useMemo(() => {
    if (!dayPlan) return null;
    const criticals = dayPlan.advisoryCards.filter((c) => c.severity === 'critical');
    const warnings = dayPlan.advisoryCards.filter((c) => c.severity === 'warning');
    const sorted = [...criticals, ...warnings].sort((a, b) => a.priority - b.priority);
    return sorted.length > 0 ? sorted[0] : null;
  }, [dayPlan]);

  const timeLocale = 'ja-JP';

  const handleSupplyDone = useCallback(() => {
    resetWater();
    Alert.alert(t.supplyComplete, t.waterReset);
  }, [resetWater, t]);

  const handleRest = useCallback(() => {
    addNote(
      `${t.restLogPrefix}: ${new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}`,
    );
    Alert.alert(t.restRecorded, t.restRecordedMsg);
  }, [addNote, t]);

  const handleNote = useCallback(() => {
    addNote(
      `${t.noteLogPrefix}: ${new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}`,
    );
    Alert.alert(t.noteRecorded, t.noteRecordedMsg);
  }, [addNote, t]);

  const handleChangeGoal = useCallback(() => {
    Alert.alert(t.changeGoalConfirmTitle, t.changeGoalConfirmMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.changeConfirm,
        style: 'destructive',
        onPress: () => router.replace('/'),
      },
    ]);
  }, [t]);

  const handleArrive = useCallback(() => {
    Alert.alert(
      t.arriveConfirmTitle,
      t.arriveConfirmMessage(selectedGoal?.nameZh ?? t.mapGoal),
      [
        { text: t.notYet, style: 'cancel' },
        {
          text: t.yesArrived,
          onPress: () => router.push('/summary'),
        },
      ],
    );
  }, [selectedGoal, t]);

  // No plan state
  if (!dayPlan || !selectedGoal) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚴</Text>
        <Text style={styles.emptyTitle}>{t.noPlanSelected}</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Text style={styles.goBackText}>{t.backToHome}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Banner */}
        {topAlert && (
          <TouchableOpacity
            style={[
              styles.alertBanner,
              {
                backgroundColor:
                  CyclingColors.severity[
                    `${topAlert.severity}Bg` as keyof typeof CyclingColors.severity
                  ] as string,
                borderLeftColor: CyclingColors.severity[topAlert.severity],
              },
            ]}
            onPress={() => {
              setAlertCard(topAlert);
              setAlertVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.alertBannerIcon}>
              {topAlert.severity === 'critical' ? '🚨' : '⚠️'}
            </Text>
            <View style={styles.alertBannerContent}>
              <Text
                style={[
                  styles.alertBannerTitle,
                  { color: CyclingColors.severity[topAlert.severity] },
                ]}
              >
                {topAlert.title}
              </Text>
              <Text style={styles.alertBannerBody} numberOfLines={1}>
                {topAlert.body}
              </Text>
            </View>
            <Text style={styles.alertBannerArrow}>{'>'}</Text>
          </TouchableOpacity>
        )}

        {/* A. Primary Next Event Card */}
        <NextEventCard
          checkpoint={displayNext.checkpoint}
          distanceKm={displayNext.distance}
          isNext={true}
        />

        {/* B. Secondary Event Card */}
        <NextEventCard
          checkpoint={displaySecond.checkpoint}
          distanceKm={displaySecond.distance}
          isNext={false}
        />

        {/* C. Condition Panel */}
        <ConditionPanel
          eta={currentEta}
          plannedEta={plannedEta}
          sunsetTime={sunTimes?.sunset ?? null}
          windDirection={currentWeather?.windDirectionDeg}
          windSpeed={currentWeather?.windSpeedKmh}
        />

        {/* Goal info bar */}
        <View style={styles.goalBar}>
          <Text style={styles.goalBarIcon}>🎯</Text>
          <View style={styles.goalBarContent}>
            <Text style={styles.goalBarLabel}>{t.todayGoal}</Text>
            <Text style={styles.goalBarName}>
              {selectedGoal.nameZh} ({selectedGoal.name})
            </Text>
          </View>
          <Text style={styles.goalBarDistance}>
            {Math.max(0, selectedGoal.kmFromStart - currentKm).toFixed(1)} km
          </Text>
        </View>

        {/* GPS Status */}
        {hasPermission === false && (
          <View style={styles.gpsBanner}>
            <Text style={styles.gpsBannerText}>
              {t.locationPermissionMissing}
            </Text>
          </View>
        )}
        {isTracking && (
          <View style={styles.gpsActiveBanner}>
            <Text style={styles.gpsActiveText}>
              {t.gpsTracking(currentKm.toFixed(1))}
            </Text>
          </View>
        )}

        {/* E. Quick Actions */}
        <QuickActions
          onSupplyDone={handleSupplyDone}
          onRest={handleRest}
          onNote={handleNote}
          onChangeGoal={handleChangeGoal}
        />

        {/* ゴール到着ボタン */}
        <TouchableOpacity
          style={styles.arriveButton}
          onPress={handleArrive}
          activeOpacity={0.7}
        >
          <Text style={styles.arriveButtonIcon}>🏁</Text>
          <Text style={styles.arriveButtonText}>{t.arriveButton}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        card={alertCard}
        onDismiss={() => setAlertVisible(false)}
        onAlternateGoal={() => {
          setAlertVisible(false);
          router.replace('/');
        }}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  goBackButton: {
    marginTop: 12,
    backgroundColor: CyclingColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goBackText: {
    color: CyclingColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  alertBannerIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  alertBannerContent: {
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertBannerBody: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  alertBannerArrow: {
    fontSize: 18,
    color: CyclingColors.textLight,
    marginLeft: 8,
  },
  goalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  goalBarIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  goalBarContent: {
    flex: 1,
  },
  goalBarLabel: {
    fontSize: 10,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  goalBarName: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  goalBarDistance: {
    fontSize: 20,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  gpsBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CyclingColors.severity.warningBg,
    borderRadius: 10,
    padding: 12,
  },
  gpsBannerText: {
    fontSize: 13,
    color: CyclingColors.severity.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsActiveBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CyclingColors.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  gpsActiveText: {
    fontSize: 13,
    color: CyclingColors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  arriveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: CyclingColors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: CyclingColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  arriveButtonIcon: {
    fontSize: 20,
  },
  arriveButtonText: {
    color: CyclingColors.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
