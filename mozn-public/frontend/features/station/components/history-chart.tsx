"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/components/lib/cn";
import { localeFor, type Dict } from "@/components/lib/i18n";
import { useLang, useT } from "@/components/state/lang-context";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { ReadingHistoryBucket } from "@/components/api/types";

export type Series = "temp" | "rain" | "humidity" | "wind" | "pressure";
export type Range = "24h" | "7d" | "30d";

/** Translated display label for a chart series (colours/units stay in
 *  `seriesConfig`; only the words are localised here). */
export function seriesLabel(series: Series, t: Dict): string {
  switch (series) {
    case "temp":
      return t.temperature;
    case "rain":
      return t.rainfall;
    case "humidity":
      return t.humidity;
    case "wind":
      return t.windSpeed;
    case "pressure":
      return t.pressure;
  }
}

export const seriesConfig: Record<
  Series,
  {
    unit: string;
    /** Chart series colour — a `--color-chart-*` token so it tracks the theme. */
    color: string;
    /** Continuous metrics read as an area; per-bucket totals (rain) as bars. */
    kind: "area" | "bar";
    pick: (b: ReadingHistoryBucket) => number;
    /** Short form for axis ticks and KPI tiles (no unit). */
    formatTick: (v: number) => string;
    /** Full form with unit, for the hover tooltip. */
    format: (v: number) => string;
  }
> = {
  // Colours come from the Figma data-viz palette (`--color-chart-*` in
  // globals.css) so the charts stay in sync with the design system and theme.
  temp: {
    unit: "°C",
    color: "var(--color-chart-danger)",
    kind: "area",
    pick: (b) => b.temp_c_avg,
    formatTick: (v) => `${Math.round(v)}°`,
    format: (v) => `${Math.round(v)}°C`,
  },
  rain: {
    unit: "mm",
    color: "var(--color-chart-1)",
    kind: "bar",
    pick: (b) => b.rain_total_mm,
    formatTick: (v) => `${v.toFixed(v < 10 ? 1 : 0)}`,
    format: (v) => `${v.toFixed(v < 10 ? 1 : 0)} mm`,
  },
  humidity: {
    unit: "%",
    color: "var(--color-chart-4)",
    kind: "area",
    pick: (b) => b.humidity_avg,
    formatTick: (v) => `${Math.round(v)}%`,
    format: (v) => `${Math.round(v)}%`,
  },
  wind: {
    unit: "km/h",
    color: "var(--color-chart-2)",
    kind: "area",
    pick: (b) => b.wind_speed_max_kmh,
    formatTick: (v) => `${Math.round(v)}`,
    format: (v) => `${Math.round(v)} km/h`,
  },
  pressure: {
    unit: "hPa",
    color: "var(--color-chart-3)",
    kind: "area",
    pick: (b) => b.pressure_hpa_avg,
    formatTick: (v) => `${Math.round(v)}`,
    format: (v) => `${Math.round(v)} hPa`,
  },
};

type MetricChartProps = {
  data: ReadingHistoryBucket[];
  series: Series;
  range: Range;
  className?: string;
};

/**
 * Interactive history chart built on shadcn's chart primitive (Recharts).
 * Continuous metrics render as a gradient area; rainfall as bars. The series
 * colour is injected as `--color-value` by `ChartContainer` from the config,
 * so it resolves to the right `--color-chart-*` token for the active theme.
 */
export function MetricChart({ data, series, range, className }: MetricChartProps) {
  const cfg = seriesConfig[series];
  const t = useT();
  const lang = useLang();

  const fmtTime = React.useCallback(
    (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      if (range === "24h") {
        return d.toLocaleTimeString(localeFor(lang), {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return d.toLocaleDateString(localeFor(lang), {
        month: "short",
        day: "numeric",
      });
    },
    [range, lang],
  );

  const chartData = React.useMemo(
    () =>
      data.map((b) => ({
        label: fmtTime(b.bucket_start),
        value: cfg.pick(b),
      })),
    [data, cfg, fmtTime],
  );

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-(--color-bg-secondary) text-body-sm text-(--color-text-muted)",
          className,
        )}
      >
        {t.noHistory}
      </div>
    );
  }

  const config = {
    value: { label: seriesLabel(series, t), color: cfg.color },
  } satisfies ChartConfig;

  const tooltip = (
    <ChartTooltip
      content={
        <ChartTooltipContent
          formatter={(value) => (
            <div className="flex w-full items-center justify-between gap-[16px]">
              <span className="text-(--color-text-muted)">
                {seriesLabel(series, t)}
              </span>
              <span className="font-mono font-medium text-(--color-text-primary) tabular-nums">
                {cfg.format(Number(value))}
              </span>
            </div>
          )}
        />
      }
    />
  );

  const axisProps = { tickLine: false, axisLine: false, tickMargin: 8 } as const;

  return (
    <ChartContainer config={config} className={cn("w-full", className)}>
      {cfg.kind === "bar" ? (
        <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" minTickGap={28} {...axisProps} />
          <YAxis width={40} domain={[0, "auto"]} tickFormatter={cfg.formatTick} {...axisProps} />
          {tooltip}
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id={`fill-${series}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" minTickGap={28} {...axisProps} />
          <YAxis width={40} domain={["auto", "auto"]} tickFormatter={cfg.formatTick} {...axisProps} />
          {tooltip}
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            fill={`url(#fill-${series})`}
            dot={false}
            activeDot={{ r: 3.5 }}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
}
