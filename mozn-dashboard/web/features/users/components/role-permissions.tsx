"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toaster";
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
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type { RoleMatrix } from "@/types/roles";

// Admin-tier roles (rank >= 100) are locked: they always hold every permission,
// and the backend refuses to strip roles.manage from the last role that has it,
// so we don't let an admin edit that column and lock themselves out.
const ADMIN_RANK = 100;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function seed(matrix: RoleMatrix): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const r of matrix.roles) out[r.id] = new Set(r.permissionIds);
  return out;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

export function RolePermissions({ matrix }: { matrix: RoleMatrix }) {
  const t = useT();
  const router = useRouter();
  const { readOnly } = useRole();

  const [grants, setGrants] = React.useState<Record<string, Set<string>>>(() => seed(matrix));
  const [saving, setSaving] = React.useState(false);
  // Re-seed when fresh server data arrives (after a Save → router.refresh()).
  // Adjust during render (the app's pattern) rather than in an effect.
  const [seededFrom, setSeededFrom] = React.useState(matrix);
  if (seededFrom !== matrix) {
    setSeededFrom(matrix);
    setGrants(seed(matrix));
  }

  const initial = React.useMemo(() => seed(matrix), [matrix]);
  const isLocked = (rank: number) => rank >= ADMIN_RANK;

  const changedRoleIds = React.useMemo(
    () =>
      matrix.roles
        .filter((r) => !isLocked(r.rank))
        .filter((r) => !setsEqual(grants[r.id] ?? new Set(), initial[r.id] ?? new Set()))
        .map((r) => r.id),
    [grants, initial, matrix.roles],
  );
  const dirty = changedRoleIds.length > 0;

  const toggle = (roleId: string, permId: string, value: boolean) =>
    setGrants((prev) => {
      const next = { ...prev };
      const set = new Set(next[roleId] ?? []);
      if (value) set.add(permId);
      else set.delete(permId);
      next[roleId] = set;
      return next;
    });

  const discard = () => setGrants(seed(matrix));

  const save = async () => {
    setSaving(true);
    try {
      const failures: string[] = [];
      for (const roleId of changedRoleIds) {
        const role = matrix.roles.find((r) => r.id === roleId);
        const res = await fetch(`${BASE}/api/roles/${roleId}/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permission_ids: [...(grants[roleId] ?? [])] }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          failures.push(`${role?.label ?? roleId}: ${json.error ?? t("roles.saveFailed")}`);
        }
      }
      toast(failures.length ? failures[0] : t("roles.saved"), failures.length ? "info" : "success");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  // Group permissions into readable sections by their group prefix.
  const groups = React.useMemo(() => {
    const byGroup = new Map<string, RoleMatrix["permissions"]>();
    for (const p of matrix.permissions) {
      const arr = byGroup.get(p.group) ?? [];
      arr.push(p);
      byGroup.set(p.group, arr);
    }
    return [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [matrix.permissions]);

  if (matrix.roles.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">{t("roles.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("roles.noRoles")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("roles.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("roles.subtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={tableHeaderRowClass}>
                <TableHead className="ps-6">{t("roles.col.permission")}</TableHead>
                {matrix.roles.map((r) => (
                  <TableHead key={r.id} className="whitespace-nowrap text-center">
                    {r.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(([group, perms]) => (
                <React.Fragment key={group}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={matrix.roles.length + 1}
                      className="bg-secondary/40 py-1.5 ps-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {perms[0]?.groupLabel ?? group}
                    </TableCell>
                  </TableRow>
                  {perms.map((p) => (
                    <TableRow key={p.id} className={tableBodyRowClass}>
                      <TableCell className="ps-6">
                        <span className="font-medium text-foreground" title={p.name}>
                          {p.label}
                        </span>
                      </TableCell>
                      {matrix.roles.map((r) => {
                        const locked = isLocked(r.rank) || readOnly;
                        const checked = (grants[r.id] ?? new Set()).has(p.id);
                        return (
                          <TableCell
                            key={r.id}
                            className={cn("text-center", isLocked(r.rank) && "bg-secondary/40")}
                          >
                            <span className="inline-flex justify-center">
                              <Checkbox
                                checked={checked}
                                disabled={locked}
                                onCheckedChange={(v) => toggle(r.id, p.id, v === true)}
                                aria-label={`${p.name} — ${r.label}`}
                              />
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {dirty && !readOnly ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card motion-safe:animate-in motion-safe:slide-in-from-bottom-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-status-advisory" aria-hidden />
            {t("settings.unsaved")}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={discard} disabled={saving}>
              {t("settings.discard")}
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Check className="size-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
