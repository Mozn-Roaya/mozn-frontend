"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { TablePagination } from "@/components/data-table/table-pagination";
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

type FlatRow = ActivityRow & { date?: Date };

export function ActivityLogView({ page }: { page: ActivityLogPage }) {
  const { locale, t } = useLocale();
  const td = useTD();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    t("history.category." + CATEGORY_LABEL[v.toLowerCase() as ActivityCategory]);

  // ── URL-driven filter state (the server does the filtering + pagination) ────
  // Category, date, and page all live in the query string; changing them pushes
  // a new URL, which re-runs the server component and refetches from the backend.
  const selectedCategories = React.useMemo(
    () => (searchParams.get("category") ?? "").split(",").filter(Boolean),
    [searchParams],
  );
  const fromParam = searchParams.get("from") ?? undefined;
  const dateValue = fromParam ? new Date(fromParam) : undefined;

  const setParams = React.useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      }
      if (resetPage) params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const onCategoryChange = (next: string[]) =>
    setParams({ category: next.length ? next.join(",") : undefined });

  const onDateChange = (d?: Date) => {
    if (!d) {
      setParams({ from: undefined, to: undefined });
      return;
    }
    // Whole-day window in the viewer's local timezone → inclusive ISO bounds.
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    setParams({ from: start.toISOString(), to: end.toISOString() });
  };

  // Faceted category options — the fixed universe from the server, no per-page
  // counts (those would require aggregating across every page).
  const categoryOptions = React.useMemo(
    () =>
      page.categories.map((v) => ({
        value: v,
        label: categoryLabel(v),
        dot: CATEGORY_DOT[v.toLowerCase() as ActivityCategory],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page.categories, locale],
  );

  // ── Current page's rows (server already filtered + paginated + newest-first) ─
  const allRows = React.useMemo<FlatRow[]>(
    () =>
      page.groups.flatMap((g) => {
        const d = parseIsoDate(g.date);
        return g.rows.map((r) => ({ ...r, date: d }));
      }),
    [page.groups],
  );

  // Free-text search is a client-side refinement over the CURRENT page only
  // (searching by actor name across all pages would need a users join the audit
  // table doesn't have).
  const [query, setQuery] = React.useState("");
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) =>
      `${td(row.actor)} ${td(row.action)}`.toLowerCase().includes(q),
    );
  }, [allRows, query, td]);

  const hasFilters =
    selectedCategories.length > 0 || query.trim() !== "" || dateValue !== undefined;
  const clearFilters = () => {
    setQuery("");
    setParams({ category: undefined, from: undefined, to: undefined });
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

  const handleExport = () => {
    if (rows.length === 0) {
      toast(t("history.export.nothing"), "info");
      return;
    }
    // Exports the current page (the rows in view); server pagination means the
    // full set isn't loaded client-side.
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
              value={dateValue}
              onChange={onDateChange}
              placeholder={t("history.opt.anyDate")}
              ariaLabel={t("history.filter.byDate")}
            />
            <FacetedFilter
              title={t("history.col.category")}
              options={categoryOptions}
              selected={selectedCategories}
              onChange={onCategoryChange}
            />
          </div>
          <div className="flex items-center gap-3 lg:ms-auto">
            <span className="text-sm text-muted-foreground">
              {t("history.activity.count", { shown: rows.length, total: page.meta.total })}
            </span>
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        </div>

        <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

        <Table containerClassName="max-h-[calc(100vh-320px)] min-h-[280px]">
          <TableHeader>
            {/* Newest-first, ordered server-side by created_at — the columns are
                not client-sortable under server pagination. */}
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="w-10 ps-6">
                <Checkbox checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleAll} aria-label={t("common.selectAll")} />
              </TableHead>
              <TableHead>{t("history.col.actor")}</TableHead>
              <TableHead>{t("history.col.action")}</TableHead>
              <TableHead>{t("history.col.category")}</TableHead>
              <TableHead>{t("history.col.time")}</TableHead>
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
              rows.map((row) => (
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
        {page.meta.total > 0 && (
          <TablePagination
            page={page.meta.page}
            pageSize={page.meta.pageSize}
            total={page.meta.total}
            onPageChange={(p) => setParams({ page: String(p) }, false)}
            onPageSizeChange={(n) => setParams({ page_size: String(n) })}
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
