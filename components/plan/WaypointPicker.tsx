import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { getGoalCandidates } from '@/lib/data/goals';
import { getCheckpoints } from '@/lib/data/checkpoints';
import { useWaypointStore, WAYPOINT_LIMIT } from '@/lib/store/waypointStore';
import { useT } from '@/lib/i18n';
import OsmSearchModal from '@/components/plan/OsmSearchModal';
import type {
  GoalCandidate,
  Checkpoint,
  Waypoint,
  WaypointCategory,
  WaypointSourceType,
} from '@/lib/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * When set, the picker hides items outside this km range by default (the
   * "today" flow). Users can still toggle a "全区間" button to see all items.
   */
  dayStartKm?: number;
  dayEndKm?: number;
};

type PickableItem = {
  key: string;
  sourceType: WaypointSourceType;
  sourceId: string;
  name: string;
  nameZh?: string;
  lat: number;
  lng: number;
  kmFromStart: number;
  category: WaypointCategory;
  subtitle: string;
  icon: string;
  accent: string;
};

type FilterKey =
  | 'all'
  | 'accommodation'
  | 'major'
  | 'sightseeing'
  | 'food';

/**
 * Build the pickable item list from existing data:
 *  - Goals with accommodation → accommodation category
 *  - Major-tier goals → sightseeing (as notable cities)
 *  - Viewpoint checkpoints → sightseeing
 *  - Food-type checkpoints → food
 */
function buildPickableItems(): PickableItem[] {
  const goals = getGoalCandidates();
  const checkpoints = getCheckpoints();

  const items: PickableItem[] = [];

  for (const g of goals) {
    if (g.hasAccommodation) {
      items.push({
        key: `goal:${g.id}`,
        sourceType: 'goal',
        sourceId: g.id,
        name: g.name,
        nameZh: g.nameZh,
        lat: g.lat,
        lng: g.lng,
        kmFromStart: g.kmFromStart,
        category: 'accommodation',
        subtitle: g.tier === 'major' ? '主要 · 宿泊可' : '宿泊可',
        icon: '🏨',
        accent: CyclingColors.success,
      });
    } else if (g.tier === 'major') {
      items.push({
        key: `goal:${g.id}`,
        sourceType: 'goal',
        sourceId: g.id,
        name: g.name,
        nameZh: g.nameZh,
        lat: g.lat,
        lng: g.lng,
        kmFromStart: g.kmFromStart,
        category: 'sightseeing',
        subtitle: '主要都市',
        icon: '⭐',
        accent: CyclingColors.primary,
      });
    }
  }

  for (const cp of checkpoints) {
    if (cp.type === 'viewpoint') {
      items.push({
        key: `checkpoint:${cp.id}`,
        sourceType: 'checkpoint',
        sourceId: cp.id,
        name: cp.name,
        nameZh: cp.nameZh,
        lat: cp.lat,
        lng: cp.lng,
        kmFromStart: cp.kmFromStart,
        category: 'sightseeing',
        subtitle: '景勝地',
        icon: '🏞️',
        accent: CyclingColors.supply.viewpoint,
      });
    } else if (cp.type === 'food') {
      items.push({
        key: `checkpoint:${cp.id}`,
        sourceType: 'checkpoint',
        sourceId: cp.id,
        name: cp.name,
        nameZh: cp.nameZh,
        lat: cp.lat,
        lng: cp.lng,
        kmFromStart: cp.kmFromStart,
        category: 'food',
        subtitle: 'グルメ',
        icon: '🍜',
        accent: CyclingColors.supply.food,
      });
    }
  }

  items.sort((a, b) => a.kmFromStart - b.kmFromStart);
  return items;
}

