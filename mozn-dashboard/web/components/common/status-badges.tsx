"use client";

import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/locale-provider";
import type {
  AlertOutcome,
  AlertSeverity,
  StationOpStatus,
  UserRole,
} from "@/types/shared";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/** A status badge with a leading dot (used in tables). */
export function DotBadge({
  variant,
  dotClass,
  className,
  children,
}: {
  variant: BadgeVariant;
  dotClass: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge variant={variant} className={cn("gap-1.5 capitalize", className)}>
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      {children}
    </Badge>
  );
}

const STATION_STATUS: Record<
  StationOpStatus,
  { variant: BadgeVariant; dot: string }
> = {
  online: { variant: "normal", dot: "bg-status-normal" },
  offline: { variant: "offline", dot: "bg-status-offline" },
  maintenance: { variant: "watch", dot: "bg-text-link" },
  anomaly: { variant: "advisory", dot: "bg-status-advisory" },
  warning: { variant: "warning", dot: "bg-status-warning" },
};

export function StationStatusBadge({ status }: { status: StationOpStatus }) {
  const s = STATION_STATUS[status];
  const t = useT();
  return (
    <DotBadge variant={s.variant} dotClass={s.dot}>
      {t(`status.${status}`)}
    </DotBadge>
  );
}

const SEVERITY: Record<AlertSeverity, BadgeVariant> = {
  critical: "warning",
  warning: "warning",
  watch: "watch",
  advisory: "advisory",
};

/** Uppercase severity chip for history/management tables. */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const t = useT();
  return (
    <Badge variant={SEVERITY[severity]} className="gap-1.5 uppercase tracking-wide">
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {t(`severity.${severity}`)}
    </Badge>
  );
}

export function OutcomeBadge({ outcome }: { outcome: AlertOutcome }) {
  const t = useT();
  return outcome === "all-clear" ? (
    <DotBadge variant="normal" dotClass="bg-status-normal">
      {t("outcome.all-clear")}
    </DotBadge>
  ) : (
    <DotBadge variant="offline" dotClass="bg-status-offline">
      {t("outcome.auto-cleared")}
    </DotBadge>
  );
}

const ROLE_VARIANT: Record<UserRole, BadgeVariant> = {
  "Super Admin": "brand",
  "Gov Editor": "watch",
  "Gov Viewer": "offline",
};

export function RoleBadge({ role }: { role: UserRole }) {
  const t = useT();
  return (
    <DotBadge variant={ROLE_VARIANT[role]} dotClass="bg-current opacity-70">
      {t(`role.${role}`)}
    </DotBadge>
  );
}
