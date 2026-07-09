"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Inbox, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { Card } from "@/components/ui/card";
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
import { PageHeading } from "@/components/common/page-heading";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { OutcomeBadge, SeverityBadge } from "@/components/common/status-badges";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import type { AlertHistoryPage, AlertHistoryRow } from "@/features/history/types";

// Map a Type filter option to a keyword found in the alert title, so the
// control actually filters instead of being decorative.
const TYPE_KEYWORD: Record<string, string> = {
  Rainfall: "rain",
  Wind: "wind",
  "Water level": "water",
  Temperature: "temp",
  Compound: "compound",
};

// Ordered so ascending sort lists the most severe alerts first.
const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, watch: 2, advisory: 3 };

type SortKey = "time" | "severity" | "alert" | "region" | "ackTime" | "duration" | "outcome";

/** Parse "1m 12s" / "45 min" / "2h 10m" to seconds for native-unit reformatting. */
function toSeconds(value: string): number {
  const t = value.toLowerCase();
  let total = 0;
  const hr = t.match(/(\d+)\s*(h|hr|hour)/);
  if (hr) total += Number(hr[1]) * 3600;
  const min = t.match(/(\d+)\s*(m|min)\b/);
  if (min) total += Number(min[1]) * 60;
  const sec = t.match(/(\d+)\s*(s|sec)\b/);
  if (sec) total += Number(sec[1]);
  return total;
}

// Unit letters are localized so ack/duration read natively in RTL.
function fmtAck(sec: number, locale: Locale = "en"): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  const [mu, su] = locale === "ar" ? ["د", "ث"] : ["m", "s"];
  return `${m}${mu} ${String(s).padStart(2, "0")}${su}`;
}
function fmtDuration(sec: number, locale: Locale = "en"): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  const [hu, mu] = locale === "ar" ? ["س", "د"] : ["h", "m"];
  return h ? `${h}${hu} ${String(m).padStart(2, "0")}${mu}` : `${m}${mu}`;
}

const RANGE_KEYS = ["24h", "7d", "30d", "90d"] as const;

