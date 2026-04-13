// ============================================
// GPS位置をルート上にスナップ
// ============================================

import { nearestPointOnLine } from "@/lib/geo/distance";

/**
 * Snap a GPS position to the nearest point on the route.
 * Returns the km along the route and the snapped lat/lng.
 *
 * @param lat               Current GPS latitude
 * @param lng               Current GPS longitude
 * @param routeCoordinates  Route geometry as [lng, lat] pairs
 * @param cumulativeDistances Precomputed cumulative km for each vertex
 */
export function snapToRoute(
  lat: number,
  lng: number,
  routeCoordinates: [number, number][],
  cumulativeDistances: number[]
): { km: number; lat: number; lng: number } {
  const result = nearestPointOnLine(
    routeCoordinates,
    [lng, lat], // nearestPointOnLine expects [lng, lat]
    cumulativeDistances
  );

  return {
    km: result.km,
    lat: result.lat,
    lng: result.lng,
  };
}
