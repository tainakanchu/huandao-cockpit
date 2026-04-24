// ============================================
// GPS 現在地 → 環島ルート上の km を推定
// ============================================
//
// 一回だけ位置を取得し、ルート上に snap して km を返す。Home 画面の
// 「GPS で現在地を取得」ボタンから呼ばれる想定。

import * as Location from 'expo-location';
import { snapToRoute } from '@/lib/geo/snap';
import { haversineDistance } from '@/lib/geo/distance';
import { getRouteCoordinates, getCumulativeKm } from '@/lib/data/route';

export type DetectResult = {
  km: number;
  lat: number;
  lng: number;
  /** GPS 実位置からルート snap 点までの距離 (km) */
  detourKm: number;
};

export class PermissionDeniedError extends Error {
  constructor() {
    super('Location permission denied');
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Foreground で一回だけ現在地を取得し、環島ルート上にスナップする。
 * 権限が拒否されたら PermissionDeniedError を投げる。
 */
export async function detectCurrentPosition(
  opts: { timeoutMs?: number } = {},
): Promise<DetectResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new PermissionDeniedError();

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = loc.coords;

  const coords = getRouteCoordinates();
  const cumKm = getCumulativeKm();
  const snapped = snapToRoute(latitude, longitude, coords, cumKm);

  const detourKm = haversineDistance(
    latitude,
    longitude,
    snapped.lat,
    snapped.lng,
  );

  return {
    km: snapped.km,
    lat: snapped.lat,
    lng: snapped.lng,
    detourKm,
  };
}
