"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CloudRain,
  Droplets,
  type LucideIcon,
  Plus,
  Radar,
  SlidersHorizontal,
  Thermometer,
  Trash2,
  TriangleAlert,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale, useT, useTD } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { paramLabel, paramUnit } from "@/lib/mappers";
import type {
  MetricThresholds,
  ThresholdMetric,
} from "@/features/thresholds/types";
import type { RegionOption } from "@/types/users";
import type { WeatherParameter } from "@/types/shared";
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

/** UI tier → backend severity (design map: yellow=advisory, orange=watch, red=warning). */
const TIER_TO_SEVERITY: Record<Tier, "yellow" | "orange" | "red"> = {
  advisory: "yellow",
  watch: "orange",
  warning: "red",
};

const APPLIES_TO = ["observed", "forecast", "both"] as const;
type AppliesTo = (typeof APPLIES_TO)[number];

type CreateDraft = {
  regionId: string;
  parameter: string;
  severity: Tier;
  appliesTo: AppliesTo;
  value: string;
};

const EMPTY_CREATE: CreateDraft = {
  regionId: "",
  parameter: "rain_rate_mm",
  severity: "advisory",
  appliesTo: "both",
  value: "",
};

/** The subset of the preview endpoint's payload the dialog surfaces. */
type PreviewResult = {
  affected_station_count: number;
  would_fire_count: number;
  evaluated_stations: number;
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const leadingNum = (s: string) => {
  const m = s.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

type MetricValues = {
  advisory: number;
  watch: number;
  warning: number;
};

/** Local edit-state key: region + metric, so the same metric in two regions
 *  doesn't share one value slot. */
const vkey = (m: { regionId: string; metric: string }) => `${m.regionId}:${m.metric}`;

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
  regionOptions,
}: {
  metrics: MetricThresholds[];
  regionOptions: RegionOption[];
}) {
  const t = useT();
  const td = useTD();
  const { locale } = useLocale();
  const router = useRouter();
  const { can } = useRole();
  const [saving, setSaving] = React.useState(false);

  const [values, setValues] = React.useState<Record<string, MetricValues>>(() =>
    Object.fromEntries(metrics.map((m) => [vkey(m), toValues(m)])),
  );

  // Distinct regions that actually have thresholds — the top selector's options.
  // (Adding thresholds to a region with none is still possible via the create
  // dialog's own region picker; the region then appears here.)
  const regionsWithData = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of metrics) if (!seen.has(m.regionId)) seen.set(m.regionId, m.regionName);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [metrics]);

  // Which region's thresholds are shown. Default to the first region with data.
  const [selectedRegion, setSelectedRegion] = React.useState<string>(metrics[0]?.regionId ?? "");
  const [selected, setSelected] = React.useState<ThresholdMetric>(metrics[0]?.metric);

  // Metrics for the selected region only — everything below operates on these.
  const regionMetrics = React.useMemo(
    () => metrics.filter((m) => m.regionId === selectedRegion),
    [metrics, selectedRegion],
  );

  // Re-seed local tier values (and keep region/metric selection valid) whenever
  // the server data changes — e.g. after a create/delete/revert triggers
  // router.refresh(). Keyed on a value signature, not array identity, so an
  // unrelated re-render never wipes in-progress edits.
  const metricsSig = React.useMemo(
    () =>
      metrics
        .map((m) => `${vkey(m)}:${m.tiers.map((tr) => `${tr.name}=${tr.value}`).join(",")}`)
        .join("|"),
    [metrics],
  );
  React.useEffect(() => {
    // Intentional prop-sync: re-seed local editor state from the server data
    // after a create/delete/revert triggers router.refresh().
    /* eslint-disable react-hooks/set-state-in-effect */
    setValues(Object.fromEntries(metrics.map((m) => [vkey(m), toValues(m)])));
    setSelectedRegion((cur) => (metrics.some((m) => m.regionId === cur) ? cur : metrics[0]?.regionId ?? ""));
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricsSig]);

  // Keep the selected metric valid for the current region (the region may not
  // carry the previously-selected metric). Render-time sync — no effect needed.
  if (regionMetrics.length > 0 && !regionMetrics.some((m) => m.metric === selected)) {
    setSelected(regionMetrics[0].metric);
  }

  // Create-threshold dialog (region + parameter + severity + value, with a
  // non-blocking impact preview) and per-tier delete confirmation.
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState<CreateDraft>(EMPTY_CREATE);
  const [paramOpts, setParamOpts] = React.useState<WeatherParameter[]>([]);
  const [preview, setPreview] = React.useState<PreviewResult | null>(null);

  // Parameter catalog for the create dialog — sourced from the backend
  // (GET /api/parameters) instead of a hardcoded list.
  React.useEffect(() => {
    if (!createOpen || paramOpts.length > 0) return;
    let alive = true;
    fetch(`${BASE}/api/parameters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.data) setParamOpts(j.data as WeatherParameter[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [createOpen, paramOpts.length]);
  const [previewing, setPreviewing] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; tier: Tier } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Live "stations affected" for the footer — dry-run the selected metric's
  // Warning tier against /preview whenever the metric or its value changes
  // (replaces the old hardcoded-empty impact payload). Debounced + abortable.
  const [footerImpact, setFooterImpact] = React.useState<number | null>(null);
  React.useEffect(() => {
    const m = regionMetrics.find((mm) => mm.metric === selected) ?? regionMetrics[0];
    const warnTier = m?.tiers.find((tr) => tr.name.toLowerCase() === "warning");
    const regionId = m?.regionId ?? "";
    const param = warnTier?.parameter ?? "";
    const warnValue = m ? values[m.metric]?.warning : undefined;
    if (!regionId || !param || warnValue == null || !Number.isFinite(warnValue)) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- reset when inputs are incomplete */
      setFooterImpact(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${BASE}/api/thresholds/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region_id: regionId, parameter: param, value: warnValue }),
        signal: ctrl.signal,
      })
        .then(async (r) => ((await r.json().catch(() => ({}))) as { data?: PreviewResult }))
        .then((json) => {
          setFooterImpact(json.data ? json.data.affected_station_count : null);
        })
        .catch(() => {
          /* aborted or failed — keep the prior value */
        });
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [regionMetrics, selected, values]);

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

  const metric = regionMetrics.find((m) => m.metric === selected) ?? regionMetrics[0];
  if (!metric) return null;
  // Composite key for this region+metric's local edit state.
  const curKey = vkey(metric);
  // Fall back to the metric's server values if the local map hasn't caught up
  // yet (the re-seed effect runs right after, but this render must not crash).
  const v = values[curKey] ?? toValues(metric);
  const unit = td(metric.unit);

  const setTier = (tier: Tier, next: number) =>
    setValues((prev) => ({ ...prev, [curKey]: { ...prev[curKey], [tier]: next } }));

  // Monotonic guard: each tier must exceed the one below it (ascending metrics).
  const lowerBound = (tier: Tier) =>
    tier === "watch" ? v.advisory : tier === "warning" ? v.watch : null;
  const invalid = (tier: Tier) => {
    const val = v[tier];
    // Empty (NaN while the field is being retyped) can't be saved either.
    if (!Number.isFinite(val)) return true;
    const lb = lowerBound(tier);
    return lb !== null && val <= lb;
  };

  // Save each CHANGED tier value via PUT /api/thresholds/:id (each tier carries
  // its backend row id). Parameter/severity/region are immutable server-side, so
  // this only sends the new value. Blocked when read-only or monotonic-invalid.
  const anyInvalid = TIERS.some((tier) => invalid(tier));
  const save = async () => {
    if (!can("thresholds.update") || saving) return;
    if (anyInvalid) {
      toast(t("thresholds.saveInvalid"), "info");
      return;
    }
    const edited = values[curKey];
    const changed = TIERS.map((tier) => {
      const row = metric.tiers.find((tr) => tr.name.toLowerCase() === tier);
      if (!row?.id) return null;
      return leadingNum(row.value) !== edited[tier] ? { id: row.id, value: edited[tier] } : null;
    }).filter((x): x is { id: string; value: number } => x !== null);
    if (changed.length === 0) {
      toast(t("thresholds.noChanges"), "info");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        changed.map((c) =>
          fetch(`${BASE}/api/thresholds/${c.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: c.value }),
          })
            .then(async (r) => ({
              ok: r.ok,
              err: r.ok ? null : ((await r.json().catch(() => ({}))) as { error?: string }).error,
            }))
            .catch(() => ({ ok: false, err: null as string | null })),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      toast(
        failed.length ? failed[0].err ?? t("thresholds.saveFailed") : t("thresholds.savedToast"),
        failed.length ? "info" : "success",
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    // Pre-select the region currently being viewed (still changeable in the dialog).
    setCreateDraft({ ...EMPTY_CREATE, regionId: selectedRegion });
    setPreview(null);
    setCreateOpen(true);
  };

  const createReady =
    createDraft.regionId !== "" && createDraft.parameter !== "" && createDraft.value !== "";

  // Dry run: POST the draft to /api/thresholds/preview and surface the counts
  // inline. Non-blocking — it never gates the Create submit.
  const runPreview = async () => {
    const value = Number(createDraft.value);
    if (!createReady || !Number.isFinite(value)) {
      toast(t("thresholds.create.fillFirst"), "info");
      return;
    }
    setPreviewing(true);
    try {
      const res = await fetch(`${BASE}/api/thresholds/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region_id: createDraft.regionId,
          parameter: createDraft.parameter,
          value,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: PreviewResult;
      };
      if (!res.ok || !json.data) {
        toast(json.error ?? t("thresholds.create.previewFailed"), "info");
        return;
      }
      setPreview(json.data);
    } finally {
      setPreviewing(false);
    }
  };

  const createThreshold = async () => {
    if (creating) return;
    const value = Number(createDraft.value);
    if (!createReady || !Number.isFinite(value)) {
      toast(t("thresholds.create.fillFirst"), "info");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/thresholds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region_id: createDraft.regionId,
          parameter: createDraft.parameter,
          severity: TIER_TO_SEVERITY[createDraft.severity],
          applies_to: createDraft.appliesTo,
          value,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; data?: unknown };
      if (!res.ok) {
        toast(json.error ?? t("thresholds.create.failed"), "info");
        return;
      }
      toast(t("thresholds.create.created"));
      setCreateOpen(false);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      const res = await fetch(`${BASE}/api/thresholds/${target.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("thresholds.delete.failed"), "info");
        return;
      }
      toast(t("thresholds.delete.deleted"));
      setPendingDelete(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Region selector — thresholds are stored per region, so pick which
          region's set to view/edit. The metric cards below belong to it. */}
      {regionsWithData.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t("thresholds.region.label")}
          </span>
          <Select
            value={selectedRegion}
            onValueChange={(rid) => {
              setSelectedRegion(rid);
              const first = metrics.find((m) => m.regionId === rid)?.metric;
              if (first) setSelected(first);
            }}
          >
            <SelectTrigger className="w-[220px]" aria-label={t("thresholds.region.label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regionsWithData.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {t("region." + r.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[224px_minmax(0,1fr)]">
        {/* Master — metric rail. Each item previews its Warning cut-off. */}
        <nav
          aria-label={t("thresholds.editor.metricsAria")}
          className="flex gap-1 overflow-x-auto border-b border-border-subtle p-2 lg:flex-col lg:border-b-0 lg:border-e"
        >
          {regionMetrics.map((m) => {
            const Icon = METRIC_ICON[m.metric];
            const isActive = m.metric === selected;
            const mv = values[vkey(m)] ?? toValues(m);
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
                    {t("severity.warning")} ≥ {Number.isFinite(mv.warning) ? mv.warning : "—"} {td(m.unit)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Detail — the selected metric's editor. */}
        <div className="min-w-0 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              {React.createElement(METRIC_ICON[metric.metric], {
                className: "size-5 text-muted-foreground",
                "aria-hidden": true,
              })}
              {t(`thresholds.metric.${metric.metric}`)}
              {metric.regionName ? (
                <Badge variant="outline" className="shrink-0 font-medium">
                  {t("region." + metric.regionName)}
                </Badge>
              ) : null}
            </h3>
            <div className="flex items-center gap-2">
              {metric.perStationOverrides ? (
                <Badge variant="secondary" className="shrink-0">
                  {t("thresholds.perStationOverrides")}
                </Badge>
              ) : null}
              {can("thresholds.create") ? (
                <Button variant="outline" size="sm" className="shrink-0" onClick={openCreate}>
                  <Plus className="size-4" />
                  {t("thresholds.create.newButton")}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Visual escalation bar. */}
          <TierScaleBar
            advisory={Number.isFinite(v.advisory) ? v.advisory : 0}
            watch={Number.isFinite(v.watch) ? v.watch : 0}
            warning={Number.isFinite(v.warning) ? v.warning : 0}
            unit={unit}
          />

          {/* Stacked tier inputs — number + unit, inline monotonic validation. */}
          <div className="mt-5 flex flex-col divide-y divide-border-subtle">
            {TIERS.map((tier) => {
              const lb = lowerBound(tier);
              // Below-bound is the hard error (red border + hint). An empty field
              // is allowed while editing — it just disables Save (anyInvalid) and
              // doesn't flash red mid-typing.
              const belowBound =
                Number.isFinite(v[tier]) && lb !== null && v[tier] <= lb;
              const rowId = metric.tiers.find((tr) => tr.name.toLowerCase() === tier)?.id;
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
                      onChange={(e) =>
                        setTier(tier, e.target.value === "" ? NaN : Number(e.target.value))
                      }
                      className={cn("pe-12 tabular-nums", belowBound && "border-status-warning")}
                      aria-invalid={belowBound}
                    />
                    <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      {unit}
                    </span>
                  </div>
                  {belowBound ? (
                    <span className="flex items-center gap-1 text-xs text-text-warning">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                      {t("thresholds.mustExceed", { prev: `${lb} ${unit}` })}
                    </span>
                  ) : null}
                  {can("thresholds.delete") && rowId ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ms-auto size-9 shrink-0 text-muted-foreground hover:text-text-warning"
                      onClick={() => setPendingDelete({ id: rowId, tier })}
                      aria-label={t("thresholds.delete.label", { tier: t(`severity.${tier}`) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
                  {t(`severity.${tier}`)} ≥ {Number.isFinite(v[tier]) ? v[tier] : "—"}
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
          {footerImpact == null
            ? t("thresholds.impact.calculating")
            : t("thresholds.impact.note", { count: footerImpact })}
        </p>
        <Button className="shrink-0" onClick={save} disabled={!can("thresholds.update") || saving || anyInvalid}>
          <Check className="size-4" />
          {t("thresholds.saveApply")}
        </Button>
      </div>

      {/* Create-threshold dialog — region + parameter + severity + value, with a
          non-blocking impact preview (dry run) before committing. */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground"
            >
              <Plus className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("thresholds.create.title")}</DialogTitle>
              <DialogDescription>{t("thresholds.create.desc")}</DialogDescription>
            </div>
          </DialogHeader>

          <form
            id="threshold-create-form"
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              createThreshold();
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="th-region" className="text-sm font-medium text-foreground">
                {t("thresholds.create.region")} <span className="text-destructive">*</span>
              </label>
              {regionOptions.length === 0 ? (
                <p className="rounded-lg border border-border-subtle bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  {t("thresholds.create.noRegions")}
                </p>
              ) : (
                <Select
                  value={createDraft.regionId}
                  onValueChange={(v) => {
                    setCreateDraft((d) => ({ ...d, regionId: v }));
                    setPreview(null);
                  }}
                >
                  <SelectTrigger id="th-region" className="w-full">
                    <SelectValue placeholder={t("thresholds.create.regionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((rg) => (
                      <SelectItem key={rg.id} value={rg.id}>
                        {t("region." + rg.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="th-param" className="text-sm font-medium text-foreground">
                  {t("thresholds.create.parameter")}
                </label>
                <Select
                  value={createDraft.parameter}
                  onValueChange={(v) => {
                    setCreateDraft((d) => ({ ...d, parameter: v }));
                    setPreview(null);
                  }}
                >
                  <SelectTrigger id="th-param" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paramOpts.filter((p) => p.alertable).length === 0 ? (
                      <SelectItem value={createDraft.parameter}>
                        {paramLabel(createDraft.parameter)}
                      </SelectItem>
                    ) : (
                      paramOpts
                        .filter((p) => p.alertable)
                        .map((p) => (
                          <SelectItem key={p.key} value={p.key}>
                            {locale === "ar" ? p.nameAr : p.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="th-value" className="text-sm font-medium text-foreground">
                  {t("thresholds.create.value")} <span className="text-destructive">*</span>
                </label>
                <div dir="ltr" className="relative">
                  <Input
                    id="th-value"
                    type="number"
                    inputMode="decimal"
                    value={createDraft.value}
                    onChange={(e) => {
                      setCreateDraft((d) => ({ ...d, value: e.target.value }));
                      setPreview(null);
                    }}
                    className="pe-14 tabular-nums"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {paramOpts.find((p) => p.key === createDraft.parameter)?.unit ??
                      paramUnit(createDraft.parameter)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="th-severity" className="text-sm font-medium text-foreground">
                  {t("thresholds.create.severity")}
                </label>
                <Select
                  value={createDraft.severity}
                  onValueChange={(v) => setCreateDraft((d) => ({ ...d, severity: v as Tier }))}
                >
                  <SelectTrigger id="th-severity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {t(`severity.${tier}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="th-applies" className="text-sm font-medium text-foreground">
                  {t("thresholds.create.appliesTo")}
                </label>
                <Select
                  value={createDraft.appliesTo}
                  onValueChange={(v) =>
                    setCreateDraft((d) => ({ ...d, appliesTo: v as AppliesTo }))
                  }
                >
                  <SelectTrigger id="th-applies" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLIES_TO.map((a) => (
                      <SelectItem key={a} value={a}>
                        {t(`thresholds.create.appliesTo.${a}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Impact preview (dry run) — never gates Create. */}
            <div className="rounded-lg border border-border-subtle bg-secondary/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {t("thresholds.create.previewHeading")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={runPreview}
                  disabled={previewing || !createReady}
                >
                  <Radar className="size-4" />
                  {t("thresholds.create.previewButton")}
                </Button>
              </div>
              {preview ? (
                <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">
                    {t("thresholds.create.affected", {
                      count: preview.affected_station_count,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("thresholds.create.wouldFire", { count: preview.would_fire_count })} ·{" "}
                    {t("thresholds.create.evaluated", { count: preview.evaluated_stations })}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("thresholds.create.previewHint")}
                </p>
              )}
            </div>
          </form>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" form="threshold-create-form" disabled={creating || !createReady}>
              <Plus className="size-4" />
              {t("thresholds.create.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-tier delete confirmation */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning"
            >
              <Trash2 className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("thresholds.delete.title")}</DialogTitle>
              <DialogDescription>
                {pendingDelete
                  ? t("thresholds.delete.desc", {
                      tier: t(`severity.${pendingDelete.tier}`),
                      metric: t(`thresholds.metric.${metric.metric}`),
                    })
                  : ""}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              <Trash2 className="size-4" />
              {t("thresholds.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  );
}
