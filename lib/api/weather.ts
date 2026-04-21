// ============================================
// Open-Meteo Weather API クライアント
// ============================================

import { WeatherSegment, SunTimes } from '@/lib/types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'wind_speed_10m',
  'wind_direction_10m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
].join(',');

const DAILY_PARAMS = ['sunrise', 'sunset'].join(',');

type OpenMeteoHourlyResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
};

/**
 * Open-Meteo API から天気データを取得し、WeatherSegment[] と SunTimes に変換する。
 */
async function fetchOpenMeteo(
  lat: number,
  lng: number,
  forecastDays: number
): Promise<OpenMeteoHourlyResponse> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', lat.toFixed(4));
  url.searchParams.set('longitude', lng.toFixed(4));
  url.searchParams.set('hourly', HOURLY_PARAMS);
  url.searchParams.set('daily', DAILY_PARAMS);
  url.searchParams.set('timezone', 'Asia/Taipei');
  url.searchParams.set('forecast_days', String(forecastDays));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<OpenMeteoHourlyResponse>;
}

/** YYYY-MM-DD in Asia/Taipei local date (no tz conversion needed since Open-Meteo
 *  returns times in the timezone we requested). */
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days between today and target (both at local midnight). */
function daysFromToday(target: Date): number {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(target);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Open-Meteo のレスポンスを WeatherSegment[] に変換する。
 * targetDateKey が指定されたら、その日付 (YYYY-MM-DD) の hourly のみ残す。
 */
function parseHourlySegments(
  data: OpenMeteoHourlyResponse,
  lat: number,
  lng: number,
  targetDateKey?: string,
): WeatherSegment[] {
  const { hourly } = data;
  const segments: WeatherSegment[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    if (targetDateKey && !timeStr.startsWith(targetDateKey)) continue;
    const date = new Date(timeStr);
    segments.push({
      hour: date.getHours(),
      lat,
      lng,
      tempC: hourly.temperature_2m[i],
      feelsLikeC: hourly.apparent_temperature[i],
      windSpeedKmh: hourly.wind_speed_10m[i],
      windDirectionDeg: hourly.wind_direction_10m[i],
      precipitationMm: hourly.precipitation[i],
      precipitationProbability: hourly.precipitation_probability[i],
      weatherCode: hourly.weather_code[i],
    });
  }

  return segments;
}

/**
 * Open-Meteo のレスポンスから SunTimes を取得する。
 * targetDateKey が指定されたらその日付のデータを探す、なければ初日。
 */
function parseSunTimes(
  data: OpenMeteoHourlyResponse,
  targetDateKey?: string,
): SunTimes {
  let idx = 0;
  if (targetDateKey) {
    const found = data.daily.sunrise.findIndex((s) =>
      s.startsWith(targetDateKey),
    );
    if (found >= 0) idx = found;
  }
  return {
    sunrise: new Date(data.daily.sunrise[idx]),
    sunset: new Date(data.daily.sunset[idx]),
  };
}

/**
 * 指定した地点の時間別天気予報を取得する。
 *
 * @param lat          緯度
 * @param lng          経度
 * @param forecastDays 予報日数（デフォルト 2）
 */
export async function fetchWeather(
  lat: number,
  lng: number,
  forecastDays: number = 2
): Promise<{ hourly: WeatherSegment[]; sun: SunTimes }> {
  try {
    const data = await fetchOpenMeteo(lat, lng, forecastDays);
    return {
      hourly: parseHourlySegments(data, lat, lng),
      sun: parseSunTimes(data),
    };
  } catch (error) {
    console.error('[weather] fetchWeather failed:', error);
    throw error;
  }
}

export type FetchRouteWeatherOpts = {
  /** Target ride date. When set, only that day's hourly segments and sun times are returned. */
  targetDate?: Date;
  /** Override the number of forecast days requested. Auto-derived from targetDate when omitted. */
  forecastDays?: number;
};

/**
 * ルート上の複数地点の天気を取得し、統合する。
 *
 * Open-Meteo は 1 リクエスト 1 地点なので、代表的な地点（始点・中間・終点など）
 * をサンプリングして取得し、各時間帯ごとに最も近い地点のデータを割り当てる。
 */
export async function fetchRouteWeather(
  points: { lat: number; lng: number }[],
  opts: FetchRouteWeatherOpts = {},
): Promise<{ segments: WeatherSegment[]; sun: SunTimes }> {
  if (points.length === 0) {
    throw new Error('[weather] fetchRouteWeather: points array is empty');
  }

  const targetDateKey = opts.targetDate ? dateKey(opts.targetDate) : undefined;
  // If a target date is N days ahead, request N+2 days to ensure coverage.
  const offset = opts.targetDate ? Math.max(0, daysFromToday(opts.targetDate)) : 0;
  const forecastDays = opts.forecastDays ?? Math.max(2, offset + 2);

  // 少数の代表点をサンプリングしてAPIコールを抑える
  // 最大5地点: 始点、1/4、中間、3/4、終点
  const sampleIndices = selectSampleIndices(points.length, 5);
  const samplePoints = sampleIndices.map((i) => points[i]);

  try {
    // 全サンプル地点を並列で取得
    const results = await Promise.all(
      samplePoints.map((p) => fetchOpenMeteo(p.lat, p.lng, forecastDays))
    );

    // SunTimes: 対象日のデータを使う（なければ初日）
    const sun = parseSunTimes(results[0], targetDateKey);

    // 各サンプル地点の hourly データを WeatherSegment に変換
    const allSegments: WeatherSegment[] = [];
    for (let i = 0; i < results.length; i++) {
      const segments = parseHourlySegments(
        results[i],
        samplePoints[i].lat,
        samplePoints[i].lng,
        targetDateKey,
      );
      allSegments.push(...segments);
    }

    // 時間でソートし、同じ時間のデータは代表1つにまとめる
    // （ルート全体の天気概要として、各時間帯で最も降水確率が高いものを採用）
    const byHour = new Map<number, WeatherSegment[]>();
    for (const seg of allSegments) {
      const existing = byHour.get(seg.hour) ?? [];
      existing.push(seg);
      byHour.set(seg.hour, existing);
    }

    const mergedSegments: WeatherSegment[] = [];
    for (const [, segs] of byHour) {
      // 最も悪い天気（降水確率が最も高い）を代表値として採用
      const worst = segs.reduce((a, b) =>
        b.precipitationProbability > a.precipitationProbability ? b : a
      );
      mergedSegments.push(worst);
    }

    // 時間順にソート
    mergedSegments.sort((a, b) => a.hour - b.hour);

    return { segments: mergedSegments, sun };
  } catch (error) {
    console.error('[weather] fetchRouteWeather failed:', error);
    throw error;
  }
}

/**
 * 均等にサンプルするインデックスを選択する。
 */
function selectSampleIndices(total: number, maxSamples: number): number[] {
  if (total <= maxSamples) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const indices: number[] = [];
  for (let i = 0; i < maxSamples; i++) {
    const index = Math.round((i / (maxSamples - 1)) * (total - 1));
    indices.push(index);
  }

  // 重複を除去
  return [...new Set(indices)];
}
