"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";

// Routes a Gov role may open (mirrors the gov-flagged nav items: G1/G2/G3).
const GOV_ALLOWED = ["/", "/stations", "/history"];

function isAllowed(pathname: string): boolean {
  return GOV_ALLOWED.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"),
  );
}

/**
 * Client-side access guard for the demo role switcher. Gov roles can only open
 * their region-scoped screens; everything else shows a restricted panel instead
 * of admin content. (Nav already hides these — this covers direct URLs.)
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { isGov } = useRole();
  const pathname = usePathname();

  if (isGov && !isAllowed(pathname)) {
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
