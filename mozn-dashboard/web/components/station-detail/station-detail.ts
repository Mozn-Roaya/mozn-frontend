/**
 * Normalised station-detail model that backs the station summary card (Figma
 * "Station Summary"). Both the overview map (MapStation) and the stations
 * table (StationRow) build one of these, so the card itself stays a pure
 * renderer.
 *
 * There is no live weather/telemetry source yet, so every detail below only
 * carries identity/location/availability fields — the weather fields stay
 * `undefined` and the card renders its empty state in their place.
 */

import type { MapStation } from "@/types/dashboard";
import type { StationRow } from "@/types/stations";
import type { ForecastDay, StationAlert, StationMetric } from "./station-weather";

export type { ForecastDay, StationMetric, WeatherCondition } from "./station-weather";

export type StationAvailability = "live" | "offline" | "maintenance";

export interface StationDetail {
  /** English name (translated via the data dictionary at render). */
  name: string;
  /** Pre-translated Arabic name when the source has one (table rows). */
  nameAr?: string;
  code: string;
  /** Region key, resolved with `region.*`. */
  region: string;
  /** City the station sits in — resolves its per-city emergency numbers. */
  city?: string;
  availability: StationAvailability;
  /** Relative timestamp shown in offline/maintenance states. */
  updated: string;
  // Live-only weather payload — absent until a real weather source exists:
  temp?: number;
  feelsLike?: number;
  high?: number;
  low?: number;
  alert?: StationAlert;
  rainfall?: StationMetric;
  wind?: StationMetric & { direction: string };
  humidity?: StationMetric;
  pressure?: StationMetric;
  forecast?: ForecastDay[];
}

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Stable display id derived from the station's real id, e.g. "#0002". */
function code(id: string): string {
  return `#${String((hash(id) % 8999) + 1000)}`;
}

/** Build a detail from an overview map station. */
export function detailFromMapStation(s: MapStation): StationDetail {
  return {
    name: s.name,
    code: code(s.id),
    region: s.region,
    city: s.name.split(/\s+/)[0],
    availability: s.status === "offline" ? "offline" : "live",
    updated: s.updated,
  };
}

/** Build a detail from a stations-table row. */
export function detailFromStationRow(r: StationRow): StationDetail {
  const availability: StationAvailability =
    r.status === "offline" ? "offline" : r.status === "maintenance" ? "maintenance" : "live";

  return {
    name: r.name,
    nameAr: r.nameAr,
    code: code(r.id),
    region: r.region,
    city: r.name.split(/\s+/)[0],
    availability,
    updated: r.lastReading,
  };
}
