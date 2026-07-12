import "server-only";

import type { DashboardOverview, MapStation, AttentionItem, ActivityItem } from "@/types/dashboard";
import type {
  StationsPage,
  StationRow,
  StationRegionGroup,
  StationDetailData,
  StationWriteInput,
} from "@/types/stations";
import type { AlertInboxPage, InboxItem } from "@/types/alert-inbox";
import type { ThresholdsPage, MetricThresholds, ThresholdTier, ScaleStop, ThresholdChange, CompoundRule } from "@/types/thresholds";
import type {
  UsersPage,
  UserRow,
  CreateUserInput,
  UpdateUserInput,
  RegionOption,
} from "@/types/users";
import type { AlertHistoryPage, AlertHistoryRow } from "@/types/history";
import type { ActivityLogPage, ActivityRow, ActivityDayGroup, AuditLogDetail } from "@/types/activity";
import type { SettingsPage, NotificationPref, ValidationRule } from "@/types/settings";
import type { ActivityCategory, ThresholdMetric, WeatherParameter } from "@/types/shared";
import type { RoleMatrix } from "@/types/roles";

import { backendData, backendFetch, backendMutate, getCurrentUser, type MutationResult } from "@/lib/backend";
import { getServerLocale } from "@/lib/i18n-server";
import { translate, translateData, type Locale } from "@/lib/i18n";
import type {
  BackendAlert,
  BackendAuditLog,
  BackendDashboardStats,
  BackendGovDashboardStats,
  BackendCompoundRule,
  BackendMunicipality,
  BackendParameter,
  BackendPermission,
  BackendPreviewResult,
  BackendRegion,
  BackendRole,
  BackendStation,
  BackendStationHealth,
  BackendSystemSetting,
  BackendThreshold,
  BackendThresholdHistory,
  BackendUser,
  BackendValidationRule,
} from "@/lib/backend-types";
import type {
  ManagedAlert,
  ManagedSeverity,
  ManagedStatus,
} from "@/features/alert-management/types";
import type { AlertTemplate } from "@/features/alert-templates/types";
import type { BackendAlertTemplate, BackendReading, BackendWeatherForecast } from "@/lib/backend-types";
import type { StationDetail } from "@/components/station-detail/station-detail";
import type { ForecastDay, WeatherCondition } from "@/components/station-detail/station-weather";
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

/** stationId → { name, nameAr, region } via municipality→region join. */
function stationLookup(
  stations: BackendStation[],
  muniRegion: Map<string, string>,
): Map<string, { name: string; nameAr?: string; region: string }> {
  return new Map(
    stations.map((s) => [s.id, { name: s.name, nameAr: s.name_ar, region: muniRegion.get(s.municipality_id) ?? "—" }]),
  );
}

function userNameMap(users: BackendUser[]): Map<string, string> {
  return new Map(users.map((u) => [u.id, u.name]));
}

