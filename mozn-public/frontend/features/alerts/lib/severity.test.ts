import { describe, expect, it } from "vitest";

import { SEVERITY_META, severityClasses, severityFromApi } from "./severity";

// Characterization tests: lock the API->domain severity mapping, the sort
// order, labels, and the exact utility-class strings. The class strings feed
// the alert visuals (and the `.split().find()` string-mining that Phase 6
// wants to refactor) — pinning them here proves that refactor stays neutral.

describe("severityFromApi", () => {
  it("maps raw API colors to domain severities", () => {
    expect(severityFromApi("yellow")).toBe("info");
    expect(severityFromApi("orange")).toBe("warning");
    expect(severityFromApi("red")).toBe("critical");
  });
});

describe("SEVERITY_META", () => {
  it("orders critical first, then warning, then info", () => {
    expect(SEVERITY_META.critical.sortOrder).toBe(0);
    expect(SEVERITY_META.warning.sortOrder).toBe(1);
    expect(SEVERITY_META.info.sortOrder).toBe(2);
  });

  it("labels each severity as shown in the UI", () => {
    expect(SEVERITY_META.critical.label).toBe("Critical");
    expect(SEVERITY_META.warning.label).toBe("Warning");
    expect(SEVERITY_META.info.label).toBe("Advisory");
  });

  it("uses the same triangle icon for every severity", () => {
    expect(SEVERITY_META.critical.icon).toBe(SEVERITY_META.warning.icon);
    expect(SEVERITY_META.warning.icon).toBe(SEVERITY_META.info.icon);
  });

  it("binds the exact severity color-token classes", () => {
    expect(SEVERITY_META.critical.classes).toEqual({
      surface: "bg-(--color-bg-severity-red-subtle)",
      accent: "text-(--color-severity-red-500) bg-(--color-severity-red-500)",
      badge: "bg-(--color-bg-severity-red-step)",
      badgeText: "text-(--color-severity-red-500)",
    });
    expect(SEVERITY_META.warning.classes).toEqual({
      surface: "bg-(--color-bg-severity-orange-subtle)",
      accent:
        "text-(--color-severity-orange-500) bg-(--color-severity-orange-500)",
      badge: "bg-(--color-bg-severity-orange-step)",
      badgeText: "text-(--color-severity-orange-500)",
    });
    expect(SEVERITY_META.info.classes).toEqual({
      surface: "bg-(--color-bg-severity-yellow-subtle)",
      accent:
        "text-(--color-severity-yellow-500) bg-(--color-severity-yellow-500)",
      badge: "bg-(--color-bg-severity-yellow-step)",
      badgeText: "text-(--color-severity-yellow-500)",
    });
  });
});

describe("severityClasses", () => {
  it("returns the classes block for a domain severity", () => {
    expect(severityClasses("critical")).toBe(SEVERITY_META.critical.classes);
    expect(severityClasses("warning")).toBe(SEVERITY_META.warning.classes);
    expect(severityClasses("info")).toBe(SEVERITY_META.info.classes);
  });
});
