import "server-only";

import type { DashboardOverview, MapStation, AttentionItem, ActivityItem } from "@/types/dashboard";
import type { StationsPage, StationRow, StationRegionGroup } from "@/types/stations";
import type { AlertInboxPage, InboxItem } from "@/types/alert-inbox";
import type { ThresholdsPage, MetricThresholds, ThresholdTier, ScaleStop, ThresholdChange } from "@/types/thresholds";
import type { UsersPage, UserRow } from "@/types/users";
import type { AlertHistoryPage, AlertHistoryRow } from "@/types/history";
import type { ActivityLogPage, ActivityRow, ActivityDayGroup } from "@/types/activity";
import type { SettingsPage, NotificationPref, ValidationRule } from "@/types/settings";
import type { ActivityCategory, ThresholdMetric } from "@/types/shared";

import { backendData, backendFetch } from "@/lib/backend";
import type {
  BackendAlert,
  BackendAuditLog,
  BackendDashboardStats,
  BackendMunicipality,
  BackendRegion,
  BackendStation,
  BackendSystemSetting,
  BackendThreshold,
  BackendThresholdHistory,
  BackendUser,
  BackendValidationRule,
} from "@/lib/backend-types";
import {
  duration,
  elapsed,
  healthStatusToMapStatus,
  historySeverity,
  initials,
  isStationOnline,
  mapBackendRole,
  municipalityRegionName,
  paramLabel,
  paramToMetric,
  paramUnit,
  relativeTime,
  severityToTier,
  splitDateTime,
  stationOpStatus,
} from "@/lib/mappers";

export { ApiError } from "@/lib/backend";

// ── Best-effort supplementary loaders ──────────────────────────────────────
// Name/lookup data that enriches a screen but shouldn't fail it. Region-scoped
// (gov) callers may lack some list permissions; on any error we fall back to
// empty so the page still renders with IDs elided rather than 500-ing.

async function loadRegions(): Promise<BackendRegion[]> {
  try {
    return await backendData<BackendRegion[]>("/api/regions?page_size=100");
  } catch {
    return [];
  }
}

async function loadMunicipalities(): Promise<BackendMunicipality[]> {
  try {
    return await backendData<BackendMunicipality[]>("/api/municipalities?page_size=1000");
  } catch {
    return [];
  }
}

async function loadStationsAll(): Promise<BackendStation[]> {
  try {
    return await backendData<BackendStation[]>("/api/stations?page_size=1000");
  } catch {
    return [];
  }
}

async function loadUsersAll(): Promise<BackendUser[]> {
  try {
    return await backendData<BackendUser[]>("/api/users?page_size=1000");
  } catch {
    return [];
  }
}

/** stationId → { name, region } via municipality→region join. */
function stationLookup(
  stations: BackendStation[],
  muniRegion: Map<string, string>,
): Map<string, { name: string; region: string }> {
  return new Map(
    stations.map((s) => [s.id, { name: s.name, region: muniRegion.get(s.municipality_id) ?? "—" }]),
  );
}

function userNameMap(users: BackendUser[]): Map<string, string> {
  return new Map(users.map((u) => [u.id, u.name]));
}

// ── Dashboard overview (A1) ─────────────────────────────────────────────────

