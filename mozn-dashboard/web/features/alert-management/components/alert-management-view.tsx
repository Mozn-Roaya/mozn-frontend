"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  CircleCheck,
  CloudRain,
  Droplets,
  Layers,
  type LucideIcon,
  Plus,
  RotateCcw,
  SearchX,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { paramLabel } from "@/lib/mappers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableBodyRowClass,
  tableHeaderRowClass,
} from "@/components/ui/table";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import { DensityToggle, rowPadFor, type Density } from "@/components/data-table/density-toggle";
import { nextSort, SortableHead, type SortState } from "@/components/data-table/sortable-head";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { DotBadge, SeverityBadge } from "@/components/common/status-badges";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type {
  ManagedAlert,
  ManagedSeverity,
  ManagedStatus,
} from "@/features/alert-management/types";

const TYPE_ICON: Record<string, LucideIcon> = {
  rainfall: CloudRain,
  wind: Wind,
  water: Droplets,
  temperature: Thermometer,
  compound: Layers,
};

const SEVERITY_RANK: Record<ManagedSeverity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
  advisory: 3,
};

const STATUS_RANK: Record<ManagedStatus, number> = {
  active: 0,
  acknowledged: 1,
  resolved: 2,
};

// Status shown as a soft dot-badge (matches Stations/History), colour is one of
// the two urgency cues on the row alongside the severity chip.
const STATUS_STYLE: Record<
  ManagedStatus,
  { variant: React.ComponentProps<typeof DotBadge>["variant"]; dot: string }
> = {
  active: { variant: "warning", dot: "bg-status-warning" },
  acknowledged: { variant: "watch", dot: "bg-text-link" },
  resolved: { variant: "normal", dot: "bg-status-normal" },
};

const STATUS_FILTERS: ManagedStatus[] = ["active", "acknowledged", "resolved"];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Parameters a manual alert can be raised on (label via paramLabel).
const ALERT_PARAMS = [
  "rain_rate_mm",
  "rain_daily_mm",
  "wind_speed_kmh",
  "wind_gust_kmh",
  "temp_high_c",
  "temp_low_c",
  "pressure_hpa",
  "humidity",
] as const;

const CREATE_SEVERITIES = ["yellow", "orange", "red"] as const;
/** backend severity → UI tier label key (yellow=advisory, orange=watch, red=warning). */
const SEVERITY_TIER: Record<(typeof CREATE_SEVERITIES)[number], string> = {
  yellow: "advisory",
  orange: "watch",
  red: "warning",
};

type CreateAlertDraft = {
  stationId: string;
  parameter: string;
  severity: (typeof CREATE_SEVERITIES)[number];
  value: string;
  message: string;
  messageAr: string;
};
const EMPTY_ALERT: CreateAlertDraft = {
  stationId: "",
  parameter: "rain_rate_mm",
  severity: "orange",
  value: "",
  message: "",
  messageAr: "",
};

type SortKey = "severity" | "type" | "trigger" | "duration" | "status";