export default function WaypointPicker({
  visible,
  onClose,
  dayStartKm,
  dayEndKm,
}: Props) {
  const t = useT();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [osmVisible, setOsmVisible] = useState(false);
  // When a day range is provided, start in "day" mode (only show items in range).
  // Users can switch to "all" via a toggle.
  const hasDayRange =
    dayStartKm !== undefined && dayEndKm !== undefined && dayEndKm > dayStartKm;
  const [dayScopeOnly, setDayScopeOnly] = useState(hasDayRange);

  const waypoints = useWaypointStore((s) => s.waypoints);
  const toggleWaypointBySource = useWaypointStore(
    (s) => s.toggleWaypointBySource,
  );

  const allItems = useMemo(() => buildPickableItems(), []);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (hasDayRange && dayScopeOnly) {
      items = items.filter(
        (i) =>
          i.kmFromStart >= (dayStartKm as number) - 0.5 &&
          i.kmFromStart <= (dayEndKm as number) + 0.5,
      );
    }
    if (filter === 'all') return items;
    if (filter === 'accommodation')
      return items.filter((i) => i.category === 'accommodation');
    if (filter === 'major')
      return items.filter(
        (i) => i.category === 'sightseeing' && i.icon === '⭐',
      );
    if (filter === 'sightseeing')
      return items.filter(
        (i) => i.category === 'sightseeing' && i.icon !== '⭐',
      );
    if (filter === 'food') return items.filter((i) => i.category === 'food');
    return items;
  }, [filter, allItems, dayScopeOnly, hasDayRange, dayStartKm, dayEndKm]);

  const addedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const w of waypoints) {
      if (w.sourceId) set.add(`${w.sourceType}:${w.sourceId}`);
    }
    return set;
  }, [waypoints]);

  const handleToggle = (item: PickableItem) => {
    const key = `${item.sourceType}:${item.sourceId}`;
    const wasAdded = addedKeys.has(key);

    if (!wasAdded && waypoints.length >= WAYPOINT_LIMIT) {
      Alert.alert(
        t.addWaypointTitle,
        t.waypointLimitReached(WAYPOINT_LIMIT),
      );
      return;
    }

    toggleWaypointBySource(item.sourceType, item.sourceId, () => ({
      name: item.name,
      nameZh: item.nameZh,
      lat: item.lat,
      lng: item.lng,
      kmFromStart: item.kmFromStart,
      category: item.category,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
    }));
  };

  const renderItem = ({ item }: { item: PickableItem }) => {
    const key = `${item.sourceType}:${item.sourceId}`;
    const isAdded = addedKeys.has(key);

    return (
      <TouchableOpacity
        style={[styles.item, isAdded && styles.itemAdded]}
        onPress={() => handleToggle(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: item.accent + '18' }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.nameZh ?? item.name}</Text>
            {item.nameZh && (
              <Text style={styles.itemNameEn}>{item.name}</Text>
            )}
          </View>
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemKm}>{Math.round(item.kmFromStart)}</Text>
          <Text style={styles.itemKmUnit}>km</Text>
          {isAdded ? (
            <View style={styles.addedBadge}>
              <Text style={styles.addedBadgeText}>✓ {t.added}</Text>
            </View>
          ) : (
            <View style={styles.plusBadge}>
              <Text style={styles.plusBadgeText}>+</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterChip = ({
    keyName,
    label,
  }: {
    keyName: FilterKey;
    label: string;
  }) => {
    const active = filter === keyName;
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setFilter(keyName)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.chipText, active && styles.chipTextActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t.addWaypointTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {hasDayRange && dayScopeOnly
                ? `今日の区間 (KP ${Math.round(dayStartKm as number)}-${Math.round(dayEndKm as number)}km) · ${waypoints.length}/${WAYPOINT_LIMIT}`
                : t.waypointsSubtitle(waypoints.length, WAYPOINT_LIMIT)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.osmRow}>
          <TouchableOpacity
            style={styles.osmButton}
            onPress={() => setOsmVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.osmButtonText}>🔍 OSM で場所を検索</Text>
          </TouchableOpacity>
        </View>

        {hasDayRange && (
          <View style={styles.scopeRow}>
            <TouchableOpacity
              style={[
                styles.scopeButton,
                dayScopeOnly && styles.scopeButtonActive,
              ]}
              onPress={() => setDayScopeOnly(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.scopeButtonText,
                  dayScopeOnly && styles.scopeButtonTextActive,
                ]}
              >
                📍 今日の区間
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.scopeButton,
                !dayScopeOnly && styles.scopeButtonActive,
              ]}
              onPress={() => setDayScopeOnly(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.scopeButtonText,
                  !dayScopeOnly && styles.scopeButtonTextActive,
                ]}
              >
                🗺️ 全区間
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            data={[
              { keyName: 'all' as FilterKey, label: t.waypointCategoryAll },
              {
                keyName: 'accommodation' as FilterKey,
                label: t.waypointCategoryAccommodation,
              },
              { keyName: 'major' as FilterKey, label: t.waypointCategoryMajor },
              {
                keyName: 'sightseeing' as FilterKey,
                label: t.waypointCategorySightseeing,
              },
              { keyName: 'food' as FilterKey, label: t.waypointCategoryFood },
            ]}
            keyExtractor={(i) => i.keyName}
            renderItem={({ item }) => (
              <FilterChip keyName={item.keyName} label={item.label} />
            )}
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <OsmSearchModal
          visible={osmVisible}
          onClose={() => setOsmVisible(false)}
          dayStartKm={dayStartKm}
          dayEndKm={dayEndKm}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CyclingColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CyclingColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CyclingColors.divider,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: CyclingColors.background,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.primary,
  },

  osmRow: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: CyclingColors.card,
  },
  osmButton: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CyclingColors.primaryDark,
    backgroundColor: CyclingColors.primaryLight,
    alignItems: 'center',
  },
  osmButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: CyclingColors.primaryDark,
  },

  scopeRow: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.card,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: CyclingColors.background,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
  },
  scopeButtonActive: {
    backgroundColor: CyclingColors.primary,
    borderColor: CyclingColors.primaryDark,
  },
  scopeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: CyclingColors.textSecondary,
  },
  scopeButtonTextActive: {
    color: CyclingColors.white,
  },

  filterRow: {
    backgroundColor: CyclingColors.card,
    borderBottomWidth: 1,
    borderBottomColor: CyclingColors.divider,
    paddingVertical: 10,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: CyclingColors.background,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: CyclingColors.primary,
    borderColor: CyclingColors.primaryDark,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.textSecondary,
  },
  chipTextActive: {
    color: CyclingColors.white,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: CyclingColors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemAdded: {
    borderColor: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight + '40',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  itemBody: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  itemNameEn: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
  },
  itemSubtitle: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  itemKm: {
    fontSize: 16,
    fontWeight: '800',
    color: CyclingColors.primary,
  },
  itemKmUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: CyclingColors.primary,
    marginTop: -2,
  },
  addedBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: CyclingColors.primary,
    borderRadius: 6,
  },
  addedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: CyclingColors.white,
  },
  plusBadge: {
    marginTop: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CyclingColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: CyclingColors.primary,
    marginTop: -2,
  },
});