// ── Dashboard overview (A1) ─────────────────────────────────────────────────

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const locale = await getServerLocale();
  // Permission-based source selection: full admin stats for accounts holding
  // dashboard.view; the leaner region-scoped /api/gov/dashboard otherwise (so a
  // gov account that lacks dashboard.view isn't 403'd on the overview).
  const me = await getCurrentUser();
  const useGov = !me.permissions.includes("dashboard.view") && me.permissions.includes("gov.dashboard");

  // 7-day window for the alert-opened trend chart.
  const trendFrom = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // Supplementary context (best-effort; region-scoped server-side for gov users).
  // The primary stats source is already decided by useGov, so fetch it in the
  // same batch instead of a third serial phase. It carries NO .catch (a failure
  // should surface as a page error, matching the original per-branch awaits).
  const [regions, municipalities, stations, users, activeAlerts, audit, trendAlerts, statsRaw] = await Promise.all([
    loadRegions(),
    loadMunicipalities(),
    loadStationsAll(),
    loadUsersAll(),
    backendData<BackendAlert[]>("/api/alerts?is_active=true&page_size=500").catch(() => [] as BackendAlert[]),
    backendData<BackendAuditLog[]>("/api/audit-logs?page_size=20").catch(() => [] as BackendAuditLog[]),
    backendData<BackendAlert[]>(`/api/alerts?from=${trendFrom}&page_size=1000`).catch(() => [] as BackendAlert[]),
    useGov
      ? backendData<BackendGovDashboardStats>("/api/gov/dashboard")
      : backendData<BackendDashboardStats>("/api/dashboard/stats"),
  ]);

  const muniRegion = municipalityRegionName(municipalities, regions);
  const stationRegion = new Map(stations.map((s) => [s.id, muniRegion.get(s.municipality_id) ?? "—"]));
  // health rows carry no name_ar; map station id → Arabic name so the map pins +
  // offline feed can localize (they iterate norm.health, which lacks name_ar).
  const stationNameAr = new Map(stations.map((s) => [s.id, s.name_ar]));
  const users_ = userNameMap(users);

  const maintenanceCount = stations.filter((s) => s.operational_status === "maintenance").length;

  // Normalize the primary stats into one shape the builders below consume. The
  // gov endpoint omits station_health + needs_attention, so reconstruct those
  // from the (already region-scoped) stations + active alerts loaded above.
  interface NormStats {
    totalStations: number;
    activeStations: number;
    offlineStations: number;
    activeAlerts: number;
    anomalyStations: number;
    unackAlerts: number;
    offlineAttention: number;
    health: BackendStationHealth[];
  }
  let norm: NormStats;
  if (useGov) {
    // Fetched above in the batch; useGov gated which endpoint was called.
    const g = statsRaw as BackendGovDashboardStats;
    const health: BackendStationHealth[] = stations.map((s) => ({
      id: s.id,
      name: s.name,
      is_active: s.is_active,
      last_seen_at: s.last_seen_at ?? null,
      status: stationOpStatus(s),
      data_status: s.data_status,
      silent_sensors: s.silent_sensors ?? [],
      latitude: s.latitude,
      longitude: s.longitude,
    }));
    norm = {
      totalStations: g.total_stations,
      activeStations: g.active_stations,
      offlineStations: g.offline_stations,
      activeAlerts: g.active_alerts,
      anomalyStations: stations.filter((s) => s.status === "anomaly").length,
      unackAlerts: activeAlerts.filter((a) => !a.acknowledged_at && a.status === "pending").length,
      offlineAttention: g.offline_stations,
      health,
    };
  } else {
    // Fetched above in the batch (no .catch → a failure surfaces as a page error).
    const stats = statsRaw as BackendDashboardStats;
    norm = {
      totalStations: stats.total_stations,
      activeStations: stats.active_stations,
      offlineStations: stats.offline_stations,
      activeAlerts: stats.active_alerts,
      anomalyStations: stats.needs_attention.anomaly_stations,
      unackAlerts: stats.needs_attention.unacknowledged_alerts,
      offlineAttention: stats.needs_attention.offline_stations,
      health: stats.station_health,
    };
  }

  const stats_ = [
    { id: "online", label: "Stations online", value: norm.activeStations, total: norm.totalStations, tone: "online" as const },
    { id: "offline", label: "Offline", value: norm.offlineStations, tone: "offline" as const },
    { id: "maintenance", label: "Maintenance", value: maintenanceCount, tone: "maintenance" as const },
    { id: "anomaly", label: "Anomaly", value: norm.anomalyStations, tone: "anomaly" as const },
    { id: "alerts", label: "Active alerts", value: norm.activeAlerts, tone: "alert" as const },
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

  const mapStations: MapStation[] = norm.health.map((sh) => {
    const counts = alertCounts.get(sh.id);
    return {
      id: sh.id,
      name: sh.name,
      nameAr: stationNameAr.get(sh.id) ?? "",
      status: healthStatusToMapStatus(sh.status, sh.is_active, sh.last_seen_at),
      latitude: sh.latitude,
      longitude: sh.longitude,
      region: stationRegion.get(sh.id) ?? "—",
      reading: "", // admin health rows carry no reading value (honest-neutral)
      updated: relativeTime(sh.last_seen_at, locale),
      ...(counts ? { activeAlerts: counts } : {}),
    };
  });

  // Needs attention: unacked active alerts + offline/anomaly health rows.
  const attention: AttentionItem[] = [];
  for (const a of activeAlerts.filter((x) => !x.acknowledged_at).slice(0, 6)) {
    const aRegion = a.station_id ? stationRegion.get(a.station_id) ?? "" : "";
    const aTier = severityToTier(a.severity);
    attention.push({
      id: a.id,
      // title is an English param label — already present in dataDict so td() localizes it.
      title: paramLabel(a.parameter),
      // carry the fragments raw so the component localizes region + tier via dict keys
      // (a pre-joined "Northwest · warning" string can't be translated by td()).
      region: aRegion,
      tier: aTier,
      meta: `${aRegion} · ${aTier}`.replace(/^ · /, ""),
      elapsed: elapsed(a.issued_at),
      severity: a.severity === "yellow" ? "advisory" : "warning",
    });
  }
  for (const sh of norm.health.filter((s) => healthStatusToMapStatus(s.status, s.is_active, s.last_seen_at) === "offline").slice(0, 4)) {
    attention.push({
      id: `offline-${sh.id}`,
      // English fallback; the component composes the localized "<name> offline" from the fields below.
      title: `${sh.name} offline`,
      stationName: sh.name,
      stationNameAr: stationNameAr.get(sh.id) ?? "",
      region: stationRegion.get(sh.id) ?? "",
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
        action: describeAudit(l.action, l.resource_type, locale),
        category: auditCategory(l.resource_type, l.action),
        source: l.ip_address || "—",
        date,
        time,
      };
    });

  // 7-day alert-opened trend, bucketed by issued_at day (oldest → newest).
  const dayMs = 86_400_000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const trend = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(todayStart.getTime() - (6 - i) * dayMs).toISOString().slice(0, 10),
    count: 0,
  }));
  const trendIdx = new Map(trend.map((p, i) => [p.date, i]));
  for (const a of trendAlerts) {
    const key = new Date(a.issued_at).toISOString().slice(0, 10);
    const i = trendIdx.get(key);
    if (i != null) trend[i].count += 1;
  }

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
      online: norm.activeStations,
      total: norm.totalStations,
      live: true,
    },
    stats: stats_,
    map: {
      title: "Station Health Map",
      subtitle: `Live status across ${norm.totalStations} stations`,
      coverageNote: "",
      stations: mapStations,
    },
    needsAttention: {
      openCount: norm.unackAlerts + norm.offlineAttention + norm.anomalyStations,
      items: attention,
    },
    recentActivity,
    regions: [...regionRollup.values()].filter((r) => r.name !== "—" || r.total > 0),
    alertTrend: trend,
  };
}

// ── Stations (A2) ───────────────────────────────────────────────────────────

