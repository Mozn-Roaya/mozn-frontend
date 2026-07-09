/**
 * Raw JSON shapes returned by the REAL Go backend (mozn-backend, this repo's
 * server), as opposed to the presentation-shaped page DTOs in `types/*`. The
 * adapters in `lib/api.ts` map these into the page DTOs the screens consume.
 *
 * These mirror the Go structs in models/*, controllers, and services — every
 * protected list endpoint returns a `BackendEnvelope<T[]>` with pagination in
 * `metadata`; single-resource and aggregate endpoints put the object in `data`.
 */

/** Every backend response is wrapped in this envelope (utils.Response). */
export interface BackendEnvelope<T> {
  code?: string;
  data: T;
  message?: string;
  error?: string;
  metadata?: BackendPaginationMeta;
}

export interface BackendPaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** GET /api/me (services.CurrentUser). Drives auth + RBAC. */
export interface BackendCurrentUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  phone?: string;
  organization?: string;
  role: string; // backend role name: admin | operator | gov_editor | gov_viewer | viewer
  permissions: string[];
  regions: string[]; // region UUIDs
  is_region_scoped: boolean;
}

/** POST /api/auth/login → data: { user, token } (services.LoginResult). */
export interface BackendLoginResult {
  user: BackendUser;
  token: string;
}

export interface BackendPermission {
  id: string;
  name: string;
}

export interface BackendRole {
  id: string;
  name: string;
  rank?: number;
  /** Present on GET /api/roles (Preload("Permissions")). */
  permissions?: BackendPermission[];
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  role_id: string;
  phone?: string | null;
  organization?: string | null;
  role?: BackendRole;
  regions?: BackendRegion[];
  last_active_at?: string | null;
  created_at?: string;
}

export interface BackendRegion {
  id: string;
  name: string;
  name_ar: string;
}

export interface BackendMunicipality {
  id: string;
  region_id: string;
  name: string;
  name_ar: string;
  /** Per-city emergency phone numbers (free-text; "" = unset). */
  emergency_services_phone?: string;
  civil_defense_phone?: string;
}

export interface BackendStation {
  id: string;
  municipality_id: string;
  wu_station_id?: string;
  name: string;
  name_ar: string;
  station_type: string;
  latitude: number;
  longitude: number;
  elevation: number;
  is_active: boolean;
  last_seen_at?: string | null;
  status: "normal" | "anomaly";
  operational_status: "active" | "maintenance" | "deactivated";
  sensors: string[];
  data_status: "full" | "partial" | "empty";
  silent_sensors: string[];
  report_interval_minutes?: number | null;
}

export interface BackendAlert {
  id: string;
  region_id?: string;
  station_id?: string;
  level: "national" | "regional" | "city";
  severity: "yellow" | "orange" | "red";
  parameter: string;
  value: number;
  message: string;
  message_ar: string;
  guidance_steps_en: string[];
  guidance_steps_ar: string[];
  is_active: boolean;
  source: "observed" | "forecast" | "compound" | "manual";
  status: "pending" | "confirmed" | "rejected" | "dismissed" | "resolved";
  confirmed_by?: string;
  confirmed_at?: string | null;
  acknowledged_by?: string;
  acknowledged_at?: string | null;
  issued_at: string;
  starts_at?: string | null;
  expires_at?: string | null;
  lead_time?: string | null;
  resolved_at?: string | null;
  resolution_reason?: string | null;
  confirm_note?: string | null;
  escalated_at?: string | null;
  urgency: "routine" | "urgent" | "critical";
  operator_modified?: boolean;
}

export interface BackendThreshold {
  id: string;
  region_id: string;
  parameter: string;
  severity: "yellow" | "orange" | "red";
  applies_to: "observed" | "forecast" | "both";
  value: number;
  is_active: boolean;
  sustain_duration_minutes?: number | null;
  clear_value?: number | null;
  set_by: string;
  created_at: string;
  updated_at: string;
}

/** POST /api/thresholds/preview result (services.PreviewThresholdResult). */
export interface BackendPreviewResult {
  lookback_hours: number;
  evaluated_stations: number;
  affected_station_count: number;
  would_fire_count: number;
  reading_count: number;
  stations: {
    station_id: string;
    station_name: string;
    peak: number;
    breach_readings: number;
    would_fire: boolean;
  }[];
}

export interface BackendThresholdHistory {
  id: string;
  threshold_id: string;
  region_id: string;
  parameter: string;
  severity: "yellow" | "orange" | "red";
  action: "created" | "updated" | "deleted" | "reverted";
  value: number;
  sustain_duration_minutes?: number | null;
  is_active: boolean;
  applies_to: string;
  previous_value?: number | null;
  changed_by: string;
  created_at: string;
}

export interface BackendAuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  status: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  duration_ms: number;
  created_at: string;
}

export interface BackendSystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface BackendAlertTemplate {
  id: string;
  event_type: string;
  severity: "yellow" | "orange" | "red";
  message_en_day: string;
  message_en_night: string;
  message_ar_day: string;
  message_ar_night: string;
  guidance_steps_en: string[];
  guidance_steps_ar: string[];
}

export interface BackendValidationRule {
  id: string;
  parameter: string;
  region_id?: string | null;
  valid_range_min?: number | null;
  valid_range_max?: number | null;
  max_rate_of_change?: number | null;
  rate_interval_min?: number | null;
}

/** GET /api/dashboard/stats (services.DashboardStats). */
export interface BackendDashboardStats {
  total_stations: number;
  active_stations: number;
  offline_stations: number;
  total_alerts: number;
  active_alerts: number;
  total_regions: number;
  total_users: number;
  readings_today: number;
  data_quality: number | null;
  alerts_by_severity: { severity: string; count: number }[];
  needs_attention: {
    offline_stations: number;
    degraded_stations: number;
    anomaly_stations: number;
    unacknowledged_alerts: number;
  };
  recent_alerts: BackendAlert[];
  station_health: BackendStationHealth[];
}

/** GET /api/readings row (models.WeatherReading). Every measurement is optional
 * (nil column ⇒ field absent), so treat missing as "unknown", not zero. */
export interface BackendReading {
  time: string;
  station_id: string;
  temp_c?: number;
  heatindex_c?: number;
  windchill_c?: number;
  dewpoint_c?: number;
  humidity?: number;
  pressure_hpa?: number;
  wind_speed_kmh?: number;
  wind_gust_kmh?: number;
  wind_dir?: number;
  rain_rate_mm?: number;
  rain_daily_mm?: number;
  battery_ok?: boolean;
  is_valid?: boolean;
}

/** GET /api/gov/dashboard (services.GovDashboardStats) — the region-scoped,
 * reduced dashboard payload for gov users (no station_health / needs_attention). */
export interface BackendGovDashboardStats {
  regions: number;
  total_stations: number;
  active_stations: number;
  offline_stations: number;
  active_alerts: number;
  readings_today: number;
  data_quality: number | null;
  recent_alerts: BackendAlert[];
}

export interface BackendStationHealth {
  id: string;
  name: string;
  is_active: boolean;
  last_seen_at?: string | null;
  status: string;
  data_status: string;
  silent_sensors: string[];
  latitude: number;
  longitude: number;
}
