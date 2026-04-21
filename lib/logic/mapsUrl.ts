// ============================================
// 外部地図アプリへのルートリンク生成
// ============================================
//
// Google Maps Directions API URL (Universal):
//   https://developers.google.com/maps/documentation/urls/get-started#directions-action
//
// Android/iOS に Google Maps アプリが入っていれば直接起動、なければブラウザで開く。

export type MapPoint = { lat: number; lng: number };

export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

/** Google Maps は URL 経由の waypoints に最大 9 件まで指定できる。 */
export const GOOGLE_MAPS_WAYPOINT_LIMIT = 9;

function fmt(p: MapPoint): string {
  return `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

/**
 * Build a Google Maps universal directions URL.
 *
 * @returns URL string. Pass to Linking.openURL.
 */
export function buildGoogleMapsDirectionsUrl(opts: {
  origin: MapPoint;
  destination: MapPoint;
  waypoints?: MapPoint[];
  travelMode?: TravelMode;
}): string {
  const { origin, destination, waypoints = [], travelMode = 'bicycling' } = opts;

  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('origin', fmt(origin));
  params.set('destination', fmt(destination));
  params.set('travelmode', travelMode);

  if (waypoints.length > 0) {
    const clipped = waypoints.slice(0, GOOGLE_MAPS_WAYPOINT_LIMIT);
    // Google expects waypoints joined by '|' (URL-encoded by URLSearchParams as %7C).
    params.set('waypoints', clipped.map(fmt).join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
