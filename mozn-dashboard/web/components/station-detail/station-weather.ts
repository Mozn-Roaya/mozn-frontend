/**
 * Weather/forecast/alert type definitions backing the station summary card
 * (Figma node 1020:2 "Station Summary"). There is no live weather data
 * source yet — `station-detail.ts` builds each `StationDetail` with these
 * fields absent, and `station-summary-card.tsx` renders an empty state in
 * their place until a real source is wired up.
 *
 * Free-text strings (metric notes, alert copy) are localised at render time
 * via the data-value translator (`td`); see lib/i18n/data.ts.
 */

import type { LocalizedStep } from "@/types/shared";

export type WeatherCondition = "sunny" | "cloudy" | "rain" | "storms";

export interface ForecastDay {
  /** i18n day key — see dashboard.station.day.* */
  key: "today" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
  condition: WeatherCondition;
  low: number;
  high: number;
}

export interface StationMetric {
  value: string;
  unit: string;
  note: string;
}

/** Shared alert payload. `actions` (if present) are the step-by-step response
 * guidance revealed when the alert card is expanded; English here, localised at
 * render via the data dictionary. */
export interface StationAlert {
  title: string;
  description: string;
  actions?: string[];
  /** Alert Template event key (e.g. "flashFlood") — lets the card pull the
   * admin-authored response steps from the live config store. */
  eventKey?: string;
  /** Per-station response steps that override the event template's steps for
   * this station only. When present (non-empty) it wins over the template
   * store and the alert's own `actions`. Authored in both languages. */
  stepsOverride?: LocalizedStep[];
}
