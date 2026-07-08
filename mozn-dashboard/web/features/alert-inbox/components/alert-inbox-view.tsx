"use client";

import * as React from "react";
import { Inbox, SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/common/search-input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  tableHeaderRowClass,
} from "@/components/ui/table";
import {
  DensityToggle,
  rowPadFor,
  type Density,
} from "@/components/data-table/density-toggle";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import {
  nextSort,
  SortableHead,
  type SortState,
} from "@/components/data-table/sortable-head";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useT, useTD } from "@/components/providers/locale-provider";
import { InboxAlertRow } from "./inbox-alert-row";
import { triageSort } from "./inbox-meta";
import type { AlertInboxPage } from "@/features/alert-inbox/types";

type SortKey = "severity" | "alert";

export function AlertInboxView({ page }: { page: AlertInboxPage }) {
  const t = useT();
  const td = useTD();
  // Multi-select severity filter (empty = all), shadcn faceted-filter style.
  const [severities, setSeverities] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);
  const [sort, setSort] = React.useState<SortState<SortKey>>({
    key: "severity",
    dir: "asc",
  });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));
  const [acked, setAcked] = React.useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [escalated, setEscalated] = React.useState<Set<string>>(new Set());

  // Distinguish "no open alerts at all" (inbox zero) from "filters hide them".
  const hasFilters = severities.length > 0 || query.trim() !== "";
  const clearFilters = () => {
    setSeverities([]);
    setQuery("");
  };

  const acknowledge = (id: string) => setAcked((p) => new Set(p).add(id));
  const reopen = (id: string) =>
    setAcked((p) => {
      const next = new Set(p);
      next.delete(id);
      return next;
    });
  const dismiss = (id: string) => setDismissed((p) => new Set(p).add(id));
  const escalate = (id: string) => setEscalated((p) => new Set(p).add(id));

  const live = React.useMemo(
    () => page.items.filter((i) => !dismissed.has(i.id)),
    [page.items, dismissed],
  );
  const open = React.useMemo(() => live.filter((i) => !acked.has(i.id)), [live, acked]);

  const counts = (key: string) =>
    key === "all" ? open.length : open.filter((i) => i.severity === key).length;

  // Most urgent first (severity, then SLA); acknowledged items sink to the end.
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = live.filter((i) => {
      const okSeverity =
        severities.length === 0 || severities.includes(i.severity);
      const okQuery =
        !q || `${td(i.title)} ${td(i.context)}`.toLowerCase().includes(q);
      return okSeverity && okQuery;
    });
    return [...scoped].sort((a, b) => {
      const ackA = acked.has(a.id) ? 1 : 0;
      const ackB = acked.has(b.id) ? 1 : 0;
      if (ackA !== ackB) return ackA - ackB; // acked sink to end
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "alert")
        return td(a.title).localeCompare(td(b.title)) * dir;
      // severity: reuse triage as the natural order, flipped by dir
      return triageSort(acked)(a, b) * dir;
    });
  }, [live, severities, acked, query, td, sort]);

  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } =
    usePagination(rows);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allVisibleSelected =
    rows.length > 0 && rows.every((i) => selected.has(i.id));
  const someSelected = rows.some((i) => selected.has(i.id));
  const toggleAll = () =>
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        rows.forEach((i) => next.delete(i.id));
        return next;
      }
      return new Set([...prev, ...rows.map((i) => i.id)]);
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ severities, query });
  if (pagedFilters.severities !== severities || pagedFilters.query !== query) {
    setPagedFilters({ severities, query });
    setPageIndex(1);
  }

  return (
    <Card className="overflow-hidden">
      {/* Toolbar inside the card — matches Stations/Users/Activity. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <SearchInput
          className="sm:max-w-[280px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("inbox.searchPlaceholder")}
          aria-label={t("inbox.searchAria")}
        />
        <FacetedFilter
          title={t("inbox.col.severity")}
          options={page.filters
            .filter((f) => f.key !== "all")
            .map((f) => ({
              value: f.key,
              label: td(f.label),
              count: counts(f.key),
            }))}
          selected={severities}
          onChange={setSeverities}
        />
        <div className="flex items-center gap-3 sm:ms-auto">
          <p className="text-xs text-muted-foreground">{td(page.slaNote)}</p>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title={t("inbox.empty.filteredTitle")}
            message={t("inbox.empty.filtered")}
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t("common.clearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Inbox}
            title={t("inbox.empty.title")}
            message={t("inbox.empty.body")}
          />
        )
      ) : (
        <>
          <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />
          <Table>
            <TableHeader>
              <TableRow className={tableHeaderRowClass}>
                <TableHead className="w-10 ps-4">
                  <Checkbox
                    checked={
                      allVisibleSelected
                        ? true
                        : someSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleAll}
                    aria-label={t("common.selectAll")}
                  />
                </TableHead>
                <SortableHead
                  label={t("inbox.col.severity")}
                  column="severity"
                  sort={sort}
                  onSort={onSort}
                  className="ps-4"
                />
                <SortableHead
                  label={t("inbox.col.alert")}
                  column="alert"
                  sort={sort}
                  onSort={onSort}
                />
                <TableHead>{t("inbox.col.reading")}</TableHead>
                <TableHead>{t("inbox.col.waiting")}</TableHead>
                <TableHead className="pe-4 text-end">{t("inbox.col.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((item) => (
                <InboxAlertRow
                  key={item.id}
                  item={item}
                  acknowledged={acked.has(item.id)}
                  escalated={escalated.has(item.id)}
                  selected={selected.has(item.id)}
                  onToggleSelect={() => toggleOne(item.id)}
                  onAcknowledge={acknowledge}
                  onReopen={reopen}
                  onEscalate={escalate}
                  onDismiss={dismiss}
                  rowClassName={rowPad}
                />
              ))}
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
