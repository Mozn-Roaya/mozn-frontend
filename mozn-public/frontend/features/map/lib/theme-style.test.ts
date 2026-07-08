import { describe, expect, it } from "vitest";

import { MASK_COLOR, MASK_OPACITY, TILE_URL, paletteFor } from "./theme-style";

// Locks the map's theme-driven styling so a refactor can't silently shift the
// Libya highlight, the neighbour scrim, or the label-free tiles.

describe("paletteFor", () => {
  it("gives Libya a stronger amber fill in dark mode", () => {
    expect(paletteFor("light").libya.fillOpacity).toBe(0.09);
    expect(paletteFor("dark").libya.fillOpacity).toBe(0.18);
    expect(paletteFor("light").libya.fillColor).toBe("#f59e0b");
  });
});

describe("mask scrim", () => {
  it("matches the page canvas per theme at a near-opaque scrim", () => {
    expect(MASK_OPACITY).toBe(0.96);
    expect(MASK_COLOR.light).toBe("#f7f7f8");
    expect(MASK_COLOR.dark).toBe("#121115");
  });
});

describe("tiles", () => {
  it("uses the label-free CARTO basemaps", () => {
    expect(TILE_URL.light).toContain("voyager_nolabels");
    expect(TILE_URL.dark).toContain("dark_nolabels");
  });
});
