// Mozn Weather API — response shapes (derived from live probes).

export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  metadata?: PaginationMeta;
  code?: string;
  error?: string;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type StationStatus = "normal" | "warning" | "offline";

export type AlertCounts = {
  total: number;
  yellow: number;
  orange: number;
  red: number;
};

export type ForecastAlert = {
  alert_id?: string;
  severity?: "yellow" | "orange" | "red";
  parameter?: string;
  starts_at?: string;
  expires_at?: string;
  lead_time?: string;
};

export type Station = {
  id: string;
  municipality_id: string;
  wu_station_id: string;
  name: string;
  name_ar: string;
  station_type: string;
  latitude: number;
  longitude: number;
  elevation: number;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: StationStatus;
  active_alerts?: AlertCounts;
  forecast_alerts?: ForecastAlert[];
};

export type Reading = {
  time: string;
  station_id: string;
  temp_c: number;
  dewpoint_c: number;
  windchill_c: number;
  heatindex_c: number;
  humidity: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  /** 0–360 degrees */
  wind_dir: number;
  rain_rate_mm: number;
  rain_daily_mm: number;
  solar_radiation: number;
  uv_index: number;
};

export type ReadingHistoryBucket = {
  bucket_start: string;
  temp_c_avg: number;
  temp_c_min: number;
  temp_c_max: number;
  humidity_avg: number;
  wind_speed_max_kmh: number;
  wind_gust_max_kmh: number;
  rain_rate_max_mm: number;
  rain_total_mm: number;
  pressure_hpa_avg: number;
  uv_index_max: number;
  sample_count: number;
};

export type DailyForecast = {
  day: string;
  temp_high_c: number;
  temp_low_c: number;
  humidity_avg: number;
  wind_speed_max_kmh: number;
  wind_gust_max_kmh: number;
  rain_total_mm: number;
  uv_index_max: number;
};

export type Alert = {
  id: string;
  severity: "yellow" | "orange" | "red";
  source?: "observed" | "forecast";
  level?: string;
  parameter?: string;
  value?: number;
  message?: string;
  message_ar?: string;
  station_id?: string;
  region_id?: string;
  is_active?: boolean;
  status?: string;
  urgency?: string;
  starts_at?: string;
  expires_at?: string;
  issued_at?: string;
  lead_time?: string;
  /**
   * Snapshot of admin-managed guidance steps resolved from the
   * `alert_templates` table at issue time. May be empty if the backend
   * had no template for the (event_type, severity) pair when the alert
   * was minted — caller should fall back to a generic message.
   */
  guidance_steps_en?: string[];
  guidance_steps_ar?: string[];
};
