import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CyclingColors } from '@/constants/Colors';
import { searchNominatim, type OsmSearchResult } from '@/lib/api/osmSearch';
import { snapToRoute } from '@/lib/geo/snap';
import { haversineDistance } from '@/lib/geo/distance';
import {
  getCumulativeKm,
  getRouteCoordinates,
} from '@/lib/data/route';
import { useWaypointStore, WAYPOINT_LIMIT } from '@/lib/store/waypointStore';
import type { WaypointCategory } from '@/lib/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Day km range used only to label results — doesn't restrict searches. */
  dayStartKm?: number;
  dayEndKm?: number;
};

/** Convert OSM category/type to our waypoint category for a reasonable icon. */
function deriveCategory(r: OsmSearchResult): WaypointCategory {
  const t = r.type ?? '';
  const c = r.category ?? '';
  if (t === 'hotel' || t === 'guest_house' || t === 'hostel') {
    return 'accommodation';
  }
  if (
    c === 'tourism' ||
    t === 'viewpoint' ||
    t === 'attraction' ||
    t === 'museum'
  ) {
    return 'sightseeing';
  }
  if (
    c === 'amenity' &&
    (t === 'cafe' ||
      t === 'restaurant' ||
      t === 'fast_food' ||
      t === 'food_court')
  ) {
    return 'food';
  }
  if (c === 'amenity' && (t === 'bench' || t === 'shelter' || t === 'drinking_water')) {
    return 'rest';
  }
  return 'custom';
}

export default function OsmSearchModal({
  visible,
  onClose,
  dayStartKm,
  dayEndKm,
}: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OsmSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const waypoints = useWaypointStore((s) => s.waypoints);
  const addWaypoint = useWaypointStore((s) => s.addWaypoint);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const res = await searchNominatim(q, { signal: ctrl.signal });
      setResults(res);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAdd = (r: OsmSearchResult) => {
    if (waypoints.length >= WAYPOINT_LIMIT) {
      Alert.alert('経由地の上限', `経由地は最大 ${WAYPOINT_LIMIT} 件までです`);
      return;
    }

    // Snap the POI to the base route
    const coords = getRouteCoordinates();
    const cumKm = getCumulativeKm();
    const snapped = snapToRoute(r.lat, r.lng, coords, cumKm);
    const detourKm = haversineDistance(r.lat, r.lng, snapped.lat, snapped.lng);

    const category = deriveCategory(r);

    const doAdd = () => {
      const ok = addWaypoint({
        name: r.shortName,
        nameZh: undefined,
        lat: snapped.lat,
        lng: snapped.lng,
        kmFromStart: snapped.km,
        category,
        sourceType: 'custom',
        sourceId: `osm:${r.id}`,
        note: r.displayName,
      });
      if (ok) {
        Alert.alert('追加しました', `${r.shortName} (KP ${Math.round(snapped.km)}km)`);
        onClose();
      } else {
        Alert.alert('追加できません', '同じ POI が既に登録されているか、上限に達しています。');
      }
    };

    if (detourKm > 5) {
      Alert.alert(
        '経路から離れています',
        `最寄りのルートから ${detourKm.toFixed(1)}km 離れています。経由地はルート上(KP ${Math.round(snapped.km)}km)に設定されます。追加しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '追加', onPress: doAdd },
        ],
      );
    } else {
      doAdd();
    }
  };

  const renderItem = ({ item }: { item: OsmSearchResult }) => {
    const coords = getRouteCoordinates();
    const cumKm = getCumulativeKm();
    const snapped = snapToRoute(item.lat, item.lng, coords, cumKm);
    const detourKm = haversineDistance(item.lat, item.lng, snapped.lat, snapped.lng);
    const inToday =
      dayStartKm !== undefined &&
      dayEndKm !== undefined &&
      snapped.km >= dayStartKm &&
      snapped.km <= dayEndKm;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAdd(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemBody}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.shortName}
          </Text>
          <Text style={styles.itemSub} numberOfLines={2}>
            {item.displayName}
          </Text>
          <View style={styles.itemMetaRow}>
            <Text style={styles.itemKm}>KP {Math.round(snapped.km)}km</Text>
            <Text
              style={[
                styles.itemDetour,
                detourKm > 5 && styles.itemDetourFar,
              ]}
            >
              経路から {detourKm < 1 ? '<1' : detourKm.toFixed(1)}km
            </Text>
            {inToday && <Text style={styles.itemTodayBadge}>今日の区間</Text>}
          </View>
        </View>
        <View style={styles.plusBadge}>
          <Text style={styles.plusBadgeText}>+</Text>
        </View>
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
          <Text style={styles.headerTitle}>🔍 OSM で場所を検索</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="例: 日月潭、九份老街、7-11 台南..."
            placeholderTextColor={CyclingColors.textLight}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={runSearch}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.searchButtonText}>検索</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          OpenStreetMap / Nominatim から検索。結果はルート上にスナップされます。
        </Text>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={CyclingColors.primary} />
            <Text style={styles.loadingText}>検索中...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>検索失敗: {error}</Text>
          </View>
        )}

        {!loading && !error && results.length === 0 && query.length > 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>結果なし</Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: CyclingColors.background,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: CyclingColors.primary,
  },

  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: CyclingColors.cardBorder,
    backgroundColor: CyclingColors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: CyclingColors.textPrimary,
  },
  searchButton: {
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: CyclingColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: CyclingColors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  hint: {
    fontSize: 11,
    color: CyclingColors.textLight,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
  },
  errorBox: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: CyclingColors.severity.criticalBg,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    color: CyclingColors.severity.critical,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: CyclingColors.textSecondary,
  },

  list: {
    paddingHorizontal: 16,
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
  },
  itemBody: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: CyclingColors.textPrimary,
  },
  itemSub: {
    fontSize: 11,
    color: CyclingColors.textSecondary,
    marginTop: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  itemKm: {
    fontSize: 11,
    fontWeight: '700',
    color: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemDetour: {
    fontSize: 10,
    color: CyclingColors.textSecondary,
  },
  itemDetourFar: {
    color: CyclingColors.severity.warning,
    fontWeight: '700',
  },
  itemTodayBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: CyclingColors.success,
    backgroundColor: CyclingColors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CyclingColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.white,
    marginTop: -2,
  },
});
