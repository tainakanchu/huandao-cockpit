// ============================================
// 方位角計算ユーティリティ
// ============================================

/**
 * Calculate the initial bearing from point 1 to point 2.
 * Returns degrees in range [0, 360) where 0=N, 90=E, 180=S, 270=W.
 */
export function calcBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const x = Math.sin(dLng) * Math.cos(phi2);
  const y =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(x, y));
  return (bearing + 360) % 360;
}

/**
 * Calculate the route bearing at a given km point.
 * Finds the segment that contains the given km and returns the bearing
 * of that segment.
 *
 * @param km                  Distance along the route in km
 * @param routeCoordinates    Route geometry as [lng, lat] pairs
 * @param cumulativeDistances Precomputed cumulative km for each vertex
 */
export function routeBearingAtKm(
  km: number,
  routeCoordinates: [number, number][],
  cumulativeDistances: number[]
): number {
  // Clamp km to route bounds
  const clampedKm = Math.max(
    0,
    Math.min(km, cumulativeDistances[cumulativeDistances.length - 1])
  );

  // Find the segment that contains this km
  let segmentIndex = 0;
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    if (cumulativeDistances[i + 1] >= clampedKm) {
      segmentIndex = i;
      break;
    }
  }

  const [aLng, aLat] = routeCoordinates[segmentIndex];
  const [bLng, bLat] = routeCoordinates[segmentIndex + 1];

  return calcBearing(aLat, aLng, bLat, bLng);
}

/**
 * Calculate the effective wind component along the route direction.
 *
 * Uses the dot product of the wind vector onto the route bearing.
 * Positive = tailwind (wind pushing from behind), Negative = headwind.
 *
 * @param routeBearing      Route direction in degrees (0=N, 90=E)
 * @param windDirectionDeg  Meteorological wind direction (direction wind comes FROM)
 * @param windSpeedKmh      Wind speed in km/h
 * @returns                 Effective wind component in km/h (positive = tailwind)
 */
export function effectiveWindComponent(
  routeBearing: number,
  windDirectionDeg: number,
  windSpeedKmh: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Wind direction in meteorological convention is where wind comes FROM.
  // The direction wind is blowing TO is windDirectionDeg + 180.
  const windToBearing = (windDirectionDeg + 180) % 360;

  // Angle between route direction and the direction wind is blowing towards
  const angleDiff = toRad(windToBearing - routeBearing);

  // cos(0) = 1 means perfect tailwind, cos(180) = -1 means perfect headwind
  return windSpeedKmh * Math.cos(angleDiff);
}
