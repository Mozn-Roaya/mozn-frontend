"use client";

import * as React from "react";
import {
  Check,
  CloudRain,
  Droplets,
  type LucideIcon,
  SlidersHorizontal,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT, useTD } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type {
  MetricThresholds,
  ThresholdMetric,
  ThresholdsPage,
} from "@/features/thresholds/types";
import { TierScaleBar } from "./tier-scale-bar";

const METRIC_ICON: Record<ThresholdMetric, LucideIcon> = {
  rainfall: CloudRain,
  wind: Wind,
  water: Droplets,
  temperature: Thermometer,
};

const TONE_HEX: Record<string, string> = {
  advisory: "#f59e0b",
  watch: "#fb923c",
  warning: "#ef4444",
};

const TIERS = ["advisory", "watch", "warning"] as const;
type Tier = (typeof TIERS)[number];

const leadingNum = (s: string) => {
  const m = s.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

type MetricValues = {
  advisory: number;
  watch: number;
  warning: number;
};

/** Parse the editable numbers out of a metric's seeded tier strings. */
function toValues(m: MetricThresholds): MetricValues {
  const find = (name: Tier) => m.tiers.find((tr) => tr.name.toLowerCase() === name);
  return {
    advisory: leadingNum(find("advisory")?.value ?? "0"),
    watch: leadingNum(find("watch")?.value ?? "0"),
    warning: leadingNum(find("warning")?.value ?? "0"),
  };
}

export function MetricThresholdsEditor({
  metrics,
  impact,
}: {
  metrics: MetricThresholds[];
  impact: ThresholdsPage["impact"];
}) {
  const t = useT();
  const td = useTD();

  const [values, setValues] = React.useState<Record<string, MetricValues>>(() =>
    Object.fromEntries(metrics.map((m) => [m.metric, toValues(m)])),
  );
  const [selected, setSelected] = React.useState<ThresholdMetric>(metrics[0]?.metric);

  // Empty backend payload: nothing to select or edit. Bail out before any of
  // the lookups below, which all assume at least one metric exists.
  if (metrics.length === 0) {
    return (
      <Card className="overflow-hidden">
        <EmptyState
          icon={SlidersHorizontal}
          title={t("thresholds.editor.empty.title")}
          message={t("thresholds.editor.empty.body")}
        />
      </Card>
    );
  }

  const metric = metrics.find((m) => m.metric === selected) ?? metrics[0];
  const v = values[selected];
  const unit = td(metric.unit);

  const setTier = (tier: Tier, next: number) =>
    setValues((prev) => ({ ...prev, [selected]: { ...prev[selected], [tier]: next } }));

  // Monotonic guard: each tier must exceed the one below it (ascending metrics).
  const lowerBound = (tier: Tier) =>
    tier === "watch" ? v.advisory : tier === "warning" ? v.watch : null;
  const invalid = (tier: Tier) => {
    const lb = lowerBound(tier);
    return lb !== null && v[tier] <= lb;
  };

  const impactCount = impact.note.match(/\d+/)?.[0] ?? String(impact.stations.length);

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[224px_minmax(0,1fr)]">
        {/* Master — metric rail. Each item previews its Warning cut-off. */}
        <nav
          aria-label={t("thresholds.editor.metricsAria")}
          className="flex gap-1 overflow-x-auto border-b border-border-subtle p-2 lg:flex-col lg:border-b-0 lg:border-e"
        >
          {metrics.map((m) => {
            const Icon = METRIC_ICON[m.metric];
            const isActive = m.metric === selected;
            const mv = values[m.metric];
            return (
              <button
                key={m.metric}
                type="button"
                onClick={() => setSelected(m.metric)}
                aria-current={isActive ? "true" : undefined}
                aria-label={t("thresholds.editor.selectMetric", {
                  metric: t(`thresholds.metric.${m.metric}`),
                })}
                className={cn(
                  "group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full",
                  isActive ? "bg-brand-subtle" : "hover:bg-muted",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-brand-foreground" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate text-sm",
                      isActive ? "font-semibold text-brand-foreground" : "font-medium text-foreground",
                    )}
                  >
                    {t(`thresholds.metric.${m.metric}`)}
                  </span>
                  <span className="truncate text-xs tabular-nums text-muted-foreground">
                    {t("severity.warning")} ≥ {mv.warning} {td(m.unit)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Detail — the selected metric's editor. */}
        <div className="min-w-0 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              {React.createElement(METRIC_ICON[metric.metric], {
                className: "size-5 text-muted-foreground",
                "aria-hidden": true,
              })}
              {t(`thresholds.metric.${metric.metric}`)}
            </h3>
            {metric.perStationOverrides ? (
              <Badge variant="secondary" className="shrink-0">
                {t("thresholds.perStationOverrides")}
              </Badge>
            ) : null}
          </div>

          {/* Visual escalation bar. */}
          <TierScaleBar advisory={v.advisory} watch={v.watch} warning={v.warning} unit={unit} />

          {/* Stacked tier inputs — number + unit, inline monotonic validation. */}
          <div className="mt-5 flex flex-col divide-y divide-border-subtle">
            {TIERS.map((tier) => {
              const bad = invalid(tier);
              const lb = lowerBound(tier);
              return (
                <div key={tier} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: TONE_HEX[tier] }}
                  />
                  <label
                    htmlFor={`tier-${tier}`}
                    className="w-20 shrink-0 text-sm font-medium"
                    style={{ color: TONE_HEX[tier] }}
                  >
                    {t(`severity.${tier}`)}
                  </label>
                  <div dir="ltr" className="relative w-32">
                    <Input
                      id={`tier-${tier}`}
                      type="number"
                      inputMode="decimal"
                      value={Number.isFinite(v[tier]) ? v[tier] : ""}
                      onChange={(e) => setTier(tier, Number(e.target.value))}
                      className={cn("pe-12 tabular-nums", bad && "border-status-warning")}
                      aria-invalid={bad}
                    />
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      {unit}
                    </span>
                  </div>
                  {bad ? (
                    <span className="flex items-center gap-1 text-xs text-text-warning">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                      {t("thresholds.mustExceed", { prev: `${lb} ${unit}` })}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Plain-language read-back of what's configured. */}
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{t("thresholds.summaryFrom")}</span>
            {TIERS.map((tier, i) => (
              <React.Fragment key={tier}>
                {i > 0 ? <span aria-hidden>·</span> : null}
                <span className="font-semibold tabular-nums" style={{ color: TONE_HEX[tier] }}>
                  {t(`severity.${tier}`)} ≥ {v[tier]}
                </span>
              </React.Fragment>
            ))}
            <span className="font-medium text-foreground">{unit}</span>
          </p>
        </div>
      </div>

      {/* Footer — live impact preview + save. */}
      <div className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <TriangleAlert className="size-4 shrink-0 text-status-advisory" aria-hidden />
          {t("thresholds.impact.note", { count: impactCount })}
        </p>
        <Button className="shrink-0" onClick={() => toast(t("thresholds.savedToast"))}>
          <Check className="size-4" />
          {t("thresholds.saveApply")}
        </Button>
      </div>
    </Card>
  );
}
