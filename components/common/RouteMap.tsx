/**
 * Lightweight vector route map.
 *
 * Draws the base route and optional highlighted segment / waypoints / current
 * position using react-native-svg — works offline, no tile server required.
 * Uses simple equirectangular projection (with longitude-compression by cos(lat)),
 * which is accurate enough at Taiwan's scale.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { CyclingColors } from '@/constants/Colors';
import {
  getRouteCoordinates,
  getCoordinateAtKm,
} from '@/lib/data/route';
import { useWaypointStore } from '@/lib/store/waypointStore';
import type { WaypointCategory } from '@/lib/types';
import taiwanOutlineData from '@/assets/data/taiwan-outline.json';

// Simplified Taiwan main-island outline as [lng, lat] polygon (~37 points).
// Used as a light background overlay so the route is geographically recognizable.
const TAIWAN_OUTLINE = taiwanOutlineData as [number, number][];

type Props = {
  /** Current rider position in km from route start. */
  currentKm?: number;
  /** Highlight this portion of the route. */
  highlightStartKm?: number;
  highlightEndKm?: number;
  /**
   * "day": auto-fit to the highlighted segment with padding (good for Today).
   * "full": fit the entire route (good for Plan / home overview).
   */
  mode?: 'day' | 'full';
  /** Height in px. */
  height?: number;
  /** Optional title shown in-card. Hide header entirely by passing null. */
  title?: string | null;
};

const WAYPOINT_COLOR: Record<WaypointCategory, string> = {
  accommodation: CyclingColors.success,
  sightseeing: CyclingColors.supply.viewpoint,
  food: CyclingColors.supply.food,
  rest: CyclingColors.accent,
  custom: CyclingColors.primary,
};

function boundsOfPoints(
  pts: Array<{ lat: number; lng: number }>,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of pts) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

/** Pad a bounds box by a fraction of its size on each side. */
function padBounds(
  b: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  frac: number,
) {
  const dLat = Math.max(0.001, b.maxLat - b.minLat);
  const dLng = Math.max(0.001, b.maxLng - b.minLng);
  return {
    minLat: b.minLat - dLat * frac,
    maxLat: b.maxLat + dLat * frac,
    minLng: b.minLng - dLng * frac,
    maxLng: b.maxLng + dLng * frac,
  };
}

