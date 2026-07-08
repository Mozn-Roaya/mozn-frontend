// Lightweight i18n for the dashboard. Pure (no next/headers) so it is safe to
// import from both client and server components. Server code reads the locale
// from the cookie via `getServerLocale` in lib/i18n-server.ts; client code uses
// the `useT()` hook from the locale provider. Both resolve against this dict.

export type Locale = "en" | "ar";

export type Entry = { en: string; ar: string };

/**
 * Flat, namespaced translation table (e.g. "nav.dashboard", "stations.title").
 * Values may contain {placeholders} filled by `translate(..., vars)`.
 * Sections are merged in from per-area maps to keep this readable.
 */
import { chrome } from "./i18n/chrome";
import { dataDict } from "./i18n/data";
import { dashboard } from "./i18n/dashboard";
import { stations } from "./i18n/stations";
import { alertInbox } from "./i18n/alert-inbox";
import { thresholds } from "./i18n/thresholds";
import { history } from "./i18n/history";
import { users } from "./i18n/users";
import { settings } from "./i18n/settings";
import { alertTemplates } from "./i18n/alert-templates";
import { alertManagement } from "./i18n/alert-management";
import { gov } from "./i18n/gov";

export const dict: Record<string, Entry> = {
  ...chrome,
  ...dashboard,
  ...stations,
  ...alertInbox,
  ...thresholds,
  ...history,
  ...users,
  ...settings,
  ...alertTemplates,
  ...alertManagement,
  ...gov,
};

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const entry = dict[key];
  let out = entry ? entry[locale] ?? entry.en : key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

/**
 * Translate a backend-supplied free-text data value (proper nouns, readings,
 * relative times, fixture copy). Unlike `translate`, this is keyed on the raw
 * English value and falls back to that value unchanged — so untranslated or
 * English-locale data renders verbatim instead of showing a missing key.
 */
export function translateData(
  locale: Locale,
  value: string | null | undefined,
): string {
  if (value == null) return value as unknown as string;
  if (locale !== "ar") return value;
  return dataDict[value] ?? value;
}
