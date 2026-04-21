import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';
import type { RiskSummary, RiskLevel } from '@/lib/types';

type Props = {
  risks: RiskSummary;
};

type RiskItem = {
  key: keyof RiskSummary;
  icon: string;
};

const riskItems: RiskItem[] = [
  { key: 'climb', icon: '⛰️' },
  { key: 'wind', icon: '💨' },
  { key: 'heat', icon: '🌡️' },
  { key: 'rain', icon: '🌧️' },
  { key: 'supply', icon: '🏪' },
  { key: 'traffic', icon: '🚗' },
  { key: 'sunset', icon: '🌅' },
];

function getRiskColor(level: RiskLevel): string {
  return CyclingColors.risk[level];
}

function getRiskBg(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '#E8F5E9';
    case 'medium':
      return '#FFF3E0';
    case 'high':
      return '#FFEBEE';
  }
}

const labelMap: Record<keyof RiskSummary, keyof ReturnType<typeof useT>> = {
  climb: 'riskClimb',
  wind: 'riskWind',
  heat: 'riskHeat',
  rain: 'riskRain',
  supply: 'riskSupply',
  traffic: 'riskTraffic',
  sunset: 'riskSunset',
};

export default function RiskBar({ risks }: Props) {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.riskOverview}</Text>
      <View style={styles.bar}>
        {riskItems.map((item) => {
          const level = risks[item.key];
          const color = getRiskColor(level);
          const bg = getRiskBg(level);
          const label = t[labelMap[item.key]] as string;

          return (
            <View key={item.key} style={[styles.item, { backgroundColor: bg }]}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.label}>{label}</Text>
              <View style={[styles.indicator, { backgroundColor: color }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