export async function getDashboardOverview(): Promise<DashboardOverview> {
  // Primary source — failure here should surface as a page error.
  const stats = await backendData<BackendDashboardStats>("/api/dashboard/stats");

  // Supplementary context (best-effort).
  const [regions, municipalities, stations, users, activeAlerts, audit] = await Promise.all([
    loadRegions(),
    loadMunicipalities(),
    loadStationsAll(),
    loadUsersAll(),
    backendData<BackendAlert[]>("/api/alerts?is_active=true&page_size=500").catch(() => [] as BackendAlert[]),
    backendData<BackendAuditLog[]>("/api/audit-logs?page_size=20").catch(() => [] as BackendAuditLog[]),
  ]);

  const muniRegion = municipalityRegionName(municipalities, regions);
  const stationRegion = new Map(stations.map((s) => [s.id, muniRegion.get(s.municipality_id) ?? "—"]));
  const users_ = userNameMap(users);

  const maintenanceCount = stations.filter((s) => s.operational_status === "maintenance").length;

  const stats_ = [
    { id: "online", label: "Stations online", value: stats.active_stations, total: stats.total_stations, tone: "online" as const },
    { id: "offline", label: "Offline", value: stats.offline_stations, tone: "offline" as const },
    { id: "maintenance", label: "Maintenance", value: maintenanceCount, tone: "maintenance" as const },
    { id: "anomaly", label: "Anomaly", value: stats.needs_attention.anomaly_stations, tone: "anomaly" as const },
    { id: "alerts", label: "Active alerts", value: stats.active_alerts, tone: "alert" as const },
  ];

  // Per-station active-alert tallies for the map pins.
  const alertCounts = new Map<string, { total: number; yellow: number; orange: number; red: number }>();
  for (const a of activeAlerts) {
    if (!a.station_id) continue;
    const c = alertCounts.get(a.station_id) ?? { total: 0, yellow: 0, orange: 0, red: 0 };
    c.total += 1;
    c[a.severity] += 1;
    alertCounts.set(a.station_id, c);
  }

  const mapStations: MapStation[] = stats.station_health.map((sh) => {
    const counts = alertCounts.get(sh.id);
    return {
      id: sh.id,
      name: sh.name,
      status: healthStatusToMapStatus(sh.status, sh.is_active, sh.last_seen_at),
      latitude: sh.latitude,
      longitude: sh.longitude,
      region: stationRegion.get(sh.id) ?? "—",
      reading: "", // admin health rows carry no reading value (honest-neutral)
      updated: relativeTime(sh.last_seen_at),
      ...(counts ? { activeAlerts: counts } : {}),
    };
  });

  // Needs attention: unacked active alerts + offline/anomaly health rows.
  const attention: AttentionItem[] = [];
  for (const a of activeAlerts.filter((x) => !x.acknowledged_at).slice(0, 6)) {
    attention.push({
      id: a.id,
      title: paramLabel(a.parameter),
      meta: `${a.station_id ? stationRegion.get(a.station_id) ?? "" : ""} · ${severityToTier(a.severity)}`.replace(/^ · /, ""),
      elapsed: elapsed(a.issued_at),
      severity: a.severity === "yellow" ? "advisory" : "warning",
    });
  }
  for (const sh of stats.station_health.filter((s) => healthStatusToMapStatus(s.status, s.is_active, s.last_seen_at) === "offline").slice(0, 4)) {
    attention.push({
      id: `offline-${sh.id}`,
      title: `${sh.name} offline`,
      meta: stationRegion.get(sh.id) ?? "No signal",
      elapsed: elapsed(sh.last_seen_at),
      severity: "offline",
    });
  }

  const recentActivity: ActivityItem[] = audit
    .filter((l) => l.action !== "view")
    .slice(0, 5)
    .map((l) => {
      const { date, time } = splitDateTime(l.created_at);
      const actor = (l.user_id && users_.get(l.user_id)) || "System";
      return {
        id: l.id,
        actor,
        initials: initials(actor),
        action: describeAudit(l.action, l.resource_type),
        category: auditCategory(l.resource_type, l.action),
        source: l.ip_address || "—",
        date,
        time,
      };
    });

  // Per-region station rollup.
  const regionRollup = new Map<string, { id: string; name: string; online: number; total: number }>();
  for (const r of regions) regionRollup.set(r.name, { id: r.id, name: r.name, online: 0, total: 0 });
  for (const s of stations) {
    const rname = stationRegion.get(s.id) ?? "—";
    const row = regionRollup.get(rname) ?? { id: rname, name: rname, online: 0, total: 0 };
    row.total += 1;
    if (isStationOnline(s)) row.online += 1;
    regionRollup.set(rname, row);
  }

  return {
    header: {
      title: "System Overview",
      statusLabel: `${stats.active_stations}/${stats.total_stations} stations reporting`,
      live: true,
    },
    stats: stats_,
    map: {
      title: "Station Health Map",
      subtitle: `Live status across ${stats.total_stations} stations`,
      coverageNote: "",
      stations: mapStations,
    },
    needsAttention: {
      openCount:
        stats.needs_attention.unacknowledged_alerts +
        stats.needs_attention.offline_stations +
        stats.needs_attention.anomaly_stations,
      items: attention,
    },
    recentActivity,
    regions: [...regionRollup.values()].filter((r) => r.name !== "—" || r.total > 0),
  };
}

