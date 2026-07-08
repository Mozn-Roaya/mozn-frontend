import type { MapTheme } from "../types";

/**
 * Theme-aware Leaflet styling. Separated from the component so palette tweaks
 * (e.g. when info-severity tokens land) don't require touching map code.
 *
 * The world layer is painted as an opaque scrim (see MASK_COLOR / MASK_OPACITY)
 * so neighbouring countries recede and Libya's basemap is what reads. Libya
 * itself uses a higher-res polygon and gets an amber highlight fill.
 */

/**
 * CARTO raster basemaps (OpenStreetMap data), theme-switched. The `_nolabels`
 * variants strip every baked-in place/country name so nothing competes with the
 * amber Libya highlight and the station pins — the map is about us, not the
 * neighbours.
 */
export const TILE_URL: Readonly<Record<MapTheme, string>> = {
  light:
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
};

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const TILE_SUBDOMAINS = "abcd";

export type LayerPalette = {
  readonly stroke: string;
  readonly fillColor: string;
  readonly fillOpacity: number;
};

export type MapPalette = {
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

/**
 * Opaque scrim painted over everything outside Libya (matches the page canvas
 * background per theme) so neighbouring countries recede and only Libya's
 * basemap stands out. Applied to the world-no-libya polygons.
 */
export const MASK_COLOR: Readonly<Record<MapTheme, string>> = {
  light: "#f7f7f8",
  dark: "#121115",
};
export const MASK_OPACITY = 0.96;

export function paletteFor(theme: MapTheme): MapPalette {
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

/** Reads the current theme from the DOM. Safe to call during SSR — returns light. */
export function readMapTheme(): MapTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