export async function getStations(): Promise<StationsPage> {
  const locale = await getServerLocale();
  const [{ data: stations, meta }, regions, municipalities] = await Promise.all([
    backendFetch<BackendStation[]>("/api/stations?page_size=1000"),
    loadRegions(),
    loadMunicipalities(),
  ]);
  const muniRegion = municipalityRegionName(municipalities, regions);

  const rows: (StationRow & { region: string })[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    nameAr: s.name_ar,
    region: muniRegion.get(s.municipality_id) ?? "—",
    municipalityId: s.municipality_id,
    status: stationOpStatus(s),
    reading: "", // admin list carries no latest-reading metric (honest-neutral)
    lastReading: relativeTime(s.last_seen_at, locale),
    lastReadingAt: s.last_seen_at ?? null,
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
      { key: "warning", label: "Warning", count: count((r) => r.status === "warning") },
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
  const locale = await getServerLocale();
  const [alerts, regions, municipalities, stations] = await Promise.all([
    backendData<BackendAlert[]>("/api/alerts?status=pending&is_active=true&page_size=200"),
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
      ...(a.station_id ? { stationId: a.station_id } : {}),
      context: [locale === "ar" ? st?.nameAr || st?.name : st?.name, st?.region, a.source].filter(Boolean).join(" · "),
      timeAgo: relativeTime(a.issued_at, locale),
      issuedAt: a.issued_at,
      ageSeconds: ageSec,
      sla,
      metrics: [
        { label: paramLabel(a.parameter), value: `${a.value}${paramUnit(a.parameter)}`, threshold: "" },
      ],
      meter: a.starts_at
        ? { label: "WINDOW", value: new Date(a.starts_at).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" }) }
        : { label: "ISSUED", value: relativeTime(a.issued_at, locale) },
      recommended: "", // backend supplies no recommended-action text (honest-neutral)
      acknowledged: a.acknowledged_at != null,
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
  const locale = await getServerLocale();
  const [thresholds, history, users, regions] = await Promise.all([
    backendData<BackendThreshold[]>("/api/thresholds?page_size=500"),
    backendData<BackendThresholdHistory[]>("/api/thresholds/history?page_size=50").catch(() => [] as BackendThresholdHistory[]),
    loadUsersAll(),
    loadRegions(),
  ]);
  const users_ = userNameMap(users);
  const regionName = new Map(regions.map((r) => [r.id, r.name]));

  // Group thresholds by REGION then UI metric, so each metric card belongs to a
  // single region. Thresholds are keyed per region in the backend; collapsing by
  // metric alone merged distinct regions' values into one card and hid the region.
  const byRegionMetric = new Map<string, Map<ThresholdMetric, BackendThreshold[]>>();
  for (const t of thresholds) {
    const m = paramToMetric(t.parameter);
    if (!m) continue;
    const perMetric = byRegionMetric.get(t.region_id) ?? new Map<ThresholdMetric, BackendThreshold[]>();
    perMetric.set(m, [...(perMetric.get(m) ?? []), t]);
    byRegionMetric.set(t.region_id, perMetric);
  }

  const severityRank = (s: string) => (s === "red" ? 3 : s === "orange" ? 2 : 1);
  const metrics: MetricThresholds[] = [];
  for (const [regionId, byMetric] of byRegionMetric) {
    for (const [metric, list] of byMetric) {
      const sorted = [...list].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
      const unit = paramUnit(sorted[0]?.parameter ?? "");
      const tiers: ThresholdTier[] = sorted.map((t) => {
        const tier = severityToTier(t.severity);
        return {
          id: t.id,
          parameter: t.parameter,
          severity: t.severity,
          appliesTo: t.applies_to,
          isActive: t.is_active,
          sustainDurationMinutes: t.sustain_duration_minutes ?? null,
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
      metrics.push({
        metric,
        label: METRIC_LABEL[metric],
        unit,
        perStationOverrides: false, // backend thresholds are region-level only
        regionId,
        regionName: regionName.get(regionId) ?? "",
        tiers,
        scale,
      });
    }
  }

  const changes: ThresholdChange[] = history.map((h) => {
    const tier = severityToTier(h.severity);
    const unit = paramUnit(h.parameter);
    const valueText =
      h.previous_value != null && h.previous_value !== h.value
        ? `${h.previous_value} → ${h.value}${unit}`
        : `${h.value}${unit}`;
    const verb =
      h.action === "created"
        ? translate(locale, "thresholds.history.added")
        : h.action === "deleted"
          ? translate(locale, "thresholds.history.removed")
          : h.action === "reverted"
            ? translate(locale, "thresholds.history.actionReverted")
            : "";
    return {
      id: h.id,
      thresholdId: h.threshold_id,
      // Localize each fragment here (locale in scope): param label via dataDict,
      // severity word via severity.* — a pre-joined English string can't be translated downstream.
      change: `${translateData(locale, paramLabel(h.parameter))} · ${translate(locale, "severity." + tier)} ${verb ? verb + " " : ""}${valueText}`.trim(),
      by: (h.changed_by && users_.get(h.changed_by)) || "—",
      when: relativeTime(h.created_at, locale),
      whenAt: h.created_at,
    };
  });

  return { metrics, changes };
}

// ── Users (A4) ────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<UsersPage> {
  const locale = await getServerLocale();
  const users = await backendData<BackendUser[]>("/api/users?page_size=500");

  const rows: UserRow[] = users.map((u) => {
    const roleName = u.role?.name ?? "viewer";
    const role = mapBackendRole(roleName);
    const regionNames = (u.regions ?? []).map((r) => r.name);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      initials: initials(u.name),
      role,
      roleName,
      regions: role === "Super Admin" ? "All regions" : regionNames.join(", ") || "—",
      regionIds: (u.regions ?? []).map((r) => r.id),
      lastActive: relativeTime(u.last_active_at, locale),
      lastActiveAt: u.last_active_at ?? null,
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

const HISTORY_RANGE_HOURS: Record<string, number> = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 };

export async function getAlertHistory(params?: { range?: string }): Promise<AlertHistoryPage> {
  const hours = HISTORY_RANGE_HOURS[params?.range ?? "7d"] ?? 168;
  const from = new Date(Date.now() - hours * 3_600_000).toISOString();
  const qs = new URLSearchParams({ page_size: "500", from });
  const [alerts, regions, municipalities, stations] = await Promise.all([
    backendData<BackendAlert[]>(`/api/alerts?${qs.toString()}`),
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
      // `alert` stays English — it backs the type facet, search, sort and CSV export.
      // The view composes the localized display from param + station/stationAr.
      alert: `${paramLabel(a.parameter)} — ${st?.name ?? st?.region ?? "—"}`,
      param: paramLabel(a.parameter),
      station: st?.name ?? st?.region ?? "—",
      stationAr: st?.nameAr,
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

const AUDIT_VERB_EN: Record<string, string> = {
  create: "Created", update: "Updated", delete: "Deleted", confirm: "Confirmed",
  reject: "Rejected", dismiss: "Dismissed", acknowledge: "Acknowledged",
  unacknowledge: "Unacknowledged", escalate: "Escalated", modify: "Modified",
  revert: "Reverted", reopen: "Reopened", resolve: "Resolved", preview: "Previewed",
  history: "Viewed history of", stats: "Viewed", permissions: "Updated permissions of",
  register: "Registered", regenerate: "Regenerated", upsert: "Saved",
};
const AUDIT_VERB_AR: Record<string, string> = {
  create: "إنشاء", update: "تعديل", delete: "حذف", confirm: "تأكيد", reject: "رفض",
  dismiss: "تجاهل", acknowledge: "إقرار", unacknowledge: "إلغاء إقرار", escalate: "تصعيد",
  modify: "تعديل", revert: "إرجاع", reopen: "إعادة فتح", resolve: "إنهاء", preview: "معاينة",
  history: "عرض سجل", stats: "عرض", permissions: "تعديل صلاحيات", register: "تسجيل",
  regenerate: "إعادة توليد", upsert: "حفظ",
};
const AUDIT_RESOURCE_AR: Record<string, string> = {
  threshold: "حد", alert: "تنبيه", user: "مستخدم", station: "محطة", role: "دور",
  dashboard: "لوحة المعلومات", "validation rule": "قاعدة تحقق", "compound rule": "قاعدة مركّبة",
  template: "قالب", setting: "إعداد", municipality: "بلدية", region: "منطقة", auth: "الدخول",
  forecast: "تنبؤ", reading: "قراءة", permission: "صلاحية",
};

function describeAudit(action: string, resource: string, locale: Locale = "en"): string {
  const res = resource.replace(/-/g, " ");
  if (action === "login") return locale === "ar" ? "تسجيل الدخول" : "Signed in";
  if (locale === "ar") {
    const v = AUDIT_VERB_AR[action] ?? action;
    const r = AUDIT_RESOURCE_AR[res] ?? res;
    return `${v} ${r}`.trim();
  }
  const v = AUDIT_VERB_EN[action] ?? action.charAt(0).toUpperCase() + action.slice(1);
  return `${v} ${res}`.trim();
}

function auditCategory(resource: string, action: string): ActivityCategory {
  if (action === "login" || resource === "auth") return "auth";
  if (resource.startsWith("threshold") || resource.includes("compound") || resource.includes("validation"))
    return "threshold";
  if (resource.startsWith("alert")) return "alert";
  if (resource.startsWith("user") || resource.startsWith("role")) return "user";
  // station, municipality, region, and anything else (dashboard/settings) fall
  // under the station/monitoring bucket — the facet has no dedicated category.
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
  const locale = await getServerLocale();
  const [logs, users] = await Promise.all([
    backendData<BackendAuditLog[]>("/api/audit-logs?page_size=200"),
    loadUsersAll(),
  ]);
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
      action: describeAudit(l.action, l.resource_type, locale),
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

/** GET /api/audit-logs/:id — full detail for the activity-log row detail view. */
export async function getAuditLog(id: string): Promise<AuditLogDetail> {
  const l = await backendData<BackendAuditLog>(`/api/audit-logs/${id}`);
  return {
    id: l.id,
    action: l.action,
    resourceType: l.resource_type,
    resourceId: l.resource_id ?? null,
    status: l.status,
    statusCode: l.status_code,
    ipAddress: l.ip_address,
    userAgent: l.user_agent,
    durationMs: l.duration_ms,
    createdAt: l.created_at,
    requestPayload: l.request_payload ?? null,
    responseError: l.response_error ?? null,
    details: l.details ?? null,
  };
}

// ── Settings (A6.0) ───────────────────────────────────────────────────────────

function humanizeKey(key: string): string {
  return key.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getSettings(): Promise<SettingsPage> {
  const [settings, rules, regions] = await Promise.all([
    backendData<BackendSystemSetting[]>("/api/settings?page_size=200").catch(() => [] as BackendSystemSetting[]),
    backendData<BackendValidationRule[]>("/api/validation-rules?page_size=200").catch(() => [] as BackendValidationRule[]),
    loadRegions(),
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
    return {
      id: r.id,
      parameter: r.parameter,
      metric: paramLabel(r.parameter),
      validRange,
      maxRate,
      active: r.is_active ?? true,
      validRangeMin: r.valid_range_min ?? null,
      validRangeMax: r.valid_range_max ?? null,
      maxRateOfChange: r.max_rate_of_change ?? null,
      rateIntervalMin: r.rate_interval_min ?? null,
    };
  });

  return {
    notifications,
    validationNote:
      "Readings outside these bounds are flagged and withheld from the public map.",
    validationRules,
    regions: regions.map((r) => ({ id: r.id, name: r.name })),
  };
}

// ── Active alerts (A3.2) ────────────────────────────────────────────────────
// Live active alerts + recently-resolved ones, shaped for the management screen.
// Resolved rows are kept so an operator can Reopen them; rejected/dismissed are
// excluded (they aren't "active alert" lifecycle states the screen manages).

export async function getActiveAlerts(): Promise<ManagedAlert[]> {
  const locale = await getServerLocale();
  const [alerts, regions, municipalities, stations] = await Promise.all([
    backendData<BackendAlert[]>("/api/alerts?page_size=200"),
    loadRegions(),
    loadMunicipalities(),
    loadStationsAll(),
  ]);
  const lookup = stationLookup(stations, municipalityRegionName(municipalities, regions));

  const now = Date.now();
  return alerts
    .filter((a) => a.is_active || a.status === "resolved")
    .map((a) => {
      const st = a.station_id ? lookup.get(a.station_id) : undefined;
      const metric = paramToMetric(a.parameter);
      const status: ManagedStatus = !a.is_active
        ? "resolved"
        : a.acknowledged_at
          ? "acknowledged"
          : "active";
      return {
        id: a.id,
        typeKey: a.source === "compound" ? "compound" : (metric ?? "compound"),
        severity: historySeverity(a) as ManagedSeverity,
        status,
        region: st?.region ?? "—",
        // Localize the station name + alert message by locale (page is server-rendered
        // and re-runs on the router.refresh() fired by the locale toggle).
        stations: st ? [locale === "ar" ? st.nameAr || st.name : st.name] : [],
        trigger: locale === "ar" ? a.message_ar || a.message : a.message,
        readings: metric ? [{ metric, value: `${a.value}${paramUnit(a.parameter)}` }] : [],
        durationMin: Math.max(0, Math.round((now - new Date(a.issued_at).getTime()) / 60_000)),
        // Timeline so the table can show WHEN a forecast/scheduled alert occurs
        // (not just how long it's been active). leadMin is computed here (server
        // clock) to stay hydration-stable, mirroring durationMin.
        source: a.source,
        issuedAt: a.issued_at,
        startsAt: a.starts_at ?? null,
        expiresAt: a.expires_at ?? null,
        leadMin: a.starts_at ? Math.round((new Date(a.starts_at).getTime() - now) / 60_000) : null,
      };
    });
}

/** Raw fields the notification bell stores (localized at render). */
export interface RecentAlertNotif {
  id: string;
  type: string;
  severity: string;
  parameter: string;
  message: string;
  messageAr: string;
  issuedAt: string;
}

/**
 * Recent notable alerts (last 48h, pending/confirmed) for BACKFILLING the
 * notification bell on load — so a user who was away still sees what happened,
 * not just what fired over SSE while the dashboard was open. Region-scoped
 * server-side for gov users. Best-effort (empty on failure).
 */
export async function getRecentAlertNotifs(): Promise<RecentAlertNotif[]> {
  const from = new Date(Date.now() - 48 * 3_600_000).toISOString();
  const alerts = await backendData<BackendAlert[]>(
    `/api/alerts?from=${from}&page_size=30`,
  ).catch(() => [] as BackendAlert[]);
  return alerts
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .map((a) => ({
      id: a.id,
      type: "alert.created",
      severity: a.severity,
      parameter: a.parameter,
      message: a.message,
      messageAr: a.message_ar,
      issuedAt: a.issued_at,
    }));
}

// ── Alert action writers (thin backend proxies for route handlers) ──────────

export function acknowledgeAlert(id: string, note?: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/acknowledge`, {
    method: "POST",
    body: JSON.stringify(note ? { confirm_note: note } : {}),
  });
}

export function unacknowledgeAlert(id: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/unacknowledge`, { method: "POST", body: "{}" });
}

export function resolveAlert(id: string, reason?: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export function reopenAlert(id: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/reopen`, { method: "POST", body: "{}" });
}

// ── Role → permission matrix (A4.2) ─────────────────────────────────────────

// Turn a backend identifier (dot/underscore separated) into Title Case words,
// e.g. "audit_log" → "Audit Log", "compound_rules.view" → "Compound Rules View".
function humanizeWords(s: string): string {
  return s
    .split(/[._\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function humanizeRoleName(name: string): string {
  return humanizeWords(name);
}

/** GET /api/roles (with permissions) + GET /api/permissions for the matrix. */
export async function getRoleMatrix(): Promise<RoleMatrix> {
  const [roles, permissions] = await Promise.all([
    backendData<BackendRole[]>("/api/roles"),
    backendData<BackendPermission[]>("/api/permissions"),
  ]);
  return {
    roles: [...roles]
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
      .map((r) => ({
        id: r.id,
        name: r.name,
        label: humanizeRoleName(r.name),
        rank: r.rank ?? 0,
        permissionIds: (r.permissions ?? []).map((p) => p.id),
      })),
    permissions: permissions.map((p) => {
      const [group, ...rest] = p.name.split(".");
      const action = rest.join(".");
      return {
        id: p.id,
        name: p.name,
        group,
        action,
        groupLabel: humanizeWords(group),
        label: humanizeWords(action) || humanizeWords(p.name),
      };
    }),
  };
}

export function updateRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<MutationResult<BackendRole>> {
  return backendMutate<BackendRole>(`/api/roles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permission_ids: permissionIds }),
  });
}

// ── Municipality emergency contacts (A2 station form) ───────────────────────

export interface MunicipalityOption {
  id: string;
  name: string;
  nameAr: string;
  region: string; // region name (for filtering the picker by the form's region)
  emergencyServices: string;
  civilDefense: string;
}

export async function getMunicipalityOptions(): Promise<MunicipalityOption[]> {
  const [municipalities, regions] = await Promise.all([
    backendData<BackendMunicipality[]>("/api/municipalities?page_size=1000"),
    loadRegions(),
  ]);
  const regionById = new Map(regions.map((r) => [r.id, r.name]));
  return municipalities.map((m) => ({
    id: m.id,
    name: m.name,
    nameAr: m.name_ar,
    region: regionById.get(m.region_id) ?? "—",
    emergencyServices: m.emergency_services_phone ?? "",
    civilDefense: m.civil_defense_phone ?? "",
  }));
}

export function updateMunicipalityContacts(
  id: string,
  contacts: { emergencyServices: string; civilDefense: string },
): Promise<MutationResult<BackendMunicipality>> {
  return backendMutate<BackendMunicipality>(`/api/municipalities/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      emergency_services_phone: contacts.emergencyServices,
      civil_defense_phone: contacts.civilDefense,
    }),
  });
}

// ── Regions (for user region-assignment picker) ─────────────────────────────

export async function getRegionOptions(): Promise<RegionOption[]> {
  const regions = await loadRegions();
  return regions.map((r) => ({ id: r.id, name: r.name }));
}

// ── Compound rules (A3.0) ───────────────────────────────────────────────────

function mapCompoundRule(r: BackendCompoundRule): CompoundRule {
  return {
    id: r.id,
    name: r.name,
    regionId: r.region_id,
    severity: r.severity,
    isActive: r.is_active,
    conditions: (r.conditions ?? []).map((c) => ({
      id: c.id,
      parameter: c.parameter,
      operator: c.operator,
      value: c.value,
      sustainMinutes: c.sustain_minutes ?? null,
    })),
  };
}

export async function getCompoundRules(): Promise<CompoundRule[]> {
  const rows = await backendData<BackendCompoundRule[]>("/api/compound-rules?page_size=200").catch(
    () => [] as BackendCompoundRule[],
  );
  return rows.map(mapCompoundRule);
}

export interface CompoundRuleConditionInput {
  parameter: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  value: number;
  sustain_minutes?: number | null;
}

export interface CompoundRuleWriteInput {
  name: string;
  region_id: string;
  severity: "yellow" | "orange" | "red";
  is_active?: boolean;
  conditions: CompoundRuleConditionInput[];
}

export function createCompoundRule(
  input: CompoundRuleWriteInput,
): Promise<MutationResult<BackendCompoundRule>> {
  return backendMutate<BackendCompoundRule>("/api/compound-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCompoundRule(
  id: string,
  input: Partial<CompoundRuleWriteInput>,
): Promise<MutationResult<BackendCompoundRule>> {
  return backendMutate<BackendCompoundRule>(`/api/compound-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCompoundRule(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/compound-rules/${id}`, { method: "DELETE" });
}

// ── Parameter catalog (thresholds / alerts / validation dropdowns) ──────────

/** GET /api/parameters — the backend's canonical weather-parameter catalog. */
export async function getParameters(): Promise<WeatherParameter[]> {
  const rows = await backendData<BackendParameter[]>("/api/parameters");
  return rows.map((p) => ({
    key: p.key,
    name: p.name,
    nameAr: p.name_ar,
    unit: p.unit,
    category: p.category,
    alertable: p.alertable ?? true,
    validation: p.validation ?? true,
  }));
}

// ── Stations CRUD (A2.1) ────────────────────────────────────────────────────

/** Full station detail for the edit form — the list DTO omits coords/sensors, so
 * a naive edit would clobber them; the form prefills from this instead. */
export async function getStation(id: string): Promise<StationDetailData> {
  const s = await backendData<BackendStation>(`/api/stations/${id}`);
  return {
    id: s.id,
    municipalityId: s.municipality_id,
    name: s.name,
    nameAr: s.name_ar,
    stationType: s.station_type,
    latitude: s.latitude,
    longitude: s.longitude,
    elevation: s.elevation,
    wuStationId: s.wu_station_id ?? null,
    sensors: s.sensors ?? [],
    operationalStatus: s.operational_status,
    isActive: s.is_active,
  };
}

export function createStation(input: StationWriteInput): Promise<MutationResult<BackendStation>> {
  return backendMutate<BackendStation>("/api/stations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStation(
  id: string,
  input: StationWriteInput,
): Promise<MutationResult<BackendStation>> {
  return backendMutate<BackendStation>(`/api/stations/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteStation(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/stations/${id}`, { method: "DELETE" });
}

// ── Users CRUD (A4.0/A4.1) ──────────────────────────────────────────────────

export function createUser(input: CreateUserInput): Promise<MutationResult<BackendUser>> {
  return backendMutate<BackendUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<MutationResult<BackendUser>> {
  return backendMutate<BackendUser>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/users/${id}`, { method: "DELETE" });
}

// ── Threshold writers (A3.0) ────────────────────────────────────────────────

/** PUT /api/thresholds/:id — parameter/severity/region are immutable (unique key);
 * only value/is_active/sustain/applies_to are editable. */
export function updateThreshold(
  id: string,
  input: { value?: number; is_active?: boolean; sustain_duration_minutes?: number | null; applies_to?: string },
): Promise<MutationResult<BackendThreshold>> {
  return backendMutate<BackendThreshold>(`/api/thresholds/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function revertThreshold(id: string, historyId: string): Promise<MutationResult<BackendThreshold>> {
  return backendMutate<BackendThreshold>(`/api/thresholds/${id}/revert`, {
    method: "POST",
    body: JSON.stringify({ history_id: historyId }),
  });
}

export interface CreateThresholdInput {
  region_id: string;
  parameter: string;
  severity: "yellow" | "orange" | "red";
  applies_to?: "observed" | "forecast" | "both";
  value: number;
  sustain_duration_minutes?: number | null;
}

export function createThreshold(input: CreateThresholdInput): Promise<MutationResult<BackendThreshold>> {
  return backendMutate<BackendThreshold>("/api/thresholds", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteThreshold(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/thresholds/${id}`, { method: "DELETE" });
}

export function previewThreshold(input: {
  region_id: string;
  parameter: string;
  value: number;
  sustain_duration_minutes?: number | null;
  lookback_hours?: number;
}): Promise<MutationResult<BackendPreviewResult>> {
  return backendMutate<BackendPreviewResult>("/api/thresholds/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── More alert actions (inbox dismiss → reject, escalate) ───────────────────

export function rejectAlert(id: string, note?: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(note ? { confirm_note: note } : {}),
  });
}

export function escalateAlert(id: string, urgency: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/escalate`, {
    method: "POST",
    body: JSON.stringify({ urgency }),
  });
}

/** POST /api/alerts/:id/confirm — promote a pending alert to confirmed. */
export function confirmAlert(id: string, note?: string): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify(note ? { confirm_note: note } : {}),
  });
}

/** PUT /api/alerts/:id/modify — change severity / level / messages of an alert. */
export function modifyAlert(
  id: string,
  input: { severity?: string; level?: string; message?: string; message_ar?: string },
): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>(`/api/alerts/${id}/modify`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export interface CreateAlertInput {
  station_id: string;
  severity: "yellow" | "orange" | "red";
  parameter: string;
  message: string;
  message_ar: string;
  value?: number;
  level?: "national" | "regional" | "city";
  urgency?: "routine" | "urgent" | "critical";
}

/** POST /api/alerts — admin-issued manual alert (created already confirmed;
 * guidance falls back to the seeded template when omitted). */
export function createAlert(input: CreateAlertInput): Promise<MutationResult<BackendAlert>> {
  return backendMutate<BackendAlert>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── Alert templates (A3.1) ──────────────────────────────────────────────────

/** Map a backend event_type to the FE i18n/icon key (camelCase). Unknown values
 * fall through unchanged (UI falls back to a generic icon + the raw label). */
const TEMPLATE_EVENT_KEY: Record<string, string> = {
  flash_flood: "flashFlood",
  heavy_rain: "heavyRain",
  high_wind: "highWind",
  heatwave: "heatwave",
  coastal_surge: "coastalSurge",
  temp_drop: "tempDrop",
};

export async function getTemplates(): Promise<AlertTemplate[]> {
  const rows = await backendData<BackendAlertTemplate[]>("/api/templates?page_size=200");
  return rows.map((r) => {
    const en = r.guidance_steps_en ?? [];
    const ar = r.guidance_steps_ar ?? [];
    const stepCount = Math.max(en.length, ar.length);
    const steps = Array.from({ length: stepCount }, (_, i) => ({ en: en[i] ?? "", ar: ar[i] ?? "" }));
    return {
      id: r.id,
      eventType: r.event_type,
      eventKey: TEMPLATE_EVENT_KEY[r.event_type] ?? r.event_type,
      severity: r.severity,
      versions: {
        enDay: r.message_en_day,
        enNight: r.message_en_night,
        arDay: r.message_ar_day,
        arNight: r.message_ar_night,
      },
      steps,
    };
  });
}

export interface TemplateWriteInput {
  message_en_day: string;
  message_en_night: string;
  message_ar_day: string;
  message_ar_night: string;
  guidance_steps_en: string[];
  guidance_steps_ar: string[];
}

export interface CreateTemplateInput extends TemplateWriteInput {
  event_type: string;
  severity: "yellow" | "orange" | "red";
}

export function createTemplate(input: CreateTemplateInput): Promise<MutationResult<BackendAlertTemplate>> {
  return backendMutate<BackendAlertTemplate>("/api/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTemplate(
  id: string,
  input: Partial<TemplateWriteInput>,
): Promise<MutationResult<BackendAlertTemplate>> {
  return backendMutate<BackendAlertTemplate>(`/api/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTemplate(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/templates/${id}`, { method: "DELETE" });
}

// ── Station live telemetry (B7) ─────────────────────────────────────────────

const COMPASS_16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];
function compass(deg: number): string {
  return COMPASS_16[Math.round(((deg % 360) / 22.5)) % 16];
}

// Arabic compass letters (ش=N، ق=E، ج=S، غ=W). The 16-point English code maps
// letter-for-letter (e.g. WNW → غ ش غ), so no per-code dict entries (and no
// single-letter dataDict keys that could hijack unrelated td() lookups).
const COMPASS_AR: Record<string, string> = { N: "ش", E: "ق", S: "ج", W: "غ" };
function compassLocalized(deg: number, locale: Locale): string {
  const code = compass(deg);
  if (locale !== "ar") return code;
  return code
    .split("")
    .map((c) => COMPASS_AR[c] ?? c)
    .join(" ");
}

/**
 * Latest reading for a station, shaped as the station-summary card's weather
 * fields. Uses the authed, region-scoped, live /api/readings (page_size=1 ⇒ the
 * newest row). Every measurement is optional server-side, so we only set the
 * fields that are present. Returns null when the station has no readings.
 */
const ALERT_SEVERITY_RANK: Record<string, number> = { red: 3, orange: 2, yellow: 1 };

export async function getLatestReading(stationId: string): Promise<Partial<StationDetail> | null> {
  const locale = await getServerLocale();
  const [rows, alerts] = await Promise.all([
    backendData<BackendReading[]>(
      `/api/readings?station_id=${encodeURIComponent(stationId)}&page_size=1`,
    ).catch(() => [] as BackendReading[]),
    // Active alerts for this station — includes PENDING (not-yet-confirmed) ones,
    // so the admin sees an internal flag the public map deliberately wouldn't.
    backendData<BackendAlert[]>(
      `/api/alerts?station_id=${encodeURIComponent(stationId)}&is_active=true&page_size=50`,
    ).catch(() => [] as BackendAlert[]),
  ]);

  const r = rows[0];
  // Highest-severity active alert → surface it on the summary card so a coloured
  // pin always has its alert to show (was previously never wired in).
  const top = [...alerts].sort(
    (a, b) => (ALERT_SEVERITY_RANK[b.severity] ?? 0) - (ALERT_SEVERITY_RANK[a.severity] ?? 0),
  )[0];

  if (!r && !top) return null;

  const out: Partial<StationDetail> = {};
  if (top) {
    out.alert = {
      title: paramLabel(top.parameter),
      description: locale === "ar" ? top.message_ar : top.message,
      actions: (locale === "ar" ? top.guidance_steps_ar : top.guidance_steps_en) ?? [],
    };
  }
  if (!r) return out;

  out.updated = relativeTime(r.time, locale);
  if (r.temp_c != null) out.temp = Math.round(r.temp_c);
  const feels = r.heatindex_c ?? r.windchill_c ?? r.temp_c;
  if (feels != null) out.feelsLike = Math.round(feels);
  if (r.rain_rate_mm != null) {
    // Note is a dynamic composed string, so localize by locale here (the card
    // refetches on a language toggle); the unit + direction are localized on the
    // client via td().
    out.rainfall = {
      value: String(r.rain_rate_mm),
      unit: "mm/hr",
      note:
        r.rain_daily_mm != null
          ? locale === "ar"
            ? `${r.rain_daily_mm} ملم اليوم`
            : `${r.rain_daily_mm} mm today`
          : "",
    };
  }
  if (r.wind_speed_kmh != null) {
    out.wind = {
      value: String(Math.round(r.wind_speed_kmh)),
      unit: "km/h",
      note:
        r.wind_gust_kmh != null
          ? locale === "ar"
            ? `هبّات ${Math.round(r.wind_gust_kmh)} كم/س`
            : `Gusts ${Math.round(r.wind_gust_kmh)} km/h`
          : "",
      direction: r.wind_dir != null ? compassLocalized(r.wind_dir, locale) : "",
    };
  }
  if (r.humidity != null) out.humidity = { value: String(Math.round(r.humidity)), unit: "%", note: "" };
  if (r.pressure_hpa != null) out.pressure = { value: String(Math.round(r.pressure_hpa)), unit: "hPa", note: "" };
  return out;
}

// ── Station forecast (B-forecast) ───────────────────────────────────────────

const DAY_KEYS: ForecastDay["key"][] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Derive a coarse weather icon from a day's peak rain/wind/humidity. */
function forecastCondition(maxRain: number, maxGust: number, maxHumidity: number): WeatherCondition {
  if (maxRain >= 10 || maxGust >= 55) return "storms";
  if (maxRain >= 0.2) return "rain";
  if (maxHumidity >= 75) return "cloudy";
  return "sunny";
}

/**
 * GET /api/forecasts?station_id= — hourly forecast rows aggregated into up to 7
 * daily ForecastDay entries (low/high temp + a derived condition) for the
 * station-summary card's 7-day forecast. Empty when the station has no forecast.
 */
export async function getStationForecast(stationId: string): Promise<ForecastDay[]> {
  const rows = await backendData<BackendWeatherForecast[]>(
    `/api/forecasts?station_id=${encodeURIComponent(stationId)}`,
  ).catch(() => [] as BackendWeatherForecast[]);
  if (rows.length === 0) return [];

  interface Bucket {
    date: string;
    temps: number[];
    maxRain: number;
    maxGust: number;
    maxHumidity: number;
  }
  const byDay = new Map<string, Bucket>();
  for (const r of rows) {
    const d = new Date(r.forecast_for);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const b =
      byDay.get(key) ?? { date: key, temps: [], maxRain: 0, maxGust: 0, maxHumidity: 0 };
    if (r.temp_c != null) b.temps.push(r.temp_c);
    if (r.rain_rate_mm != null) b.maxRain = Math.max(b.maxRain, r.rain_rate_mm);
    if (r.wind_gust_kmh != null) b.maxGust = Math.max(b.maxGust, r.wind_gust_kmh);
    if (r.humidity != null) b.maxHumidity = Math.max(b.maxHumidity, r.humidity);
    byDay.set(key, b);
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  return [...byDay.values()]
    .filter((b) => b.temps.length > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 7)
    .map((b, i) => ({
      key: i === 0 && b.date === todayKey ? "today" : DAY_KEYS[new Date(b.date + "T00:00:00").getDay()],
      condition: forecastCondition(b.maxRain, b.maxGust, b.maxHumidity),
      low: Math.round(Math.min(...b.temps)),
      high: Math.round(Math.max(...b.temps)),
    }));
}

// ── Settings + validation rules (A6) ────────────────────────────────────────

/** PUT /api/settings — single key/value upsert (no bulk endpoint; call per key). */
export function upsertSetting(key: string, value: string): Promise<MutationResult<BackendSystemSetting>> {
  return backendMutate<BackendSystemSetting>("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ key, value }),
  });
}

export function updateValidationRule(
  id: string,
  input: {
    valid_range_min?: number | null;
    valid_range_max?: number | null;
    max_rate_of_change?: number | null;
    rate_interval_min?: number | null;
    is_active?: boolean;
  },
): Promise<MutationResult<BackendValidationRule>> {
  return backendMutate<BackendValidationRule>(`/api/validation-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export interface CreateValidationRuleInput {
  parameter: string;
  region_id?: string | null;
  valid_range_min?: number | null;
  valid_range_max?: number | null;
  max_rate_of_change?: number | null;
  rate_interval_min?: number | null;
}

export function createValidationRule(
  input: CreateValidationRuleInput,
): Promise<MutationResult<BackendValidationRule>> {
  return backendMutate<BackendValidationRule>("/api/validation-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteValidationRule(id: string): Promise<MutationResult<null>> {
  return backendMutate<null>(`/api/validation-rules/${id}`, { method: "DELETE" });
}
