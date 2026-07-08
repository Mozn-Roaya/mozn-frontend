import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { buildCsv, type IncludeKey } from "./csv";

import type { Reading } from "@/components/api/types";


const reading: Reading = {
  time: "2026-07-03T12:00:00Z",
  station_id: "st-1",
  temp_c: 31.5,
  dewpoint_c: 10,
  windchill_c: 30,
  heatindex_c: 33,
  humidity: 40,
  pressure_hpa: 1012,
  wind_speed_kmh: 18,
  wind_gust_kmh: 25,
  wind_dir: 90,
  rain_rate_mm: 0,
  rain_daily_mm: 0,
  solar_radiation: 500,
  uv_index: 7,
};

const allOn = (): Record<IncludeKey, boolean> => ({
  temperature: true,
  humidity: true,
  rainfall: true,
  waterLevel: true,
  windSpeed: true,
  coordinates: true,
});

describe("buildCsv", () => {
  it("emits a header plus one row per reading", () => {
    const csv = buildCsv([reading], makeStation(), allOn());
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "Time,Temperature (°C),Humidity (%),Rainfall (mm/hr),Water Level,Wind Speed (km/h),Latitude,Longitude",
    );
    // Water Level column stays blank (two consecutive commas around it).
    expect(lines[1]).toContain("31.5,40,0,,18,");
  });

  it("only includes selected columns", () => {
    const include = { ...allOn(), humidity: false, rainfall: false, waterLevel: false, windSpeed: false, coordinates: false };
    const csv = buildCsv([reading], makeStation(), include);
    expect(csv.split("\n")[0]).toBe("Time,Temperature (°C)");
  });

  it("includes station coordinates when selected", () => {
    const csv = buildCsv([reading], makeStation({ latitude: 32.9, longitude: 13.2 }), allOn());
    expect(csv.split("\n")[1]).toContain("32.9,13.2");
  });
});
