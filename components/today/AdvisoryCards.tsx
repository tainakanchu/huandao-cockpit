import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { AdvisoryCard } from '@/lib/types';

type Props = {
  cards: AdvisoryCard[];
};

const typeIcons: Record<string, string> = {
  wind: '💨',
  supply: '🏪',
  climb: '⛰️',
  heat: '🌡️',
  rain: '🌧️',
  time: '⏰',
  danger: '⚠️',
};

export default function AdvisoryCards({ cards }: Props) {
  if (cards.length === 0) return null;

  // Show up to 3 cards, sorted by priority
  const sorted = [...cards].sort((a, b) => a.priority - b.priority).slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>注意事項</Text>
      {sorted.map((card) => {
        const severityColor = CyclingColors.severity[card.severity];
        const severityBg =
          CyclingColors.severity[
            `${card.severity}Bg` as keyof typeof CyclingColors.severity
          ] as string;
        const icon = typeIcons[card.type] ?? '⚠️';

        return (
          <View
            key={card.id}
            style={[
              styles.card,
              { backgroundColor: severityBg, borderLeftColor: severityColor },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{icon}</Text>
              <Text style={[styles.cardTitle, { color: severityColor }]}>
                {card.title}
              </Text>
            </View>
            <Text style={styles.cardBody}>{card.body}</Text>
          </View>
        );
      })}
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
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    lineHeight: 19,
    marginLeft: 26,
  },
});
