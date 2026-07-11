"use client";

import * as React from "react";
import {
  Download,
  MoreHorizontal,
  PenLine,
  RadioTower,
  Rows2,
  Rows3,
  Search,
  SearchX,
  Trash2,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/common/search-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale, useT, useTD } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";

type TFunction = (key: string, vars?: Record<string, string | number>) => string;
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import { TablePagination } from "@/components/data-table/table-pagination";
import {
  nextSort,
  SortableHead,
  type SortState,
} from "@/components/data-table/sortable-head";
import { usePagination } from "@/hooks/use-pagination";
import { StationStatusBadge } from "@/components/common/status-badges";
import { EmptyState } from "@/components/common/empty-state";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "@/components/ui/toaster";
import type {
  StationOpStatus,
  StationRow,
  StationsPage,
} from "@/features/stations/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from "next/link";
import { StationSummaryCard } from "@/components/station-detail/station-summary-card";
import { detailFromStationRow } from "@/components/station-detail/station-detail";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function exportStations(stations: StationRow[], t: TFunction) {
  downloadCsv(
    "stations",
    [
      { header: t("stations.colStation"), value: (s) => s.name },
      { header: t("stations.colRegion"), value: (s) => t("region." + s.region) },
      { header: t("stations.colStatus"), value: (s) => t("status." + s.status) },
      { header: t("stations.colLastReading"), value: (s) => s.lastReading },
    ],
    stations,
  );
  toast(t("stations.exportedToast", { count: stations.length }));
}

type Row = StationRow;
type SortKey = "station" | "region" | "status";
type Density = "comfortable" | "compact";

// Lower rank = more urgent; the default sort floats problems to the top.
const SEVERITY: Record<StationOpStatus, number> = {
  warning: 0,
  anomaly: 1,
  offline: 2,
  maintenance: 3,
  online: 4,
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-status-normal",
  warning: "bg-status-warning",
  anomaly: "bg-status-advisory",
  maintenance: "bg-text-link",
  offline: "bg-status-offline",
};

