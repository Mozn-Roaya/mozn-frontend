"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { NAV_GROUPS } from "./nav-config";

// Routes a Gov role may open (mirrors the gov-flagged nav items: G1/G2/G3).
const GOV_ALLOWED = ["/", "/stations", "/history"];

function isAllowed(pathname: string): boolean {
  return GOV_ALLOWED.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"),
  );
}

/** View-permission a top-level route needs, from the nav config (matches the
 * nav-list gating). Undefined = no permission gate for this path. */
function permissionForPath(pathname: string): string | undefined {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.href || !item.permission) continue;
      const match =
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(item.href + "/");
      if (match) return item.permission;
    }
  }
  return undefined;
}

/**
 * Client-side access guard. Gov roles may only open their region-scoped screens;
 * non-Gov accounts are blocked from any screen whose view permission they lack
 * (e.g. an `operator` deep-linking to /users or /settings). Nav already hides
 * these — this covers direct URLs. The backend enforces the same on every call.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { isGov, can } = useRole();
  const pathname = usePathname();

  const requiredPerm = permissionForPath(pathname);
  const govBlocked = isGov && !isAllowed(pathname);
  const permBlocked = !isGov && requiredPerm !== undefined && !can(requiredPerm);

  if (govBlocked || permBlocked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="size-7" aria-hidden />
        </span>
        <div className="max-w-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {t("access.restricted.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("access.restricted.body")}</p>
        </div>
        <Button asChild>
          <Link href="/">{t("access.restricted.back")}</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
