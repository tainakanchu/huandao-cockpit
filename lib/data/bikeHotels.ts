/**
 * 自行車友善旅宿（Bicycle-Friendly Hotels）データ
 *
 * 台湾政府観光局の公開データから抽出。
 * ルート5km以内の自転車友善認定宿泊施設。
 */

import type { BikeHotel } from "@/lib/types";
import hotelsData from "@/assets/data/bike-hotels.json";

const hotels: BikeHotel[] = hotelsData as BikeHotel[];

/**
 * 指定km範囲内の自転車友善旅宿を取得する。
 */
export function getBikeHotelsInRange(
  startKm: number,
  endKm: number,
): BikeHotel[] {
  return hotels
    .filter((h) => h.kmFromStart >= startKm && h.kmFromStart <= endKm)
    .sort((a, b) => a.kmFromStart - b.kmFromStart);
}

/**
 * 指定km地点に最も近い自転車友善旅宿を取得する。
 */
export function getNearestBikeHotels(
  km: number,
  limit: number = 5,
): BikeHotel[] {
  return [...hotels]
    .sort((a, b) => Math.abs(a.kmFromStart - km) - Math.abs(b.kmFromStart - km))
    .slice(0, limit);
}
