import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useWaypointStore, WAYPOINT_LIMIT } from '@/lib/store/waypointStore';
import WaypointPicker from '@/components/plan/WaypointPicker';
import type { Waypoint, WaypointCategory } from '@/lib/types';

type Props = {
  dayStartKm: number;
  dayEndKm: number;
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

/**
 * Today-screen list of waypoints that fall within the current day's km range,
 * plus an "add" button that opens WaypointPicker scoped to the day.
 */
export default function DayWaypointSection({ dayStartKm, dayEndKm }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const waypoints = useWaypointStore((s) => s.waypoints);
  const removeWaypoint = useWaypointStore((s) => s.removeWaypoint);

  const dayWaypoints = useMemo(
    () =>
      waypoints.filter(
        (w) =>
          w.kmFromStart > dayStartKm + 0.5 && w.kmFromStart < dayEndKm - 0.5,
      ),
    [waypoints, dayStartKm, dayEndKm],
  );

  const handleRemove = (wp: Waypoint) => {
    Alert.alert(
      wp.nameZh ?? wp.name,
      '経由地から外しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '外す',
          style: 'destructive',
          onPress: () => removeWaypoint(wp.id),
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>🛣️ 今日の立ち寄り</Text>
        <Text style={styles.count}>
          {dayWaypoints.length} 箇所 ・ 全体 {waypoints.length}/{WAYPOINT_LIMIT}
        </Text>
      </View>

      {dayWaypoints.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            今日の区間に立ち寄りはありません
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {dayWaypoints.map((wp) => {
            const meta =
              CATEGORY_META[wp.category] ?? CATEGORY_META.custom;
            const offsetKm = wp.kmFromStart - dayStartKm;
            return (
              <TouchableOpacity
                key={wp.id}
                style={styles.row}
                onPress={() => handleRemove(wp)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: meta.color + '1F' },
                  ]}
                >
                  <Text style={styles.rowIconText}>{meta.icon}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {wp.nameZh ?? wp.name}
                  </Text>
                  <Text style={styles.rowKm}>
                    スタートから +{Math.round(offsetKm)}km (KP{' '}
                    {Math.round(wp.kmFromStart)})
                  </Text>
                </View>
                <Text style={styles.removeHint}>✕</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>+ 立ち寄りを追加</Text>
      </TouchableOpacity>

      <WaypointPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        dayStartKm={dayStartKm}
        dayEndKm={dayEndKm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
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
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 12,
    color: CyclingColors.textLight,
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
  removeHint: {
    fontSize: 14,
    color: CyclingColors.textLight,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  addButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: CyclingColors.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.white,
  },
});
