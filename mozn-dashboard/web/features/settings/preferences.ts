/**
 * Client-side settings preferences. Theme and language are owned by their own
 * providers (next-themes / locale cookie); everything here is EWS operational
 * config that persists to localStorage — standing in for the real backend
 * settings endpoints, exactly like admin-config-provider does for citizen copy.
 */

export type TempUnit = "c" | "f";
export type WindUnit = "kmh" | "ms" | "kt";
export type Volume = "off" | "low" | "med" | "high";
export type RefreshInterval = "off" | "30s" | "1m" | "5m" | "15m";

export interface SettingsPreferences {
  // Appearance (non-theme/language)
  tempUnit: TempUnit;
  windUnit: WindUnit;
  // Alerting & escalation
  notif: Record<string, boolean>; // urgency tiers, keyed by backend pref id
  alertSound: boolean;
  alertVolume: Volume;
  slaAckMinutes: number;
  // Live data
  refreshInterval: RefreshInterval;
  defaultRegion: string;
}

/**
 * Blank starting point for every operational preference — no fabricated
 * thresholds or picks ship by default. Two kinds of field keep a valid in-type
 * value rather than a literal empty: unit-system toggles (`tempUnit`/`windUnit`,
 * whose unions have no neutral member) and the numeric config fields, which
 * default to their editor's declared `min` floor (see settings-view.tsx) so the
 * value is never below range. Everything else uses its type's empty/off value.
 */
export const DEFAULT_PREFERENCES: SettingsPreferences = {
  tempUnit: "c",
  windUnit: "kmh",
  notif: {},
  alertSound: false,
  alertVolume: "off",
  slaAckMinutes: 2,
  refreshInterval: "off",
  defaultRegion: "",
};

const STORAGE_KEY = "mozn-settings";

/**
 * Merge persisted preferences over the given defaults. Safe to call only on the
 * client (guards against SSR / unavailable or corrupt storage). `notif` is
 * merged one level deep so the backend-seeded tier map is preserved.
 */
export function loadPreferences(defaults: SettingsPreferences): SettingsPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SettingsPreferences>;
    return {
      ...defaults,
      ...parsed,
      notif: { ...defaults.notif, ...(parsed.notif ?? {}) },
    };
  } catch {
    return defaults;
  }
}

/** Fired after preferences are saved so live consumers (auto-refresh, SLA,
 * unit displays) can re-read without a full reload. */
export const PREFS_CHANGED_EVENT = "mozn-settings-changed";

export function savePreferences(prefs: SettingsPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event(PREFS_CHANGED_EVENT));
  } catch {
    /* storage unavailable */
  }
}
