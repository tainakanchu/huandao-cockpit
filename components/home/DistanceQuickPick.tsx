import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';

type Props = {
  onSelect: (km: number) => void;
  activeDistance?: number;
};

const distances = [60, 80, 100, 120];

export default function DistanceQuickPick({ onSelect, activeDistance }: Props) {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.targetDistance}</Text>
      <View style={styles.row}>
        {distances.map((km) => {
          const isActive = activeDistance === km;
          return (
            <TouchableOpacity
              key={km}
              style={[styles.button, isActive && styles.buttonActive]}
              onPress={() => onSelect(km)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  isActive && styles.buttonTextActive,
                ]}
              >
                {km}
              </Text>
              <Text
                style={[
                  styles.buttonUnit,
                  isActive && styles.buttonUnitActive,
                ]}
              >
                km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: CyclingColors.card,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: CyclingColors.cardBorder,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  buttonActive: {
    backgroundColor: CyclingColors.primary,
    borderColor: CyclingColors.primaryDark,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  buttonTextActive: {
    color: CyclingColors.white,
  },
  buttonUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  buttonUnitActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});
