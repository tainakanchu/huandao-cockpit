import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import type { SupplyPoint, CheckpointType } from '@/lib/types';

type Props = {
  supplyPoints: SupplyPoint[];
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

const recommendationLabels: Record<string, { label: string; color: string }> = {
  light: { label: '軽食', color: CyclingColors.success },
  water: { label: '水分補給', color: CyclingColors.primary },
  meal: { label: '食事', color: CyclingColors.accent },
  final: { label: '最終補給', color: CyclingColors.critical },
};

function openInGoogleMaps(lat: number, lng: number, name: string) {
  const encodedName = encodeURIComponent(name);
  const url = Platform.select({
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url);
}

export default function SupplyPlan({ supplyPoints }: Props) {
  if (supplyPoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>補給プラン</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>補給ポイントデータなし</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>補給プラン</Text>
      <View style={styles.card}>
        {supplyPoints.map((sp, idx) => {
          const icon = checkpointIcons[sp.checkpoint.type] ?? '📍';
          const rec = recommendationLabels[sp.recommended] ?? {
            label: sp.recommended,
            color: CyclingColors.textSecondary,
          };

          return (
            <TouchableOpacity
              key={sp.checkpoint.id + idx}
              style={styles.item}
              onPress={() =>
                openInGoogleMaps(
                  sp.checkpoint.lat,
                  sp.checkpoint.lng,
                  sp.checkpoint.nameZh || sp.checkpoint.name,
                )
              }
              activeOpacity={0.6}
            >
              <View style={styles.timeline}>
                <View
                  style={[styles.dot, { backgroundColor: rec.color }]}
                />
                {idx < supplyPoints.length - 1 && (
                  <View style={styles.line} />
                )}
              </View>

              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemIcon}>{icon}</Text>
                  <Text style={styles.itemName}>
                    {sp.checkpoint.name}
                  </Text>
                  <Text style={styles.itemKm}>
                    {sp.kmFromDayStart.toFixed(1)} km
                  </Text>
                </View>

                <View style={styles.itemMeta}>
                  <View
                    style={[
                      styles.recBadge,
                      { backgroundColor: rec.color + '20' },
                    ]}
                  >
                    <Text style={[styles.recText, { color: rec.color }]}>
                      {rec.label}
                    </Text>
                  </View>
                  <Text style={styles.itemReason} numberOfLines={1}>
                    {sp.reason}
                  </Text>
                  <Text style={styles.mapLink}>MAP</Text>
                </View>
                {sp.recommended === 'meal' && (
                  <TouchableOpacity
                    style={styles.restaurantLink}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/${encodeURIComponent('餐廳')}/@${sp.checkpoint.lat},${sp.checkpoint.lng},15z`,
                      )
                    }
                    activeOpacity={0.6}
                  >
                    <Text style={styles.restaurantLinkText}>
                      🍽️ 周辺のレストランを探す
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
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
  card: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyCard: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: CyclingColors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: CyclingColors.divider,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemIcon: {
    fontSize: 16,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.textPrimary,
    flex: 1,
  },
  itemKm: {
    fontSize: 13,
    fontWeight: '600',
    color: CyclingColors.primary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  recBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemReason: {
    fontSize: 12,
    color: CyclingColors.textSecondary,
    flex: 1,
  },
  mapLink: {
    fontSize: 10,
    fontWeight: '800',
    color: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  restaurantLink: {
    marginTop: 6,
    backgroundColor: CyclingColors.accent + '15',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  restaurantLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.accent,
  },
});
