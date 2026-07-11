"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Inbox, SearchX, ShieldCheck, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { toast } from "@/components/ui/toaster";
import { useRole } from "@/components/providers/role-provider";
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
import { Textarea } from "@/components/ui/textarea";
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
import { usePreferences } from "@/features/settings/use-preferences";
import { InboxAlertRow } from "./inbox-alert-row";
import { triageSort } from "./inbox-meta";
import type { AlertInboxPage, InboxItem, SlaTone } from "@/features/alert-inbox/types";

type SortKey = "severity" | "alert";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Recompute an item's SLA countdown from its age + the operator's SLA-minutes
 * preference (routine urgency has no SLA). Pure — uses the fetch-time age, not a
 * live clock, matching how the list was rendered server-side. */
function slaFor(
  item: InboxItem,
  slaMinutes: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): { label: string; tone: SlaTone } {
  if (item.severity === "routine") return { label: t("inbox.sla.none"), tone: "muted" };
  const remaining = slaMinutes * 60 - item.ageSeconds;
  const mmss = (s: number) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, "0")}`;
  if (remaining > 0)
    return { label: t("inbox.sla.remaining", { time: mmss(remaining) }), tone: remaining < 60 ? "danger" : "ok" };
  return { label: t("inbox.sla.passed"), tone: "danger" };
}

export function AlertInboxView({ page }: { page: AlertInboxPage }) {
  const t = useT();
  const td = useTD();
  const router = useRouter();
  const { can } = useRole();
  const { slaAckMinutes } = usePreferences();
  // Per-action capabilities, each keyed to the endpoint that action calls, so a
  // control appears exactly when the account holds that specific permission.
  const caps = React.useMemo(
    () => ({
      acknowledge: can("alerts.acknowledge"), // POST /api/alerts/:id/acknowledge
      unacknowledge: can("alerts.unacknowledge"), // POST /api/alerts/:id/unacknowledge
      confirm: can("alerts.confirm"), // POST /api/alerts/:id/confirm
      reject: can("alerts.reject"), // POST /api/alerts/:id/reject (dismiss)
      escalate: can("alerts.escalate"), // POST /api/alerts/:id/escalate
      setMaintenance: can("stations.update"), // PUT /api/stations/:id
    }),
    [can],
  );
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
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [escalated, setEscalated] = React.useState<Set<string>>(new Set());
  // Acknowledged state is server-backed (backend acknowledged_at); after a write
  // we router.refresh() so the list reflects the backend, not a local guess.
  const acked = React.useMemo(
    () => new Set(page.items.filter((i) => i.acknowledged).map((i) => i.id)),
    [page.items],
  );

  // Distinguish "no open alerts at all" (inbox zero) from "filters hide them".
  const hasFilters = severities.length > 0 || query.trim() !== "";
  const clearFilters = () => {
    setSeverities([]);
    setQuery("");
  };

  const acknowledge = async (id: string, note: string) => {
    const res = await fetch(`${BASE}/api/alerts/${id}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.acknowledged"));
    router.refresh();
  };
  const reopen = async (id: string) => {
    const res = await fetch(`${BASE}/api/alerts/${id}/unacknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.reopened"), "info");
    router.refresh();
  };
  // Dismiss a pending inbox alert = reject it as a false positive (backend
  // reject; it deactivates + drops out of the pending queue on refresh).
  const dismiss = async (id: string, reason: string) => {
    setDismissed((p) => new Set(p).add(id)); // optimistic hide
    const res = await fetch(`${BASE}/api/alerts/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: reason }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setDismissed((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.dismissed"), "info");
    router.refresh();
  };
  // Confirm a pending alert = promote it to a confirmed, citizen-visible alert.
  const confirm = async (id: string) => {
    const res = await fetch(`${BASE}/api/alerts/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.confirmed"));
    router.refresh();
  };
  // Put the alert's station into maintenance (routes through the station PUT —
  // maintenance is a station status, not an alert one).
  const setMaintenance = async (stationId: string) => {
    const res = await fetch(`${BASE}/api/stations/${stationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operational_status: "maintenance" }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.maintenance"));
    router.refresh();
  };
  const escalate = async (id: string) => {
    const item = page.items.find((i) => i.id === id);
    const next = item?.severity === "routine" ? "urgent" : "critical";
    setEscalated((p) => new Set(p).add(id)); // optimistic
    const res = await fetch(`${BASE}/api/alerts/${id}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urgency: next }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setEscalated((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
      toast(json.error ?? t("inbox.toast.failed"), "info");
      return;
    }
    toast(t("inbox.toast.escalated"));
    router.refresh();
  };

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

  // ── Bulk triage over the selection ───────────────────────────────────────
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [bulkDismissOpen, setBulkDismissOpen] = React.useState(false);
  const [bulkReason, setBulkReason] = React.useState("");

  const bulkConfirm = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`${BASE}/api/alerts/${id}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    );
    setBulkBusy(false);
    const failed = results.filter((ok) => !ok).length;
    toast(
      failed ? t("inbox.bulk.failed") : t("inbox.bulk.confirmed", { count: ids.length }),
      failed ? "info" : "success",
    );
    setSelected(new Set());
    router.refresh();
  };

  const bulkDismiss = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const reason = bulkReason.trim();
    if (!reason) return;
    setBulkBusy(true);
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`${BASE}/api/alerts/${id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: reason }),
        })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    );
    setBulkBusy(false);
    const failed = results.filter((ok) => !ok).length;
    toast(
      failed ? t("inbox.bulk.failed") : t("inbox.bulk.dismissed", { count: ids.length }),
      failed ? "info" : "success",
    );
    setBulkDismissOpen(false);
    setBulkReason("");
    setSelected(new Set());
    router.refresh();
  };

  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ severities, query, sort });
  if (
    pagedFilters.severities !== severities ||
    pagedFilters.query !== query ||
    pagedFilters.sort !== sort
  ) {
    setPagedFilters({ severities, query, sort });
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
          <SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
            {caps.confirm ? (
              <Button size="sm" variant="outline" className="h-8" onClick={bulkConfirm} disabled={bulkBusy}>
                <ShieldCheck className="size-3.5" />
                {t("inbox.action.confirm")}
              </Button>
            ) : null}
            {caps.reject ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-text-warning hover:text-text-warning"
                onClick={() => setBulkDismissOpen(true)}
                disabled={bulkBusy}
              >
                <Trash2 className="size-3.5" />
                {t("inbox.action.dismiss")}
              </Button>
            ) : null}
          </SelectionBar>
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
                  item={{ ...item, sla: slaFor(item, slaAckMinutes, t) }}
                  acknowledged={acked.has(item.id)}
                  escalated={escalated.has(item.id)}
                  selected={selected.has(item.id)}
                  caps={caps}
                  onToggleSelect={() => toggleOne(item.id)}
                  onAcknowledge={acknowledge}
                  onReopen={reopen}
                  onEscalate={escalate}
                  onDismiss={dismiss}
                  onConfirm={confirm}
                  onSetMaintenance={setMaintenance}
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

      {/* Bulk dismiss — shared reason applied to every selected alert. */}
      <Dialog open={bulkDismissOpen} onOpenChange={(o) => { setBulkDismissOpen(o); if (!o) setBulkReason(""); }}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); void bulkDismiss(); }}>
            <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
                <Trash2 className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle>{t("inbox.bulk.dismissTitle", { count: selected.size })}</DialogTitle>
                <DialogDescription>{t("inbox.bulk.dismissDesc")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-5 grid gap-2">
              <label htmlFor="bulk-dismiss-reason" className="text-sm font-medium text-foreground">
                {t("inbox.dismiss.reasonLabel")} <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="bulk-dismiss-reason"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder={t("inbox.dismiss.reasonPlaceholder")}
                rows={3}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={!bulkReason.trim() || bulkBusy}>
                <Trash2 className="size-4" />
                {t("inbox.action.dismiss")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
