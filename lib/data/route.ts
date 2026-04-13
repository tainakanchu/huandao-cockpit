/**
 * Route data loading module.
 *
 * Loads the actual GeoJSON route data processed from OSM relation 5692631.
 * The route is a single LineString covering the full Taiwan cycling route
 * (counterclockwise, starting from Songshan Station).
 */

import type { Route, ElevationPoint, GeoJSONLineString } from "@/lib/types";
import routeGeoJSON from "@/assets/data/route.json";

type RouteGeoJSONFile = {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    name_en: string;
    totalDistanceKm: number;
    pointCount: number;
    cumulativeKm: number[];
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

const geoData = routeGeoJSON as unknown as RouteGeoJSONFile;

/**
 * Elevation profile along the route.
 * These are approximate values for key points.
 * TODO: Replace with real elevation data from Open-Meteo Elevation API.
 */
const ELEVATION_PROFILE: ElevationPoint[] = [
  { km: 0, elevationM: 10 },
  { km: 40, elevationM: 30 },
  { km: 87, elevationM: 15 },   // 新竹
  { km: 120, elevationM: 80 },
  { km: 140, elevationM: 20 },
  { km: 186, elevationM: 100 },  // 台中
  { km: 230, elevationM: 25 },
  { km: 280, elevationM: 30 },
  { km: 310, elevationM: 25 },
  { km: 340, elevationM: 10 },   // 台南
  { km: 395, elevationM: 10 },   // 高雄
  { km: 440, elevationM: 25 },
  { km: 475, elevationM: 10 },
  { km: 490, elevationM: 30 },
  { km: 510, elevationM: 50 },   // 楓港〜車城
  { km: 530, elevationM: 60 },   // 恆春
  { km: 545, elevationM: 80 },
  { km: 555, elevationM: 460 },  // 壽卡 peak
  { km: 562, elevationM: 200 },
  { km: 570, elevationM: 50 },
  { km: 590, elevationM: 15 },   // 大武
  { km: 620, elevationM: 20 },
  { km: 559, elevationM: 20 },   // 台東
  { km: 660, elevationM: 30 },
  { km: 690, elevationM: 25 },
  { km: 724, elevationM: 10 },   // 花蓮
  { km: 755, elevationM: 20 },
  { km: 770, elevationM: 180 },  // 蘇花公路
  { km: 790, elevationM: 50 },
  { km: 820, elevationM: 15 },
  { km: 846, elevationM: 8 },    // 宜蘭
  { km: 870, elevationM: 15 },
  { km: 890, elevationM: 400 },  // 北宜公路 peak
  { km: 910, elevationM: 250 },
  { km: 935, elevationM: 40 },
  { km: 946, elevationM: 10 },
];

// Sort elevation profile by km to ensure correct order
ELEVATION_PROFILE.sort((a, b) => a.km - b.km);

const geometry: GeoJSONLineString = {
  type: "LineString",
  coordinates: geoData.geometry.coordinates,
};

const route: Route = {
  id: geoData.properties.id,
  name: geoData.properties.name,
  geometry,
  totalDistanceKm: geoData.properties.totalDistanceKm,
  elevationProfile: ELEVATION_PROFILE,
};

/** Precomputed cumulative distances for each coordinate vertex */
let _cumulativeKm: number[] | null = null;

/** Get the cumulative km array (lazy-loaded from GeoJSON) */
export function getCumulativeKm(): number[] {
  if (!_cumulativeKm) {
    _cumulativeKm = geoData.properties.cumulativeKm;
  }
  return _cumulativeKm;
}

/** Get the full route data */
export function getRoute(): Route {
  return route;
}

/** Get route coordinates as [lng, lat] array */
export function getRouteCoordinates(): [number, number][] {
  return route.geometry.coordinates;
}

/** Get elevation at a given km (linear interpolation between known points) */
export function getElevationAtKm(km: number): number {
  const profile = route.elevationProfile;

  if (km <= profile[0].km) return profile[0].elevationM;
  if (km >= profile[profile.length - 1].km)
    return profile[profile.length - 1].elevationM;

  for (let i = 0; i < profile.length - 1; i++) {
    if (km >= profile[i].km && km <= profile[i + 1].km) {
      const ratio =
        (km - profile[i].km) / (profile[i + 1].km - profile[i].km);
      return (
        profile[i].elevationM +
        ratio * (profile[i + 1].elevationM - profile[i].elevationM)
      );
    }
  }

  return 0;
}

/** Get the elevation profile array */
export function getRouteElevationProfile(): ElevationPoint[] {
  return route.elevationProfile;
}

/** Get total elevation gain between two km points */
export function getElevationGain(startKm: number, endKm: number): number {
  const profile = route.elevationProfile;
  let gain = 0;
  let prevElevation = getElevationAtKm(startKm);

  for (const point of profile) {
    if (point.km <= startKm) continue;
    if (point.km > endKm) break;

    const diff = point.elevationM - prevElevation;
    if (diff > 0) gain += diff;
    prevElevation = point.elevationM;
  }

  // Include the final segment to endKm
  const endElevation = getElevationAtKm(endKm);
  const finalDiff = endElevation - prevElevation;
  if (finalDiff > 0) gain += finalDiff;

  return Math.round(gain);
}

/** Get the lat/lng coordinates at a given km position on the route */
export function getCoordinateAtKm(km: number): { lat: number; lng: number } | null {
  const cumKm = getCumulativeKm();
  const coords = route.geometry.coordinates;

  if (km <= 0) return { lng: coords[0][0], lat: coords[0][1] };
  if (km >= cumKm[cumKm.length - 1]) {
    const last = coords[coords.length - 1];
    return { lng: last[0], lat: last[1] };
  }

  for (let i = 0; i < cumKm.length - 1; i++) {
    if (km >= cumKm[i] && km <= cumKm[i + 1]) {
      const ratio = (km - cumKm[i]) / (cumKm[i + 1] - cumKm[i]);
      const lng = coords[i][0] + ratio * (coords[i + 1][0] - coords[i][0]);
      const lat = coords[i][1] + ratio * (coords[i + 1][1] - coords[i][1]);
      return { lng, lat };
    }
  }

  return null;
}