// ── Stations (A2) ───────────────────────────────────────────────────────────

export async function getStations(): Promise<StationsPage> {
  const { data: stations, meta } = await backendFetch<BackendStation[]>("/api/stations?page_size=1000");
  const [regions, municipalities] = await Promise.all([loadRegions(), loadMunicipalities()]);
  const muniRegion = municipalityRegionName(municipalities, regions);

  const rows: (StationRow & { region: string })[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    nameAr: s.name_ar,
    region: muniRegion.get(s.municipality_id) ?? "—",
    status: stationOpStatus(s),
    reading: "", // admin list carries no latest-reading metric (honest-neutral)
    signal: 0, // WU feed exposes no signal strength — neutral
    battery: null, // WU exposes only a boolean on readings, not on the station
    lastReading: relativeTime(s.last_seen_at),
  }));

  // Group by region, preserving region order from the regions list.
  const order = regions.map((r) => r.name);
  const byRegion = new Map<string, StationRow[]>();
  for (const r of rows) {
    const list = byRegion.get(r.region) ?? [];
    list.push(r);
    byRegion.set(r.region, list);
  }
  const groups: StationRegionGroup[] = [...byRegion.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([region, groupRows]) => ({
      region,
      total: groupRows.length,
      online: groupRows.filter((x) => x.status === "online").length,
      rows: groupRows,
    }));

  const count = (pred: (r: StationRow) => boolean) => rows.filter(pred).length;
  const total = meta?.total ?? rows.length;
  const needAttention = count((r) => r.status === "offline" || r.status === "anomaly" || r.status === "warning");

  return {
    total,
    regionCount: groups.length,
    needAttention,
    filters: [
      { key: "all", label: "All", count: rows.length },
      { key: "online", label: "Online", count: count((r) => r.status === "online") },
      { key: "offline", label: "Offline", count: count((r) => r.status === "offline") },
      { key: "maintenance", label: "Maintenance", count: count((r) => r.status === "maintenance") },
      { key: "anomaly", label: "Anomaly", count: count((r) => r.status === "anomaly") },
    ],
    groups,
  };
}

// ── Alert inbox (A3.3) ───────────────────────────────────────────────────────

const SLA_SECONDS = 120; // 2-minute triage SLA (design)

