/**
 * Map geometry + camera constants. All distances are in display units the
 * Leaflet API uses directly (lat/lng pairs, pixel padding, second-based
 * animation durations).
 */

import type { LatLngBoundsLiteral } from "leaflet";

/** Initial framing — wide enough that Libya plus the immediate neighbors fit. */
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
/** Fly animation duration in seconds. Matches the UI's "smooth pan" motion. */
export const FLY_DURATION_S = 0.7;
