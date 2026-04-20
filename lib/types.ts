// ============================================
// 環島コックピット - 型定義
// ============================================

// 2.1 ルートデータ
export type ElevationPoint = {
  km: number;
  elevationM: number;
};

export type Route = {
  id: string;
  name: string;
  geometry: GeoJSONLineString;
  totalDistanceKm: number;
  elevationProfile: ElevationPoint[];
};

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: [number, number][]; // [lng, lat]
};

// 2.2 ゴール候補
export type GoalCandidate = {
  id: string;
  name: string;
  nameZh: string;
  kmFromStart: number;
  lat: number;
  lng: number;
  tier: "major" | "mid" | "minor";
  hasAccommodation: boolean;
  hasConvenienceStore: boolean;
  hasStation: boolean;
  note?: string;
};

// 2.3 チェックポイント
export type CheckpointType =
  | "seven_eleven"
  | "family_mart"
  | "hi_life"
  | "ok_mart"
  | "water"
  | "food"
  | "station"
  | "bike_shop"
  | "police"
  | "viewpoint";

export type Checkpoint = {
  id: string;
  type: CheckpointType;
  name: string;
  nameZh?: string;
  lat: number;
  lng: number;
  kmFromStart: number;
  reliability: "high" | "medium" | "low";
  note?: string;
};

// 2.4 ハザード
export type HazardType =
  | "climb"
  | "traffic"
  | "low_supply"
  | "wind_exposure"
  | "heat"
  | "rail_transfer"
  | "tunnel"
  | "night_risk";

export type Hazard = {
  id: string;
  type: HazardType;
  startKm: number;
  endKm: number;
  severity: 1 | 2 | 3 | 4 | 5;
  message: string;
  messageZh?: string;
};

// 2.5 動的ステージ
export type DayPlan = {
  dayNumber: number;
  startKm: number;
  endKm: number;
  distanceKm: number;
  elevationGainM: number;
  checkpoints: Checkpoint[];
  hazards: Hazard[];
  advisoryCards: AdvisoryCard[];
  supplyPlan: SupplyPoint[];
  weather?: WeatherSegment[];
};

// 2.6 走行状態
export type WaterLevel = "full" | "half" | "low";
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type FatigueLevel = 1 | 2 | 3 | 4 | 5;

export type RideStatus = {
  currentLat: number;
  currentLng: number;
  currentKm: number;
  startedAt: Date;
  elapsedMinutes: number;
  waterLevel: WaterLevel;
  energyLevel: EnergyLevel;
  fatigue: FatigueLevel;
  notes: string[];
};

// 2.7 天気
export type WeatherSegment = {
  hour: number;
  lat: number;
  lng: number;
  tempC: number;
  feelsLikeC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationMm: number;
  precipitationProbability: number;
  weatherCode: number;
};

// 2.8 判断カード
export type AdvisoryType =
  | "wind"
  | "supply"
  | "climb"
  | "heat"
  | "rain"
  | "time"
  | "danger";

export type AdvisorySeverity = "info" | "warning" | "critical";

export type AdvisoryCard = {
  id: string;
  priority: number;
  type: AdvisoryType;
  title: string;
  body: string;
  severity: AdvisorySeverity;
};

// 2.9 補給プラン
export type SupplyRecommendation = "light" | "water" | "meal" | "final";

export type SupplyPoint = {
  checkpoint: Checkpoint;
  kmFromDayStart: number;
  recommended: SupplyRecommendation;
  reason: string;
  localFood?: string;
};

// 2.9.5 経由地 / Via Point
// BIWAICHI Cycling Navi 風の「ベースルート + 任意の経由地」パターン。
// ルートは線形 (km 0 → 946) なので、経由地は kmFromStart 順にソートされる。
export type WaypointCategory =
  | 'sightseeing'   // 観光スポット・景勝地
  | 'food'          // 飲食・名物
  | 'rest'          // 休憩・カフェ
  | 'accommodation' // 宿泊可能
  | 'custom';       // ユーザー自由入力

export type WaypointSourceType = 'goal' | 'checkpoint' | 'custom';

export type Waypoint = {
  id: string;
  name: string;
  nameZh?: string;
  lat: number;
  lng: number;
  kmFromStart: number;
  category: WaypointCategory;
  sourceType: WaypointSourceType;
  sourceId?: string;  // 元となった Goal / Checkpoint の id
  note?: string;
};

// 2.10 自行車友善旅宿
export type BikeHotel = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kmFromStart: number;
  address: string;
  phone: string;
  hotelClass: string;
};

// 難易度
export type DifficultyLevel = "Easy" | "Moderate" | "Hard" | "Critical";

// 日の出・日没
export type SunTimes = {
  sunrise: Date;
  sunset: Date;
};

// リスクレベル（リスクサマリーバー用）
export type RiskLevel = "low" | "medium" | "high";

export type RiskSummary = {
  climb: RiskLevel;
  wind: RiskLevel;
  heat: RiskLevel;
  rain: RiskLevel;
  supply: RiskLevel;
  traffic: RiskLevel;
  sunset: RiskLevel;
};
