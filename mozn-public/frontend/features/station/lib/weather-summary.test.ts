import { describe, expect, it } from "vitest";

import { getDict } from "@/components/lib/i18n";

import {
  degToCardinal,
  humidityDescription,
  pressureDescription,
  rainDescription,
  windDescription,
} from "./weather-summary";

const t = getDict("en");

describe("degToCardinal", () => {
  it("maps degrees to the nearest 8-point cardinal", () => {
    expect(degToCardinal(0)).toBe("N");
    expect(degToCardinal(45)).toBe("NE");
    expect(degToCardinal(90)).toBe("E");
    expect(degToCardinal(180)).toBe("S");
    expect(degToCardinal(270)).toBe("W");
    expect(degToCardinal(360)).toBe("N");
  });
});

describe("weather descriptions branch by threshold", () => {
  it("wind", () => {
    expect(windDescription(0, "N", t)).toBe(t.windCalm);
    expect(windDescription(5, "N", t)).toBe(t.windLight("N"));
    expect(windDescription(20, "N", t)).toBe(t.windModerate("N"));
    expect(windDescription(40, "N", t)).toBe(t.windStrong("N"));
    expect(windDescription(60, "N", t)).toBe(t.windGale("N"));
  });
  it("humidity / pressure / rain", () => {
    expect(humidityDescription(10, t)).toBe(t.humidityDry);
    expect(humidityDescription(90, t)).toBe(t.humidityVery);
    expect(pressureDescription(990, t)).toBe(t.pressureLow);
    expect(pressureDescription(1030, t)).toBe(t.pressureHigh);
    expect(pressureDescription(1010, t)).toBe(t.pressureSteady);
    expect(rainDescription(5, 0, t)).toBe(t.rainHeavy);
    expect(rainDescription(0, 3, t)).toBe(t.rainToday("3.0"));
    expect(rainDescription(0, 0, t)).toBe(t.rainNone);
  });
});