export async function getAlertInbox(): Promise<AlertInboxPage> {
  const alerts = await backendData<BackendAlert[]>("/api/alerts?status=pending&is_active=true&page_size=200");
  const [regions, municipalities, stations] = await Promise.all([
    loadRegions(),
    loadMunicipalities(),
    loadStationsAll(),
  ]);
  const lookup = stationLookup(stations, municipalityRegionName(municipalities, regions));

  const now = Date.now();
  const items: InboxItem[] = alerts.map((a) => {
    const st = a.station_id ? lookup.get(a.station_id) : undefined;
    const ageSec = Math.round((now - new Date(a.issued_at).getTime()) / 1000);
    const remaining = SLA_SECONDS - ageSec;
    const mmss = (secs: number) => `${Math.floor(Math.abs(secs) / 60)}:${String(Math.abs(secs) % 60).padStart(2, "0")}`;
    const sla =
      a.urgency === "routine"
        ? { label: "No SLA", tone: "muted" as const }
        : remaining > 0
          ? { label: `${mmss(remaining)} to SLA`, tone: remaining < 60 ? ("danger" as const) : ("ok" as const) }
          : { label: "SLA passed", tone: "danger" as const };

    return {
      id: a.id,
      severity: a.urgency, // routine | urgent | critical == InboxSeverity
      title: paramLabel(a.parameter),
      context: [st?.name, st?.region, a.source].filter(Boolean).join(" · "),
      timeAgo: relativeTime(a.issued_at),
      sla,
      metrics: [
        { label: paramLabel(a.parameter), value: `${a.value}${paramUnit(a.parameter)}`, threshold: "" },
      ],
      meter: a.starts_at
        ? { label: "WINDOW", value: new Date(a.starts_at).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" }) }
        : { label: "ISSUED", value: relativeTime(a.issued_at) },
      recommended: "", // backend supplies no recommended-action text (honest-neutral)
    };
  });

  const byUrgency = (u: string) => items.filter((i) => i.severity === u).length;
  return {
    avgAck: "—",
    slaNote: "Triage critical items within the 2-minute SLA.",
    filters: [
      { key: "all", label: "All", count: items.length },
      { key: "critical", label: "Critical", count: byUrgency("critical") },
      { key: "urgent", label: "Urgent", count: byUrgency("urgent") },
      { key: "routine", label: "Routine", count: byUrgency("routine") },
    ],
    items,
  };
}

// ── Thresholds (A3.0) ────────────────────────────────────────────────────────

const METRIC_LABEL: Record<ThresholdMetric, string> = {
  rainfall: "Rainfall",
  wind: "Wind",
  water: "Water level",
  temperature: "Temperature",
};

export async function getThresholds(): Promise<ThresholdsPage> {
  const [thresholds, history, users] = await Promise.all([
    backendData<BackendThreshold[]>("/api/thresholds?page_size=500"),
    backendData<BackendThresholdHistory[]>("/api/thresholds/history?page_size=50").catch(() => [] as BackendThresholdHistory[]),
    loadUsersAll(),
  ]);
  const users_ = userNameMap(users);

  // Group thresholds by UI metric.
  const byMetric = new Map<ThresholdMetric, BackendThreshold[]>();
  for (const t of thresholds) {
    const m = paramToMetric(t.parameter);
    if (!m) continue;
    byMetric.set(m, [...(byMetric.get(m) ?? []), t]);
  }

  const severityRank = (s: string) => (s === "red" ? 3 : s === "orange" ? 2 : 1);
  const metrics: MetricThresholds[] = [...byMetric.entries()].map(([metric, list]) => {
    const sorted = [...list].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    const unit = paramUnit(sorted[0]?.parameter ?? "");
    const tiers: ThresholdTier[] = sorted.map((t) => {
      const tier = severityToTier(t.severity);
      return {
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        mode: t.severity === "red" ? "manual" : "auto",
        description: paramLabel(t.parameter),
        value: String(t.value),
        unit: paramUnit(t.parameter),
        sustained: t.sustain_duration_minutes ? `sustained ${t.sustain_duration_minutes} min` : "",
      };
    });
    const scale: ScaleStop[] = [
      { label: "Normal", value: "", tone: "normal" },
      ...sorted.map((t) => ({ label: severityToTier(t.severity), value: String(t.value), tone: severityToTier(t.severity) })),
    ];
    return {
      metric,
      label: METRIC_LABEL[metric],
      unit,
      perStationOverrides: false, // backend thresholds are region-level only
      tiers,
      scale,
    };
  });

  const changes: ThresholdChange[] = history.map((h) => {
    const tier = severityToTier(h.severity);
    const unit = paramUnit(h.parameter);
    const valueText =
      h.previous_value != null && h.previous_value !== h.value
        ? `${h.previous_value} → ${h.value}${unit}`
        : `${h.value}${unit}`;
    const verb = h.action === "created" ? "added" : h.action === "deleted" ? "removed" : h.action === "reverted" ? "reverted" : "";
    return {
      id: h.id,
      change: `${paramLabel(h.parameter)} · ${tier.charAt(0).toUpperCase() + tier.slice(1)} ${verb ? verb + " " : ""}${valueText}`.trim(),
      by: (h.changed_by && users_.get(h.changed_by)) || "—",
      when: relativeTime(h.created_at),
    };
  });

  return { metrics, impact: { note: "", stations: [] }, changes };
}

// ── Users (A4) ────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UsersPage> {
  const users = await backendData<BackendUser[]>("/api/users?page_size=500");

  const rows: UserRow[] = users.map((u) => {
    const role = mapBackendRole(u.role?.name ?? "viewer");
    const regionNames = (u.regions ?? []).map((r) => r.name);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      initials: initials(u.name),
      role,
      regions: role === "Super Admin" ? "All regions" : regionNames.join(", ") || "—",
      lastActive: relativeTime(u.last_active_at),
      active: u.is_active,
      ...(u.phone ? { phone: u.phone } : {}),
      ...(u.organization ? { organization: u.organization } : {}),
    };
  });

  const adminCount = rows.filter((r) => r.role === "Super Admin").length;
  const govCount = rows.filter((r) => r.role !== "Super Admin").length;

  return {
    adminCount,
    govCount,
    filters: [
      { key: "all", label: "All roles", count: rows.length },
      { key: "super-admin", label: "Super Admin", count: rows.filter((r) => r.role === "Super Admin").length },
      { key: "gov-editor", label: "Gov Editor", count: rows.filter((r) => r.role === "Gov Editor").length },
      { key: "gov-viewer", label: "Gov Viewer", count: rows.filter((r) => r.role === "Gov Viewer").length },
    ],
    users: rows,
  };
}

