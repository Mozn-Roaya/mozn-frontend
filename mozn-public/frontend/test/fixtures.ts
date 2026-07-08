import type { Station } from "@/components/api/types";

/**
 * Build a fully-typed `Station` for tests. Defaults to a quiet "normal"
 * station with no alerts; pass overrides to exercise specific branches.
 */
export function makeStation(overrides: Partial<Station> = {}): Station {
  return {
    id: "st-1",
    municipality_id: "m-1",
    wu_station_id: "wu-1",
    name: "Tripoli",
    name_ar: "طرابلس",
    station_type: "aws",
    latitude: 32.0,
    longitude: 13.0,
    elevation: 10,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    status: "normal",
    ...overrides,
  };
}
