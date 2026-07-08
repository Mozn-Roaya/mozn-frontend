"use client";

import * as React from "react";

import { cn } from "@/components/lib/cn";
import { useT } from "@/components/state/lang-context";

import {
  MetricChart,
  seriesConfig,
  seriesLabel,
  type Range,
  type Series,
} from "./history-chart";

import type { ReadingHistoryBucket } from "@/components/api/types";
import type { Dict } from "@/components/lib/i18n";

// Figma charts grid (232:2): Temperature, Rainfall, Wind Speed, Water Level.
// Water Level has no series in the readings-history API, so the fourth slot
// shows Pressure — the remaining real, data-backed series.
const GRID_SERIES: Series[] = ["temp", "rain", "wind", "pressure"];
const RANGES: Range[] = ["24h", "7d", "30d"];

type ExpandedChartsProps = {
  stationId: string;
  initial: { range: Range; data: ReadingHistoryBucket[] };
};

export function ExpandedCharts({ stationId, initial }: ExpandedChartsProps) {
  const t = useT();
  const [range, setRange] = React.useState<Range>(initial.range);
  const [data, setData] = React.useState<ReadingHistoryBucket[]>(initial.data);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<Series>("temp");

  React.useEffect(() => {
    if (range === initial.range && data === initial.data) return;
    let cancelled = false;
    setPending(true);
    setError(null);
    fetch(
      `/api/proxy/public/readings/history?station_id=${encodeURIComponent(
        stationId,
      )}&range=${range}`,
    )
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
    // `data`/`initial.data` intentionally excluded — this reacts to range only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, stationId, initial.range]);

  return (
    <div className="flex w-full flex-col gap-[16px] pb-[8px]">
      {/* Range switcher */}
      <div className="flex items-center gap-[8px]">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={cn(
              "rounded-lg px-[14px] py-[8px] text-body-xs font-medium transition-colors",
              range === r
                ? "bg-(--color-bg-inverse) text-(--color-text-inverse)"
                : "border border-solid border-(--color-border-default) text-(--color-text-muted) hover:text-(--color-text-primary)",
            )}
          >
            {t.periods[r]}
          </button>
        ))}
        {pending && (
          <span className="text-body-xxs text-(--color-text-muted)">
            {t.loadingShort}
          </span>
        )}
        {error && (
          <span className="text-body-xxs text-(--color-text-warning)">
            {t.couldntLoadHistory}
          </span>
        )}
      </div>

      {/* Master (metric rail) + detail (focused chart) */}
      <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-[248px_1fr] lg:gap-[20px]">
        <div className="flex gap-[10px] overflow-x-auto pb-[4px] lg:flex-col lg:overflow-visible lg:pb-0">
          {GRID_SERIES.map((s) => (
            <MetricCard
              key={s}
              series={s}
              data={data}
              active={s === active}
              onSelect={() => setActive(s)}
              t={t}
            />
          ))}
        </div>

        <FocusedPanel series={active} data={data} range={range} t={t} />
      </div>
    </div>
  );
}

/** Aggregate helpers over the currently loaded buckets for one series. */
function stats(data: ReadingHistoryBucket[], series: Series) {
  const values = data.map(seriesConfig[series].pick);
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    now: values[values.length - 1],
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function MetricCard({
  series,
  data,
  active,
  onSelect,
  t,
}: {
  series: Series;
  data: ReadingHistoryBucket[];
  active: boolean;
  onSelect: () => void;
  t: Dict;
}) {
  const cfg = seriesConfig[series];
  const s = stats(data, series);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex min-w-[168px] items-center justify-between gap-[12px] rounded-xl border border-solid p-[12px] text-start transition-colors lg:min-w-0",
        active
          ? "border-(--color-border-default) bg-(--color-bg-primary) shadow-card"
          : "border-transparent bg-(--color-bg-secondary) hover:border-(--color-border-subtle)",
      )}
    >
      <span className="flex min-w-0 items-center gap-[8px]">
        <span
          className="size-[8px] shrink-0 rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-xxs text-(--color-text-muted)">
            {seriesLabel(series, t)}
          </span>
          <span className="text-label-lg font-semibold text-(--color-text-primary) tabular-nums">
            {s ? cfg.formatTick(s.now) : "—"}
          </span>
        </span>
      </span>
      <Sparkline
        values={data.map(cfg.pick)}
        color={cfg.color}
        kind={cfg.kind}
      />
    </button>
  );
}

/** Tiny inline sparkline — a lightweight indicator, not the main chart. */
function Sparkline({
  values,
  color,
  kind,
}: {
  values: number[];
  color: string;
  kind: "area" | "bar";
}) {
  const W = 56;
  const H = 26;
  if (values.length < 2) return <span className="w-[56px]" aria-hidden="true" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 2 - ((v - min) / range) * (H - 5);

  if (kind === "bar") {
    const bw = (W / values.length) * 0.7;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
        {values.map((v, i) => (
          <rect
            key={i}
            x={x(i) - bw / 2}
            y={y(v)}
            width={bw}
            height={Math.max(0, H - 2 - y(v))}
            rx={1}
            fill={color}
            opacity={0.85}
          />
        ))}
      </svg>
    );
  }

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FocusedPanel({
  series,
  data,
  range,
  t,
}: {
  series: Series;
  data: ReadingHistoryBucket[];
  range: Range;
  t: Dict;
}) {
  const cfg = seriesConfig[series];
  const s = stats(data, series);
  const tiles: Array<[string, number | undefined]> = [
    [t.statNow, s?.now],
    [t.statAvg, s?.avg],
    [t.statMin, s?.min],
    [t.statMax, s?.max],
  ];

  return (
    <div className="flex flex-col gap-[14px] rounded-xl border border-solid border-(--color-border-subtle) bg-(--color-bg-secondary) p-[16px] lg:p-[20px]">
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <div className="flex flex-col gap-[1px]">
          <h3 className="m-0 text-label-lg font-semibold text-(--color-text-primary)">
            {seriesLabel(series, t)}
          </h3>
          <p className="m-0 text-body-xxs text-(--color-text-muted)">{cfg.unit}</p>
        </div>
        <div className="flex gap-[18px]">
          {tiles.map(([label, value]) => (
            <div key={label} className="text-end">
              <p className="m-0 text-body-xxs uppercase tracking-[0.06em] text-(--color-text-muted)">
                {label}
              </p>
              <p className="m-0 text-label-lg font-semibold text-(--color-text-primary) tabular-nums">
                {value === undefined ? "—" : cfg.formatTick(value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <MetricChart
        data={data}
        series={series}
        range={range}
        className="h-[240px] lg:h-[300px]"
      />
    </div>
  );
}