// ── Alert history (A5.0) ──────────────────────────────────────────────────────

export async function getAlertHistory(): Promise<AlertHistoryPage> {
  const alerts = await backendData<BackendAlert[]>("/api/alerts?page_size=200");
  const [regions, municipalities, stations] = await Promise.all([
    loadRegions(),
    loadMunicipalities(),
    loadStationsAll(),
  ]);
  const lookup = stationLookup(stations, municipalityRegionName(municipalities, regions));

  const rows: AlertHistoryRow[] = alerts.map((a) => {
    const st = a.station_id ? lookup.get(a.station_id) : undefined;
    const { date, time } = splitDateTime(a.issued_at);
    const autoCleared = (a.resolution_reason ?? "").toLowerCase().includes("clear") ||
      (a.resolution_reason ?? "").toLowerCase().includes("no breach") ||
      (a.resolution_reason ?? "").toLowerCase().includes("superseded");
    return {
      id: a.id,
      date,
      time,
      severity: historySeverity(a),
      alert: `${paramLabel(a.parameter)} — ${st?.name ?? st?.region ?? "—"}`,
      region: st?.region ?? "—",
      ackTime: a.acknowledged_at ? duration(a.issued_at, a.acknowledged_at) : "—",
      duration: a.resolved_at ? duration(a.issued_at, a.resolved_at) : "—",
      outcome: a.resolved_at ? (autoCleared ? "auto-cleared" : "all-clear") : "all-clear",
    };
  });

  const uniq = (xs: string[]) => [...new Set(xs.filter((x) => x && x !== "—"))];
  return {
    ranges: ["Last 24 hours", "Last 7 days", "Last 30 days", "Last 90 days"],
    regions: uniq(rows.map((r) => r.region)),
    types: uniq(alerts.map((a) => paramLabel(a.parameter))),
    severities: ["critical", "warning", "watch", "advisory"],
    rows,
  };
}

