"use client";

import * as React from "react";

import {
  cityKey,
  DEFAULT_EMERGENCY_CONTACTS,
  type EmergencyContacts,
} from "@/lib/emergency-contacts";
import type { LocalizedStep } from "@/types/shared";

const STORAGE_KEY = "mozn-admin-config";

/**
 * Coerce persisted steps to the bilingual shape. Older stored data (and any
 * external writer) may hold plain `string[]`; treat each string as the English
 * text with an empty Arabic side so nothing is silently dropped.
 */
function normalizeTemplateSteps(
  raw: Record<string, unknown> | undefined,
): Record<string, LocalizedStep[]> {
  const out: Record<string, LocalizedStep[]> = {};
  if (!raw) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    out[key] = value.map((step) =>
      typeof step === "string"
        ? { en: step, ar: "" }
        : {
            en: typeof (step as LocalizedStep)?.en === "string" ? (step as LocalizedStep).en : "",
            ar: typeof (step as LocalizedStep)?.ar === "string" ? (step as LocalizedStep).ar : "",
          },
    );
  }
  return out;
}

/**
 * Per-city emergency numbers (keyed by normalised city). Empty until an admin
 * sets numbers for a city via the station form; `contactsForCity` falls back
 * to `DEFAULT_EMERGENCY_CONTACTS` for any city with no entry here.
 */
export const DEFAULT_CITY_CONTACTS: Record<string, EmergencyContacts> = {};

interface AdminConfigValue {
  /** Emergency numbers keyed by normalised city (see `cityKey`). */
  cityContacts: Record<string, EmergencyContacts>;
  setCityContacts: (city: string, next: EmergencyContacts) => void;
  /** Resolve numbers for a city (or a station name); falls back to the national default. */
  contactsForCity: (cityOrName?: string) => EmergencyContacts;
  /** Response steps keyed by event template (e.g. "flashFlood"). */
  templateSteps: Record<string, LocalizedStep[]>;
  setTemplateSteps: (eventKey: string, steps: LocalizedStep[]) => void;
}

const AdminConfigContext = React.createContext<AdminConfigValue>({
  cityContacts: DEFAULT_CITY_CONTACTS,
  setCityContacts: () => {},
  contactsForCity: () => DEFAULT_EMERGENCY_CONTACTS,
  templateSteps: {},
  setTemplateSteps: () => {},
});

type Persisted = {
  cityContacts?: Record<string, EmergencyContacts>;
  templateSteps?: Record<string, unknown>;
};

/**
 * Session-wide store for admin-authored content that the citizen-facing card
 * reads back live: national emergency numbers and per-event response steps.
 * Persisted to localStorage so edits survive reloads. (Stands in for the
 * real backend config endpoints.)
 */
export function AdminConfigProvider({ children }: { children: React.ReactNode }) {
  const [cityContacts, setCityContactsState] =
    React.useState<Record<string, EmergencyContacts>>(DEFAULT_CITY_CONTACTS);
  const [templateSteps, setTemplateStepsState] =
    React.useState<Record<string, LocalizedStep[]>>({});

  // Load persisted values after mount. This must run client-only: reading
  // localStorage during SSR is impossible and seeding it into initial state
  // would diverge the server/client markup, so the one-time hydrate here is
  // deliberate (hence the set-state-in-effect exception below).
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Persisted;
      /* eslint-disable react-hooks/set-state-in-effect -- see the comment above: one-time client-only hydrate from localStorage */
      if (parsed.cityContacts) {
        setCityContactsState((prev) => ({ ...prev, ...parsed.cityContacts }));
      }
      if (parsed.templateSteps) {
        setTemplateStepsState((prev) => ({
          ...prev,
          ...normalizeTemplateSteps(parsed.templateSteps),
        }));
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* storage unavailable / corrupt */
    }
  }, []);

  const persist = React.useCallback((next: Persisted) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as Persisted) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setCityContacts = React.useCallback(
    (city: string, next: EmergencyContacts) => {
      setCityContactsState((prev) => {
        const merged = { ...prev, [cityKey(city)]: next };
        persist({ cityContacts: merged });
        return merged;
      });
    },
    [persist],
  );

  const contactsForCity = React.useCallback(
    (cityOrName?: string): EmergencyContacts =>
      (cityOrName ? cityContacts[cityKey(cityOrName)] : undefined) ?? DEFAULT_EMERGENCY_CONTACTS,
    [cityContacts],
  );

  const setTemplateSteps = React.useCallback(
    (eventKey: string, steps: LocalizedStep[]) => {
      setTemplateStepsState((prev) => {
        const merged = { ...prev, [eventKey]: steps };
        persist({ templateSteps: merged });
        return merged;
      });
    },
    [persist],
  );

  const value = React.useMemo<AdminConfigValue>(
    () => ({ cityContacts, setCityContacts, contactsForCity, templateSteps, setTemplateSteps }),
    [cityContacts, setCityContacts, contactsForCity, templateSteps, setTemplateSteps],
  );

  return <AdminConfigContext.Provider value={value}>{children}</AdminConfigContext.Provider>;
}

export function useAdminConfig() {
  return React.useContext(AdminConfigContext);
}
