"use client";

import * as React from "react";
import { Download, Eye, Inbox, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DatePicker } from "@/components/ui/date-picker";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import { PageHeading } from "@/components/common/page-heading";
import {
  nextSort,
  SortableHead,
  type SortState,
} from "@/components/data-table/sortable-head";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { DensityToggle, rowPadFor, type Density } from "@/components/data-table/density-toggle";
import { downloadCsv } from "@/lib/export-csv";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { useLocale, useTD } from "@/components/providers/locale-provider";
import type {
  ActivityCategory,
  ActivityLogPage,
  ActivityRow,
  AuditLogDetail,
} from "@/features/activity/types";
import { CATEGORY_LABEL } from "@/components/common/activity-category";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Category → status-dot colour, matching the badge palette used elsewhere.
const CATEGORY_DOT: Record<ActivityCategory, string> = {
  alert: "bg-status-warning",
  threshold: "bg-chart-1",
  station: "bg-status-advisory",
  user: "bg-brand-foreground",
  auth: "bg-status-offline",
};

/** Parse the group's ISO "YYYY-MM-DD" date into a local Date (no timezone shift
 * — building from parts avoids `new Date("YYYY-MM-DD")` being read as UTC). */
function parseIsoDate(iso: string): Date | undefined {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

const dayKey = (d?: Date) =>
  d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : "";

type FlatRow = ActivityRow & { date?: Date };

type SortKey = "actor" | "action" | "category" | "time";

export function ActivityLogView({ page }: { page: ActivityLogPage }) {
  const { locale, t } = useLocale();
  const td = useTD();

  // Localized "10 Jun" with Western digits (matches the rest of the dashboard).
  const fmtDate = React.useCallback(
    (d?: Date) =>
      d
        ? new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
            day: "numeric",
            month: "short",
          }).format(d)
        : "",
    [locale],
  );

  const categoryLabel = (v: string) =>
    v === page.categories[0]
      ? t("history.opt.allCategories")
      : t("history.category." + v);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>();
  // Default to the log's natural newest-first chronological order.
  const [sort, setSort] = React.useState<SortState<SortKey>>({
    key: "time",
    dir: "asc",
  });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));

  // Flatten the day groups into a single chronological log; carry each row's
  // derived date so it can be filtered and shown per-row.
  const allRows = React.useMemo<FlatRow[]>(
    () =>
      page.groups.flatMap((g) => {
        const d = parseIsoDate(g.date);
        return g.rows.map((r) => ({ ...r, date: d }));
      }),
    [page.groups],
  );

  // Days that actually have activity — used to disable empty days in the picker.
  const activeDays = React.useMemo(
    () => new Set(allRows.map((r) => dayKey(r.date))),
    [allRows],
  );

  // Faceted category filter with live counts (empty selection = all).
  // Date stays a standalone picker; search is its own control.
  const categoryOptions = React.useMemo(() => {
    const tally = new Map<string, number>();
    allRows.forEach((r) => tally.set(r.category, (tally.get(r.category) ?? 0) + 1));
    return page.categories.slice(1).map((v) => ({
      value: v,
      label: categoryLabel(v),
      count: tally.get(v.toLowerCase()) ?? 0,
      dot: CATEGORY_DOT[v.toLowerCase() as ActivityCategory],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, page.categories]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const dKey = dayKey(date);
    const filtered = allRows.filter((row) => {
      const matchesCategory =
        categories.length === 0 ||
        categories.some((c) => c.toLowerCase() === row.category);
      const matchesDate = !date || dayKey(row.date) === dKey;
      const matchesQuery =
        q === "" || `${row.actor} ${row.action}`.toLowerCase().includes(q);
      return matchesCategory && matchesDate && matchesQuery;
    });

    // "time" preserves the seeded newest-first order; the rest sort on the
    // displayed (translated) value so it matches what the user reads.
    const indexOf = new Map(allRows.map((r, i) => [r.id, i]));
    const dir = sort.dir === "asc" ? 1 : -1;
    const cmp = (a: FlatRow, b: FlatRow) => {
      switch (sort.key) {
        case "actor":
          return td(a.actor).localeCompare(td(b.actor));
        case "action":
          return td(a.action).localeCompare(td(b.action));
        case "category":
          return a.category.localeCompare(b.category);
        case "time":
        default:
          return indexOf.get(a.id)! - indexOf.get(b.id)!;
      }
    };
    return filtered.sort((a, b) => cmp(a, b) * dir);
  }, [allRows, categories, query, date, sort, td]);

  // Distinguish "no rows because filters exclude everything" from "no data at
  // all" so the empty state can say the right thing (and offer Clear filters).
  const hasFilters =
    categories.length > 0 || query.trim() !== "" || date !== undefined;
  const clearFilters = () => {
    setCategories([]);
    setQuery("");
    setDate(undefined);
  };

  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);

  // Per-row detail: fetch the full audit entry on demand (the list DTO omits
  // payload / response error / details / user agent).
  const [detailRow, setDetailRow] = React.useState<ActivityRow | null>(null);
  const [detail, setDetail] = React.useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const openDetail = (row: ActivityRow) => {
    setDetailRow(row);
    setDetail(null);
    setDetailLoading(true);
    fetch(`${BASE}/api/audit-logs/${row.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDetail(j?.data ?? null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

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

  // Client-side pagination over the filtered set (shared hook; reset to page 1
  // when the filters or sort change).
  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } = usePagination(rows);
  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ categories, query, date, sort });
  if (
    pagedFilters.categories !== categories ||
    pagedFilters.query !== query ||
    pagedFilters.date !== date ||
    pagedFilters.sort !== sort
  ) {
    setPagedFilters({ categories, query, date, sort });
    setPageIndex(1);
  }

  const handleExport = () => {
    if (rows.length === 0) {
      toast(t("history.export.nothing"), "info");
      return;
    }
    downloadCsv(
      "activity-log",
      [
        { header: t("history.col.when"), value: (r) => `${fmtDate(r.date)} ${r.time}` },
        { header: t("history.col.actor"), value: (r) => td(r.actor) },
        { header: t("history.col.action"), value: (r) => td(r.action) },
        {
          header: t("history.col.category"),
          value: (r) => t("history.category." + CATEGORY_LABEL[r.category]),
        },
      ],
      rows,
    );
    toast(t("history.export.events", { count: rows.length }));
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("history.activity.title")}
        subtitle={t("history.activity.subtitle")}
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          {t("common.export")}
        </Button>
      </PageHeading>

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border-subtle p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-[280px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("history.activity.searchPlaceholder")}
            aria-label={t("history.activity.searchAria")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder={t("history.opt.anyDate")}
              ariaLabel={t("history.filter.byDate")}
              disabled={(d) => !activeDays.has(dayKey(d))}
            />
            <FacetedFilter
              title={t("history.col.category")}
              options={categoryOptions}
              selected={categories}
              onChange={setCategories}
            />
          </div>
          <div className="flex items-center gap-3 lg:ms-auto">
            <span className="text-sm text-muted-foreground">
              {t("history.activity.count", { shown: rows.length, total: allRows.length })}
            </span>
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        </div>

        <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

        <Table containerClassName="max-h-[calc(100vh-320px)] min-h-[280px]">
          <TableHeader>
            {/* Columns are auto-distributed across the full width (no fixed
                widths) so they spread evenly like the Users table; only the
                trailing action column is pinned narrow. */}
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="w-10 ps-6">
                <Checkbox checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleAll} aria-label={t("common.selectAll")} />
              </TableHead>
              <SortableHead label={t("history.col.actor")} column="actor" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.action")} column="action" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.category")} column="category" sort={sort} onSort={onSort} />
              <SortableHead label={t("history.col.time")} column="time" sort={sort} onSort={onSort} />
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-[280px] p-0">
                  <EmptyState
                    icon={hasFilters ? SearchX : Inbox}
                    title={t(
                      hasFilters
                        ? "history.activity.emptyTitle"
                        : "history.activity.noDataTitle",
                    )}
                    message={t(
                      hasFilters
                        ? "history.activity.empty"
                        : "history.activity.noData",
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
                <TableRow key={row.id} className={cn(tableBodyRowClass, "h-16", rowPad)}>
                  <TableCell className="ps-6" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleOne(row.id)} aria-label={t("common.selectRow")} />
                  </TableCell>
                  <TableCell className="align-middle">
                    <span className="font-medium text-foreground">{td(row.actor)}</span>
                  </TableCell>
                  <TableCell className="align-middle text-foreground">
                    {td(row.action)}
                  </TableCell>
                  <TableCell className="align-middle">
                    {/* Status-style pill: colour dot + label (Untitled-UI style). */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                      <span
                        aria-hidden
                        className={cn("size-1.5 shrink-0 rounded-full", CATEGORY_DOT[row.category])}
                      />
                      {t("history.category." + CATEGORY_LABEL[row.category])}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap align-middle">
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-foreground">
                        {fmtDate(row.date)}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {row.time}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-end">
                    <button
                      type="button"
                      onClick={() => openDetail(row)}
                      aria-label={t("history.activity.view")}
                      title={t("history.activity.view")}
                      className="inline-grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
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

      {/* Per-entry detail — full audit record (payload, response, IP, agent). */}
      <Dialog open={detailRow !== null} onOpenChange={(o) => { if (!o) { setDetailRow(null); setDetail(null); } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("history.activity.detailTitle")}</DialogTitle>
            <DialogDescription>
              {detailRow ? `${td(detailRow.actor)} · ${td(detailRow.action)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("history.activity.loading")}</p>
          ) : detail ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
              <DetailRow label={t("history.activity.detail.resource")} value={detail.resourceId ? `${detail.resourceType} · ${detail.resourceId}` : detail.resourceType} />
              <DetailRow label={t("history.activity.detail.status")} value={`${detail.status} (${detail.statusCode})`} />
              <DetailRow label={t("history.activity.detail.ip")} value={detail.ipAddress || "—"} />
              <DetailRow label={t("history.activity.detail.duration")} value={`${detail.durationMs} ms`} />
              <DetailRow label={t("history.activity.detail.agent")} value={detail.userAgent || "—"} />
              {detail.responseError ? (
                <DetailRow label={t("history.activity.detail.error")} value={detail.responseError} />
              ) : null}
              {detail.requestPayload != null ? (
                <DetailBlock label={t("history.activity.detail.payload")} value={detail.requestPayload} />
              ) : null}
              {detail.details != null ? (
                <DetailBlock label={t("history.activity.detail.details")} value={detail.details} />
              ) : null}
            </dl>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("history.activity.detailFailed")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One label/value row in the audit-detail grid. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground" dir="auto">{value}</dd>
    </>
  );
}

/** A JSON block spanning both grid columns (payload / details). */
function DetailBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="col-span-2 grid gap-1.5">
      <span className="font-medium text-muted-foreground">{label}</span>
      <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-secondary/40 p-3 text-xs leading-relaxed text-foreground" dir="ltr">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
