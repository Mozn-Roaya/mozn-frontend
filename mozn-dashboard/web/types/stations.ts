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
