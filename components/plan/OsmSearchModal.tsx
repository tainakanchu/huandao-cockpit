import React, { useCallback, useMemo, useRef, useState } from 'react';
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

type Notice =
  | { type: 'added'; name: string; km: number }
  | { type: 'duplicate' }
  | { type: 'limit' }
  | { type: 'error'; message: string }
  | null;

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
  const [notice, setNotice] = useState<Notice>(null);
  const abortRef = useRef<AbortController | null>(null);

  const waypoints = useWaypointStore((s) => s.waypoints);
  const addWaypoint = useWaypointStore((s) => s.addWaypoint);

  // Precomputed route coords (stable across renders)
  const routeCoords = useMemo(() => getRouteCoordinates(), []);
  const cumKm = useMemo(() => getCumulativeKm(), []);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setNotice(null);
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

  const handleAdd = useCallback(
    (r: OsmSearchResult) => {
      // Over-limit?
      if (waypoints.length >= WAYPOINT_LIMIT) {
        setNotice({ type: 'limit' });
        return;
      }

      // Snap and compute detour distance for metadata only.
      const snapped = snapToRoute(r.lat, r.lng, routeCoords, cumKm);
      const category = deriveCategory(r);

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
        setNotice({
          type: 'added',
          name: r.shortName,
          km: Math.round(snapped.km),
        });
      } else {
        setNotice({ type: 'duplicate' });
      }
    },
    [addWaypoint, waypoints.length, routeCoords, cumKm],
  );

  const renderItem = ({ item }: { item: OsmSearchResult }) => {
    const snapped = snapToRoute(item.lat, item.lng, routeCoords, cumKm);
    const detourKm = haversineDistance(
      item.lat,
      item.lng,
      snapped.lat,
      snapped.lng,
    );
    const inToday =
      dayStartKm !== undefined &&
      dayEndKm !== undefined &&
      snapped.km >= dayStartKm &&
      snapped.km <= dayEndKm;

    const alreadyAdded = waypoints.some(
      (w) => w.sourceType === 'custom' && w.sourceId === `osm:${item.id}`,
    );

    return (
      <TouchableOpacity
        style={[styles.item, alreadyAdded && styles.itemAdded]}
        onPress={() => !alreadyAdded && handleAdd(item)}
        disabled={alreadyAdded}
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
        <View style={[styles.plusBadge, alreadyAdded && styles.plusBadgeAdded]}>
          <Text style={styles.plusBadgeText}>{alreadyAdded ? '✓' : '+'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const noticeNode = (() => {
    if (!notice) return null;
    if (notice.type === 'added') {
      return (
        <View style={[styles.noticeBox, styles.noticeBoxSuccess]}>
          <Text style={styles.noticeText}>
            ✓ {notice.name} を追加しました (KP {notice.km}km)
          </Text>
        </View>
      );
    }
    if (notice.type === 'duplicate') {
      return (
        <View style={[styles.noticeBox, styles.noticeBoxWarn]}>
          <Text style={styles.noticeText}>既に追加済みです</Text>
        </View>
      );
    }
    if (notice.type === 'limit') {
      return (
        <View style={[styles.noticeBox, styles.noticeBoxWarn]}>
          <Text style={styles.noticeText}>
            経由地は最大 {WAYPOINT_LIMIT} 件までです
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.noticeBox, styles.noticeBoxError]}>
        <Text style={styles.noticeText}>追加失敗: {notice.message}</Text>
      </View>
    );
  })();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 場所を検索</Text>
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
          名前や地名で検索できます。結果はルート上にスナップされます。
        </Text>

        {noticeNode}

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

  noticeBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  noticeBoxSuccess: {
    backgroundColor: CyclingColors.primaryLight,
    borderWidth: 1,
    borderColor: CyclingColors.primary,
  },
  noticeBoxWarn: {
    backgroundColor: CyclingColors.severity.warningBg,
    borderWidth: 1,
    borderColor: CyclingColors.severity.warning,
  },
  noticeBoxError: {
    backgroundColor: CyclingColors.severity.criticalBg,
    borderWidth: 1,
    borderColor: CyclingColors.severity.critical,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: CyclingColors.textPrimary,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemAdded: {
    borderColor: CyclingColors.primary,
    backgroundColor: CyclingColors.primaryLight + '40',
    opacity: 0.85,
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
  plusBadgeAdded: {
    backgroundColor: CyclingColors.success,
  },
  plusBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: CyclingColors.white,
    marginTop: -2,
  },
});
