/**
 * Stations API contract types. Mirror the JSON served by the Go backend
 * (internal/model/stations.go). Part of the shared types/ contract layer so the
 * fetch layer (lib/api) and shared components (station-detail) can reference
 * them without reaching into features/. The stations feature re-exports these
 * from features/stations/types.
 */
import type { FilterTab, StationOpStatus } from "@/types/shared";

export type { FilterTab, StationOpStatus };

export interface StationRow {
  id: string;
  name: string;
  nameAr: string;
  region: string;
  /** Owning municipality (city) — drives the per-city emergency contacts editor. */
  municipalityId: string;
  status: StationOpStatus;
  /** Latest or status-driving metric, e.g. "Rainfall 28 mm/hr". */
  reading: string;
  /** Signal strength 0–4. */
  signal: number;
  /** Battery charge 0–100, or null when unknown/offline. */
  battery: number | null;
  lastReading: string;
}

export interface StationRegionGroup {
  region: string;
  online: number;
  total: number;
  rows: StationRow[];
}

export interface StationsPage {
  total: number;
  regionCount: number;
  needAttention: number;
  filters: FilterTab[];
  groups: StationRegionGroup[];
}

/** Full station detail for the edit form (mirrors the backend station row). */
export interface StationDetailData {
  id: string;
  municipalityId: string;
  name: string;
  nameAr: string;
  stationType: string;
  latitude: number;
  longitude: number;
  elevation: number;
  wuStationId: string | null;
  /** Backend sensor param keys, e.g. "temp_high_c", "rain_rate_mm". */
  sensors: string[];
  reportIntervalMinutes: number | null;
  operationalStatus: "active" | "maintenance" | "deactivated";
  isActive: boolean;
}

/** Body sent to POST/PUT /api/stations. All fields optional-on-PUT (partial). */
export interface StationWriteInput {
  municipality_id?: string;
  name?: string;
  name_ar?: string;
  station_type?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  wu_station_id?: string | null;
  sensors?: string[];
  report_interval_minutes?: number | null;
  operational_status?: "active" | "maintenance" | "deactivated";
  is_active?: boolean;
}
