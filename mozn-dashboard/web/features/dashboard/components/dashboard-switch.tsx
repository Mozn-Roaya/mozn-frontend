"use client";

import type { ReactNode } from "react";
import { BellRing, MapPinned, RadioTower, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/stat-card";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type { DashboardOverview } from "@/features/dashboard/types";
import { PageHeader } from "./page-header";
import { StatusStrip } from "./status-strip";
import { StationHealthMap } from "./station-health-map";
import { NeedsAttention } from "./needs-attention";
import { RecentActivity } from "./recent-activity";
import { AlertTrend } from "./alert-trend";
import { StationStatusDonut } from "./station-status-donut";
import { RegionRollup } from "./region-rollup";

/** Region-scoped, read-only dashboard for Gov roles (G1). */
function GovRegionalDashboard({ overview }: { overview: DashboardOverview }) {
  const t = useT();
  const { assignedRegion } = useRole();

  const matches = overview.map.stations.filter((s) => s.region === assignedRegion);
  const stations = matches.length ? matches : overview.map.stations;
  const online = stations.filter((s) => s.status === "online").length;
  const offline = stations.filter((s) => s.status === "offline").length;
  const alerts = stations.filter((s) => s.status === "warning").length;

  const scopedMap = { ...overview.map, stations };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("gov.regionalDashboard")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("gov.regionalSubtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="brand" className="gap-1.5">
            <MapPinned className="size-3.5" />
            {t("gov.viewingRegion", { region: t("region." + assignedRegion) })}
          </Badge>
          <Badge variant="secondary">{t("gov.readOnly")}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={RadioTower} label={t("nav.stations")} value={stations.length} />
        <StatCard icon={Wifi} label={t("status.online")} value={online} tone="ok" />
        <StatCard icon={WifiOff} label={t("status.offline")} value={offline} tone={offline > 0 ? "offline" : "neutral"} />
        <StatCard icon={BellRing} label={t("gov.recentAlerts")} value={alerts} tone={alerts > 0 ? "danger" : "neutral"} />
      </div>

      <StationHealthMap map={scopedMap} />
      <RecentActivity items={overview.recentActivity} />
    </div>
  );
}

/**
 * Labelled group that gives the System Overview a clear, scannable hierarchy:
 * a page-level `h1` up top, then an eyebrow `h2` per group. The eyebrow reads as
 * an uppercase, letter-spaced label in English; letter-spacing breaks Arabic's
 * cursive joining, so it is reset to a plain bold label in RTL.
 */
function DashboardSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground rtl:tracking-normal">
        {label}
      </h2>
      {children}
    </section>
  );
}

/** Admin (Super Admin) full overview — A1. */
function AdminDashboard({ overview }: { overview: DashboardOverview }) {
  const t = useT();
  return (
    <div className="space-y-8">
      {/* Page heading — live-sync status + page actions. */}
      <PageHeader header={overview.header} stats={overview.stats} />

      {/* At a glance — the quick-scan KPI band. */}
      <DashboardSection label={t("dashboard.section.glance")}>
        <StatusStrip stats={overview.stats} />
      </DashboardSection>

      {/* Operations — the map is the hero, with the work queue beside it. */}
      <DashboardSection label={t("dashboard.section.operations")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <StationHealthMap map={overview.map} />
          <NeedsAttention data={overview.needsAttention} />
        </div>
      </DashboardSection>

      {/* Analytics — fleet composition + alert trend, then the audit trail. */}
      <DashboardSection label={t("dashboard.section.analytics")}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <StationStatusDonut stats={overview.stats} />
            <AlertTrend stats={overview.stats} trend={overview.alertTrend} />
          </div>
          <RegionRollup regions={overview.regions} />
          <RecentActivity items={overview.recentActivity} />
        </div>
      </DashboardSection>
    </div>
  );
}

export function DashboardSwitch({ overview }: { overview: DashboardOverview }) {
  const { isGov } = useRole();
  return isGov ? (
    <GovRegionalDashboard overview={overview} />
  ) : (
    <AdminDashboard overview={overview} />
  );
}
