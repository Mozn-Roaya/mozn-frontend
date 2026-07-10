"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useMounted } from "@/hooks/use-mounted";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EmptyState } from "@/components/common/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AlertTrendPoint, StatCard } from "@/features/dashboard/types";
import { ChartCard } from "./chart-card";

// The alerts-opened-per-day series over the last 7 days (bucketed server-side in
// getDashboardOverview), plus the live active-alert total for the headline.
const ALERT_COLOR = "var(--status-warning)";

export function AlertTrend({
  stats,
  trend,
  className,
}: {
  stats: StatCard[];
  trend: AlertTrendPoint[];
  className?: string;
}) {
  const { t, locale } = useLocale();
  const rtl = locale === "ar";
  const reduced = useReducedMotion();

  // Recharts can't measure during SSR; mount after layout (same guard the other
  // charts use).
  const mounted = useMounted();

  const total = React.useMemo(
    () => stats.find((s) => s.tone === "alert")?.value ?? 0,
    [stats],
  );

  // One bar per day, weekday-labelled in the active locale.
  const data = React.useMemo(
    () =>
      trend.map((p) => ({
        label: new Date(p.date + "T00:00:00").toLocaleDateString(rtl ? "ar" : "en", {
          weekday: "short",
        }),
        total: p.count,
      })),
    [trend, rtl],
  );

  const trendTotal = React.useMemo(() => trend.reduce((sum, p) => sum + p.count, 0), [trend]);
  const peak = React.useMemo(() => Math.max(0, ...trend.map((p) => p.count)), [trend]);
  const max = Math.max(2, Math.ceil(peak / 2) * 2);

  const yTicks = React.useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= max; v += 2) ticks.push(v);
    return ticks;
  }, [max]);

  const config = React.useMemo(
    () =>
      ({
        total: { label: t("dashboard.alertTrend.opened"), color: ALERT_COLOR },
      }) satisfies ChartConfig,
    [t],
  );

  return (
    <ChartCard title={t("dashboard.alertTrend.title")} className={className}>
      {trendTotal === 0 && total === 0 ? (
        <EmptyState icon={TrendingUp} message={t("dashboard.alertTrend.empty")} />
      ) : (
        <div className="flex h-full flex-col">
          {/* Text summary for screen readers — the bar chart is aria-hidden. */}
          <p className="sr-only">
            {t("dashboard.alertTrend.subtitle")}.{" "}
            {data.map((d) => `${d.label}: ${d.total}`).join(", ")}.
          </p>

          {/* Headline: total active alerts now. */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
              {total}
            </span>
            <span className="pb-0.5 text-sm text-muted-foreground">
              {t("dashboard.alertTrend.active")}
            </span>
          </div>

          {!mounted ? (
            <div className="mt-4 h-[188px] w-full" aria-hidden />
          ) : (
            <ChartContainer config={config} className="mt-4 aspect-auto h-[188px] w-full">
              <BarChart
                accessibilityLayer
                data={data}
                margin={{ left: rtl ? 4 : 0, right: rtl ? 0 : 4, top: 4, bottom: 4 }}
                maxBarSize={30}
              >
                <CartesianGrid vertical={false} stroke="var(--chart-track)" />
                <XAxis
                  dataKey="label"
                  reversed={rtl}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, max]}
                  ticks={yTicks}
                  orientation={rtl ? "right" : "left"}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--chart-track)", opacity: 0.4 }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={!reduced}
                  animationDuration={reduced ? 0 : 600}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      )}
    </ChartCard>
  );
}
