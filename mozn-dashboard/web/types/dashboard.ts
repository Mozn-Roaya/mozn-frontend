/**
 * Dashboard API contract types. Mirror the JSON served by the Go backend
 * (internal/model/dashboard.go). Part of the shared types/ contract layer so
 * the fetch layer (lib/api) and shared components (maps, station-detail) can
 * reference them without reaching into features/. The dashboard feature
 * re-exports these from features/dashboard/types.
 */
import type { ActivityCategory } from "@/types/shared";

export type StatTone =
  | "online"
  | "offline"
  | "maintenance"
  | "anomaly"
  | "alert";

export interface StatCard {
  id: string;
  label: string;
  value: number;
  /** Optional denominator, e.g. 142 / 153. */
  total?: number;
  tone: StatTone;
}

export type StationStatus = "online" | "warning" | "offline";

/**
 * Weather-alert tier used to colour a map pin. Mirrors the public app's
 * severity vocabulary so the two maps read identically. A higher-severity
 * active/forecast alert outranks the station's own health status. Distinct from
 * the history `AlertSeverity` (critical/warning/watch/advisory) in types/shared.
 */
export type MapAlertSeverity = "yellow" | "orange" | "red";

/** Per-severity tally of a station's active alerts (public API `active_alerts`). */
export interface AlertCounts {
  total: number;
  yellow: number;
  orange: number;
  red: number;
}

/** Pending, forecast-driven alert for a station (public API `forecast_alerts`). */
export interface ForecastAlert {
  alertId?: string;
  severity?: MapAlertSeverity;
  parameter?: string;
  startsAt?: string;
  expiresAt?: string;
  leadTime?: string;
}

export interface MapStation {
  id: string;
  name: string;
  status: StationStatus;
  /** Real WGS84 coordinates, plotted directly on the Leaflet basemap. */
  latitude: number;
  longitude: number;
  region: string;
  /** Latest status-driving metric, e.g. "Rainfall 2 mm/hr". Empty if offline. */
  reading: string;
  /** Relative timestamp, e.g. "2 min ago". */
  updated: string;
  /**
   * Alert data driving the pin's severity colour (matches the public map).
   * Optional: absent when a station has no alerts, so the pin falls back to its
   * health-status colour.
   */
  activeAlerts?: AlertCounts;
  forecastAlerts?: ForecastAlert[];
}

export interface StationHealthMap {
  title: string;
  subtitle: string;
  coverageNote: string;
  stations: MapStation[];
}

export type AttentionSeverity = "warning" | "advisory" | "offline";

export interface AttentionItem {
  id: string;
  title: string;
  meta: string;
  elapsed: string;
  severity: AttentionSeverity;
}

export interface NeedsAttention {
  openCount: number;
  items: AttentionItem[];
}

// Recent-activity rows mirror the Activity Log row shape so the dashboard panel
// can render the same columns (actor · action · category · source · date/time).
export interface ActivityItem {
  id: string;
  actor: string;
  initials: string;
  action: string;
  category: ActivityCategory;
  source: string;
  date: string;
  time: string;
}

export interface RegionStat {
  id: string;
  name: string;
  online: number;
  total: number;
}

export interface DashboardHeader {
  title: string;
  statusLabel: string;
  live: boolean;
}

export interface DashboardOverview {
  header: DashboardHeader;
  stats: StatCard[];
  map: StationHealthMap;
  needsAttention: NeedsAttention;
  recentActivity: ActivityItem[];
  regions: RegionStat[];
}
