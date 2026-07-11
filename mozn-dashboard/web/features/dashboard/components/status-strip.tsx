"use client";

import { Activity, BellRing, Gauge, Wifi, WifiOff, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { StatCard, type StatTone } from "@/components/common/stat-card";
import { Card } from "@/components/ui/card";
import { useT, useTD } from "@/components/providers/locale-provider";
import type { StatCard as StatCardType, StatTone as StatusTone } from "@/features/dashboard/types";

/** Map each system-status tone to a shared StatCard treatment. `hintKey`
 *  resolves to a one-word context line; `href` is the drill-down target. */
const STATUS_CARD: Record<
  StatusTone,
  { icon: LucideIcon; tone: StatTone; hintKey: string; href: string }
> = {
  online: { icon: Wifi, tone: "ok", hintKey: "dashboard.hint.reportingNow", href: "/stations?status=online" },
  offline: { icon: WifiOff, tone: "offline", hintKey: "dashboard.hint.noSignal", href: "/stations?status=offline" },
  maintenance: { icon: Wrench, tone: "watch", hintKey: "dashboard.hint.scheduled", href: "/stations?status=maintenance" },
  anomaly: { icon: Activity, tone: "advisory", hintKey: "dashboard.hint.needsReview", href: "/stations?status=anomaly" },
  alert: { icon: BellRing, tone: "danger", hintKey: "dashboard.hint.openNow", href: "/alert-inbox" },
};

export function StatusStrip({ stats }: { stats: StatCardType[] }) {
  const t = useT();
  const td = useTD();

  if (stats.length === 0) {
    return (
      <section aria-label={t("dashboard.systemStatusAria")}>
        <Card>
          <EmptyState icon={Gauge} message={t("dashboard.glance.empty")} />
        </Card>
      </section>
    );
  }

  return (
    <section
      aria-label={t("dashboard.systemStatusAria")}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {stats.map((stat) => {
        const cfg = STATUS_CARD[stat.tone];
        const hasTotal = stat.total !== undefined;
        return (
          <StatCard
            key={stat.id}
            icon={cfg.icon}
            label={td(stat.label)}
            value={stat.value}
            suffix={hasTotal ? `/ ${stat.total}` : undefined}
            tone={cfg.tone}
            href={cfg.href}
            // Online shows coverage as a bar; the rest show a one-word hint.
            progress={
              hasTotal ? Math.round((stat.value / stat.total!) * 100) : undefined
            }
            hint={t(cfg.hintKey)}
          />
        );
      })}
    </section>
  );
}
