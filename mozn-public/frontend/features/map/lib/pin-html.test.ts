import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { escapeHtml, stationIconHtml } from "./pin-html";

// Characterization tests for the ONLY HTML-injection surface in the map
// (Leaflet divIcon). The escaping assertions here are security-critical: if a
// later phase weakens escaping, these fail. They lock current behavior exactly.

describe("escapeHtml", () => {
  it("escapes all five significant characters", () => {
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#39;");
  });

  it("escapes ampersands first so entities are not double-mangled", () => {
    expect(escapeHtml("<a>")).toBe("&lt;a&gt;");
    expect(escapeHtml('Tom & "Jerry"')).toBe("Tom &amp; &quot;Jerry&quot;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Tripoli 32")).toBe("Tripoli 32");
  });
});

describe("stationIconHtml", () => {
  it("produces the exact markup for a quiet normal station", () => {
    const html = stationIconHtml(makeStation({ id: "st-1", name: "Tripoli" }), {
      selected: false,
      showLabel: false,
    });

    expect(html).toBe(
      '<a class="mz-pin-link mz-pin--normal" href="/stations/st-1" aria-label="Tripoli — Normal" draggable="false">' +
        '<span class="mz-pin" aria-hidden="true">' +
        '<span class="mz-pin-halo" style="background-color:var(--color-status-normal-500)"></span>' +
        '<span class="mz-pin-dot" style="background-color:var(--color-status-normal-500)"></span>' +
        "</span>" +
        "</a>",
    );
  });

  it("adds the is-selected class when selected", () => {
    const html = stationIconHtml(makeStation(), { selected: true, showLabel: false });
    expect(html).toContain('class="mz-pin-link mz-pin--normal is-selected"');
  });

  it("appends the label span only when showLabel is true", () => {
    const withLabel = stationIconHtml(makeStation({ name: "Tripoli" }), {
      selected: false,
      showLabel: true,
    });
    const withoutLabel = stationIconHtml(makeStation({ name: "Tripoli" }), {
      selected: false,
      showLabel: false,
    });

    expect(withLabel).toContain('<span class="mz-pin-label"');
    expect(withLabel).toContain("<span>Tripoli</span>");
    expect(withoutLabel).not.toContain("mz-pin-label");
  });

  it("URL-encodes the station id in the href", () => {
    const html = stationIconHtml(makeStation({ id: "a b/c" }), {
      selected: false,
      showLabel: false,
    });
    expect(html).toContain('href="/stations/a%20b%2Fc"');
  });

  it("escapes station name in the aria-label and label (no raw HTML injected)", () => {
    const html = stationIconHtml(
      makeStation({ name: '<img src=x onerror=alert(1)>' }),
      { selected: false, showLabel: true },
    );

    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
