/**
 * 台湾一周サイクリングガイドブックから抽出した情報
 *
 * - 病院リスト（ルート沿いの緊急医療機関）
 * - ご当地グルメ（各区間の名物料理）
 */

import guideData from "@/assets/data/guide-data.json";

export type Hospital = {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  kmFromStart: number;
};

export type LocalFood = {
  name: string;
  area: string;
  kmRange: [number, number];
  description: string;
};

/** ルート沿いの病院を取得 */
export function getHospitalsInRange(
  startKm: number,
  endKm: number,
): Hospital[] {
  return (guideData.hospitals as Hospital[])
    .filter((h) => h.kmFromStart >= startKm && h.kmFromStart <= endKm)
    .sort((a, b) => a.kmFromStart - b.kmFromStart);
}

/** 指定km地点に最も近い病院を取得 */
export function getNearestHospital(km: number): Hospital | null {
  const hospitals = guideData.hospitals as Hospital[];
  if (hospitals.length === 0) return null;
  return hospitals.reduce((best, h) =>
    Math.abs(h.kmFromStart - km) < Math.abs(best.kmFromStart - km) ? h : best,
  );
}

/** 指定区間のご当地グルメを取得 */
export function getLocalFoodForRange(
  startKm: number,
  endKm: number,
): LocalFood[] {
  return (guideData.localFood as LocalFood[]).filter(
    (f) => f.kmRange[0] <= endKm && f.kmRange[1] >= startKm,
  );
}
