import type { ReadingHistoryBucket, Station } from "@/components/api/types";

/** Which reading columns the export includes. Backed by the hourly aggregate,
 *  so temperature/wind/rain expand into their avg/min/max/total sub-columns. */
export type IncludeKey =
  | "temperature"
  | "humidity"
  | "rainfall"
  | "windSpeed"
  | "pressure"
  | "coordinates";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Round to 2 decimals; blank for a missing bucket value (never fabricate 0). */
function num(v: number | null | undefined): string {
  return v == null ? "" : String(Math.round(v * 100) / 100);
}

export function buildCsv(
  buckets: ReadingHistoryBucket[],
  station: Station,
  include: Record<IncludeKey, boolean>,
): string {
  const headers: string[] = ["Time (hour)"];
  if (include.temperature) headers.push("Temp Avg (°C)", "Temp Min (°C)", "Temp Max (°C)");
  if (include.humidity) headers.push("Humidity Avg (%)");
  if (include.rainfall) headers.push("Rain Total (mm)", "Rain Rate Max (mm/hr)");
  if (include.windSpeed) headers.push("Wind Max (km/h)", "Gust Max (km/h)");
  if (include.pressure) headers.push("Pressure Avg (hPa)");
  if (include.coordinates) headers.push("Latitude", "Longitude");

  const lines = [headers.map(csvCell).join(",")];
  for (const b of buckets) {
    const row: Array<string | number> = [b.bucket_start];
    if (include.temperature) row.push(num(b.temp_c_avg), num(b.temp_c_min), num(b.temp_c_max));
    if (include.humidity) row.push(num(b.humidity_avg));
    if (include.rainfall) row.push(num(b.rain_total_mm), num(b.rain_rate_max_mm));
    if (include.windSpeed) row.push(num(b.wind_speed_max_kmh), num(b.wind_gust_max_kmh));
    if (include.pressure) row.push(num(b.pressure_hpa_avg));
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
