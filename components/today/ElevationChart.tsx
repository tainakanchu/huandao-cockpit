import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText, Circle, Rect } from "react-native-svg";
import { CyclingColors } from "@/constants/Colors";
import { useT } from "@/lib/i18n";
import type { ElevationPoint, Hazard, Checkpoint } from "@/lib/types";

type Props = {
  elevationProfile: ElevationPoint[];
  startKm: number;
  endKm: number;
  currentKm?: number;
  hazards?: Hazard[];
  checkpoints?: Checkpoint[];
  width?: number;
  height?: number;
};

const PADDING = { top: 20, right: 16, bottom: 32, left: 40 };

export default function ElevationChart({
  elevationProfile,
  startKm,
  endKm,
  currentKm,
  hazards = [],
  checkpoints = [],
  width = 358,
  height = 180,
}: Props) {
  const t = useT();
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const { points, maxElev, minElev, pathD, areaD, gridLines, kmLabels } = useMemo(() => {
    // Filter and interpolate elevation profile for the segment
    const filtered = elevationProfile
      .filter((p) => p.km >= startKm && p.km <= endKm)
      .sort((a, b) => a.km - b.km);

    // If no points in range, interpolate start and end
    if (filtered.length === 0) {
      return {
        points: [],
        maxElev: 100,
        minElev: 0,
        pathD: "",
        areaD: "",
        gridLines: [],
        kmLabels: [],
      };
    }

    // Add start/end points if missing (interpolate from nearest)
    const allProfile = [...elevationProfile].sort((a, b) => a.km - b.km);
    const interpAt = (km: number): number => {
      if (km <= allProfile[0].km) return allProfile[0].elevationM;
      if (km >= allProfile[allProfile.length - 1].km) return allProfile[allProfile.length - 1].elevationM;
      for (let i = 0; i < allProfile.length - 1; i++) {
        if (km >= allProfile[i].km && km <= allProfile[i + 1].km) {
          const r = (km - allProfile[i].km) / (allProfile[i + 1].km - allProfile[i].km);
          return allProfile[i].elevationM + r * (allProfile[i + 1].elevationM - allProfile[i].elevationM);
        }
      }
      return 0;
    };

    const pts: { km: number; elev: number }[] = [];
    if (filtered[0].km > startKm) {
      pts.push({ km: startKm, elev: interpAt(startKm) });
    }
    for (const p of filtered) {
      pts.push({ km: p.km, elev: p.elevationM });
    }
    if (filtered[filtered.length - 1].km < endKm) {
      pts.push({ km: endKm, elev: interpAt(endKm) });
    }

    const elevValues = pts.map((p) => p.elev);
    let minE = Math.min(...elevValues);
    let maxE = Math.max(...elevValues);

    // Add 10% padding
    const range = maxE - minE || 50;
    minE = Math.max(0, minE - range * 0.1);
    maxE = maxE + range * 0.15;

    // Scale functions
    const xScale = (km: number) => ((km - startKm) / (endKm - startKm)) * chartWidth;
    const yScale = (elev: number) => chartHeight - ((elev - minE) / (maxE - minE)) * chartHeight;

    // Build SVG path
    const linePoints = pts.map((p) => `${xScale(p.km)},${yScale(p.elev)}`);
    const pathDStr = `M ${linePoints.join(" L ")}`;

    // Area fill (closed path)
    const areaDStr = `${pathDStr} L ${xScale(pts[pts.length - 1].km)},${chartHeight} L ${xScale(pts[0].km)},${chartHeight} Z`;

    // Grid lines (horizontal)
    const gridCount = 4;
    const gridStep = (maxE - minE) / gridCount;
    const grids = [];
    for (let i = 0; i <= gridCount; i++) {
      const elev = minE + gridStep * i;
      grids.push({ y: yScale(elev), label: `${Math.round(elev)}m` });
    }

    // KM labels (bottom axis)
    const distKm = endKm - startKm;
    const kmStep = distKm <= 30 ? 5 : distKm <= 60 ? 10 : distKm <= 120 ? 20 : 50;
    const labels = [];
    const firstLabel = Math.ceil(startKm / kmStep) * kmStep;
    for (let km = firstLabel; km <= endKm; km += kmStep) {
      labels.push({ x: xScale(km), label: `${Math.round(km)}` });
    }

    return {
      points: pts,
      maxElev: maxE,
      minElev: minE,
      pathD: pathDStr,
      areaD: areaDStr,
      gridLines: grids,
      kmLabels: labels,
    };
  }, [elevationProfile, startKm, endKm, chartWidth, chartHeight]);

  // Current position marker
  const currentMarker = useMemo(() => {
    if (currentKm == null || currentKm < startKm || currentKm > endKm) return null;
    const allProfile = [...elevationProfile].sort((a, b) => a.km - b.km);
    const interpAt = (km: number): number => {
      if (km <= allProfile[0].km) return allProfile[0].elevationM;
      if (km >= allProfile[allProfile.length - 1].km) return allProfile[allProfile.length - 1].elevationM;
      for (let i = 0; i < allProfile.length - 1; i++) {
        if (km >= allProfile[i].km && km <= allProfile[i + 1].km) {
          const r = (km - allProfile[i].km) / (allProfile[i + 1].km - allProfile[i].km);
          return allProfile[i].elevationM + r * (allProfile[i + 1].elevationM - allProfile[i].elevationM);
        }
      }
      return 0;
    };

    const elev = interpAt(currentKm);
    const x = ((currentKm - startKm) / (endKm - startKm)) * chartWidth;
    const y = chartHeight - ((elev - minElev) / (maxElev - minElev)) * chartHeight;
    return { x, y, elev };
  }, [currentKm, startKm, endKm, chartWidth, chartHeight, maxElev, minElev, elevationProfile]);

  // Hazard zones
  const hazardZones = useMemo(() => {
    return hazards
      .filter((h) => h.type === "climb" && h.startKm < endKm && h.endKm > startKm)
      .map((h) => {
        const x1 = Math.max(0, ((Math.max(h.startKm, startKm) - startKm) / (endKm - startKm)) * chartWidth);
        const x2 = Math.min(chartWidth, ((Math.min(h.endKm, endKm) - startKm) / (endKm - startKm)) * chartWidth);
        return { x: x1, width: x2 - x1, severity: h.severity };
      });
  }, [hazards, startKm, endKm, chartWidth]);

  // Supply checkpoints markers
  const supplyMarkers = useMemo(() => {
    const supplyTypes = new Set(["seven_eleven", "family_mart", "hi_life", "ok_mart", "water", "food"]);
    return checkpoints
      .filter((c) => supplyTypes.has(c.type) && c.kmFromStart >= startKm && c.kmFromStart <= endKm)
      .slice(0, 8) // Limit to avoid clutter
      .map((c) => ({
        x: ((c.kmFromStart - startKm) / (endKm - startKm)) * chartWidth,
        name: c.name,
        type: c.type,
      }));
  }, [checkpoints, startKm, endKm, chartWidth]);

  if (points.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>{t.noElevationData}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.elevationProfile}</Text>
      <View style={styles.chartContainer}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={CyclingColors.primary} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={CyclingColors.primary} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>

          {/* Chart area group */}
          <Svg x={PADDING.left} y={PADDING.top} width={chartWidth} height={chartHeight}>
            {/* Hazard zones background */}
            {hazardZones.map((hz, i) => (
              <Rect
                key={`hz-${i}`}
                x={hz.x}
                y={0}
                width={hz.width}
                height={chartHeight}
                fill={CyclingColors.critical}
                opacity={0.08 + hz.severity * 0.03}
              />
            ))}

            {/* Grid lines */}
            {gridLines.map((g, i) => (
              <Line
                key={`grid-${i}`}
                x1={0}
                y1={g.y}
                x2={chartWidth}
                y2={g.y}
                stroke={CyclingColors.divider}
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
            ))}

            {/* Area fill */}
            <Path d={areaD} fill="url(#elevGradient)" />

            {/* Elevation line */}
            <Path
              d={pathD}
              fill="none"
              stroke={CyclingColors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Supply markers (small dots on x-axis) */}
            {supplyMarkers.map((m, i) => (
              <Circle
                key={`supply-${i}`}
                cx={m.x}
                cy={chartHeight + 2}
                r={2.5}
                fill={CyclingColors.supply[m.type as keyof typeof CyclingColors.supply] || CyclingColors.accent}
              />
            ))}

            {/* Current position marker */}
            {currentMarker && (
              <>
                <Line
                  x1={currentMarker.x}
                  y1={0}
                  x2={currentMarker.x}
                  y2={chartHeight}
                  stroke={CyclingColors.accent}
                  strokeWidth={1.5}
                  strokeDasharray="3,3"
                />
                <Circle
                  cx={currentMarker.x}
                  cy={currentMarker.y}
                  r={5}
                  fill={CyclingColors.accent}
                  stroke={CyclingColors.white}
                  strokeWidth={2}
                />
              </>
            )}
          </Svg>

          {/* Y-axis labels */}
          {gridLines.map((g, i) => (
            <SvgText
              key={`ylabel-${i}`}
              x={PADDING.left - 4}
              y={PADDING.top + g.y + 3}
              fontSize={9}
              fill={CyclingColors.textSecondary}
              textAnchor="end"
            >
              {g.label}
            </SvgText>
          ))}

          {/* X-axis labels (km) */}
          {kmLabels.map((l, i) => (
            <SvgText
              key={`xlabel-${i}`}
              x={PADDING.left + l.x}
              y={height - 6}
              fontSize={9}
              fill={CyclingColors.textSecondary}
              textAnchor="middle"
            >
              {l.label}
            </SvgText>
          ))}

          {/* Axis label */}
          <SvgText
            x={width / 2}
            y={height - 1}
            fontSize={9}
            fill={CyclingColors.textLight}
            textAnchor="middle"
          >
            km
          </SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {hazardZones.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: CyclingColors.critical, opacity: 0.3 }]} />
            <Text style={styles.legendText}>{t.steepSection}</Text>
          </View>
        )}
        {supplyMarkers.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: CyclingColors.supply.seven_eleven, borderRadius: 4 }]} />
            <Text style={styles.legendText}>{t.supply}</Text>
          </View>
        )}
        {currentMarker && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: CyclingColors.accent, borderRadius: 4 }]} />
            <Text style={styles.legendText}>{t.currentLocation}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: CyclingColors.textPrimary,
    marginBottom: 8,
  },
  chartContainer: {
    backgroundColor: CyclingColors.card,
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  noData: {
    fontSize: 14,
    color: CyclingColors.textSecondary,
    textAlign: "center",
    paddingVertical: 40,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: CyclingColors.textSecondary,
  },
});
