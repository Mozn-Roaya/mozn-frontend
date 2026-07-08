"use client";

import * as React from "react";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  SearchX,
  ShieldCheck,
  TriangleAlert,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT, useTD } from "@/components/providers/locale-provider";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/common/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/components/ui/toaster";
import { DensityToggle, rowPadFor, type Density } from "@/components/data-table/density-toggle";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SelectionBar } from "@/components/data-table/selection-bar";
import { nextSort, SortableHead, type SortState } from "@/components/data-table/sortable-head";
import { TablePagination } from "@/components/data-table/table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { DotBadge, RoleBadge } from "@/components/common/status-badges";
import { EmptyState } from "@/components/common/empty-state";
import type { UserRole, UserRow, UsersPage } from "@/features/users/types";

const ROLES: UserRole[] = ["Super Admin", "Gov Editor", "Gov Viewer"];

type SortKey = "user" | "role" | "regions" | "lastActive" | "status";

/** Turn a relative "last active" label into minutes-ago so the column sorts by recency. */
function recencyMinutes(label: string): number {
  const t = label.toLowerCase();
  if (t.includes("now")) return 0;
  if (t.includes("yesterday")) return 1440;
  const m = t.match(/(\d+)\s*(min|h|hour|day|week|month)/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit.startsWith("min") ? 1 : unit.startsWith("h") ? 60 : unit.startsWith("day") ? 1440 : unit.startsWith("week") ? 10080 : 43200;
  return n * mult;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

type Draft = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  password: string;
  role: UserRole;
  regions: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  password: "",
  role: "Gov Viewer",
  regions: "",
};

const MIN_PASSWORD = 8;

// Roles that can manage a region's stations/alerts (A4.1 sole-editor guard).
const EDITOR_ROLES = new Set<UserRole>(["Super Admin", "Gov Editor"]);

/** A user whose region assignment spans everything (Super Admin or "all"). */
function coversAllRegions(u: UserRow): boolean {
  const r = u.regions.trim();
  return u.role === "Super Admin" || /all/i.test(r) || r === "" || r === "—";
}

function regionTokens(u: UserRow): string[] {
  return u.regions
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Regions that would be left with no active editor if `target` is deactivated.
 * Empty when another editor still covers them (or covers all regions).
 */
function orphanedRegions(target: UserRow, rows: UserRow[]): string[] {
  if (!EDITOR_ROLES.has(target.role)) return [];
  const others = rows.filter(
    (u) => u.active && u.id !== target.id && EDITOR_ROLES.has(u.role),
  );
  if (others.some(coversAllRegions)) return [];
  const targetRegions = coversAllRegions(target)
    ? Array.from(new Set(rows.flatMap(regionTokens)))
    : regionTokens(target);
  return targetRegions.filter(
    (region) => !others.some((o) => regionTokens(o).includes(region)),
  );
}

export function UsersTable({
  page,
  openCreateRef,
}: {
  page: UsersPage;
  /** Lets a parent (the tab header) trigger the create dialog from outside the table. */
  openCreateRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const t = useT();
  const td = useTD();
  const [rows, setRows] = React.useState<UserRow[]>(page.users);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  // Single dialog reused for create + edit. `editingId` null means "create".
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [showPassword, setShowPassword] = React.useState(false);
  const [sort, setSort] = React.useState<SortState<SortKey>>({ key: "lastActive", dir: "asc" });
  const onSort = (key: SortKey) => setSort((prev) => nextSort(prev, key));
  const [density, setDensity] = React.useState<Density>("comfortable");
  const rowPad = rowPadFor(density);
  const newIdRef = React.useRef(0);

  // Distinguish "filters exclude everyone" from "no users at all" so the empty
  // state can say the right thing (and offer Clear filters).
  const hasFilters = roles.length > 0 || query.trim() !== "";
  const clearFilters = () => {
    setRoles([]);
    setQuery("");
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowPassword(false);
    setDialogOpen(true);
  };

  // Expose create to the tab header, whose "Add user" button lives outside the
  // table Card. Kept fresh each render so it always calls the latest closure.
  React.useEffect(() => {
    if (!openCreateRef) return;
    openCreateRef.current = openCreate;
    return () => {
      openCreateRef.current = null;
    };
  });

  const openEdit = (user: UserRow) => {
    setEditingId(user.id);
    setDraft({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      organization: user.organization ?? "",
      password: "",
      role: user.role,
      regions: user.regions,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const submitDraft = () => {
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!name || !email) {
      toast(t("users.toastNameEmailRequired"), "info");
      return;
    }
    // New accounts need a starting password; on edit it's optional (blank = keep).
    if (!editingId && draft.password.length < MIN_PASSWORD) {
      toast(t("users.toastPasswordMin", { n: MIN_PASSWORD }), "info");
      return;
    }
    const phone = draft.phone.trim();
    const organization = draft.organization.trim();
    if (editingId) {
      setRows((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? { ...u, name, email, phone, organization, role: draft.role, regions: draft.regions.trim() || "—", initials: initialsOf(name) }
            : u,
        ),
      );
      toast(t("users.toastSaved", { name }));
    } else {
      const id = `u-new-${++newIdRef.current}`;
      setRows((prev) => [
        {
          id,
          name,
          email,
          phone,
          organization,
          initials: initialsOf(name),
          role: draft.role,
          regions: draft.regions.trim() || "—",
          lastActive: "Active now",
          active: true,
        },
        ...prev,
      ]);
      toast(t("users.toastAdded", { name }));
    }
    setDialogOpen(false);
  };

  // Sole-editor guard: deactivating an editor that's the last cover for a
  // region opens a confirm dialog instead of toggling immediately.
  const [pendingDeactivate, setPendingDeactivate] = React.useState<{
    user: UserRow;
    regions: string[];
  } | null>(null);

  const performToggle = (user: UserRow) => {
    setRows((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)),
    );
    toast(
      user.active
        ? t("users.toastDeactivated", { name: td(user.name) })
        : t("users.toastActivated", { name: td(user.name) }),
    );
  };

  const toggleActive = (user: UserRow) => {
    if (user.active) {
      const orphaned = orphanedRegions(user, rows);
      if (orphaned.length > 0) {
        setPendingDeactivate({ user, regions: orphaned });
        return;
      }
    }
    performToggle(user);
  };

  const removeUser = (user: UserRow) => {
    setRows((prev) => prev.filter((u) => u.id !== user.id));
    toast(t("users.toastRemoved", { name: td(user.name) }));
  };

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((u) => {
      const matchesRole = roles.length === 0 || roles.includes(u.role);
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    const cmp = (a: UserRow, b: UserRow) => {
      switch (sort.key) {
        case "role": return a.role.localeCompare(b.role) || a.name.localeCompare(b.name);
        case "regions": return a.regions.localeCompare(b.regions) || a.name.localeCompare(b.name);
        case "lastActive": return recencyMinutes(a.lastActive) - recencyMinutes(b.lastActive);
        case "status": return Number(b.active) - Number(a.active) || a.name.localeCompare(b.name);
        case "user": default: return a.name.localeCompare(b.name);
      }
    };
    return [...filtered].sort((a, b) => cmp(a, b) * dir);
  }, [rows, roles, query, sort]);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allVisibleSelected = visible.length > 0 && visible.every((u) => selected.has(u.id));
  const someSelected = visible.some((u) => selected.has(u.id));
  const toggleAll = () => setSelected((prev) => {
    if (allVisibleSelected) { const next = new Set(prev); visible.forEach((u) => next.delete(u.id)); return next; }
    return new Set([...prev, ...visible.map((u) => u.id)]);
  });
  const toggleOne = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  // Client-side pagination over the filtered/sorted list. The page size is
  // auto-fitted to the available height so the table shows exactly the rows
  // that fit — no internal scroll, page stays static — until the user picks a
  // size manually (then we honour their choice and stop auto-fitting).
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { pageSize, setPageSize, setPageIndex, safePage, pageRows } =
    usePagination(visible);
  const userPickedSize = React.useRef(false);

  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fit = () => {
      if (userPickedSize.current) return;
      const headH = el.querySelector("thead")?.getBoundingClientRect().height ?? 48;
      const rowH =
        el.querySelector("tbody tr[data-row]")?.getBoundingClientRect().height ?? 56;
      const n = Math.max(1, Math.floor((el.clientHeight - headH) / rowH));
      setPageSize((prev) => (prev === n ? prev : n));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setPageSize]);

  // Always offer the current (fitted) size in the selector so its value renders.
  const pageSizeOptions = React.useMemo(
    () => Array.from(new Set([pageSize, 10, 25, 50])).sort((a, b) => a - b),
    [pageSize],
  );

  // Reset to page 1 when the filter set changes — adjusted during render (the
  // pattern used elsewhere in the app) rather than in an effect, so it commits
  // once with no flash of the pre-reset page.
  const [pagedFilters, setPagedFilters] = React.useState({ roles, query, sort });
  if (pagedFilters.roles !== roles || pagedFilters.query !== query || pagedFilters.sort !== sort) {
    setPagedFilters({ roles, query, sort });
    setPageIndex(1);
  }

  // Faceted role filter options with live per-role counts (empty = all).
  const roleOptions = React.useMemo(() => {
    const tally = new Map<string, number>();
    rows.forEach((u) => tally.set(u.role, (tally.get(u.role) ?? 0) + 1));
    return page.filters
      .filter((f) => f.key !== "all")
      .map((f) => ({
        value: f.key,
        label: t("role." + f.key),
        count: tally.get(f.key) ?? 0,
      }));
  }, [rows, page.filters, t]);

  return (
    // The table auto-fits rows to the viewport (flex-1) when populated; when
    // empty, size to content so the empty state sits in a compact box like the
    // other tables instead of stretching to the bottom of the screen.
    <Card
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        visible.length > 0 && "flex-1",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:max-w-[260px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
          aria-label={t("users.searchAria")}
        />
        <FacetedFilter
          title={t("users.colRole")}
          options={roleOptions}
          selected={roles}
          onChange={setRoles}
        />
        <div className="flex items-center gap-3 sm:ms-auto">
          <span className="text-sm text-muted-foreground">
            {t("common.of", { shown: visible.length, total: rows.length })}
          </span>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

      <Table containerRef={scrollRef} containerClassName="min-h-0 flex-1">
        <TableHeader>
          <TableRow className={tableHeaderRowClass}>
            <TableHead className="w-10 ps-4">
              <Checkbox checked={allVisibleSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleAll} aria-label={t("common.selectAll")} />
            </TableHead>
            <SortableHead label={t("users.colUser")} column="user" sort={sort} onSort={onSort} />
            <SortableHead label={t("users.colRole")} column="role" sort={sort} onSort={onSort} />
            <SortableHead label={t("users.colRegions")} column="regions" sort={sort} onSort={onSort} />
            <SortableHead label={t("users.colLastActive")} column="lastActive" sort={sort} onSort={onSort} />
            <SortableHead label={t("users.colStatus")} column="status" sort={sort} onSort={onSort} />
            <TableHead className="w-12 text-end" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="h-[280px] p-0">
                <EmptyState
                  icon={hasFilters ? SearchX : Users}
                  title={t(hasFilters ? "users.emptyTitle" : "users.noDataTitle")}
                  message={t(hasFilters ? "users.empty" : "users.noData")}
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
            pageRows.map((user) => (
              <TableRow key={user.id} data-row className={cn(tableBodyRowClass, rowPad)}>
                <TableCell className="ps-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(user.id)} onCheckedChange={() => toggleOne(user.id)} aria-label={t("common.selectRow")} />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{td(user.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-muted-foreground">{td(user.regions)}</TableCell>
                <TableCell
                  className={cn(
                    user.lastActive === "Active now"
                      ? "font-semibold text-status-normal"
                      : "text-muted-foreground",
                  )}
                >
                  {td(user.lastActive)}
                </TableCell>
                <TableCell>
                  {user.active ? (
                    <DotBadge variant="normal" dotClass="bg-status-normal">
                      {t("users.statusActive")}
                    </DotBadge>
                  ) : (
                    <DotBadge variant="offline" dotClass="bg-status-offline">
                      {t("users.statusInactive")}
                    </DotBadge>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9"
                        aria-label={t("users.actionsFor", { name: td(user.name) })}
                      >
                        <MoreHorizontal className="size-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(user)}>
                        <Pencil className="size-4" />
                        {t("users.editUser")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(user)}>
                        {user.active ? (
                          <>
                            <UserX className="size-4" />
                            {t("users.deactivate")}
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-4" />
                            {t("users.activate")}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeUser(user)}
                        className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                      >
                        <Trash2 className="size-4" />
                        {t("users.removeUser")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {visible.length > 0 && (
        <TablePagination
          page={safePage}
          pageSize={pageSize}
          total={visible.length}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPageIndex}
          onPageSizeChange={(n) => {
            userPickedSize.current = true;
            setPageSize(n);
            setPageIndex(1);
          }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground"
            >
              {editingId ? <Pencil className="size-5" /> : <UserPlus className="size-5" />}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>
                {editingId ? t("users.dialogEditTitle") : t("users.dialogAddTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? t("users.dialogEditDesc")
                  : t("users.dialogAddDesc")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <form
            id="user-form"
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitDraft();
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="user-name" className="text-sm font-medium text-foreground">
                {t("users.fieldName")} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-name"
                  className="ps-9"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder={t("users.namePlaceholder")}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="user-email" className="text-sm font-medium text-foreground">
                {t("users.fieldEmail")} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-email"
                  type="email"
                  className="ps-9"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  placeholder={t("users.emailPlaceholder")}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="user-password" className="text-sm font-medium text-foreground">
                {editingId ? (
                  <>
                    {t("users.fieldPassword")}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("users.passwordKeepHint")}
                    </span>
                  </>
                ) : (
                  <>
                    {t("users.fieldPassword")} <span className="text-destructive">*</span>
                  </>
                )}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  className="ps-9 pe-10"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                  placeholder={editingId ? "••••••••" : t("users.passwordPlaceholder", { n: MIN_PASSWORD })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute end-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? t("users.hidePassword") : t("users.showPassword")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="user-role" className="text-sm font-medium text-foreground">
                  {t("users.fieldRole")}
                </label>
                <Select
                  value={draft.role}
                  onValueChange={(v) => setDraft((d) => ({ ...d, role: v as UserRole }))}
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <div className="flex min-w-0 items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t("role." + r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-regions" className="text-sm font-medium text-foreground">
                  {t("users.fieldRegions")}
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-regions"
                    className="ps-9"
                    value={draft.regions}
                    onChange={(e) => setDraft((d) => ({ ...d, regions: e.target.value }))}
                    placeholder={t("users.regionsPlaceholder")}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="user-phone" className="text-sm font-medium text-foreground">
                  {t("users.fieldPhone")}{" "}
                  <span className="font-normal text-muted-foreground">{t("users.optional")}</span>
                </label>
                <div className="relative">
                  {/* Icon pinned to the field edge (start-3), consistent with the
                      other fields. dir=ltr keeps the number groups from reversing;
                      symmetric px-9 + text-center centres the number in the field. */}
                  <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-phone"
                    type="tel"
                    className="px-9 text-center"
                    dir="ltr"
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    placeholder={t("users.phonePlaceholder")}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="user-org" className="text-sm font-medium text-foreground">
                  {t("users.fieldOrg")}{" "}
                  <span className="font-normal text-muted-foreground">{t("users.optional")}</span>
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-org"
                    className="ps-9"
                    value={draft.organization}
                    onChange={(e) => setDraft((d) => ({ ...d, organization: e.target.value }))}
                    placeholder={t("users.orgPlaceholder")}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("users.formHelp")}
            </p>
          </form>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="user-form"
              disabled={
                !draft.name.trim() ||
                !draft.email.trim() ||
                (!editingId && draft.password.length < MIN_PASSWORD)
              }
            >
              {editingId ? <Check className="size-4" /> : <UserPlus className="size-4" />}
              {editingId ? t("common.save") : t("users.submitAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sole-editor-for-region safeguard */}
      <Dialog
        open={pendingDeactivate !== null}
        onOpenChange={(o) => !o && setPendingDeactivate(null)}
      >
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
              <TriangleAlert className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("users.soleEditor.title")}</DialogTitle>
              <DialogDescription>
                {pendingDeactivate
                  ? t("users.soleEditor.desc", {
                      name: td(pendingDeactivate.user.name),
                      regions: pendingDeactivate.regions
                        .map((r) =>
                          t("region." + r) === "region." + r ? r : t("region." + r),
                        )
                        .join("، "),
                    })
                  : ""}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingDeactivate) performToggle(pendingDeactivate.user);
                setPendingDeactivate(null);
              }}
            >
              <UserX className="size-4" />
              {t("users.soleEditor.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