// ── Activity log (A5.1) ───────────────────────────────────────────────────────

function describeAudit(action: string, resource: string): string {
  if (action === "login") return "Signed in";
  const res = resource.replace(/-/g, " ");
  const verb: Record<string, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    confirm: "Confirmed",
    reject: "Rejected",
    dismiss: "Dismissed",
    acknowledge: "Acknowledged",
    escalate: "Escalated",
    modify: "Modified",
    revert: "Reverted",
  };
  const v = verb[action] ?? action.charAt(0).toUpperCase() + action.slice(1);
  return `${v} ${res}`.trim();
}

function auditCategory(resource: string, action: string): ActivityCategory {
  if (action === "login" || resource === "auth") return "auth";
  if (resource.startsWith("threshold")) return "threshold";
  if (resource.startsWith("alert")) return "alert";
  if (resource.startsWith("user")) return "user";
  if (resource.startsWith("station")) return "station";
  return "station";
}

function dayLabel(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  const today = new Date(now);
  const diffDays = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export async function getActivityLog(): Promise<ActivityLogPage> {
  const logs = await backendData<BackendAuditLog[]>("/api/audit-logs?page_size=200");
  const users = await loadUsersAll();
  const users_ = userNameMap(users);

  const meaningful = logs.filter((l) => l.action !== "view");

  const groupsMap = new Map<string, ActivityDayGroup>();
  for (const l of meaningful) {
    const { date, time } = splitDateTime(l.created_at);
    const actor = (l.user_id && users_.get(l.user_id)) || "System";
    const row: ActivityRow = {
      id: l.id,
      time,
      actor,
      initials: initials(actor),
      action: describeAudit(l.action, l.resource_type),
      category: auditCategory(l.resource_type, l.action),
      source: l.ip_address || "—",
    };
    const group = groupsMap.get(date) ?? { label: dayLabel(l.created_at), date, rows: [] };
    group.rows.push(row);
    groupsMap.set(date, group);
  }

  const groups = [...groupsMap.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  const actors = [...new Set(meaningful.map((l) => (l.user_id && users_.get(l.user_id)) || "System"))];
  const categories = [...new Set(meaningful.map((l) => auditCategory(l.resource_type, l.action)))];

  return { categories, users: actors, groups };
}

// ── Settings (A6.0) ───────────────────────────────────────────────────────────

function humanizeKey(key: string): string {
  return key.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getSettings(): Promise<SettingsPage> {
  const [settings, rules] = await Promise.all([
    backendData<BackendSystemSetting[]>("/api/settings?page_size=200").catch(() => [] as BackendSystemSetting[]),
    backendData<BackendValidationRule[]>("/api/validation-rules?page_size=200").catch(() => [] as BackendValidationRule[]),
  ]);

  const notifications: NotificationPref[] = settings.map((s) => ({
    id: s.key,
    title: humanizeKey(s.key),
    description: "",
    enabled: /^(true|1|on|yes|enabled)$/i.test(s.value.trim()),
  }));

  const validationRules: ValidationRule[] = rules.map((r) => {
    const u = paramUnit(r.parameter);
    const lo = r.valid_range_min;
    const hi = r.valid_range_max;
    const validRange =
      lo != null && hi != null
        ? `${lo} to ${hi}${u ? " " + u : ""}`
        : hi != null
          ? `≤ ${hi}${u ? " " + u : ""}`
          : lo != null
            ? `≥ ${lo}${u ? " " + u : ""}`
            : "—";
    const maxRate =
      r.max_rate_of_change != null
        ? `${r.max_rate_of_change}${u ? " " + u : ""}${r.rate_interval_min ? ` / ${r.rate_interval_min} min` : ""}`
        : "—";
    return { metric: paramLabel(r.parameter), validRange, maxRate, active: true };
  });

  return {
    notifications,
    validationNote:
      "Readings outside these bounds are flagged and withheld from the public map.",
    validationRules,
  };
}
