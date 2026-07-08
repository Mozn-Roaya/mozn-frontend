/**
 * Per-city emergency contact numbers shown in the citizen alert card. Numbers
 * are scoped to a city (many stations can share one city), not to each station
 * and not nationally. Edited in the station form and stored city-keyed in the
 * admin config store, so every station in a city shares one set of numbers.
 */
export interface EmergencyContacts {
  emergencyServices: string;
  civilDefense: string;
}

/**
 * National fallback used when a city has no configured numbers. Empty until an
 * admin sets real numbers (station form) or the backend supplies them — no
 * placeholder digits ship by default.
 */
export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContacts = {
  emergencyServices: "",
  civilDefense: "",
};

/**
 * Normalise a city (or a station name whose first token is the city) into a
 * stable key for the city → contacts map. "Coastal Port" → "coastal".
 */
export function cityKey(value: string): string {
  return value.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}