export function StationsTable({ page }: { page: StationsPage }) {
  const { locale } = useLocale();
  const t = useT();
  const td = useTD();
  const router = useRouter();
  // Station actions follow the account's real permissions. `readOnly` (no
  // selection / bulk bar / edit) means it can't update stations; create + delete
  // are gated separately. Region scoping is handled by the backend (it returns
  // only the account's regions), so the table renders whatever it receives.
  const { can } = useRole();
  const canDelete = can("stations.delete");
  const readOnly = !can("stations.update");
  const nameOf = React.useCallback(
    (r: Row) => (locale === "ar" ? r.nameAr : r.name),
    [locale],
  );

  const allRows = React.useMemo<Row[]>(
    () => page.groups.flatMap((g) => g.rows),
    [page.groups],
  );

  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState<SortKey>>({
    key: "status",
    dir: "asc",
  });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [density, setDensity] = React.useState<Density>("comfortable");
  // Station whose detail sheet is open (Figma "Station Summary").
  const [detailRow, setDetailRow] = React.useState<Row | null>(null);
  // Station pending delete-confirmation.
  const [deleteRow, setDeleteRow] = React.useState<Row | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Faceted status filter options: real statuses only (empty selection = all),
  // each with its colored dot and count.
  const statusOptions = React.useMemo(
    () =>
      page.filters
        .filter((f) => f.key !== "all")
        .map((f) => ({
          value: f.key,
          label: t("status." + f.key),
          count: f.count,
          dot: STATUS_DOT[f.key],
        })),
    [page.filters, t],
  );

  const rowPad = density === "compact" ? "[&>td]:py-1.5" : "[&>td]:py-3";

  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));

  // Distinguish "filters exclude everything" from "no stations at all" so the
  // empty state can say the right thing (and offer Clear filters).
  const hasFilters = statuses.length > 0 || query.trim() !== "";
  const clearFilters = () => {
    setStatuses([]);
    setQuery("");
  };

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allRows.filter((r) => {
      const matchesStatus =
        statuses.length === 0 || statuses.includes(r.status);
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.nameAr.includes(query.trim());
      return matchesStatus && matchesQuery;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case "station":
          return nameOf(a).localeCompare(nameOf(b)) * dir;
        case "region":
          return (a.region.localeCompare(b.region) || nameOf(a).localeCompare(nameOf(b))) * dir;
        case "status":
        default:
          return (
            (SEVERITY[a.status] - SEVERITY[b.status] || nameOf(a).localeCompare(nameOf(b))) *
            dir
          );
      }
    });
  }, [allRows, statuses, query, sort, nameOf]);

  // Client-side pagination. Selection + bulk actions still span the whole
  // filtered set; only the rendered rows are sliced to the current page.
  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } =
    usePagination(rows);
  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ statuses, query, sort });
  if (pagedFilters.statuses !== statuses || pagedFilters.query !== query || pagedFilters.sort !== sort) {
    setPagedFilters({ statuses, query, sort });
    setPageIndex(1);
  }

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

  // Set one or more stations to maintenance via the backend, then refresh.
  const setMaintenance = async (ids: string[]) => {
    if (ids.length === 0) return;
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`${BASE}/api/stations/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operational_status: "maintenance" }),
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
      failed.length ? failed[0].err ?? t("stations.maintenanceFailed") : t("stations.maintenanceToast"),
      failed.length ? "info" : "success",
    );
    setSelected(new Set());
    router.refresh();
  };

  // Delete a station via the backend, then refresh.
  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    const res = await fetch(`${BASE}/api/stations/${deleteRow.id}`, { method: "DELETE" })
      .then(async (r) => ({
        ok: r.ok,
        err: r.ok ? null : ((await r.json().catch(() => ({}))) as { error?: string }).error,
      }))
      .catch(() => ({ ok: false, err: null as string | null }));
    setDeleting(false);
    if (res.ok) {
      toast(t("stations.deletedToast", { name: nameOf(deleteRow) }));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteRow.id);
        return next;
      });
      setDeleteRow(null);
      router.refresh();
    } else {
      toast(res.err ?? t("stations.deleteFailed"), "info");
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border-subtle p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-[280px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("stations.searchPlaceholder")}
            aria-label={t("stations.searchAria")}
          />
          <FacetedFilter
            title={t("stations.colStatus")}
            options={statusOptions}
            selected={statuses}
            onChange={setStatuses}
          />
          <div className="flex items-center gap-3 lg:ms-auto">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {t("common.of", { shown: rows.length, total: page.total })}
            </span>
            <ToggleGroup
              type="single"
              value={density}
              onValueChange={(v) => v && setDensity(v as Density)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="comfortable" aria-label={t("common.comfortable")}>
                <Rows2 className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" aria-label={t("common.compact")}>
                <Rows3 className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Contextual bulk bar */}
        {!readOnly ? (
          <SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setMaintenance([...selected])}
            >
              <Wrench className="size-3.5" />
              {t("stations.setMaintenance")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => exportStations(allRows.filter((r) => selected.has(r.id)), t)}
            >
              <Download className="size-3.5" />
              {t("common.export")}
            </Button>
          </SelectionBar>
        ) : null}

        <Table containerClassName="max-h-[calc(100vh-300px)] min-h-[320px]">
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              {!readOnly ? (
                <TableHead className="w-10 ps-6">
                  <Checkbox
                    checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label={t("stations.selectAll")}
                  />
                </TableHead>
              ) : null}
              <SortableHead label={t("stations.colStation")} column="station" sort={sort} onSort={onSort} className={readOnly ? "ps-6" : undefined} />
              <SortableHead label={t("stations.colRegion")} column="region" sort={sort} onSort={onSort} />
              <SortableHead label={t("stations.colStatus")} column="status" sort={sort} onSort={onSort} />
              <TableHead>{t("stations.colLastReading")}</TableHead>
              <TableHead className="w-12 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={readOnly ? 5 : 6} className="h-[320px] p-0">
                  <EmptyState
                    icon={hasFilters ? SearchX : RadioTower}
                    title={t(hasFilters ? "stations.emptyTitle" : "stations.noDataTitle")}
                    message={t(hasFilters ? "stations.empty" : "stations.noData")}
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
              pageRows.map((row) => {
                const isSelected = selected.has(row.id);
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn("group cursor-pointer", tableBodyRowClass, rowPad)}
                    onClick={() => setDetailRow(row)}
                  >
                    {!readOnly ? (
                      <TableCell className="ps-6" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(row.id)}
                          aria-label={t("stations.selectRow", { name: nameOf(row) })}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className={readOnly ? "ps-6" : undefined}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailRow(row);
                        }}
                        className="text-start font-semibold text-foreground transition-colors hover:text-text-link focus-visible:underline focus-visible:outline-none"
                        dir="auto"
                      >
                        {nameOf(row)}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t("region." + row.region)}
                    </TableCell>
                    <TableCell>
                      <StationStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{td(row.lastReading)}</TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            aria-label={t("stations.rowActions", { name: nameOf(row) })}
                          >
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailRow(row)}>
                            <Search className="size-4" />
                            {t("common.viewDetails")}
                          </DropdownMenuItem>
                          {!readOnly ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/stations/${row.id}/edit`}>
                                  <PenLine className="size-4" />
                                  {t("stations.editStation")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={row.status === "maintenance"}
                                onClick={() => setMaintenance([row.id])}
                              >
                                <Wrench className="size-4" />
                                {t("stations.setMaintenance")}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              onClick={() => setDeleteRow(row)}
                              className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                            >
                              <Trash2 className="size-4" />
                              {t("stations.deleteStation")}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Station detail sheet — full summary card (Figma "Station Summary"). */}
      <Sheet
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
      >
        <SheetContent
          side={locale === "ar" ? "left" : "right"}
          hideClose
          className="w-full gap-0 bg-background p-0 sm:max-w-[440px]"
        >
          {detailRow ? (
            <>
              <SheetTitle>{nameOf(detailRow)}</SheetTitle>
              <SheetDescription>{t("region." + detailRow.region)}</SheetDescription>
              <div className="h-full overflow-y-auto p-6">
                <StationSummaryCard
                  detail={detailFromStationRow(detailRow)}
                  stationId={detailRow.id}
                  onClose={() => setDetailRow(null)}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation — destructive, requires explicit confirm. */}
      <Dialog open={deleteRow !== null} onOpenChange={(o) => { if (!o && !deleting) setDeleteRow(null); }}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
              <Trash2 className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("stations.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("stations.delete.desc", { name: deleteRow ? nameOf(deleteRow) : "" })}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deleting}>
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              <Trash2 className="size-4" />
              {t("stations.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