export function AlertHistoryView({ page, range }: { page: AlertHistoryPage; range: string }) {
  const { locale, t, td } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rangePending, startRangeTransition] = React.useTransition();

  // The date range is a SERVER filter (the page reads ?range and refetches with
  // from/to); everything else below is client-side over the returned window.
  const setRange = (r: string) => {
    if (!r || r === range) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("range", r);
    startRangeTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  // Multi-select faceted filters (empty selection = all).
  const [severities, setSeverities] = React.useState<string[]>([]);
  const [regions, setRegions] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState<SortKey>>({ key: "time", dir: "asc" });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));
  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);

  // Distinguish "filters exclude everything" from "no data at all" so the empty
  // state can say the right thing (and offer Clear filters).
  const hasFilters =
    severities.length > 0 ||
    regions.length > 0 ||
    types.length > 0 ||
    query.trim() !== "";
  const clearFilters = () => {
    setSeverities([]);
    setRegions([]);
    setTypes([]);
    setQuery("");
  };

  // Type filters by keyword match in the alert title (not a stored field).
  const alertMatchesType = (alert: string, tp: string) => {
    const keyword = TYPE_KEYWORD[tp];
    return keyword ? alert.toLowerCase().includes(keyword) : false;
  };

  // Rows narrowed by region/type — drives the severity facet counts.
  const base = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return page.rows.filter((r) => {
      const okRegion = regions.length === 0 || regions.includes(r.region);
      const okType =
        types.length === 0 || types.some((tp) => alertMatchesType(r.alert, tp));
      const okQuery =
        !q || `${r.alert} ${t("region." + r.region)}`.toLowerCase().includes(q);
      return okRegion && okType && okQuery;
    });
  }, [page.rows, regions, types, query, t]);

  const rows = React.useMemo(() => {
    const filtered =
      severities.length === 0
        ? base
        : base.filter((r) => severities.some((s) => s.toLowerCase() === r.severity));
    const indexOf = new Map(page.rows.map((r, i) => [r.id, i]));
    const dir = sort.dir === "asc" ? 1 : -1;
    const cmp = (a: AlertHistoryRow, b: AlertHistoryRow) => {
      switch (sort.key) {
        case "severity":
          return (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99);
        case "alert":
          return a.alert.localeCompare(b.alert);
        case "region":
          return t("region." + a.region).localeCompare(t("region." + b.region));
        case "ackTime":
          return toSeconds(a.ackTime) - toSeconds(b.ackTime);
        case "duration":
          return toSeconds(a.duration) - toSeconds(b.duration);
        case "outcome":
          return a.outcome.localeCompare(b.outcome);
        case "time":
        default:
          return (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0);
      }
    };
    return [...filtered].sort((a, b) => cmp(a, b) * dir);
  }, [base, severities, sort, page.rows, t]);

  // Row selection (ids), scoped to the currently filtered/sorted rows.
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.id));
        return next;
      }
      return new Set([...prev, ...rows.map((r) => r.id)]);
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Facet options with counts: severity over the region/type-filtered base,
  // region/type over the full dataset.
  const severityOptions = React.useMemo(
    () =>
      page.severities.slice(1).map((v) => ({
        value: v,
        label: t("severity." + v.toLowerCase()),
        count: base.filter((r) => r.severity === v.toLowerCase()).length,
      })),
    [page.severities, base, t],
  );
  const regionOptions = React.useMemo(
    () =>
      page.regions.slice(1).map((v) => ({
        value: v,
        label: t("region." + v),
        count: page.rows.filter((r) => r.region === v).length,
      })),
    [page.regions, page.rows, t],
  );
  const typeOptions = React.useMemo(
    () =>
      page.types.slice(1).map((v) => ({
        value: v,
        label: t("history.type." + v),
        count: page.rows.filter((r) => alertMatchesType(r.alert, v)).length,
      })),
    [page.types, page.rows, t],
  );

  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } = usePagination(rows);
  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ regions, types, severities, query, sort });
  if (
    pagedFilters.regions !== regions ||
    pagedFilters.types !== types ||
    pagedFilters.severities !== severities ||
    pagedFilters.query !== query ||
    pagedFilters.sort !== sort
  ) {
    setPagedFilters({ regions, types, severities, query, sort });
    setPageIndex(1);
  }

  const handleExport = () => {
    if (rows.length === 0) {
      toast(t("history.export.nothing"), "info");
      return;
    }
    downloadCsv(
      "alert-history",
      [
        { header: t("history.col.when"), value: (r) => `${r.date} ${r.time}` },
        { header: t("history.col.severity"), value: (r) => t("severity." + r.severity) },
        { header: t("history.col.alert"), value: (r) => r.alert },
        { header: t("history.col.region"), value: (r) => t("region." + r.region) },
        { header: t("history.col.ackTime"), value: (r) => r.ackTime },
        { header: t("history.col.duration"), value: (r) => r.duration },
        { header: t("history.col.outcome"), value: (r) => t("outcome." + r.outcome) },
      ],
      rows,
    );
    toast(t("history.export.alerts", { count: rows.length }));
  };

  return (
    <div className="space-y-6">
      <PageHeading title={t("history.alerts.title")} subtitle={t("history.alerts.subtitle")}>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={setRange}
          variant="outline"
          size="sm"
          disabled={rangePending}
          aria-label={t("history.range.label")}
        >
          {RANGE_KEYS.map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {t("history.range." + r)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          {t("common.export")}
        </Button>
      </PageHeading>

      <Card className="overflow-hidden">
        {/* Toolbar inside the card — matches Stations/Users/Activity. */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <SearchInput
          className="sm:max-w-[280px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("history.alerts.searchPlaceholder")}
          aria-label={t("history.alerts.searchAria")}
        />
        <FacetedFilter
          title={t("history.col.severity")}
          options={severityOptions}
          selected={severities}
          onChange={setSeverities}
        />
        <FacetedFilter
          title={t("history.col.region")}
          options={regionOptions}
          selected={regions}
          onChange={setRegions}
        />
        <FacetedFilter
          title={t("history.col.type")}
          options={typeOptions}
          selected={types}
          onChange={setTypes}
        />
        <div className="flex items-center gap-3 sm:ms-auto">
          <p className="text-sm text-muted-foreground">
            {t("common.of", { shown: rows.length, total: page.rows.length })}
          </p>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>
        <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />
        <Table containerClassName="max-h-[calc(100vh-440px)] min-h-[260px]">
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="w-10 ps-4">
                <Checkbox
                  checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label={t("common.selectAll")}
                />
              </TableHead>
              <SortableHead label={t("history.col.when")} column="time" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.severity")} column="severity" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.alert")} column="alert" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.region")} column="region" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.ackTime")} column="ackTime" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.duration")} column="duration" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.outcome")} column="outcome" sort={sort} onSort={onSort} className="pe-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-[260px] p-0">
                  <EmptyState
                    icon={hasFilters ? SearchX : Inbox}
                    title={t(
                      hasFilters
                        ? "history.alerts.emptyTitle"
                        : "history.alerts.noDataTitle",
                    )}
                    message={t(
                      hasFilters ? "history.alerts.empty" : "history.alerts.noData",
                    )}
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
              pageRows.map((row) => (
                <TableRow key={row.id} className={cn(tableBodyRowClass, rowPad)}>
                  <TableCell className="ps-4">
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={t("common.selectRow")}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-semibold text-foreground">{td(row.date)}</span>
                    <span className="ms-1.5 text-xs tabular-nums text-muted-foreground">{row.time}</span>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={row.severity} />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{td(row.alert)}</TableCell>
                  <TableCell className="text-muted-foreground">{t("region." + row.region)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {fmtAck(toSeconds(row.ackTime), locale)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {fmtDuration(toSeconds(row.duration), locale)}
                  </TableCell>
                  <TableCell className="pe-4">
                    <OutcomeBadge outcome={row.outcome} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {rows.length > 0 && (
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
        )}
      </Card>
    </div>
  );
}
