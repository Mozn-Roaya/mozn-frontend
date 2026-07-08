import { describe, expect, it } from "vitest";

import {
  alertTimeRange,
  alertTitle,
  hazardFromParameter,
  severityWord,
} from "./hazard";

// Characterization tests for user-visible alert copy/formatting. Date-format
// assertions avoid exact locale/timezone output (which varies per machine) and
// instead lock the branching + prefixes, keeping the suite deterministic.

describe("hazardFromParameter", () => {
  it("falls back to a generic label for missing/unknown parameters", () => {
    expect(hazardFromParameter(undefined)).toBe("Weather Alert");
    expect(hazardFromParameter("")).toBe("Weather Alert");
    expect(hazardFromParameter("something_unmapped")).toBe("Weather Alert");
  });

  it("maps known parameter prefixes to hazard labels", () => {
    expect(hazardFromParameter("temp_high_c")).toBe("High Temperature");
    expect(hazardFromParameter("temp_low_c")).toBe("Low Temperature");
    expect(hazardFromParameter("rain_rate")).toBe("Heavy Rainfall");
    expect(hazardFromParameter("wind_gust_kmh")).toBe("Strong Wind Gust");
    expect(hazardFromParameter("wind_speed")).toBe("High Wind");
    expect(hazardFromParameter("uv_index")).toBe("High UV");
  });

  it("treats any parameter containing 'flood' as heavy rainfall", () => {
    expect(hazardFromParameter("flash_flood")).toBe("Heavy Rainfall");
  });
});

describe("severityWord", () => {
  it("tiers the wording by severity", () => {
    expect(severityWord("red")).toBe("Severe Warning");
    expect(severityWord("orange")).toBe("Warning");
    expect(severityWord("yellow")).toBe("Watch");
    expect(severityWord(undefined)).toBe("Alert");
  });
});

describe("alertTitle", () => {
  it("combines hazard and severity word", () => {
    expect(alertTitle("temp_high_c", "yellow")).toBe("High Temperature Watch");
    expect(alertTitle("rain_rate", "red")).toBe("Heavy Rainfall Severe Warning");
    expect(alertTitle(undefined, undefined)).toBe("Weather Alert Alert");
  });
});

describe("alertTimeRange", () => {
  it("returns undefined when there is nothing to show", () => {
    expect(alertTimeRange({})).toBeUndefined();
    expect(alertTimeRange({ issuedAt: "not-a-date" })).toBeUndefined();
  });

  it("shows lead time alone when no window is present", () => {
    expect(alertTimeRange({ leadTime: "22h" })).toBe("Starts in 22h");
  });

  it("prefixes a same-window range with 'Active' and appends lead time", () => {
    const result = alertTimeRange({
      startsAt: "2026-07-01T10:00:00Z",
      expiresAt: "2026-07-01T14:00:00Z",
      leadTime: "3h",
    });
    expect(result).toMatch(/^Active .+ · starts in 3h$/);
  });

  it("uses an arrow between endpoints for a cross-day window", () => {
    const result = alertTimeRange({
      startsAt: "2026-07-01T10:00:00Z",
      expiresAt: "2026-07-05T14:00:00Z",
    });
    expect(result).toContain("→");
  });

  it("falls back to an 'Issued' line for observed alerts", () => {
    expect(alertTimeRange({ issuedAt: "2026-07-01T10:00:00Z" })).toMatch(
      /^Issued /,
    );
  });
});
