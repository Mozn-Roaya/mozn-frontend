"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { canAccessNav, navItemForPath } from "./nav-config";

/**
 * Client-side access guard. Every account is blocked from any screen whose view
 * permission it lacks (e.g. a gov role deep-linking to /users, or an operator to
 * /settings) — the same permission the sidebar uses to show/hide the item, so nav
 * and direct-URL access always agree. The backend enforces the same on every call.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { can } = useRole();
  const pathname = usePathname();

  const item = navItemForPath(pathname);
  if (item && !canAccessNav(item, can)) {
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