export default function RouteMap({
  currentKm,
  highlightStartKm,
  highlightEndKm,
  mode = 'day',
  height = 180,
  title,
}: Props) {
  const waypoints = useWaypointStore((s) => s.waypoints);

  const coords = useMemo(() => getRouteCoordinates(), []);

  // Filter highlighted portion of the route (rough subset by index).
  // We approximate km→index via linear interpolation along the array; the route
  // data module exposes cumulativeKm but for drawing we just slice on the fly.
  const highlightCoords = useMemo(() => {
    if (highlightStartKm === undefined || highlightEndKm === undefined) {
      return null;
    }
    const start = getCoordinateAtKm(highlightStartKm);
    const end = getCoordinateAtKm(highlightEndKm);
    if (!start || !end) return null;
    // Rough: include vertices between the nearest points to start and end.
    // Easier: walk the coord array and pick ones where cumulative-km is in range.
    // Fallback: project by nearest Euclidean.
    // For visual purposes, slice by closest-vertex index is fine.
    const startIdx = findNearestIndex(coords, start.lng, start.lat);
    const endIdx = findNearestIndex(coords, end.lng, end.lat);
    const [i0, i1] =
      startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    return coords.slice(i0, i1 + 1);
  }, [coords, highlightStartKm, highlightEndKm]);

  const waypointsInRange = useMemo(() => {
    if (
      mode !== 'day' ||
      highlightStartKm === undefined ||
      highlightEndKm === undefined
    ) {
      return waypoints;
    }
    return waypoints.filter(
      (w) =>
        w.kmFromStart >= highlightStartKm - 0.5 &&
        w.kmFromStart <= highlightEndKm + 0.5,
    );
  }, [waypoints, mode, highlightStartKm, highlightEndKm]);

  // Compute bounds to fit
  const view = useMemo(() => {
    let basePts: Array<{ lat: number; lng: number }>;
    if (mode === 'day' && highlightCoords && highlightCoords.length > 0) {
      basePts = highlightCoords.map(([lng, lat]) => ({ lat, lng }));
    } else {
      basePts = coords.map(([lng, lat]) => ({ lat, lng }));
    }
    const raw = boundsOfPoints(basePts);
    const padded = padBounds(raw, 0.08);
    return padded;
  }, [mode, highlightCoords, coords]);

  // Canvas & projection
  const width = 360; // virtual width; scales via SVG viewBox
  const centerLat = (view.minLat + view.maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lngSpan = Math.max(0.001, (view.maxLng - view.minLng) * cosLat);
  const latSpan = Math.max(0.001, view.maxLat - view.minLat);
  const aspect = lngSpan / latSpan;
  const canvasW = width;
  const canvasH = Math.max(80, width / aspect);
  const scaleX = canvasW / lngSpan;
  const scaleY = canvasH / latSpan;

  function project(lng: number, lat: number): [number, number] {
    const x = (lng - view.minLng) * cosLat * scaleX;
    const y = canvasH - (lat - view.minLat) * scaleY;
    return [x, y];
  }

  // Build SVG path for the full route (or just day segment in day mode)
  const fullPath = useMemo(() => {
    const pts = mode === 'full' ? coords : highlightCoords ?? coords;
    return pointsToPath(pts, project);
  }, [mode, coords, highlightCoords]);

  const highlightPath = useMemo(() => {
    if (!highlightCoords || mode === 'day') return null;
    return pointsToPath(highlightCoords, project);
  }, [highlightCoords, mode]);

  // Taiwan outline as a closed polygon path (used as background overlay)
  const taiwanPath = useMemo(() => {
    if (TAIWAN_OUTLINE.length === 0) return '';
    return pointsToPath(TAIWAN_OUTLINE, project) + ' Z';
  }, [project]);

  // Current position
  const currentPos = useMemo(() => {
    if (currentKm === undefined) return null;
    const p = getCoordinateAtKm(currentKm);
    if (!p) return null;
    const [x, y] = project(p.lng, p.lat);
    return { x, y };
  }, [currentKm, project]);

  // Start / end markers for day mode
  const startMarker = useMemo(() => {
    if (mode !== 'day' || highlightStartKm === undefined) return null;
    const p = getCoordinateAtKm(highlightStartKm);
    if (!p) return null;
    const [x, y] = project(p.lng, p.lat);
    return { x, y };
  }, [mode, highlightStartKm, project]);

  const endMarker = useMemo(() => {
    if (mode !== 'day' || highlightEndKm === undefined) return null;
    const p = getCoordinateAtKm(highlightEndKm);
    if (!p) return null;
    const [x, y] = project(p.lng, p.lat);
    return { x, y };
  }, [mode, highlightEndKm, project]);

  return (
    <View style={[styles.card, { height: height + (title === null ? 16 : 40) }]}>
      {title !== null && (
        <Text style={styles.title}>{title ?? '🗺️ ルート'}</Text>
      )}
      <View style={[styles.mapBox, { height }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Taiwan island background overlay */}
          <Path
            d={taiwanPath}
            fill={CyclingColors.primaryLight}
            fillOpacity={0.45}
            stroke={CyclingColors.textLight}
            strokeWidth={0.6}
            strokeOpacity={0.5}
          />

          {/* Base (or day segment) route line — red for visibility over green fill */}
          <Path
            d={fullPath}
            stroke={
              mode === 'full'
                ? CyclingColors.accent
                : CyclingColors.primaryDark
            }
            strokeWidth={mode === 'full' ? 1.8 : 2.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={mode === 'full' ? 0.85 : 1}
          />

          {/* Highlighted day segment overlay (only when mode=full) */}
          {highlightPath && (
            <Path
              d={highlightPath}
              stroke={CyclingColors.primaryDark}
              strokeWidth={3.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Waypoints */}
          <G>
            {waypointsInRange.map((w) => {
              const [x, y] = project(w.lng, w.lat);
              const color = WAYPOINT_COLOR[w.category] ?? CyclingColors.primary;
              return (
                <G key={w.id}>
                  <Circle cx={x} cy={y} r={6} fill={color} stroke="white" strokeWidth={1.5} />
                </G>
              );
            })}
          </G>

          {/* Start / end markers for day mode */}
          {startMarker && (
            <Circle
              cx={startMarker.x}
              cy={startMarker.y}
              r={5}
              fill={CyclingColors.textPrimary}
              stroke="white"
              strokeWidth={1.5}
            />
          )}
          {endMarker && (
            <Circle
              cx={endMarker.x}
              cy={endMarker.y}
              r={7}
              fill={CyclingColors.accent}
              stroke="white"
              strokeWidth={2}
            />
          )}

          {/* Current position */}
          {currentPos && (
            <>
              <Circle
                cx={currentPos.x}
                cy={currentPos.y}
                r={10}
                fill={CyclingColors.primary}
                opacity={0.25}
              />
              <Circle
                cx={currentPos.x}
                cy={currentPos.y}
                r={5}
                fill={CyclingColors.primary}
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}
        </Svg>
      </View>

      {title !== null && waypointsInRange.length > 0 && (
        <Text style={styles.hint}>
          ● 経由地 {waypointsInRange.length}  ·  ● 現在地  ·  ● 今日のゴール
        </Text>
      )}
    </View>
  );
}

function pointsToPath(
  pts: [number, number][],
  project: (lng: number, lat: number) => [number, number],
): string {
  if (pts.length === 0) return '';
  const first = pts[0];
  const [fx, fy] = project(first[0], first[1]);
  let d = `M ${fx.toFixed(2)},${fy.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = project(pts[i][0], pts[i][1]);
    d += ` L ${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d;
}

function findNearestIndex(
  coords: [number, number][],
  targetLng: number,
  targetLat: number,
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    const dLng = lng - targetLng;
    const dLat = lat - targetLat;
    const d = dLng * dLng + dLat * dLat;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: CyclingColors.textPrimary,
    marginBottom: 6,
  },
  mapBox: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: CyclingColors.background,
  },
  hint: {
    fontSize: 10,
    color: CyclingColors.textLight,
    marginTop: 6,
  },
});
