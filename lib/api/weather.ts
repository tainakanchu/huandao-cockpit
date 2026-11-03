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

/** Fetch the destination forecast for the target ride date. */
export async function fetchRouteWeather(
  destination: { lat: number; lng: number },
  opts: FetchRouteWeatherOpts = {},
): Promise<{ segments: WeatherSegment[]; sun: SunTimes }> {
  const targetDateKey = opts.targetDate ? dateKey(opts.targetDate) : undefined;
  // If a target date is N days ahead, request N+2 days to ensure coverage.
  const offset = opts.targetDate ? Math.max(0, daysFromToday(opts.targetDate)) : 0;
  const forecastDays = opts.forecastDays ?? Math.max(2, offset + 2);

  try {
    const { lat, lng } = destination;
    const data = await fetchOpenMeteo(lat, lng, forecastDays);
    return {
      segments: parseHourlySegments(data, lat, lng, targetDateKey),
      sun: parseSunTimes(data, targetDateKey),
    };
  } catch (error) {
    console.error('[weather] fetchRouteWeather failed:', error);
    throw error;
  }
}
