import { getDict, localeFor, type Lang } from "@/components/lib/i18n";

import type { ApiSeverity } from "./severity";

/**
 * Map a backend `parameter` string (e.g. `temp_high_c`) to a human-readable
 * hazard label. Single source of truth for hazard naming so the alert
 * header, map pin tooltips, and any future surfaces all phrase the same
 * hazard the same way.
 *
 * Unknown parameters fall back to a generic "Weather Alert" — better than
 * leaking a snake_case identifier into the UI.
 */
export function hazardFromParameter(parameter?: string, lang: Lang = "en"): string {
  const t = getDict(lang);
  if (!parameter) return t.hazardGeneric;
  if (parameter.startsWith("temp_high")) return t.hazardHighTemp;
  if (parameter.startsWith("temp_low")) return t.hazardLowTemp;
  if (parameter.startsWith("rain") || parameter.includes("flood"))
    return t.hazardHeavyRain;
  if (parameter.startsWith("wind_gust")) return t.hazardWindGust;
  if (parameter.startsWith("wind")) return t.hazardHighWind;
  if (parameter.startsWith("uv")) return t.hazardHighUV;
  return t.hazardGeneric;
}

/**
 * Severity word used in alert titles. Tiered to match meteorological
 * convention: yellow = "Watch" (situational awareness), orange = "Warning"
 * (act now), red = "Severe Warning" (immediate danger).
 */
export function severityWord(severity?: ApiSeverity, lang: Lang = "en"): string {
  const t = getDict(lang);
  switch (severity) {
    case "red":
      return t.sevSevere;
    case "orange":
      return t.sevWarning;
    case "yellow":
      return t.sevWatch;
    default:
      return t.sevAlert;
  }
}

/**
 * Compose the title shown in the alert header. Combines hazard + severity
 * tier — e.g. `temp_high_c` + `yellow` → "High Temperature Watch".
 */
export function alertTitle(
  parameter?: string,
  severity?: ApiSeverity,
  lang: Lang = "en",
): string {
  return getDict(lang).alertTitle(
    hazardFromParameter(parameter, lang),
    severityWord(severity, lang),
  );
}

/**
 * Format the alert's active time window as a short, human-readable string
 * suitable for the alert header meta line. Returns `undefined` when there's
 * no temporal information worth showing.
 *
 * Priority of inputs:
 *   - explicit `startsAt`/`expiresAt` window (forecast alerts)
 *   - `leadTime` alone (server-formatted lead, e.g. "22h")
 *   - `issuedAt` alone (observed alerts that don't carry an end time)
 */
export function alertTimeRange(
  opts: {
    readonly startsAt?: string;
    readonly expiresAt?: string;
    readonly leadTime?: string;
    readonly issuedAt?: string;
  },
  lang: Lang = "en",
): string | undefined {
  const t = getDict(lang);
  const start = parseIso(opts.startsAt);
  const end = parseIso(opts.expiresAt);

  if (start && end) {
    return `${t.alertActiveRange(formatRange(start, end, lang))}${
      opts.leadTime ? t.alertStartsInSuffix(opts.leadTime) : ""
    }`;
  }
  if (opts.leadTime) {
    return t.alertStartsIn(opts.leadTime);
  }
  const issued = parseIso(opts.issuedAt);
  if (issued) {
    return t.alertIssued(formatDateTime(issued, lang));
  }
  return undefined;
}

function parseIso(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function formatDateTime(d: Date, lang: Lang): string {
  return d.toLocaleString(localeFor(lang), DATE_OPTS);
}

function formatRange(start: Date, end: Date, lang: Lang): string {
  const locale = localeFor(lang);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    const day = start.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
    const startTime = start.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${day}, ${startTime}–${endTime}`;
  }
  return `${formatDateTime(start, lang)} → ${formatDateTime(end, lang)}`;
}
