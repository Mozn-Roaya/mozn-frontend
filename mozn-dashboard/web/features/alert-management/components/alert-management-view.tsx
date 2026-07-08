"use client";

import * as React from "react";
import {
  CheckCheck,
  CircleCheck,
  CloudRain,
  Droplets,
  Layers,
  type LucideIcon,
  MoreHorizontal,
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
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import { DensityToggle, rowPadFor, type Density } from "@/components/data-table/density-toggle";
import { nextSort, SortableHead, type SortState } from "@/components/data-table/sortable-head";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { DotBadge, SeverityBadge } from "@/components/common/status-badges";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
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

const SEVERITIES: ManagedSeverity[] = ["advisory", "watch", "warning", "critical"];

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

const STATUS_FILTERS: (ManagedStatus | "all")[] = [
  "all",
  "active",
  "acknowledged",
  "resolved",
];

type SortKey = "severity" | "type" | "trigger" | "duration" | "status";

export function AlertManagementView() {
  const { t, td } = useLocale();
  const [alerts, setAlerts] = React.useState<ManagedAlert[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState<SortKey>>({ key: "severity", dir: "asc" });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));
  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);

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
      STATUS_FILTERS.filter((key) => key !== "all").map((key) => ({
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

  const update = (id: string, patch: Partial<ManagedAlert>) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const setSeverity = (id: string, s: ManagedSeverity) => {
    update(id, { severity: s });
    toast(t("alertmgmt.toast.severity", { tier: t("severity." + s) }));
  };
  const acknowledge = (id: string) => {
    update(id, { status: "acknowledged" });
    toast(t("alertmgmt.toast.acknowledged"));
  };
  const resolve = (id: string) => {
    update(id, { status: "resolved" });
    toast(t("alertmgmt.toast.resolved"));
  };

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
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">{readings}</p>
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
                        {resolved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-normal">
                            <CheckCheck className="size-3.5" aria-hidden />
                            {t("alertmgmt.status.resolved")}
                          </span>
                        ) : (
                          <>
                            {a.status === "active" ? (
                              <Button size="sm" onClick={() => acknowledge(a.id)}>
                                <CheckCheck className="size-4" />
                                {t("alertmgmt.action.acknowledge")}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => resolve(a.id)}>
                                <CircleCheck className="size-4" />
                                {t("alertmgmt.action.resolve")}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-muted-foreground"
                                  aria-label={t("alertmgmt.action.more")}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>{t("alertmgmt.action.severity")}</DropdownMenuLabel>
                                {SEVERITIES.map((s) => (
                                  <DropdownMenuCheckboxItem
                                    key={s}
                                    checked={a.severity === s}
                                    onCheckedChange={() => setSeverity(a.id, s)}
                                  >
                                    {t("severity." + s)}
                                  </DropdownMenuCheckboxItem>
                                ))}
                                {a.status === "active" ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => resolve(a.id)}>
                                      <CircleCheck className="size-4" />
                                      {t("alertmgmt.action.resolve")}
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
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
      </Card>
  );
}
