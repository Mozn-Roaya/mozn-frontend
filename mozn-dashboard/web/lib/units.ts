/**
 * Display-unit conversions for live weather values. Backend readings are always
 * °C and km/h; these convert to the operator's preferred display units
 * (Settings → Appearance). Positions on the temperature gauge / forecast bars
 * are proportion-based, so they stay correct without converting the math — only
 * the displayed numbers and unit labels change.
 */
import type { TempUnit, WindUnit } from "@/features/settings/preferences";

/** °C → the display unit's rounded value. */
export function toTemp(celsius: number, unit: TempUnit): number {
  return unit === "f" ? Math.round((celsius * 9) / 5 + 32) : Math.round(celsius);
}

export function tempSymbol(unit: TempUnit): string {
  return unit === "f" ? "°F" : "°C";
}

/** km/h → the display unit's rounded value (m/s to one decimal). */
export function toWind(kmh: number, unit: WindUnit): number {
  if (unit === "ms") return Math.round((kmh / 3.6) * 10) / 10;
  if (unit === "kt") return Math.round(kmh / 1.852);
  return Math.round(kmh);
}

export function windUnitLabel(unit: WindUnit): string {
  return unit === "ms" ? "m/s" : unit === "kt" ? "kt" : "km/h";
}

/** Reformat a wind StationMetric (value + "km/h" unit + "Gusts N km/h" note). */
export function convertWindMetric<T extends { value: string; unit: string; note: string }>(
  metric: T,
  unit: WindUnit,
): T {
  if (unit === "kmh") return metric;
  const label = windUnitLabel(unit);
  const v = Number(metric.value);
  const value = Number.isFinite(v) ? String(toWind(v, unit)) : metric.value;
  const note = metric.note.replace(
    /([\d.]+)\s*km\/h/g,
    (_, n: string) => `${toWind(Number(n), unit)} ${label}`,
  );
  return { ...metric, value, unit: metric.unit ? label : metric.unit, note };
}
