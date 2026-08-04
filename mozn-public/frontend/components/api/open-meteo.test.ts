import { afterEach, describe, expect, it, vi } from "vitest";

import { getEstimatedConditions } from "./open-meteo";

// Locks the contract that matters: the mapper never throws, converts
// precipitation from interval accumulation to an hourly rate, and returns null
// (not zeros) for anything the source didn't actually provide.

function mockFetch(body: unknown, ok = true, status = 200) {
  const spy = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

const FULL = {
  current: {
    time: "2026-08-04T20:15",
    interval: 900,
    temperature_2m: 34.2,
    apparent_temperature: 35.4,
    relative_humidity_2m: 38,
    surface_pressure: 1012.2,
    wind_speed_10m: 11.7,
    wind_direction_10m: 72,
    precipitation: 0.5,
  },
  daily: { precipitation_sum: [1.2] },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getEstimatedConditions", () => {
  it("maps a full response", async () => {
    mockFetch(FULL);
    const est = await getEstimatedConditions(32.75, 12.57);
    expect(est).toEqual({
      observed_at: "2026-08-04T20:15",
      temp_c: 34.2,
      feels_like_c: 35.4,
      humidity: 38,
      pressure_hpa: 1012.2,
      wind_speed_kmh: 11.7,
      wind_dir: 72,
      // 0.5mm over 900s → 2.0 mm/hr
      rain_rate_mm: 2,
      rain_daily_mm: 1.2,
    });
  });

  it("requests the station's own coordinates", async () => {
    const spy = mockFetch(FULL);
    await getEstimatedConditions(32.75, 12.57);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain("latitude=32.75");
    expect(url).toContain("longitude=12.57");
  });

  it("converts precipitation using the reported interval, not a fixed factor", async () => {
    mockFetch({
      ...FULL,
      current: { ...FULL.current, interval: 3600, precipitation: 0.5 },
    });
    const est = await getEstimatedConditions(32, 13);
    expect(est?.rain_rate_mm).toBe(0.5);
  });

  it("returns a null rain rate when the interval is missing", async () => {
    const noInterval: Record<string, unknown> = { ...FULL.current };
    delete noInterval.interval;
    mockFetch({ ...FULL, current: noInterval });
    const est = await getEstimatedConditions(32, 13);
    expect(est?.rain_rate_mm).toBeNull();
    // The rest of the estimate still stands.
    expect(est?.temp_c).toBe(34.2);
  });

  it("nulls individual fields the source omitted instead of defaulting to 0", async () => {
    mockFetch({
      current: { time: "2026-08-04T20:15", interval: 900, temperature_2m: 30 },
    });
    const est = await getEstimatedConditions(32, 13);
    expect(est).toMatchObject({
      temp_c: 30,
      feels_like_c: null,
      humidity: null,
      pressure_hpa: null,
      wind_speed_kmh: null,
      wind_dir: null,
      rain_rate_mm: null,
      rain_daily_mm: null,
    });
  });

  it("returns null without a temperature — the one field the panel can't fake", async () => {
    mockFetch({ current: { time: "2026-08-04T20:15", interval: 900 } });
    expect(await getEstimatedConditions(32, 13)).toBeNull();
  });

  it("returns null on a non-2xx response", async () => {
    mockFetch({}, false, 503);
    expect(await getEstimatedConditions(32, 13)).toBeNull();
  });

  it("returns null on a network error rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ENOTFOUND")));
    await expect(getEstimatedConditions(32, 13)).resolves.toBeNull();
  });

  it("returns null on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Unexpected token");
        },
      } as unknown as Response),
    );
    expect(await getEstimatedConditions(32, 13)).toBeNull();
  });

  it("skips the request entirely for non-finite coordinates", async () => {
    const spy = mockFetch(FULL);
    expect(await getEstimatedConditions(Number.NaN, 13)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
