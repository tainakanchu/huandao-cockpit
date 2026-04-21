import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { useWaypointStore, WAYPOINT_LIMIT } from '@/lib/store/waypointStore';
import WaypointPicker from '@/components/plan/WaypointPicker';
import { useT } from '@/lib/i18n';
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
  const t = useT();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Waypoint | null>(null);
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

  const handleConfirmRemove = () => {
    if (confirmRemove) {
      removeWaypoint(confirmRemove.id);
    }
    setConfirmRemove(null);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.todayStopsTitle}</Text>
        <Text style={styles.count}>
          {t.todayStopsSubtitle(
            dayWaypoints.length,
            waypoints.length,
            WAYPOINT_LIMIT,
          )}
        </Text>
      </View>

      {dayWaypoints.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t.noStopsInRange}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {dayWaypoints.map((wp) => {
            const meta =
              CATEGORY_META[wp.category] ?? CATEGORY_META.custom;
            const offsetKm = wp.kmFromStart - dayStartKm;
            return (
              <View key={wp.id} style={styles.row}>
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
                    {t.stopOffsetFromStart(
                      Math.round(offsetKm),
                      Math.round(wp.kmFromStart),
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setConfirmRemove(wp)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.addButtonText}>{t.addStopButton}</Text>
      </TouchableOpacity>

      <WaypointPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        dayStartKm={dayStartKm}
        dayEndKm={dayEndKm}
      />

      {/* Custom confirm dialog (replaces Alert.alert which can't reliably fire
          onPress on react-native-web) */}
      <Modal
        visible={confirmRemove !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRemove(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t.removeStopTitle}</Text>
            {confirmRemove && (
              <Text style={styles.confirmBody}>
                {confirmRemove.nameZh ?? confirmRemove.name} (KP{' '}
                {Math.round(confirmRemove.kmFromStart)}km)
              </Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setConfirmRemove(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBtnCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnRemove]}
                onPress={handleConfirmRemove}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBtnRemoveText}>{t.removeStopButton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CyclingColors.card,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
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

  // Confirm dialog
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
    marginBottom: 6,
  },
  confirmBody: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: CyclingColors.background,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },
  confirmBtnRemove: {
    backgroundColor: CyclingColors.critical,
  },
  confirmBtnRemoveText: {
    fontSize: 14,
    fontWeight: '700',
    color: CyclingColors.white,
  },
});
