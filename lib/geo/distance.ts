// ============================================
// 距離計算ユーティリティ
// ============================================

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula for distance between two points in km.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Find the nearest point on a LineString to a given point.
 *
 * For each segment of the line, we project the point onto the segment and
 * compute the distance. Returns the closest projected point with its km
 * along the route and the index of the segment.
 *
 * @param line        Array of [lng, lat] coordinate pairs forming the line
 * @param point       [lng, lat] of the query point
 * @param cumulativeDistances  Precomputed cumulative km for each vertex
 * @returns           The nearest point on the line with km, lat, lng, and segmentIndex
 */
export function nearestPointOnLine(
  line: [number, number][],
  point: [number, number],
  cumulativeDistances: number[]
): { km: number; lat: number; lng: number; segmentIndex: number } {
  const [pLng, pLat] = point;

  let bestDist = Infinity;
  let bestKm = 0;
  let bestLat = line[0][1];
  let bestLng = line[0][0];
  let bestSegmentIndex = 0;

  for (let i = 0; i < line.length - 1; i++) {
    const [aLng, aLat] = line[i];
    const [bLng, bLat] = line[i + 1];

    // Project point onto segment [A, B] using a planar approximation
    // for the parametric fraction t, then compute haversine for the
    // actual distance. This gives good results for short segments.
    const dx = bLng - aLng;
    const dy = bLat - aLat;
    const lenSq = dx * dx + dy * dy;

    let t: number;
    if (lenSq === 0) {
      // A and B are the same point
      t = 0;
    } else {
      t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLat = aLat + t * dy;
    const projLng = aLng + t * dx;

    const dist = haversineDistance(pLat, pLng, projLat, projLng);

    if (dist < bestDist) {
      bestDist = dist;
      bestLat = projLat;
      bestLng = projLng;
      bestSegmentIndex = i;

      // Calculate km: cumulative distance to vertex i + fraction of segment
      const segmentLength = cumulativeDistances[i + 1] - cumulativeDistances[i];
      bestKm = cumulativeDistances[i] + t * segmentLength;
    }
  }

  return { km: bestKm, lat: bestLat, lng: bestLng, segmentIndex: bestSegmentIndex };
}

/**
 * Compute cumulative distances along a LineString.
 * Returns an array of km values, one per vertex.
 * The first element is always 0.
 *
 * @param coordinates  Array of [lng, lat] coordinate pairs
 */
export function computeCumulativeDistances(
  coordinates: [number, number][]
): number[] {
  const distances: number[] = [0];

  for (let i = 1; i < coordinates.length; i++) {
    const [prevLng, prevLat] = coordinates[i - 1];
    const [curLng, curLat] = coordinates[i];
    const segDist = haversineDistance(prevLat, prevLng, curLat, curLng);
    distances.push(distances[i - 1] + segDist);
  }

  return distances;
}
