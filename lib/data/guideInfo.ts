/**
 * ルート沿いの緊急医療機関情報。
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
