"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { NAV_GROUPS, type NavItem } from "./nav-config";

function NavRow({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const isActive = item.href === pathname;
  const Icon = item.icon;
  const label = t(item.labelKey);

  const content = (
    <>
      {/* Active state is a soft brand wash + a rounded accent bar centered on the
          start edge (logical, so it flips in RTL) — a deliberate "selected" cue,
          not a heavy filled pill. */}
      {isActive ? (
        <span
          aria-hidden
          className="absolute start-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-e-full bg-primary"
        />
      ) : null}
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors",
          isActive
            ? "text-brand-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{label}</span>
      {item.badge ? (
        // Fixed-height circle for single digits (h == min-w), growing into a pill
        // for 2+ digits. Plain span with an explicit 11px size so the RTL badge
        // metrics (min-height / font swap) don't stretch it out of round.
        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none tabular-nums text-destructive-foreground">
          {/* Nudge the glyph down ~0.5px: digits have no descender, so leading-none
              centers the em-box but leaves the number optically riding high. */}
          <span className="translate-y-[0.5px]">{item.badge}</span>
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
    isActive
      ? "bg-primary/10 font-semibold text-brand-foreground"
      : "font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
  );

  if (!item.href) {
    return (
      <span
        aria-disabled
        title={t("nav.comingSoon")}
        className={cn(className, "cursor-not-allowed opacity-60")}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

/** Grouped sidebar navigation. The active item is derived from the route, and
 * the item set is scoped to the active role (Gov roles see a subset). */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const { isGov, can } = useRole();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    // Gov roles: the region-scoped subset (by the `gov` flag). Non-Gov roles:
    // everything they hold the view permission for — so an `operator` doesn't see
    // admin screens (Users/Settings) it lacks access to and would only 403 on.
    items: group.items.filter((i) => (isGov ? i.gov : !i.permission || can(i.permission))),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-5" aria-label={t("nav.primaryAria")}>
      {groups.map((group) => (
        <div key={group.labelKey} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            {t(group.labelKey)}
          </p>
          {group.items.map((item) => (
            <NavRow key={item.labelKey} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}
