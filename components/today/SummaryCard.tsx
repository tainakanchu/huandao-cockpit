import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useWaypointStore } from '@/lib/store/waypointStore';
import {
  estimateTravelTime,
  countWaypointsInRange,
} from '@/lib/logic/eta';
import type { DayPlan, SunTimes } from '@/lib/types';

type Props = {
  plan: DayPlan;
  sunTimes?: SunTimes;
};

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatHM(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m.toString().padStart(2, '0')}m`;
}

function getWeatherSummary(plan: DayPlan) {
  const weather = plan.weather ?? [];
  if (weather.length === 0) {
    return {
      tempRange: '--',
      windInfo: '--',
      precipitation: '--',
    };
  }

  // Filter to riding hours (6-18)
  const ridingWeather = weather.filter((w) => w.hour >= 6 && w.hour <= 18);
  const data = ridingWeather.length > 0 ? ridingWeather : weather;

  const temps = data.map((w) => w.tempC);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));

  const avgWind = Math.round(
    data.reduce((sum, w) => sum + w.windSpeedKmh, 0) / data.length
  );

  const maxPrecip = Math.max(...data.map((w) => w.precipitationProbability));

  return {
    tempRange: `${minTemp}-${maxTemp}°C`,
    windInfo: `${avgWind} km/h`,
    precipitation: `${maxPrecip}%`,
  };
}

export default function SummaryCard({ plan, sunTimes }: Props) {
  const waypoints = useWaypointStore((s) => s.waypoints);
  const { total: waypointCount, food: foodWaypointCount } = countWaypointsInRange(
    waypoints,
    plan.startKm,
    plan.endKm,
  );

  const estimate = estimateTravelTime(plan.distanceKm, plan.elevationGainM, {
    waypointCount,
    foodWaypointCount,
  });

  // Calculate ETA from 7:00 start using TOTAL time (moving + stops)
  const startTime = new Date();
  startTime.setHours(7, 0, 0, 0);
  const eta = new Date(
    startTime.getTime() + estimate.totalHours * 60 * 60 * 1000,
  );

  // Sunset margin
  let sunsetMargin = '--';
  if (sunTimes) {
    const sunsetMs = sunTimes.sunset.getTime();
    const etaMs = eta.getTime();
    const marginMin = Math.round((sunsetMs - etaMs) / (1000 * 60));
    if (marginMin >= 0) {
      const marginH = Math.floor(marginMin / 60);
      const marginM = marginMin % 60;
      sunsetMargin = `+${marginH}h${marginM.toString().padStart(2, '0')}m`;
    } else {
      const absMin = Math.abs(marginMin);
      const marginH = Math.floor(absMin / 60);
      const marginM = absMin % 60;
      sunsetMargin = `-${marginH}h${marginM.toString().padStart(2, '0')}m`;
    }
  }

  const weatherSummary = getWeatherSummary(plan);

  const metrics = [
    { icon: '🚴', label: '距離', value: `${plan.distanceKm.toFixed(1)} km` },
    { icon: '⛰️', label: '獲得標高', value: `${plan.elevationGainM} m` },
    {
      icon: '⏱️',
      label: '走行時間',
      value: formatHM(estimate.movingHours),
    },
    {
      icon: '🕒',
      label: '所要時間',
      value: formatHM(estimate.totalHours),
      sub: `+休憩 ${Math.round(estimate.stopHours * 60)}分`,
    },
    { icon: '🏁', label: 'ETA', value: formatTime(eta) },
    { icon: '🌅', label: '日没余裕', value: sunsetMargin },
    { icon: '🌡️', label: '気温', value: weatherSummary.tempRange },
    { icon: '💨', label: '風速', value: weatherSummary.windInfo },
    { icon: '🌧️', label: '降水確率', value: weatherSummary.precipitation },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>今日のサマリー</Text>
      <View style={styles.grid}>
        {metrics.map((m, idx) => (
          <View key={idx} style={styles.metricItem}>
            <Text style={styles.metricIcon}>{m.icon}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricValue}>{m.value}</Text>
            {'sub' in m && m.sub ? (
              <Text style={styles.metricSub}>{m.sub}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  metricSub: {
    fontSize: 10,
    color: CyclingColors.textLight,
    marginTop: 2,
  },
});
