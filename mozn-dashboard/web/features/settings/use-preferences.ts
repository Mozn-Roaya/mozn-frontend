"use client";

import * as React from "react";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  PREFS_CHANGED_EVENT,
  type SettingsPreferences,
} from "./preferences";

/**
 * Live view of the operator's saved preferences. Returns DEFAULT_PREFERENCES on
 * the server and first client render (so hydration matches), then the persisted
 * values after mount — and re-reads whenever preferences are saved (same tab via
 * PREFS_CHANGED_EVENT, other tabs via `storage`).
 */
export function usePreferences(): SettingsPreferences {
  const [prefs, setPrefs] = React.useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  React.useEffect(() => {
    const read = () => setPrefs(loadPreferences(DEFAULT_PREFERENCES));
    read();
    window.addEventListener(PREFS_CHANGED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PREFS_CHANGED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return prefs;
}
