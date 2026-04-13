// ============================================
// GPS位置追跡フック
// ============================================

import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useRideStore } from '@/lib/store/rideStore';
import { snapToRoute } from '@/lib/geo/snap';
import { getRouteCoordinates, getCumulativeKm } from '@/lib/data/route';

type LocationTrackingState = {
  /** 位置情報の権限が許可されているか */
  hasPermission: boolean | null;
  /** GPS追跡が有効か */
  isTracking: boolean;
};

/**
 * GPS位置を追跡し、ルート上にスナップして rideStore を更新するフック。
 *
 * @param enabled  trueの場合のみ追跡を開始する（通常は isRiding）
 */
export function useLocationTracking(enabled: boolean): LocationTrackingState {
  const updatePosition = useRideStore((s) => s.updatePosition);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setIsTracking(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      const granted = status === 'granted';
      setHasPermission(granted);
      if (!granted) return;

      const routeCoords = getRouteCoordinates();
      const cumulativeKm = getCumulativeKm();

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 30, // 30m移動ごと
          timeInterval: 5000,   // または5秒ごと
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const snapped = snapToRoute(
            latitude,
            longitude,
            routeCoords,
            cumulativeKm,
          );
          updatePosition(snapped.lat, snapped.lng, snapped.km);
        },
      );

      if (cancelled) {
        sub.remove();
        return;
      }

      subscriptionRef.current = sub;
      setIsTracking(true);
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setIsTracking(false);
    };
  }, [enabled, updatePosition]);

  return { hasPermission, isTracking };
}
