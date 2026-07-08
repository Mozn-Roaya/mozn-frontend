import { stationName, type Lang } from "@/components/lib/i18n";

import { hazardFor, pinColorFor, pinKindFor } from "./pin-status";


import type { Station } from "@/components/api/types";

type PinRenderOptions = {
  readonly selected: boolean;
  readonly showLabel: boolean;
  readonly lang?: Lang;
};

/**
 * Escapes the five XML/HTML-significant chars. Used because Leaflet's
 * `divIcon` accepts an HTML string, not React — anything dynamic must go
 * through this before being interpolated.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pinClassName(kind: string, selected: boolean): string {
  const classes = ["mz-pin-link", `mz-pin--${kind}`];
  if (selected) classes.push("is-selected");
  return classes.join(" ");
}

function labelHtml(name: string, hazard: string): string {
  return [
    // dir="auto" lets the label read in its own script (Arabic RTL) even though
    // the marker container is forced LTR to keep the pin anchored on its point.
    `<span class="mz-pin-label" dir="auto">`,
    `<span>${escapeHtml(name)}</span>`,
    `<span aria-hidden="true">·</span>`,
    `<span>${escapeHtml(hazard)}</span>`,
    `</span>`,
  ].join("");
}

/**
 * Builds the raw HTML for one station's Leaflet `divIcon`.
 * Kept as a pure string-returning function so it's trivial to unit-test
 * (snapshot the string for a fixture station).
 */
export function stationIconHtml(
  station: Station,
  options: PinRenderOptions,
): string {
  const lang = options.lang ?? "en";
  const kind = pinKindFor(station);
  const color = pinColorFor(kind);
  const hazard = hazardFor(station, lang);
  const name = stationName(station, lang);
  const href = `/stations/${encodeURIComponent(station.id)}`;
  const ariaLabel = `${escapeHtml(name)} — ${escapeHtml(hazard)}`;

  return [
    `<a class="${pinClassName(kind, options.selected)}" href="${href}" aria-label="${ariaLabel}" draggable="false">`,
    `<span class="mz-pin" aria-hidden="true">`,
    `<span class="mz-pin-halo" style="background-color:${color}"></span>`,
    `<span class="mz-pin-dot" style="background-color:${color}"></span>`,
    `</span>`,
    options.showLabel ? labelHtml(name, hazard) : "",
    `</a>`,
  ].join("");
}
