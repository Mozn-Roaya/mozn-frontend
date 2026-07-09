/**
 * Pure mapping helpers that reshape the raw Go backend JSON (lib/backend-types)
 * into the presentation-shaped page DTOs the screens consume (types/*). Kept
 * pure (no server-only, no fetch) so both the server adapters in lib/api.ts and
 * client components can import the small shared bits (role map, formatters).
 */

import type {
  UserRole,
  StationOpStatus,
  ThresholdMetric,
  AlertSeverity,
} from "@/types/shared";
import type {
  BackendAlert,
  BackendCurrentUser,
  BackendMunicipality,
  BackendRegion,
  BackendStation,
} from "@/lib/backend-types";

// ── Generic formatters ─────────────────────────────────────────────────────

/** Human relative time, e.g. "2 min ago". Null/absent → "Never". */
export function relativeTime(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const secs = Math.max(0, Math.round((now - then) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.round(months / 12)} year${months >= 24 ? "s" : ""} ago`;
}

/** Short elapsed label, e.g. "3m", "2h", "1d" — for SLA/attention meta. */
export function elapsed(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return "";
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Duration between two instants as "1h 04m" / "48s". */
export function duration(fromIso?: string | null, toIso?: string | null): string {
  if (!fromIso || !toIso) return "—";
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Up-to-two-letter initials from a display name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** ISO date (YYYY-MM-DD) and HH:MM (24h) split, for date/time columns. */
export function splitDateTime(iso: string): { date: string; time: string; iso: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    iso,
  };
}

// ── Role / session ─────────────────────────────────────────────────────────

/** Map a backend role name to the dashboard's three UI roles. */
export function mapBackendRole(backendRole: string): UserRole {
  switch (backendRole) {
    case "admin":
    case "operator":
      return "Super Admin";
    case "gov_editor":
      return "Gov Editor";
    case "gov_viewer":
    case "viewer":
    default:
      return "Gov Viewer";
  }
}

/** Any permission that lets a role mutate state (drives read-only gating). */
const WRITE_PERMISSION = /\.(create|update|delete|manage|confirm|reject|dismiss|acknowledge|escalate|modify)$/;

export function canWrite(permissions: string[]): boolean {
  return permissions.some((p) => WRITE_PERMISSION.test(p));
}

/** The signed-in user, shaped for the client RoleProvider / UserCard. */
export interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
  isGov: boolean;
  readOnly: boolean;
  assignedRegion: string;
}

/**
 * Build the client session view from /api/me. `regionNameById` resolves the
 * user's scoped-region UUIDs to names (best-effort; may be empty if the caller
 * lacks regions.view). Admins (unscoped) show "All regions".
 */
export function buildSessionUser(
  me: BackendCurrentUser,
  regionNameById: Map<string, string>,
): SessionUser {
  const names = me.regions
    .map((id) => regionNameById.get(id))
    .filter((n): n is string => Boolean(n));
  const assignedRegion = me.is_region_scoped
    ? names.join(", ") || "Assigned region"
    : "All regions";
  return {
    name: me.name,
    email: me.email,
    role: mapBackendRole(me.role),
    isGov: me.is_region_scoped,
    readOnly: !canWrite(me.permissions),
    assignedRegion,
  };
}

// ── Region / station joins ─────────────────────────────────────────────────

/** region_id → region name. */
export function regionNameMap(regions: BackendRegion[]): Map<string, string> {
  return new Map(regions.map((r) => [r.id, r.name]));
}

/** municipality_id → region name (via the municipality's region_id). */
export function municipalityRegionName(
  municipalities: BackendMunicipality[],
  regions: BackendRegion[],
): Map<string, string> {
  const regionById = regionNameMap(regions);
  return new Map(
    municipalities.map((m) => [m.id, regionById.get(m.region_id) ?? "—"]),
  );
}

/** Default offline cutoff when a station declares no reporting cadence. */
const DEFAULT_STALE_MINUTES = 30;
const STALE_MULTIPLIER = 3;

/**
 * Best-effort online/offline derivation for the admin list (which returns raw
 * stations, unlike the public endpoints' server-derived status). A station is
 * offline when deactivated, inactive, or its last reading is older than a few
 * reporting intervals. Approximates the backend's own freshness rule.
 */
export function isStationOnline(s: BackendStation, now: number = Date.now()): boolean {
  if (!s.is_active || s.operational_status === "deactivated") return false;
  if (!s.last_seen_at) return false;
  const interval = s.report_interval_minutes ?? DEFAULT_STALE_MINUTES;
  const staleMs = Math.max(interval * STALE_MULTIPLIER, DEFAULT_STALE_MINUTES) * 60_000;
  return now - new Date(s.last_seen_at).getTime() <= staleMs;
}

/** Collapse a raw station's flags into the UI's operational status union. */
export function stationOpStatus(
  s: BackendStation,
  now: number = Date.now(),
): StationOpStatus {
  if (s.operational_status === "maintenance") return "maintenance";
  if (!isStationOnline(s, now)) return "offline";
  if (s.status === "anomaly") return "anomaly";
  if (s.data_status === "partial") return "warning";
  return "online";
}

/** Map the dashboard station-health row status to the map pin's 3-state union. */
export function healthStatusToMapStatus(
  status: string,
  isActive: boolean,
  lastSeenAt?: string | null,
): "online" | "warning" | "offline" {
  const s = status.toLowerCase();
  if (!isActive || s.includes("offline") || s.includes("deactivated")) return "offline";
  if (!lastSeenAt) return "offline";
  if (s.includes("anomaly") || s.includes("warning") || s.includes("degraded") || s.includes("maintenance"))
    return "warning";
  return "online";
}

// ── Metric / severity vocabulary (mirrors constants/weather.go) ─────────────

const PARAM_TO_METRIC: Record<string, ThresholdMetric> = {
  rain_rate_mm: "rainfall",
  rain_daily_mm: "rainfall",
  wind_speed_kmh: "wind",
  wind_gust_kmh: "wind",
  temp_high_c: "temperature",
  temp_low_c: "temperature",
};

export function paramToMetric(param: string): ThresholdMetric | undefined {
  return PARAM_TO_METRIC[param];
}

const PARAM_LABEL: Record<string, string> = {
  rain_rate_mm: "Rainfall rate",
  rain_daily_mm: "Daily rainfall",
  wind_speed_kmh: "Wind speed",
  wind_gust_kmh: "Wind gust",
  temp_high_c: "High temperature",
  temp_low_c: "Low temperature",
  pressure_hpa: "Air pressure",
  humidity: "Humidity",
};

export function paramLabel(param: string): string {
  return PARAM_LABEL[param] ?? param;
}

const PARAM_UNIT: Record<string, string> = {
  rain_rate_mm: "mm/hr",
  rain_daily_mm: "mm",
  wind_speed_kmh: "km/h",
  wind_gust_kmh: "km/h",
  temp_high_c: "°C",
  temp_low_c: "°C",
  pressure_hpa: "hPa",
  humidity: "%",
};

export function paramUnit(param: string): string {
  return PARAM_UNIT[param] ?? "";
}

/** Design severity map: yellow=advisory, orange=watch, red=warning. */
export function severityToTier(severity: string): "advisory" | "watch" | "warning" {
  if (severity === "red") return "warning";
  if (severity === "orange") return "watch";
  return "advisory";
}

/**
 * History/badge severity (critical | warning | watch | advisory). Compound or
 * critical-urgency alerts read as "critical"; otherwise the colour tier maps by
 * severity.
 */
export function historySeverity(alert: BackendAlert): AlertSeverity {
  if (alert.urgency === "critical" || alert.source === "compound") return "critical";
  return severityToTier(alert.severity);
}

