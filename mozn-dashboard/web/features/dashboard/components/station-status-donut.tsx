"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartPie } from "lucide-react";

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
import type { StatCard } from "@/features/dashboard/types";
import { ChartCard } from "./chart-card";

// The four live station states, in the order they read on the legend. "alert"
// is a count of open alerts, not a station state, so it is excluded here.
const STATES = ["online", "offline", "maintenance", "anomaly"] as const;
type State = (typeof STATES)[number];

// Each slice maps to a semantic token already used elsewhere in the app:
// normal-green, neutral-grey, informational-blue (scheduled), advisory-amber.
const STATE_COLOR: Record<State, string> = {
  online: "var(--status-normal)",
  offline: "var(--status-offline)",
  maintenance: "var(--chart-1)",
  anomaly: "var(--status-advisory)",
};

export function StationStatusDonut({ stats }: { stats: StatCard[] }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();

  // Recharts can't measure during SSR; mount after layout (same guard the
  // other charts use).
  const mounted = useMounted();

  const byTone = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stats) m.set(s.tone, s.value);
    return m;
  }, [stats]);

  const data = React.useMemo(
    () =>
      STATES.map((key) => ({
        key,
        label: t(`dashboard.fleet.${key}`),
        value: byTone.get(key) ?? 0,
        color: STATE_COLOR[key],
      })).filter((d) => d.value > 0),
    [byTone, t],
  );

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const config = React.useMemo(
    () =>
      Object.fromEntries(
        STATES.map((k) => [k, { label: t(`dashboard.fleet.${k}`), color: STATE_COLOR[k] }]),
      ) satisfies ChartConfig,
    [t],
  );

  return (
    <ChartCard
      title={t("dashboard.fleet.title")}
      contentClassName="flex items-center justify-center"
    >
      {total === 0 ? (
        <EmptyState icon={ChartPie} message={t("dashboard.fleet.empty")} />
      ) : (
        <div className="flex w-fit flex-col items-center gap-6 sm:flex-row sm:gap-10">
          {/* Text summary for screen readers — the donut graphic is aria-hidden. */}
          <p className="sr-only">
            {t("dashboard.fleet.subtitle", { total })}.{" "}
            {data.map((d) => `${d.value} ${d.label}`).join(", ")}.
          </p>
          {/* Donut + legend are centred together as one cluster (the ChartCard
              content centres this w-fit block), so it reads balanced in the card. */}
          <div className="relative size-[208px] shrink-0" aria-hidden>
              {mounted ? (
                <ChartContainer config={config} className="relative z-10 size-[208px]">
                  <PieChart>
                    {/* Follows the cursor (SaaS-style). The chart layer sits above
                        the centre readout (z-10) so the opaque tooltip cleanly
                        covers it on overlap instead of blending. Recharts clamps
                        the tooltip inside the chart box (no allowEscapeViewBox) so
                        it can never spill past the card's clipped rounded edge. */}
                    <ChartTooltip
                      cursor={false}
                      offset={12}
                      // pointer-events:none so the cursor-following tooltip never
                      // sits between the pointer and the segment (which makes the
                      // chart lose hover → hide → re-show → flicker).
                      wrapperStyle={{ pointerEvents: "none" }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey="key"
                          formatter={(value, _n, item) => {
                            const pct = total
                              ? Math.round((Number(value) / total) * 100)
                              : 0;
                            const p = item.payload as { label?: string; color?: string };
                            return (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span
                                  className="size-2.5 shrink-0 rounded-[3px]"
                                  style={{ backgroundColor: p?.color }}
                                />
                                <span className="text-muted-foreground">{p?.label}</span>
                                <span className="ms-2 font-semibold tabular-nums text-foreground">
                                  {String(value)}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                  · {pct}%
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    {/* Rounded segments with a hairline gap — distinct states, not
                        one solid ring. */}
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="key"
                      innerRadius={78}
                      outerRadius={102}
                      paddingAngle={2}
                      cornerRadius={4}
                      strokeWidth={0}
                      isAnimationActive={!reduced}
                      animationDuration={reduced ? 0 : 700}
                    >
                      {data.map((d) => (
                        <Cell key={d.key} fill={`var(--color-${d.key})`} style={{ outline: "none" }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="size-[208px]" aria-hidden />
              )}
              {/* Center readout: total fleet size. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
                  {total}
                </span>
                <span className="mt-1.5 text-xs text-muted-foreground">
                  {t("dashboard.fleet.total")}
                </span>
              </div>
          </div>

          {/* Legend — hairline-divided, ranked by size. Count only; the share is
              derivable and the total sits in the ring centre. Natural width so it
              hugs the donut as one centred cluster. */}
          <ul className="flex w-full flex-col divide-y divide-border-subtle sm:w-auto sm:shrink-0">
            {data
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((d) => (
                <li
                  key={d.key}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {d.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {d.value}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
