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

/** Icon chip treatment for "Needs attention" rows by severity. */
export const ATTENTION_SEVERITY: Record<
  AttentionSeverity,
  { chipClass: string }
> = {
  warning: { chipClass: "bg-status-warning/10 text-status-warning" },
  advisory: { chipClass: "bg-status-advisory/10 text-status-advisory" },
  offline: { chipClass: "bg-status-offline/15 text-status-offline" },
};
