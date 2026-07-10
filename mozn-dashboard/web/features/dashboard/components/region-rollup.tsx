"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/common/empty-state";
import type { RegionStat } from "@/features/dashboard/types";
import { ChartCard } from "./chart-card";

/**
 * Per-region station rollup (online / total). The data is already computed by
 * getDashboardOverview and shipped in the contract (overview.regions); this
 * renders it. Regions with offline stations float to the top so problems are
 * scannable first.
 */
export function RegionRollup({ regions }: { regions: RegionStat[] }) {
  const t = useT();
  const rows = [...regions]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - b.online - (a.total - a.online) || b.total - a.total);

  return (
    <ChartCard title={t("dashboard.regions.title")}>
      {rows.length === 0 ? (
        <EmptyState icon={MapPin} message={t("dashboard.regions.empty")} />
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {rows.map((r) => {
            const offline = Math.max(0, r.total - r.online);
            const pct = r.total ? Math.round((r.online / r.total) * 100) : 0;
            const tone =
              offline === 0
                ? "bg-status-normal"
                : pct >= 50
                  ? "bg-status-warning"
                  : "bg-status-offline";
            return (
              <li key={r.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {t("region." + r.name)}
                </span>
                <div
                  className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:block"
                  aria-hidden
                >
                  <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.online}</span>
                  {" / "}
                  {r.total}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
