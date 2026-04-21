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
import Svg, { Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { CyclingColors } from '@/constants/Colors';
import {
  getRouteCoordinates,
  getCoordinateAtKm,
} from '@/lib/data/route';
import { haversineDistance } from '@/lib/geo/distance';
import { useWaypointStore } from '@/lib/store/waypointStore';
import { useT } from '@/lib/i18n';
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
  const t = useT();
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

  // Compute bounds to fit. In day mode, include in-range waypoints too so
  // off-route POIs don't get clipped.
  const view = useMemo(() => {
    let basePts: Array<{ lat: number; lng: number }>;
    if (mode === 'day' && highlightCoords && highlightCoords.length > 0) {
      basePts = highlightCoords.map(([lng, lat]) => ({ lat, lng }));
      for (const w of waypointsInRange) {
        basePts.push({ lat: w.lat, lng: w.lng });
      }
    } else {
      basePts = coords.map(([lng, lat]) => ({ lat, lng }));
    }
    const raw = boundsOfPoints(basePts);
    const padded = padBounds(raw, 0.08);
    return padded;
  }, [mode, highlightCoords, coords, waypointsInRange]);

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

  // 環島一號線（全 946km）— 常に背景として描画する参照線
  const huandaoFullPath = useMemo(
    () => pointsToPath(coords, project),
    [coords, project],
  );

  // 今日の区間 (day mode でのメインのルート)
  const daySegmentPath = useMemo(() => {
    if (mode !== 'day' || !highlightCoords) return null;
    return pointsToPath(highlightCoords, project);
  }, [mode, highlightCoords, project]);

  // full mode での強調区間（trip 進行中なら今日の区間）
  const fullModeHighlight = useMemo(() => {
    if (mode !== 'full' || !highlightCoords) return null;
    return pointsToPath(highlightCoords, project);
  }, [mode, highlightCoords, project]);

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
        <Text style={styles.title}>{title ?? t.mapDefaultTitle}</Text>
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

          {/* 環島一號線（全ルートの参照線）— 常に青で表示 */}
          <Path
            d={huandaoFullPath}
            stroke={CyclingColors.supply.water}
            strokeWidth={mode === 'full' ? 1.6 : 1.3}
            strokeOpacity={mode === 'full' ? 0.7 : 0.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 今日の区間 (day mode) — 朱赤で目立たせる */}
          {daySegmentPath && (
            <Path
              d={daySegmentPath}
              stroke={CyclingColors.accent}
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 強調区間 (full mode) — 濃い緑 */}
          {fullModeHighlight && (
            <Path
              d={fullModeHighlight}
              stroke={CyclingColors.primaryDark}
              strokeWidth={3.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Waypoints: 実座標に描画。ルートから離れている場合は最寄り km 地点へ点線で接続 */}
          <G>
            {waypointsInRange.map((w) => {
              const [x, y] = project(w.lng, w.lat);
              const color = WAYPOINT_COLOR[w.category] ?? CyclingColors.primary;
              const label = w.nameZh ?? w.name;
              const onRight = x < canvasW * 0.7;

              // Detour コネクタ: ルート上の最寄り km 地点から waypoint までを点線で
              const snapPoint = getCoordinateAtKm(w.kmFromStart);
              const detourKm = snapPoint
                ? haversineDistance(w.lat, w.lng, snapPoint.lat, snapPoint.lng)
                : 0;
              const showConnector = snapPoint !== null && detourKm > 0.3;
              const [sx, sy] = snapPoint
                ? project(snapPoint.lng, snapPoint.lat)
                : [x, y];

              return (
                <G key={w.id}>
                  {showConnector && (
                    <Line
                      x1={sx}
                      y1={sy}
                      x2={x}
                      y2={y}
                      stroke={color}
                      strokeWidth={1.2}
                      strokeDasharray="3,2"
                      strokeOpacity={0.7}
                    />
                  )}
                  <Circle cx={x} cy={y} r={6} fill={color} stroke="white" strokeWidth={1.5} />
                  <LabelWithHalo
                    x={onRight ? x + 9 : x - 9}
                    y={y + 3}
                    text={
                      detourKm > 1
                        ? `${label} (−${detourKm.toFixed(1)}km)`
                        : label
                    }
                    anchor={onRight ? 'start' : 'end'}
                    fontSize={9}
                  />
                </G>
              );
            })}
          </G>

          {/* Start / end markers for day mode (with labels) */}
          {startMarker && (
            <G>
              <Circle
                cx={startMarker.x}
                cy={startMarker.y}
                r={5}
                fill={CyclingColors.textPrimary}
                stroke="white"
                strokeWidth={1.5}
              />
              <LabelWithHalo
                x={startMarker.x < canvasW * 0.7 ? startMarker.x + 8 : startMarker.x - 8}
                y={startMarker.y + 3}
                text={t.mapStart}
                anchor={startMarker.x < canvasW * 0.7 ? 'start' : 'end'}
                fontSize={9}
                color={CyclingColors.textPrimary}
              />
            </G>
          )}
          {endMarker && (
            <G>
              <Circle
                cx={endMarker.x}
                cy={endMarker.y}
                r={7}
                fill={CyclingColors.accent}
                stroke="white"
                strokeWidth={2}
              />
              <LabelWithHalo
                x={endMarker.x < canvasW * 0.7 ? endMarker.x + 10 : endMarker.x - 10}
                y={endMarker.y + 3}
                text={t.mapGoal}
                anchor={endMarker.x < canvasW * 0.7 ? 'start' : 'end'}
                fontSize={10}
                color={CyclingColors.accent}
              />
            </G>
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

      {title !== null && (
        <Text style={styles.hint}>
          <Text style={{ color: CyclingColors.supply.water }}>━</Text>{' '}
          {t.mapLegendHuandao}
          {mode === 'day' ? (
            <>
              {'  ·  '}
              <Text style={{ color: CyclingColors.accent }}>━</Text>{' '}
              {t.mapLegendToday}
            </>
          ) : null}
          {waypointsInRange.length > 0
            ? `  ·  ${t.mapLegendWaypoints(waypointsInRange.length)}`
            : ''}
        </Text>
      )}
    </View>
  );
}

/**
 * Draw text with a white halo outline so it remains readable over any map
 * background. React-native-svg renders the two Text elements in order, so the
 * halo sits under the main fill.
 */
function LabelWithHalo({
  x,
  y,
  text,
  anchor,
  fontSize,
  color,
}: {
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
  fontSize: number;
  color?: string;
}) {
  const fill = color ?? CyclingColors.textPrimary;
  return (
    <G>
      <SvgText
        x={x}
        y={y}
        fontSize={fontSize}
        fontWeight="700"
        textAnchor={anchor}
        fill="white"
        stroke="white"
        strokeWidth={3}
      >
        {text}
      </SvgText>
      <SvgText
        x={x}
        y={y}
        fontSize={fontSize}
        fontWeight="700"
        textAnchor={anchor}
        fill={fill}
      >
        {text}
      </SvgText>
    </G>
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
