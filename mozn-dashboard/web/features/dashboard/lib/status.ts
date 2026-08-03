import type { AttentionSeverity, StationStatus } from "@/features/dashboard/types";

/** Dot / pill colors for live station statuses on the map and legend. */
export const STATION_STATUS: Record<
  StationStatus,
  { label: string; dotClass: string; pinClass: string }
> = {
  online: {
    label: "Online",
    dotClass: "bg-status-normal",
    pinClass: "bg-status-normal/15 text-status-normal",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-status-warning",
    pinClass: "bg-status-warning/15 text-status-warning",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-status-offline",
    pinClass: "bg-status-offline/20 text-status-offline",
  },
};

/**
 * The map legend key, in the order it reads (escalating). Kept separate from
 * `STATION_STATUS` because the legend is a coarse grouping, not a station
 * status: "advisory" is the yellow alert tier, which the backend never emits as
 * a `StationStatus`. The six pin kinds collapse into these four entries:
 *
 *   online   → online pins
 *   advisory → yellow-tier alert pins
 *   warning  → warning, plus orange- and red-tier alert pins
 *   offline  → offline pins
 *
 * Advisory borrows the orange severity hue rather than `--status-advisory` so
 * the key reads green → orange → red → grey, matching the public map's legend.
 */
export const MAP_LEGEND: ReadonlyArray<{
  key: string;
  dotClass: string;
  labelKey: string;
}> = [
  { key: "online", dotClass: "bg-status-normal", labelKey: "status.online" },
  {
    key: "advisory",
    dotClass: "bg-severity-orange",
    labelKey: "status.advisory",
  },
  { key: "warning", dotClass: "bg-status-warning", labelKey: "status.warning" },
  { key: "offline", dotClass: "bg-status-offline", labelKey: "status.offline" },
];

/** Icon chip treatment for "Needs attention" rows by severity. */
export const ATTENTION_SEVERITY: Record<
  AttentionSeverity,
  { chipClass: string }
> = {
  warning: { chipClass: "bg-status-warning/10 text-status-warning" },
  advisory: { chipClass: "bg-status-advisory/10 text-status-advisory" },
  offline: { chipClass: "bg-status-offline/15 text-status-offline" },
};
