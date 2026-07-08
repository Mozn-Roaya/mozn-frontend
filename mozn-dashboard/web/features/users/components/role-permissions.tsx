"use client";

import * as React from "react";
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
import {
  CAPABILITIES,
  DEFAULT_PERMISSIONS,
  loadPermissions,
  PERMISSION_ROLES,
  savePermissions,
  type Capability,
  type PermissionMatrix,
} from "@/features/users/role-permissions-state";
import type { UserRole } from "@/types/shared";

// Super Admin always keeps full access; its cells are locked so an admin can't
// revoke the rights that let them manage everyone else.
const LOCKED_ROLE: UserRole = "Super Admin";

export function RolePermissions() {
  const t = useT();
  const [perms, setPerms] = React.useState<PermissionMatrix>(DEFAULT_PERMISSIONS);
  const savedRef = React.useRef<PermissionMatrix>(DEFAULT_PERMISSIONS);
  const [dirty, setDirty] = React.useState(false);

  // localStorage stands in for the backend; hydrate on mount (see
  // role-permissions-state). Client-only by design — seeding persisted values
  // into initial state would desync the server/client markup — so the
  // set-state-in-effect here is deliberate.
  React.useEffect(() => {
    const loaded = loadPermissions();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client-only hydrate from localStorage (see comment above) */
    setPerms(loaded);
    savedRef.current = loaded;
    setDirty(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggle = (cap: Capability, role: UserRole, value: boolean) => {
    setPerms((p) => ({ ...p, [cap]: { ...p[cap], [role]: value } }));
    setDirty(true);
  };

  const handleSave = () => {
    savePermissions(perms);
    savedRef.current = perms;
    setDirty(false);
    toast(t("roles.saved"));
  };
  const handleDiscard = () => {
    setPerms(savedRef.current);
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("roles.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("roles.subtitle")}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="ps-6">{t("roles.col.capability")}</TableHead>
              {PERMISSION_ROLES.map((r) => (
                <TableHead key={r} className="text-center">
                  {t(`role.${r}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CAPABILITIES.map((cap) => (
              <TableRow key={cap} className={tableBodyRowClass}>
                <TableCell className="ps-6 font-medium text-foreground">
                  {t(`roles.cap.${cap}`)}
                </TableCell>
                {PERMISSION_ROLES.map((r) => {
                  const locked = r === LOCKED_ROLE;
                  return (
                    <TableCell
                      key={r}
                      className={cn("text-center", r === "Super Admin" && "bg-secondary/40")}
                    >
                      <span className="inline-flex justify-center">
                        <Checkbox
                          checked={perms[cap][r]}
                          disabled={locked}
                          onCheckedChange={(v) => toggle(cap, r, v === true)}
                          aria-label={`${t(`roles.cap.${cap}`)} — ${t(`role.${r}`)}`}
                        />
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {dirty ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card motion-safe:animate-in motion-safe:slide-in-from-bottom-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-status-advisory" aria-hidden />
            {t("settings.unsaved")}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard}>
              {t("settings.discard")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="size-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
