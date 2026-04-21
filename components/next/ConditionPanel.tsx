import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';

type Props = {
  eta: Date | null;
  plannedEta: Date | null;
  sunsetTime: Date | null;
  windDirection?: number;
  windSpeed?: number;
};

function formatTime(date: Date | null): string {
  if (!date) return '--:--';
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getDelayText(
  eta: Date | null,
  plannedEta: Date | null,
  minFmt: (n: number) => string,
): { text: string; color: string } {
  if (!eta || !plannedEta) return { text: '--', color: CyclingColors.textSecondary };
  const delayMin = Math.round(
    (eta.getTime() - plannedEta.getTime()) / (1000 * 60)
  );
  if (delayMin <= 0) {
    return { text: minFmt(delayMin), color: CyclingColors.success };
  }
  if (delayMin <= 30) {
    return { text: `+${minFmt(delayMin)}`, color: CyclingColors.accent };
  }
  return { text: `+${minFmt(delayMin)}`, color: CyclingColors.critical };
}

function getSunsetMargin(
  eta: Date | null,
  sunset: Date | null,
  minFmt: (n: number) => string,
): { text: string; color: string } {
  if (!eta || !sunset) return { text: '--', color: CyclingColors.textSecondary };
  const marginMin = Math.round(
    (sunset.getTime() - eta.getTime()) / (1000 * 60)
  );
  if (marginMin >= 60) {
    const h = Math.floor(marginMin / 60);
    const m = marginMin % 60;
    return {
      text: `+${h}h${m.toString().padStart(2, '0')}m`,
      color: CyclingColors.success,
    };
  }
  if (marginMin >= 0) {
    return { text: `+${minFmt(marginMin)}`, color: CyclingColors.accent };
  }
  return { text: minFmt(marginMin), color: CyclingColors.critical };
}

function getWindDirectionArrow(deg?: number): string {
  if (deg === undefined) return '--';
  // Convert wind direction (where wind is coming FROM) to arrow
  const directions = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

export default function ConditionPanel({
  eta,
  plannedEta,
  sunsetTime,
  windDirection,
  windSpeed,
}: Props) {
  const t = useT();
  const delay = getDelayText(eta, plannedEta, t.minuteSuffix);
  const sunset = getSunsetMargin(eta, sunsetTime, t.minuteSuffix);

  const items = [
    {
      icon: '🏁',
      label: t.conditionEta,
      value: formatTime(eta),
      color: CyclingColors.textPrimary,
    },
    {
      icon: '⏱️',
      label: t.conditionDelay,
      value: delay.text,
      color: delay.color,
    },
    {
      icon: '🌅',
      label: t.conditionSunsetMargin,
      value: sunset.text,
      color: sunset.color,
    },
    {
      icon: '💨',
      label: t.conditionWind,
      value:
        windSpeed !== undefined
          ? `${getWindDirectionArrow(windDirection)} ${windSpeed}km/h`
          : '--',
      color: CyclingColors.textPrimary,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.item}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={[styles.itemValue, { color: item.color }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  panel: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 10,
    color: CyclingColors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