export function AlertManagementView({ initialAlerts }: { initialAlerts: ManagedAlert[] }) {
  const { t, td } = useLocale();
  const router = useRouter();
  const { readOnly, can } = useRole();
  // Server-rendered live data is the source of truth; after each action we
  // router.refresh() to re-fetch rather than mutate a local copy.
  const alerts = initialAlerts;

  // Manual alert creation dialog.
  const [createOpen, setCreateOpen] = React.useState(false);
  const [alertDraft, setAlertDraft] = React.useState<CreateAlertDraft>(EMPTY_ALERT);
  const [stationOpts, setStationOpts] = React.useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = React.useState(false);

  // Load the station list (for the create dialog's station select) on first open.
  React.useEffect(() => {
    if (!createOpen || stationOpts.length > 0) return;
    let alive = true;
    fetch(`${BASE}/api/stations`)
      .then((r) => (r.ok ? r.json() : null))
      .then((page) => {
        if (!alive || !page?.groups) return;
        const rows = (page.groups as { rows: { id: string; name: string }[] }[])
          .flatMap((g) => g.rows)
          .map((r) => ({ id: r.id, name: r.name }));
        setStationOpts(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [createOpen, stationOpts.length]);

  const submitCreate = async () => {
    const d = alertDraft;
    if (!d.stationId || !d.parameter || !d.message.trim() || !d.messageAr.trim()) {
      toast(t("alertmgmt.create.incomplete"), "info");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: d.stationId,
          severity: d.severity,
          parameter: d.parameter,
          message: d.message.trim(),
          message_ar: d.messageAr.trim(),
          ...(d.value.trim() !== "" && !Number.isNaN(Number(d.value)) ? { value: Number(d.value) } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("alertmgmt.create.failed"), "info");
        return;
      }
      toast(t("alertmgmt.create.created"));
      setCreateOpen(false);
      setAlertDraft(EMPTY_ALERT);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState<SortKey>>({ key: "severity", dir: "asc" });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));
  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);

  // Resolve reason dialog + in-flight guard.
  const [resolveTarget, setResolveTarget] = React.useState<ManagedAlert | null>(null);
  const [reason, setReason] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const act = React.useCallback(
    async (id: string, action: "resolve" | "reopen", body?: Record<string, unknown>) => {
      setBusyId(id);
      try {
        const res = await fetch(`${BASE}/api/alerts/${id}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body ?? {}),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast(json.error ?? t("alertmgmt.toast.failed"), "info");
          return;
        }
        toast(action === "resolve" ? t("alertmgmt.toast.resolved") : t("alertmgmt.toast.reopened"));
        router.refresh();
      } finally {
        setBusyId(null);
      }
    },
    [router, t],
  );

  const confirmResolve = () => {
    if (!resolveTarget) return;
    const id = resolveTarget.id;
    const r = reason.trim();
    setResolveTarget(null);
    setReason("");
    void act(id, "resolve", r ? { reason: r } : {});
  };

  // With alerts present, zero rows means the filters excluded them all.
  const hasFilters = statuses.length > 0 || query.trim() !== "";
  const clearFilters = () => {
    setStatuses([]);
    setQuery("");
  };

  const typeLabel = React.useCallback(
    (a: ManagedAlert) =>
      a.typeKey === "compound"
        ? t("alertmgmt.type.compound")
        : t("thresholds.metric." + a.typeKey),
    [t],
  );

  // Faceted status filter options with live counts (empty selection = all).
  const statusOptions = React.useMemo(
    () =>
      STATUS_FILTERS.map((key) => ({
        value: key,
        label: t("alertmgmt.status." + key),
        count: alerts.filter((a) => a.status === key).length,
      })),
    [alerts, t],
  );

  // Fixed triage order: most severe first, then by lifecycle (active → resolved).
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = alerts.filter((a) => {
      const okStatus = statuses.length === 0 || statuses.includes(a.status);
      const okQuery =
        !q ||
        `${a.trigger} ${a.stations.join(" ")} ${typeLabel(a)} ${t("region." + a.region)}`
          .toLowerCase()
          .includes(q);
      return okStatus && okQuery;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    const cmp = (a: ManagedAlert, b: ManagedAlert) => {
      switch (sort.key) {
        case "type": return typeLabel(a).localeCompare(typeLabel(b));
        case "trigger": return a.trigger.localeCompare(b.trigger);
        case "duration": return a.durationMin - b.durationMin;
        case "status": return STATUS_RANK[a.status] - STATUS_RANK[b.status];
        case "severity": default: return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || STATUS_RANK[a.status] - STATUS_RANK[b.status];
      }
    };
    return [...scoped].sort((a, b) => cmp(a, b) * dir);
  }, [alerts, statuses, query, sort, t, typeLabel]);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allVisibleSelected = rows.length > 0 && rows.every((a) => selected.has(a.id));
  const someSelected = rows.some((a) => selected.has(a.id));
  const toggleAll = () => setSelected((prev) => { if (allVisibleSelected) { const next = new Set(prev); rows.forEach((a) => next.delete(a.id)); return next; } return new Set([...prev, ...rows.map((a) => a.id)]); });
  const toggleOne = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } = usePagination(rows);
  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ statuses, query, sort });
  if (pagedFilters.statuses !== statuses || pagedFilters.query !== query || pagedFilters.sort !== sort) {
    setPagedFilters({ statuses, query, sort });
    setPageIndex(1);
  }

  return (
    <Card className="overflow-hidden">
      {/* Toolbar lives inside the card (matches Stations/Users/Activity). */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <SearchInput
          className="sm:max-w-[280px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("alertmgmt.searchPlaceholder")}
          aria-label={t("alertmgmt.searchAria")}
        />
        <FacetedFilter
          title={t("alertmgmt.col.status")}
          options={statusOptions}
          selected={statuses}
          onChange={setStatuses}
        />
        <div className="flex items-center gap-3 sm:ms-auto">
          <p className="text-xs text-muted-foreground">
            {t("alertmgmt.count", { shown: rows.length, total: alerts.length })}
          </p>
          <DensityToggle value={density} onChange={setDensity} />
          {can("alerts.create") ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t("alertmgmt.create.newButton")}
            </Button>
          ) : null}
        </div>
      </div>
      {alerts.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("alertmgmt.empty.title")}
          message={t("alertmgmt.empty.body")}
        />
      ) : (
        <>
        <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="w-10 ps-4">
                <Checkbox
                  checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label={t("common.selectAll")}
                />
              </TableHead>
              <SortableHead label={t("alertmgmt.col.severity")} column="severity" sort={sort} onSort={onSort} />
              <SortableHead label={t("alertmgmt.col.type")} column="type" sort={sort} onSort={onSort} />
              <SortableHead label={t("alertmgmt.trigger")} column="trigger" sort={sort} onSort={onSort} />
              <SortableHead label={t("alertmgmt.duration")} column="duration" sort={sort} onSort={onSort} />
              <SortableHead label={t("alertmgmt.col.status")} column="status" sort={sort} onSort={onSort} />
              <TableHead className="pe-4 text-end">{t("alertmgmt.col.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-[240px] p-0">
                  <EmptyState
                    icon={SearchX}
                    title={t("alertmgmt.empty.filteredTitle")}
                    message={t("alertmgmt.empty.none")}
                    action={
                      hasFilters ? (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          {t("common.clearFilters")}
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((a) => {
                const Icon = TYPE_ICON[a.typeKey] ?? TriangleAlert;
                const resolved = a.status === "resolved";
                const st = STATUS_STYLE[a.status];
                const readings = a.readings
                  .map((r) => `${t("thresholds.metric." + r.metric)} ${td(r.value)}`)
                  .join(" · ");
                return (
                  <TableRow key={a.id} className={cn(tableBodyRowClass, rowPad, resolved && "opacity-60")}>
                    <TableCell className="ps-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(a.id)}
                        onCheckedChange={() => toggleOne(a.id)}
                        aria-label={t("common.selectRow")}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <SeverityBadge severity={a.severity} />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-medium text-foreground">{typeLabel(a)}</span>
                      </div>
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                        {t("region." + a.region)} · {a.stations.map(td).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="max-w-[380px] text-sm leading-snug text-foreground">{td(a.trigger)}</p>
                      {readings ? (
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground">{readings}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap align-top tabular-nums text-muted-foreground">
                      {t("alertmgmt.durationValue", { min: a.durationMin })}
                    </TableCell>
                    <TableCell className="align-top">
                      <DotBadge variant={st.variant} dotClass={st.dot}>
                        {t("alertmgmt.status." + a.status)}
                      </DotBadge>
                    </TableCell>
                    <TableCell className="pe-4 align-top text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {readOnly ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : resolved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(a.id, "reopen")}
                            disabled={busyId === a.id}
                          >
                            <RotateCcw className="size-4" />
                            {t("alertmgmt.action.reopen")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => { setReason(""); setResolveTarget(a); }}
                            disabled={busyId === a.id}
                          >
                            <CircleCheck className="size-4" />
                            {t("alertmgmt.action.resolve")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={safePage}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPageIndex}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPageIndex(1);
          }}
        />
        </>
      )}

      {/* Resolve — optional reason (all-clear); deactivates the alert. */}
      <Dialog open={resolveTarget !== null} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setReason(""); } }}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); confirmResolve(); }}>
            <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-normal/10 text-status-normal">
                <CheckCheck className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle>{t("alertmgmt.resolve.title")}</DialogTitle>
                <DialogDescription>{t("alertmgmt.resolve.desc")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-5 grid gap-2">
              <label htmlFor="resolve-reason" className="text-sm font-medium text-foreground">
                {t("alertmgmt.resolve.reasonLabel")}
              </label>
              <Textarea
                id="resolve-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("alertmgmt.resolve.reasonPlaceholder")}
                rows={3}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit">
                <CircleCheck className="size-4" />
                {t("alertmgmt.resolve.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create — admin-issued manual alert (created already confirmed). */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setAlertDraft(EMPTY_ALERT); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <form onSubmit={(e) => { e.preventDefault(); void submitCreate(); }}>
            <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
                <Plus className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle>{t("alertmgmt.create.title")}</DialogTitle>
                <DialogDescription>{t("alertmgmt.create.desc")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  {t("alertmgmt.create.station")} <span className="text-destructive">*</span>
                </label>
                <Select value={alertDraft.stationId} onValueChange={(v) => setAlertDraft((d) => ({ ...d, stationId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder={t("alertmgmt.create.stationPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {stationOpts.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("alertmgmt.create.noStations")}</div>
                    ) : (
                      stationOpts.map((s) => <SelectItem key={s.id} value={s.id}>{td(s.name)}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">{t("alertmgmt.create.parameter")}</label>
                  <Select value={alertDraft.parameter} onValueChange={(v) => setAlertDraft((d) => ({ ...d, parameter: v }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALERT_PARAMS.map((p) => <SelectItem key={p} value={p}>{paramLabel(p)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">{t("alertmgmt.create.severity")}</label>
                  <Select value={alertDraft.severity} onValueChange={(v) => setAlertDraft((d) => ({ ...d, severity: v as CreateAlertDraft["severity"] }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CREATE_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{t("severity." + SEVERITY_TIER[s])}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="alert-value" className="text-sm font-medium text-foreground">
                  {t("alertmgmt.create.value")} <span className="font-normal text-muted-foreground">{t("alertmgmt.create.optional")}</span>
                </label>
                <Input id="alert-value" type="number" inputMode="decimal" dir="ltr" value={alertDraft.value} onChange={(e) => setAlertDraft((d) => ({ ...d, value: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="alert-msg" className="text-sm font-medium text-foreground">
                  {t("alertmgmt.create.message")} <span className="text-destructive">*</span>
                </label>
                <Textarea id="alert-msg" rows={2} value={alertDraft.message} onChange={(e) => setAlertDraft((d) => ({ ...d, message: e.target.value }))} placeholder={t("alertmgmt.create.messagePlaceholder")} />
              </div>
              <div className="grid gap-2">
                <label htmlFor="alert-msg-ar" className="text-sm font-medium text-foreground">
                  {t("alertmgmt.create.messageAr")} <span className="text-destructive">*</span>
                </label>
                <Textarea id="alert-msg-ar" rows={2} dir="rtl" value={alertDraft.messageAr} onChange={(e) => setAlertDraft((d) => ({ ...d, messageAr: e.target.value }))} placeholder={t("alertmgmt.create.messageArPlaceholder")} />
              </div>
            </div>
            <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" disabled={creating}>
                <Plus className="size-4" />
                {t("alertmgmt.create.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </Card>
  );
}
