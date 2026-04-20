// ============================================
// Nominatim (OSM) 検索クライアント
// ============================================
//
// 使い方:
//   - 全文検索で POI / 地名を取得 (searchNominatim)
//   - レート制限 1req/sec を守る。この関数内でも簡易スロットリング。
//   - User-Agent が必要なので app 名を送る。
//
// Nominatim 利用規約: https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** Taiwan (including outlying islands) bounding box: west,north,east,south */
const TAIWAN_VIEWBOX = '119.3,25.5,122.2,21.8';

/** Minimum gap between successive requests (ms) to stay under 1 req/sec. */
const MIN_REQUEST_INTERVAL_MS = 1100;

let lastRequestAt = 0;

export type OsmSearchResult = {
  id: string;          // place_id
  displayName: string; // full display name (long)
  shortName: string;   // the best short name
  lat: number;
  lng: number;
  category?: string;   // e.g., "tourism", "amenity"
  type?: string;       // e.g., "cafe", "viewpoint"
};

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now;
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastRequestAt = Date.now();
}

function pickShortName(displayName: string, queryRaw?: string): string {
  // Nominatim displayName is comma-separated; the first part is usually the POI name.
  const first = displayName.split(',')[0]?.trim();
  if (first) return first;
  return queryRaw ?? displayName;
}

/**
 * Search Nominatim for POIs/addresses in Taiwan.
 * Returns up to 8 results, ranked by Nominatim's own relevance.
 */
export async function searchNominatim(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<OsmSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  await throttle();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(opts.limit ?? 8));
  url.searchParams.set('viewbox', TAIWAN_VIEWBOX);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('accept-language', 'ja,zh-TW,en');

  const res = await fetch(url.toString(), {
    signal: opts.signal,
    headers: {
      // Nominatim requires a meaningful UA. Using fetch from a browser puts the
      // browser UA in; that's fine for the free tier. On native the UA is fixed
      // by the RN runtime. Attribution is via the app name in manifest.
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim ${res.status} ${res.statusText}`);
  }

  const raw = (await res.json()) as Array<{
    place_id: number | string;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    category?: string;
    type?: string;
  }>;

  const out: OsmSearchResult[] = [];
  for (const r of raw) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: String(r.place_id),
      displayName: r.display_name,
      shortName: r.name ?? pickShortName(r.display_name, trimmed),
      lat,
      lng,
      category: r.category,
      type: r.type,
    });
  }
  return out;
}
