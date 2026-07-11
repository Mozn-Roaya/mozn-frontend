import { getDict, type Lang } from "@/components/lib/i18n";

import type { Station, StationStatus } from "@/components/api/types";

/** Raw alert severity returned by the API (`Alert.severity`). */
export type ApiSeverity = "yellow" | "orange" | "red";

/**
 * What a pin actually shows. Severities outrank station status because a
 * red-alerting station that's also "warning" should read as red, not amber —
 * the alert is the more urgent signal. Offline still shows when there's no
 * active alert; a silent station is itself meaningful.
 */
export type PinKind = ApiSeverity | StationStatus;

/**
 * Status → color. Operational state of the station itself.
 */
// Keyed by string (not StationStatus) because the backend Status enum also emits
// values the FE type omits — chiefly 'maintenance' — which reach a pin when the
// station has no active/forecast alert. Without an entry the pin colour was
// undefined; give it a defined, muted colour.
export const STATUS_COLOR: Readonly<Record<string, string>> = {
  normal: "var(--color-status-normal-500)",
  warning: "var(--color-status-warning-500)",
  offline: "var(--color-status-offline-400)",
  maintenance: "var(--color-status-offline-400)",
};

/**
 * Alert severity → color. Matches the API's literal naming
 * (yellow/orange/red) so the map reads like a weather warning at a glance.
 */
export const SEVERITY_COLOR: Readonly<Record<ApiSeverity, string>> = {
  yellow: "var(--color-severity-yellow-500)",
  orange: "var(--color-severity-orange-500)",
  red: "var(--color-severity-red-500)",
};

/** Halo opacity for both the React pin and the Leaflet divIcon halo. */
export const PIN_HALO_OPACITY = 0.2;

/**
 * Resolve what a station's pin should communicate. Priority:
 *   red > orange > yellow > offline > normal
 * Alerts beat operational status because a severe alert on a station that
 * happens to also be flagged "warning" should still read as severe.
 *
 * Both `active_alerts` (observed) and `forecast_alerts` count — the station
 * panel already falls back to forecast severity when no observed alert is
 * active, and the map pin must agree with what the panel shows.
 */
export function pinKindFor(station: Station): PinKind {
  const counts = station.active_alerts;
  const forecasts = station.forecast_alerts ?? [];
  const hasForecast = (sev: ApiSeverity) =>
    forecasts.some((f) => f.severity === sev);

  if ((counts?.red ?? 0) > 0 || hasForecast("red")) return "red";
  if ((counts?.orange ?? 0) > 0 || hasForecast("orange")) return "orange";
  if ((counts?.yellow ?? 0) > 0 || hasForecast("yellow")) return "yellow";
  return station.status;
}

/** Color token for a pin kind. */
export function pinColorFor(kind: PinKind): string {
  if (kind === "yellow" || kind === "orange" || kind === "red") {
    return SEVERITY_COLOR[kind];
  }
  return STATUS_COLOR[kind];
}

/**
 * Display string surfaced next to a station pin label. Mirrors `pinKindFor`
 * priority so the colored dot and the text never disagree.
 */
export function hazardFor(station: Station, lang: Lang = "en"): string {
  const t = getDict(lang);
  switch (pinKindFor(station)) {
    case "red":
      return t.pinSevere;
    case "orange":
      return t.pinWarning;
    case "yellow":
      return t.pinWatch;
    case "offline":
      return t.pinOffline;
    default:
      return t.pinNormal;
  }
}
