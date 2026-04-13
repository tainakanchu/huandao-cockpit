import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { RiskSummary, RiskLevel } from '@/lib/types';

type Props = {
  risks: RiskSummary;
};

type RiskItem = {
  key: keyof RiskSummary;
  icon: string;
  label: string;
};

const riskItems: RiskItem[] = [
  { key: 'climb', icon: '⛰️', label: '登坂' },
  { key: 'wind', icon: '💨', label: '風' },
  { key: 'heat', icon: '🌡️', label: '暑さ' },
  { key: 'rain', icon: '🌧️', label: '雨' },
  { key: 'supply', icon: '🏪', label: '補給' },
  { key: 'traffic', icon: '🚗', label: '交通' },
  { key: 'sunset', icon: '🌅', label: '日没' },
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

export default function RiskBar({ risks }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>リスク概要</Text>
      <View style={styles.bar}>
        {riskItems.map((item) => {
          const level = risks[item.key];
          const color = getRiskColor(level);
          const bg = getRiskBg(level);

          return (
            <View key={item.key} style={[styles.item, { backgroundColor: bg }]}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.label}>{item.label}</Text>
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
