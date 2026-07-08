/**
 * Stations domain types. The contract types live in the shared types/ layer
 * (mirroring the Go internal/model) so the fetch layer and shared components can
 * reference them without importing this feature; re-exported here for the
 * stations feature's own components.
 */
export type * from "@/types/stations";
