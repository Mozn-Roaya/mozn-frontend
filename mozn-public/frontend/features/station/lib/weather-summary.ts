import type { Dict } from "@/components/lib/i18n";

// Turns raw reading values into the short human sentences shown under each
// metric card. All copy comes from the dictionary so it stays bilingual.

export const CARDINAL = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type Cardinal = (typeof CARDINAL)[number];

export function degToCardinal(deg: number): Cardinal {
  const idx = Math.round((deg % 360) / 45) % 8;
  return CARDINAL[idx];
}

export function windDescription(speedKmh: number, dir: Cardinal, t: Dict): string {
  const name = t.cardinals[dir];
  if (speedKmh < 1) return t.windCalm;
  if (speedKmh < 12) return t.windLight(name);
  if (speedKmh < 30) return t.windModerate(name);
  if (speedKmh < 50) return t.windStrong(name);
  return t.windGale(name);
}

export function humidityDescription(pct: number, t: Dict): string {
  if (pct < 25) return t.humidityDry;
  if (pct < 60) return t.humidityComfortable;
  if (pct < 80) return t.humidityHumid;
  return t.humidityVery;
}

export function pressureDescription(hpa: number, t: Dict): string {
  if (hpa < 1000) return t.pressureLow;
  if (hpa > 1020) return t.pressureHigh;
  return t.pressureSteady;
}

export function rainDescription(rate: number, daily: number, t: Dict): string {
  if (rate > 4) return t.rainHeavy;
  if (rate > 0.5) return t.rainLight;
  if (daily > 0) return t.rainToday(daily.toFixed(1));
  return t.rainNone;
}
