import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useT } from '@/lib/i18n';
import type { Checkpoint, CheckpointType } from '@/lib/types';

type Props = {
  checkpoint: Checkpoint | null;
  distanceKm: number;
  isNext?: boolean;
};

const checkpointIcons: Record<CheckpointType, string> = {
  seven_eleven: '🏪',
  family_mart: '🏪',
  hi_life: '🏪',
  ok_mart: '🏪',
  water: '💧',
  food: '🍽️',
  station: '🚉',
  bike_shop: '🔧',
  police: '👮',
  viewpoint: '📍',
};

export default function NextEventCard({
  checkpoint,
  distanceKm,
  isNext = true,
}: Props) {
  const t = useT();
  const checkpointLabel = (type: CheckpointType): string => {
    switch (type) {
      case 'seven_eleven': return t.cpSevenEleven;
      case 'family_mart': return t.cpFamilyMart;
      case 'hi_life': return t.cpHiLife;
      case 'ok_mart': return t.cpOkMart;
      case 'water': return t.cpWater;
      case 'food': return t.cpFood;
      case 'station': return t.cpStation;
      case 'bike_shop': return t.cpBikeShop;
      case 'police': return t.cpPolice;
      case 'viewpoint': return t.cpViewpoint;
      default: return type;
    }
  };

  if (!checkpoint) {
    return (
      <View style={[styles.card, isNext ? styles.primaryCard : styles.secondaryCard]}>
        <Text style={[styles.emptyText, isNext && styles.primaryText]}>
          {isNext ? t.noNextEvent : '---'}
        </Text>
      </View>
    );
  }

  const icon = checkpointIcons[checkpoint.type] ?? '📍';
  const typeLabel = checkpointLabel(checkpoint.type);

  return (
    <View style={[styles.card, isNext ? styles.primaryCard : styles.secondaryCard]}>
      <View style={styles.header}>
        <Text style={[styles.typeLabel, isNext && styles.primaryText]}>
          {isNext ? t.next : t.after}
        </Text>
        {checkpoint.reliability === 'low' && (
          <Text style={styles.reliabilityBadge}>{t.unconfirmed}</Text>
        )}
      </View>

      <View style={styles.mainRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.distanceBlock}>
          <Text
            style={[
              styles.distanceNumber,
              isNext ? styles.primaryDistanceNumber : styles.secondaryDistanceNumber,
            ]}
          >
            {distanceKm.toFixed(1)}
          </Text>
          <Text style={[styles.distanceUnit, isNext && styles.primaryText]}>
            km
          </Text>
        </View>
      </View>

      <Text
        style={[styles.name, isNext && styles.primaryText]}
        numberOfLines={1}
      >
        {checkpoint.name}
        {checkpoint.nameZh ? ` (${checkpoint.nameZh})` : ''}
      </Text>
      <Text style={[styles.typeLabelSmall, isNext && styles.primarySubText]}>
        {typeLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryCard: {
    backgroundColor: CyclingColors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
  },
  secondaryCard: {
    backgroundColor: CyclingColors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: CyclingColors.textSecondary,
  },
  primaryText: {
    color: CyclingColors.white,
  },
  primarySubText: {
    color: 'rgba(255,255,255,0.7)',
  },
  reliabilityBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: CyclingColors.accent,
    backgroundColor: CyclingColors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  icon: {
    fontSize: 40,
  },
  distanceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  distanceNumber: {
    fontWeight: '800',
  },
  primaryDistanceNumber: {
    fontSize: 56,
    color: CyclingColors.white,
  },
  secondaryDistanceNumber: {
    fontSize: 36,
    color: CyclingColors.textPrimary,
  },
  distanceUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 2,
  },
  typeLabelSmall: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: CyclingColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
