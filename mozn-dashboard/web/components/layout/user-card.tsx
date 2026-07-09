"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LogOut, Settings, User, UserCog } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type { UserRole } from "@/types/shared";

const ROLES: UserRole[] = ["Super Admin", "Gov Editor", "Gov Viewer"];

/** Account summary pinned to the bottom of the sidebar. Shows the real signed-in
 * identity from the backend session; the dropdown keeps a role-switcher that
 * previews the role-scoped experience (the backend still enforces permissions)
 * and a Sign out action that clears the session cookie. */
export function UserCard() {
  const t = useT();
  const router = useRouter();
  const { role, setRole, name, email } = useRole();

  async function handleSignOut() {
    try {
      await fetch("api/auth/logout", { method: "POST" });
    } catch {
      /* clear client state regardless */
    }
    toast(t("account.signedOut"));
    router.replace("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <User className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name || t("account.notSignedIn")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("role." + role)}</p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" sideOffset={8} className="w-[240px]">
        <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <User className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name || t("account.notSignedIn")}</p>
            <p className="truncate text-xs text-muted-foreground">{email || t("role." + role)}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Demo role switcher — previews role-based access (no real auth here) */}
        <DropdownMenuLabel className="flex items-center gap-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <UserCog className="size-3.5" aria-hidden />
          {t("role.switch.label")}
        </DropdownMenuLabel>
        {ROLES.map((r) => (
          <DropdownMenuItem key={r} onClick={() => setRole(r)} className="justify-between">
            {t("role." + r)}
            {role === r ? <Check className="size-4 text-brand-foreground" /> : null}
          </DropdownMenuItem>
        ))}
        <p className="px-2 py-1 text-[10px] text-muted-foreground/70">{t("role.switch.hint")}</p>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            {t("account.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
        >
          <LogOut className="size-4" />
          {t("account.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
