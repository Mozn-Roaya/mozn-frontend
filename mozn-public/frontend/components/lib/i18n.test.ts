import { describe, expect, it } from "vitest";

import { getDict, isLang, localeFor, pickLang, stationName } from "./i18n";

// Locks the bilingual contract the app relies on: dictionary selection, the
// Arabic-with-fallback rule for backend fields, and the number-safe locale.

describe("getDict", () => {
  it("returns the matching dictionary and falls back to English", () => {
    expect(getDict("en").tabOverview).toBe("Overview");
    expect(getDict("ar").tabOverview).toBe("نظرة عامة");
    // Unknown language codes degrade to English rather than throwing.
    expect(getDict("fr" as never).tabOverview).toBe("Overview");
  });

  it("keeps interpolating helpers in both languages", () => {
    expect(getDict("en").feelsLike(30)).toBe("Feels like 30°");
    expect(getDict("ar").feelsLike(30)).toBe("الإحساس كأنها 30°");
  });
});

describe("pickLang", () => {
  it("uses the Arabic field for ar, base for en", () => {
    expect(pickLang("ar", "Tripoli", "طرابلس")).toBe("طرابلس");
    expect(pickLang("en", "Tripoli", "طرابلس")).toBe("Tripoli");
  });

  it("falls back to the base value when the Arabic field is missing/empty", () => {
    expect(pickLang("ar", "Tripoli", "")).toBe("Tripoli");
    expect(pickLang("ar", "Tripoli", "   ")).toBe("Tripoli");
    expect(pickLang("ar", "Tripoli", undefined)).toBe("Tripoli");
  });
});

describe("localeFor", () => {
  it("uses Latin numerals for Arabic so numeric values stay consistent", () => {
    expect(localeFor("ar")).toBe("ar-u-nu-latn");
    expect(localeFor("en")).toBe("en-US");
  });
});

describe("stationName", () => {
  const s = { name: "Tripoli", name_ar: "طرابلس" };
  it("localizes a station's name with Arabic fallback", () => {
    expect(stationName(s, "ar")).toBe("طرابلس");
    expect(stationName(s, "en")).toBe("Tripoli");
    expect(stationName({ name: "Sabha", name_ar: "" }, "ar")).toBe("Sabha");
  });
});

describe("isLang", () => {
  it("narrows only the two supported codes", () => {
    expect(isLang("en")).toBe(true);
    expect(isLang("ar")).toBe(true);
    expect(isLang("de")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
