import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { hazardFor, pinColorFor, pinKindFor } from "./pin-status";

// Characterization tests: they lock the CURRENT behavior of pin resolution so
// refactors in later phases can't silently change which color/label a station
// pin shows. They do not assert that current behavior is "correct" — only
// that it stays the same.

describe("pinKindFor", () => {
  it("returns the station status when there are no alerts", () => {
    expect(pinKindFor(makeStation({ status: "normal" }))).toBe("normal");
    expect(pinKindFor(makeStation({ status: "warning" }))).toBe("warning");
    expect(pinKindFor(makeStation({ status: "offline" }))).toBe("offline");
  });

  it("maps active alert counts to the matching severity", () => {
    expect(
      pinKindFor(
        makeStation({ active_alerts: { total: 1, yellow: 1, orange: 0, red: 0 } }),
      ),
    ).toBe("yellow");
    expect(
      pinKindFor(
        makeStation({ active_alerts: { total: 1, yellow: 0, orange: 1, red: 0 } }),
      ),
    ).toBe("orange");
    expect(
      pinKindFor(
        makeStation({ active_alerts: { total: 1, yellow: 0, orange: 0, red: 1 } }),
      ),
    ).toBe("red");
  });

  it("applies red > orange > yellow priority when several counts are set", () => {
    expect(
      pinKindFor(
        makeStation({ active_alerts: { total: 3, yellow: 1, orange: 1, red: 1 } }),
      ),
    ).toBe("red");
    expect(
      pinKindFor(
        makeStation({ active_alerts: { total: 2, yellow: 1, orange: 1, red: 0 } }),
      ),
    ).toBe("orange");
  });

  it("also honors forecast_alerts severities", () => {
    expect(
      pinKindFor(makeStation({ forecast_alerts: [{ severity: "orange" }] })),
    ).toBe("orange");
    expect(
      pinKindFor(makeStation({ forecast_alerts: [{ severity: "red" }] })),
    ).toBe("red");
  });

  it("lets any alert outrank operational status", () => {
    // A warning-status station with a red alert should read as red.
    expect(
      pinKindFor(
        makeStation({
          status: "warning",
          active_alerts: { total: 1, yellow: 0, orange: 0, red: 1 },
        }),
      ),
    ).toBe("red");
  });
});

describe("pinColorFor", () => {
  it("maps severities to severity color tokens", () => {
    expect(pinColorFor("yellow")).toBe("var(--color-severity-yellow-500)");
    expect(pinColorFor("orange")).toBe("var(--color-severity-orange-500)");
    expect(pinColorFor("red")).toBe("var(--color-severity-red-500)");
  });

  it("maps statuses to status color tokens", () => {
    expect(pinColorFor("normal")).toBe("var(--color-status-normal-500)");
    expect(pinColorFor("warning")).toBe("var(--color-status-warning-500)");
    expect(pinColorFor("offline")).toBe("var(--color-status-offline-400)");
  });
});

describe("hazardFor", () => {
  it("returns the display word matching the resolved pin kind", () => {
    expect(
      hazardFor(makeStation({ active_alerts: { total: 1, yellow: 0, orange: 0, red: 1 } })),
    ).toBe("Severe");
    expect(
      hazardFor(makeStation({ active_alerts: { total: 1, yellow: 0, orange: 1, red: 0 } })),
    ).toBe("Warning");
    expect(
      hazardFor(makeStation({ active_alerts: { total: 1, yellow: 1, orange: 0, red: 0 } })),
    ).toBe("Watch");
    expect(hazardFor(makeStation({ status: "offline" }))).toBe("Offline");
    expect(hazardFor(makeStation({ status: "normal" }))).toBe("Normal");
  });
});
