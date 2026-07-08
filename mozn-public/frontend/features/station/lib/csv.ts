import type { Reading, Station } from "@/components/api/types";

/** Which reading columns the export includes. */
export type IncludeKey =
  | "temperature"
  | "humidity"
  | "rainfall"
  | "waterLevel"
  | "windSpeed"
  | "coordinates";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(
  readings: Reading[],
  station: Station,
  include: Record<IncludeKey, boolean>,
): string {
  const headers: string[] = ["Time"];
  if (include.temperature) headers.push("Temperature (°C)");
  if (include.humidity) headers.push("Humidity (%)");
  if (include.rainfall) headers.push("Rainfall (mm/hr)");
  // Water Level has no field in the readings API; the column is emitted (to
  // honour the selection) but stays blank rather than showing fabricated data.
  if (include.waterLevel) headers.push("Water Level");
  if (include.windSpeed) headers.push("Wind Speed (km/h)");
  if (include.coordinates) headers.push("Latitude", "Longitude");

  const lines = [headers.map(csvCell).join(",")];
  for (const r of readings) {
    const row: Array<string | number> = [r.time];
    if (include.temperature) row.push(r.temp_c);
    if (include.humidity) row.push(r.humidity);
    if (include.rainfall) row.push(r.rain_rate_mm);
    if (include.waterLevel) row.push("");
    if (include.windSpeed) row.push(r.wind_speed_kmh);
    if (include.coordinates) row.push(station.latitude, station.longitude);
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}

export function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
