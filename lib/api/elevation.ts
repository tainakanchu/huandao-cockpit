// ============================================
// Open-Meteo Elevation API クライアント
// ============================================

import { ElevationPoint } from '@/lib/types';
import {
  haversineDistance,
  computeCumulativeDistances,
} from '@/lib/geo/distance';

const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

/** Open-Meteo Elevation API の 1 リクエストあたり最大座標数 */
const MAX_COORDS_PER_REQUEST = 100;

/**
 * 座標リストの標高を取得する。
 *
 * Open-Meteo の制限に従い、100 座標を超える場合はバッチに分割して並列リクエストする。
 *
 * @param points 座標リスト（lat, lng）
 * @returns      各座標に対応する標高（メートル）の配列
 */
export async function fetchElevation(
  points: { lat: number; lng: number }[]
): Promise<number[]> {
  if (points.length === 0) {
    return [];
  }

  // バッチに分割
  const batches: { lat: number; lng: number }[][] = [];
  for (let i = 0; i < points.length; i += MAX_COORDS_PER_REQUEST) {
    batches.push(points.slice(i, i + MAX_COORDS_PER_REQUEST));
  }

  try {
    // 全バッチを並列で取得
    const batchResults = await Promise.all(batches.map(fetchElevationBatch));

    // 結果を結合
    return batchResults.flat();
  } catch (error) {
    console.error('[elevation] fetchElevation failed:', error);
    throw error;
  }
}

/**
 * 1 バッチ分（最大100座標）の標高をAPIから取得する。
 */
async function fetchElevationBatch(
  points: { lat: number; lng: number }[]
): Promise<number[]> {
  const latitudes = points.map((p) => p.lat.toFixed(4)).join(',');
  const longitudes = points.map((p) => p.lng.toFixed(4)).join(',');

  const url = new URL(ELEVATION_URL);
  url.searchParams.set('latitude', latitudes);
  url.searchParams.set('longitude', longitudes);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Open-Meteo Elevation API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as { elevation: number[] };

  if (!data.elevation || !Array.isArray(data.elevation)) {
    throw new Error(
      '[elevation] Unexpected API response: missing elevation array'
    );
  }

  return data.elevation;
}

/**
 * ルート座標に沿った標高プロファイルを生成する。
 *
 * ルートの座標を指定間隔でサンプリングし、各サンプル地点の標高を取得して
 * ElevationPoint[] として返す。
 *
 * @param coordinates [lng, lat] ペアの配列（GeoJSON形式）
 * @param intervalM   サンプリング間隔（メートル、デフォルト 100）
 * @returns           ElevationPoint の配列（km と elevationM）
 */
export async function fetchElevationProfile(
  coordinates: [number, number][],
  intervalM: number = 100
): Promise<ElevationPoint[]> {
  if (coordinates.length === 0) {
    return [];
  }

  if (coordinates.length === 1) {
    const [lng, lat] = coordinates[0];
    const elevations = await fetchElevation([{ lat, lng }]);
    return [{ km: 0, elevationM: elevations[0] }];
  }

  // 累積距離を計算（km）
  const cumulativeKm = computeCumulativeDistances(coordinates);
  const totalKm = cumulativeKm[cumulativeKm.length - 1];
  const intervalKm = intervalM / 1000;

  // サンプル地点を等間隔で生成
  const samplePoints: { lat: number; lng: number; km: number }[] = [];

  let nextSampleKm = 0;
  let segIndex = 0;

  while (nextSampleKm <= totalKm) {
    // nextSampleKm が含まれるセグメントを探す
    while (
      segIndex < coordinates.length - 2 &&
      cumulativeKm[segIndex + 1] < nextSampleKm
    ) {
      segIndex++;
    }

    // セグメント内での補間
    const segStartKm = cumulativeKm[segIndex];
    const segEndKm = cumulativeKm[segIndex + 1];
    const segLength = segEndKm - segStartKm;

    let t = 0;
    if (segLength > 0) {
      t = (nextSampleKm - segStartKm) / segLength;
      t = Math.max(0, Math.min(1, t));
    }

    const [lng1, lat1] = coordinates[segIndex];
    const [lng2, lat2] = coordinates[segIndex + 1];

    const lat = lat1 + t * (lat2 - lat1);
    const lng = lng1 + t * (lng2 - lng1);

    samplePoints.push({ lat, lng, km: nextSampleKm });

    nextSampleKm += intervalKm;
  }

  // 最終地点を必ず含める
  const lastKm = samplePoints[samplePoints.length - 1]?.km ?? -1;
  if (Math.abs(lastKm - totalKm) > intervalKm * 0.1) {
    const [lng, lat] = coordinates[coordinates.length - 1];
    samplePoints.push({ lat, lng, km: totalKm });
  }

  // 標高を取得
  const elevations = await fetchElevation(
    samplePoints.map((p) => ({ lat: p.lat, lng: p.lng }))
  );

  // ElevationPoint[] を生成
  return samplePoints.map((p, i) => ({
    km: Math.round(p.km * 1000) / 1000, // 小数第3位まで
    elevationM: elevations[i],
  }));
}
