import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { buildCsv, type IncludeKey } from "./csv";

import type { ReadingHistoryBucket } from "@/components/api/types";


const bucket: ReadingHistoryBucket = {
  bucket_start: "2026-07-03T12:00:00Z",
  temp_c_avg: 31.5,
  temp_c_min: 30,
  temp_c_max: 33,
  humidity_avg: 40,
  wind_speed_max_kmh: 18,
  wind_gust_max_kmh: 25,
  rain_rate_max_mm: 0,
  rain_total_mm: 0,
  pressure_hpa_avg: 1012,
  uv_index_max: 7,
  sample_count: 12,
};

const allOn = (): Record<IncludeKey, boolean> => ({
  temperature: true,
  humidity: true,
  rainfall: true,
  windSpeed: true,
  pressure: true,
  coordinates: true,
});

describe("buildCsv", () => {
  it("emits a header plus one row per hourly bucket", () => {
    const csv = buildCsv([bucket], makeStation(), allOn());
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "Time (hour),Temp Avg (°C),Temp Min (°C),Temp Max (°C),Humidity Avg (%),Rain Total (mm),Rain Rate Max (mm/hr),Wind Max (km/h),Gust Max (km/h),Pressure Avg (hPa),Latitude,Longitude",
    );
    expect(lines[1]).toContain("31.5,30,33,40,0,0,18,25,1012,");
  });

  it("only includes selected columns", () => {
    const include = {
      ...allOn(),
      humidity: false,
      rainfall: false,
      windSpeed: false,
      pressure: false,
      coordinates: false,
    };
    const csv = buildCsv([bucket], makeStation(), include);
    expect(csv.split("\n")[0]).toBe("Time (hour),Temp Avg (°C),Temp Min (°C),Temp Max (°C)");
  });

  it("includes station coordinates when selected", () => {
    const csv = buildCsv([bucket], makeStation({ latitude: 32.9, longitude: 13.2 }), allOn());
    expect(csv.split("\n")[1]).toContain("32.9,13.2");
  });

  it("leaves a missing bucket value blank rather than 0", () => {
    const partial = { ...bucket, humidity_avg: null as unknown as number };
    const csv = buildCsv([partial], makeStation(), allOn());
    // humidity column (after the 3 temp columns) is blank: ...33,,0...
    expect(csv.split("\n")[1]).toContain("33,,0,0,");
  });
});
