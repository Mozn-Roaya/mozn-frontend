import type { LatLngBoundsLiteral } from "leaflet";

import type {
  MapAlertSeverity,
  MapStation,
  StationStatus,
} from "@/types/dashboard";

/**
 * Geometry, camera, tile and styling constants for the Leaflet station-health
 * map. Ported from the public Mozn map (Leaflet + CARTO raster tiles) and
 * re-tokenised to the dashboard's design system. Distances are in the units the
 * Leaflet API consumes directly (lat/lng pairs, pixel padding, seconds).
 */

export type MapTheme = "light" | "dark";

/** Initial framing — wide enough that Libya plus the immediate neighbours fit. */
export const LIBYA_BOUNDS: LatLngBoundsLiteral = [
  [17.5, 7.0],
  [35.0, 27.5],
];

/** Hard pan limit — beyond this and panning rubber-bands back. */
export const MAP_MAX_BOUNDS: LatLngBoundsLiteral = [
  [14.5, 2.5],
  [38.5, 32.5],
];

export const MIN_ZOOM = 5;
export const MAX_ZOOM = 12;
/** Zoom level the camera flies to when a station is selected. */
export const STATION_ZOOM = 9;
/** Zoom delta for the +/− buttons. */
export const ZOOM_STEP = 0.5;
/** Pixel padding inside the viewport when fitting a bounds. */
export const FIT_PADDING_PX = 32;
/** Fly animation duration in seconds. */
export const FLY_DURATION_S = 0.7;

/**
 * CARTO raster basemaps (OpenStreetMap data), theme-switched. The `_nolabels`
 * variants strip every baked-in place/country name so nothing competes with the
 * amber Libya highlight and our station pins — the map is about us, not the
 * neighbours.
 */
export const TILE_URL: Readonly<Record<MapTheme, string>> = {
  light:
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
};

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions" rel="noopener noreferrer">CARTO</a>';

export const TILE_SUBDOMAINS = "abcd";

/**
 * What a pin actually shows. Severities outrank health status because a
 * red-alerting station that is also "warning" should read as red — the alert is
 * the more urgent signal. Mirrors the public map's `PinKind`.
 */
export type PinKind = MapAlertSeverity | StationStatus;

/** Health status → pin colour. CSS vars so pins re-tint with the active theme. */
export const STATION_PIN_COLOR: Readonly<Record<StationStatus, string>> = {
  online: "var(--status-normal)",
  warning: "var(--status-warning)",
  offline: "var(--status-offline)",
};

/** Alert severity → pin colour, matching the public map's severity tiers. */
export const SEVERITY_PIN_COLOR: Readonly<Record<MapAlertSeverity, string>> = {
  yellow: "var(--severity-yellow)",
  orange: "var(--severity-orange)",
  red: "var(--severity-red)",
};

/**
 * Resolve what a station's pin should communicate. Priority (matches the public
 * map): red > orange > yellow > health status. Both active and forecast alerts
 * count, so the pin agrees with the station panel.
 */
export function pinKindFor(station: MapStation): PinKind {
  const counts = station.activeAlerts;
  const forecasts = station.forecastAlerts ?? [];
  const hasForecast = (sev: MapAlertSeverity) =>
    forecasts.some((f) => f.severity === sev);

  if ((counts?.red ?? 0) > 0 || hasForecast("red")) return "red";
  if ((counts?.orange ?? 0) > 0 || hasForecast("orange")) return "orange";
  if ((counts?.yellow ?? 0) > 0 || hasForecast("yellow")) return "yellow";
  return station.status;
}

/** Colour token for a pin kind. */
export function pinColorFor(kind: PinKind): string {
  if (kind === "yellow" || kind === "orange" || kind === "red") {
    return SEVERITY_PIN_COLOR[kind];
  }
  return STATION_PIN_COLOR[kind];
}

type LayerPalette = {
  readonly stroke: string;
  readonly fillColor: string;
  readonly fillOpacity: number;
};

type MapPalette = {
  readonly world: LayerPalette;
  readonly libya: LayerPalette;
};

const LIBYA_AMBER = "#f59e0b";

const LIGHT_PALETTE: MapPalette = {
  world: { stroke: "#c5c8d0", fillColor: "#e7e8ec", fillOpacity: 0 },
  libya: { stroke: LIBYA_AMBER, fillColor: LIBYA_AMBER, fillOpacity: 0.09 },
};

const DARK_PALETTE: MapPalette = {
  world: { stroke: "#3a3e4a", fillColor: "#2a2d36", fillOpacity: 0 },
  libya: { stroke: LIBYA_AMBER, fillColor: LIBYA_AMBER, fillOpacity: 0.18 },
};

export function paletteFor(theme: MapTheme): MapPalette {
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

/**
 * Opaque scrim painted over everything outside Libya (matches the page
 * `--background` per theme) so neighbouring countries are hidden and only
 * Libya's basemap shows. Shared by the dashboard map and the location picker.
 */
export const MASK_COLOR: Readonly<Record<MapTheme, string>> = {
  light: "#f7f7f8",
  dark: "#121115",
};
export const MASK_OPACITY = 0.96;

/** Reads the active theme from the DOM (next-themes toggles `.dark` on <html>). */
export function readMapTheme(): MapTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Escapes the five XML/HTML-significant chars. Leaflet's `divIcon` takes an
 * HTML string, not React — anything dynamic must pass through this first.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type PinRenderOptions = {
  readonly selected: boolean;
  readonly showLabel: boolean;
  /**
   * Localised hazard/status word per pin kind (e.g. red → "Severe",
   * online → "Online"). Shown beside the name and in the aria-label.
   */
  readonly pinLabels: Readonly<Record<PinKind, string>>;
};

/** The `name · hazard` pill shown beside a pin — mirrors the public map. */
function labelHtml(name: string, hazard: string): string {
  return [
    // dir="auto" lets the label read in its own script (Arabic RTL) while the
    // pin stays anchored on its coordinate.
    `<span class="mz-pin-label" dir="auto">`,
    `<span>${escapeHtml(name)}</span>`,
    `<span aria-hidden="true">·</span>`,
    `<span>${escapeHtml(hazard)}</span>`,
    `</span>`,
  ].join("");
}

/**
 * Builds the raw HTML for one station's Leaflet `divIcon`. Pure string in/out so
 * it is trivial to snapshot-test. Pin colour follows the resolved `pinKind`
 * (severity outranks health status), matching the public map; geometry and the
 * live pulse come from CSS (see globals.css).
 */
export function stationIconHtml(
  station: MapStation,
  { selected, showLabel, pinLabels }: PinRenderOptions,
): string {
  const kind = pinKindFor(station);
  const color = pinColorFor(kind);
  const hazard = pinLabels[kind];
  const classes = ["mz-pin-link", `mz-pin--${kind}`];
  if (selected) classes.push("is-selected");

  return [
    `<span class="${classes.join(" ")}" aria-label="${escapeHtml(station.name)} — ${escapeHtml(hazard)}">`,
    `<span class="mz-pin" aria-hidden="true">`,
    `<span class="mz-pin-halo" style="background-color:${color}"></span>`,
    `<span class="mz-pin-dot" style="background-color:${color}"></span>`,
    `</span>`,
    showLabel ? labelHtml(station.name, hazard) : "",
    `</span>`,
  ].join("");
}
