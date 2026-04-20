import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useWaypointStore, WAYPOINT_LIMIT } from '@/lib/store/waypointStore';
import { useT } from '@/lib/i18n';
import type { Waypoint, WaypointCategory } from '@/lib/types';

type Props = {
  onAddPress: () => void;
};

const CATEGORY_META: Record<
  WaypointCategory,
  { icon: string; color: string }
> = {
  accommodation: { icon: '🏨', color: CyclingColors.success },
  sightseeing: { icon: '🏞️', color: CyclingColors.supply.viewpoint },
  food: { icon: '🍜', color: CyclingColors.supply.food },
  rest: { icon: '☕', color: CyclingColors.accent },
  custom: { icon: '📍', color: CyclingColors.primary },
};

export default function WaypointList({ onAddPress }: Props) {
  const t = useT();
  const waypoints = useWaypointStore((s) => s.waypoints);
  const removeWaypoint = useWaypointStore((s) => s.removeWaypoint);
  const clearWaypoints = useWaypointStore((s) => s.clearWaypoints);

  const isLimit = waypoints.length >= WAYPOINT_LIMIT;

  const handleClear = () => {
    Alert.alert(
      t.clearWaypoints,
      t.clearWaypointsConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.clearWaypoints,
          style: 'destructive',
          onPress: () => clearWaypoints(),
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t.waypointsTitle}</Text>
          <Text style={styles.subtitle}>
            {t.waypointsSubtitle(waypoints.length, WAYPOINT_LIMIT)}
          </Text>
        </View>
        {waypoints.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>{t.clearWaypoints}</Text>
          </TouchableOpacity>
        )}
      </View>

      {waypoints.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{t.waypointsEmpty}</Text>
          <Text style={styles.emptyHint}>{t.waypointsEmptyHint}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {waypoints.map((wp, index) => (
            <WaypointRow
              key={wp.id}
              waypoint={wp}
              index={index}
              onRemove={() => removeWaypoint(wp.id)}
              removeLabel={t.remove}
            />
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addButton, isLimit && styles.addButtonDisabled]}
        onPress={onAddPress}
        disabled={isLimit}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.addButtonText,
            isLimit && styles.addButtonTextDisabled,
          ]}
        >
          {isLimit
            ? t.waypointLimitReached(WAYPOINT_LIMIT)
            : t.addWaypoint}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function WaypointRow({
  waypoint,
  index,
  onRemove,
  removeLabel,
}: {
  waypoint: Waypoint;
  index: number;
  onRemove: () => void;
  removeLabel: string;
}) {
  const meta = CATEGORY_META[waypoint.category] ?? CATEGORY_META.custom;
  return (
    <View style={styles.row}>
      <View style={styles.rowNumber}>
        <Text style={styles.rowNumberText}>{index + 1}</Text>
      </View>
      <View
        style={[styles.rowIcon, { backgroundColor: meta.color + '1F' }]}
      >
        <Text style={styles.rowIconText}>{meta.icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {waypoint.nameZh ?? waypoint.name}
        </Text>
        <Text style={styles.rowKm}>
          KP {Math.round(waypoint.kmFromStart)}km
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: CyclingColors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: CyclingColors.severity.criticalBg,
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: CyclingColors.severity.critical,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 11,
    color: CyclingColors.textLight,
    textAlign: 'center',
  },

  list: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: CyclingColors.background,
    marginBottom: 6,
  },
  rowNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CyclingColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: CyclingColors.white,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowIconText: {
    fontSize: 16,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  rowKm: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CyclingColors.card,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },

  addButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: CyclingColors.primary,
  },
  addButtonDisabled: {
    backgroundColor: CyclingColors.cardBorder,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.white,
    letterSpacing: 0.3,
  },
  addButtonTextDisabled: {
    color: CyclingColors.textSecondary,
  },
});
