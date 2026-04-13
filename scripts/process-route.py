#!/usr/bin/env python3
"""
OSM Overpass GeoJSON (relation 5692631) を
1本の連続 LineString に結合し、松山駅起点 / 反時計回り に整形する。

Usage:
  python3 scripts/process-route.py
"""
import json, math, sys, os

INPUT  = os.path.join(os.path.dirname(__file__), '../../geo/export.geojson')
OUTPUT = os.path.join(os.path.dirname(__file__), '../assets/data/route.geojson')

def haversine(lon1, lat1, lon2, lat2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def line_length_km(coords):
    total = 0
    for i in range(len(coords)-1):
        total += haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    return total

def simplify_rdp(coords, epsilon_km=0.05):
    """Ramer-Douglas-Peucker simplification"""
    if len(coords) <= 2:
        return coords

    # Find furthest point from line between first and last
    start, end = coords[0], coords[-1]
    max_dist = 0
    max_idx = 0
    for i in range(1, len(coords)-1):
        # Approximate cross-track distance
        d = point_line_distance(coords[i], start, end)
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > epsilon_km:
        left = simplify_rdp(coords[:max_idx+1], epsilon_km)
        right = simplify_rdp(coords[max_idx:], epsilon_km)
        return left[:-1] + right
    else:
        return [coords[0], coords[-1]]

def point_line_distance(point, start, end):
    """Approximate distance from point to line segment in km"""
    px, py = point[0], point[1]
    sx, sy = start[0], start[1]
    ex, ey = end[0], end[1]

    dx, dy = ex - sx, ey - sy
    if dx == 0 and dy == 0:
        return haversine(px, py, sx, sy)

    t = max(0, min(1, ((px-sx)*dx + (py-sy)*dy) / (dx*dx + dy*dy)))
    proj_x = sx + t * dx
    proj_y = sy + t * dy
    return haversine(px, py, proj_x, proj_y)

# ---- Main ----

print("Loading GeoJSON...")
with open(INPUT) as f:
    data = json.load(f)

# Extract MultiLineString route
route_feature = None
for feat in data['features']:
    if feat['geometry']['type'] == 'MultiLineString':
        route_feature = feat
        break

if not route_feature:
    print("ERROR: No MultiLineString found")
    sys.exit(1)

segs = route_feature['geometry']['coordinates']
print(f"Found {len(segs)} segments, {sum(len(s) for s in segs)} total points")

# Stitch order determined by endpoint proximity analysis:
# Seg 9 → 7 → 6 → 5 → 4 → 3(rev) → 2(rev) → 1 → 0 → 8(rev)
stitch_order = [
    (9, False),  # near Songshan, tiny connector
    (7, False),  # Taipei → west coast south to 嘉義
    (6, False),  # 嘉義 → 台南/高雄
    (5, False),  # 高雄 → 南端 (恆春)
    (4, False),  # 南端 connector
    (3, True),   # 南端 → 台東 (reversed)
    (2, True),   # 台東 → 花蓮 (reversed)
    (1, False),  # 花蓮 connector
    (0, False),  # 花蓮 → 宜蘭
    (8, True),   # 宜蘭 → 回台北 (reversed)
]

# Build single coordinate list
merged = []
for seg_idx, reverse in stitch_order:
    coords = segs[seg_idx]
    if reverse:
        coords = list(reversed(coords))
    # Skip first point if it's too close to last merged point (avoid duplicates)
    if merged:
        d = haversine(merged[-1][0], merged[-1][1], coords[0][0], coords[0][1])
        if d < 0.05:  # < 50m → skip duplicate
            coords = coords[1:]
    merged.extend(coords)

total_km = line_length_km(merged)
print(f"Merged route: {len(merged)} points, {total_km:.1f} km")

# Simplify to reduce size (keep ~0.05km accuracy)
simplified = simplify_rdp(merged, epsilon_km=0.03)
simplified_km = line_length_km(simplified)
print(f"Simplified: {len(simplified)} points, {simplified_km:.1f} km")

# Compute cumulative distances for each point
cumulative = [0.0]
for i in range(1, len(simplified)):
    d = haversine(simplified[i-1][0], simplified[i-1][1],
                  simplified[i][0], simplified[i][1])
    cumulative.append(cumulative[-1] + d)

# Build output GeoJSON
output = {
    "type": "Feature",
    "properties": {
        "id": "huandao-no1-ccw",
        "name": "環島1號線 (逆時針)",
        "name_en": "Cycling Route No. 1 (Counterclockwise)",
        "totalDistanceKm": round(simplified_km, 1),
        "pointCount": len(simplified)
    },
    "geometry": {
        "type": "LineString",
        "coordinates": [[round(c[0], 6), round(c[1], 6)] for c in simplified]
    }
}

# Also build cumulative distance array (for km lookup)
output["properties"]["cumulativeKm"] = [round(d, 3) for d in cumulative]

# Write output
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w') as f:
    json.dump(output, f)

file_size = os.path.getsize(OUTPUT)
print(f"Output: {OUTPUT}")
print(f"File size: {file_size / 1024:.0f} KB")
print(f"First point: {simplified[0]} (should be near Songshan)")
print(f"Last point: {simplified[-1]} (should be near Songshan)")
print(f"Total distance: {simplified_km:.1f} km")
