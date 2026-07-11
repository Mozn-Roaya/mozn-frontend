import {
  BellRing,
  FileText,
  History,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  RadioTower,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export interface NavItem {
  /** i18n key (e.g. "nav.dashboard"); resolved at render via useT. */
  labelKey: string;
  icon: LucideIcon;
  /** Present once the matching screen exists. */
  href?: string;
  badge?: number;
  /** Backend view-permission(s) the screen needs. The nav + route guard hide the
   * item (and block direct URLs) unless the account holds it — so the sidebar
   * shows exactly the screens each role's permissions allow, for every role.
   * An array means any-of (e.g. the dashboard is dashboard.view OR gov.dashboard). */
  permission?: string | string[];
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

/**
 * Sidebar navigation, grouped by daily workflow: live monitoring first,
 * records in the middle, account/admin at the bottom.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "navGroup.monitoring",
    items: [
      { labelKey: "nav.dashboard", icon: LayoutDashboard, href: "/", permission: ["dashboard.view", "gov.dashboard"] },
      { labelKey: "nav.alertInbox", icon: Inbox, href: "/alert-inbox", permission: "alerts.view" },
      { labelKey: "nav.activeAlerts", icon: BellRing, href: "/active-alerts", permission: "alerts.view" },
      { labelKey: "nav.alertsThresholds", icon: SlidersHorizontal, href: "/alerts", permission: "thresholds.view" },
      { labelKey: "nav.alertTemplates", icon: FileText, href: "/alert-templates", permission: "templates.view" },
      { labelKey: "nav.stations", icon: RadioTower, href: "/stations", permission: "stations.view" },
    ],
  },
  {
    labelKey: "navGroup.records",
    items: [
      // /history is alert history (data from /api/alerts) → alerts.view; /activity
      // is the audit log → audit_log.view.
      { labelKey: "nav.historyAudit", icon: History, href: "/history", permission: "alerts.view" },
      { labelKey: "nav.activityLog", icon: ScrollText, href: "/activity", permission: "audit_log.view" },
    ],
  },
  {
    labelKey: "navGroup.account",
    items: [
      { labelKey: "nav.usersAccess", icon: Users, href: "/users", permission: "users.view" },
      { labelKey: "nav.settings", icon: Settings, href: "/settings", permission: "settings.view" },
    ],
  },
];

/** Whether an account (via `can`) meets a nav item's permission requirement.
 * No permission → always allowed; an array → any-of. Used by the sidebar, the
 * route guard, and the command palette so all three agree on visibility. */
export function canAccessNav(item: NavItem, can: (permission: string) => boolean): boolean {
  if (!item.permission) return true;
  const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
  return perms.some((p) => can(p));
}

/** The nav item that owns a pathname (exact for "/", else prefix match) so the
 * route guard can gate a direct URL by the same permission the sidebar uses. */
export function navItemForPath(pathname: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.href) continue;
      const match =
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(item.href + "/");
      if (match) return item;
    }
  }
  return undefined;
}

/**
 * Leaf breadcrumbs for sub-routes that sit *below* a top-level nav item (form
 * and detail screens). The topbar breadcrumb resolves the parent section from
 * NAV_GROUPS, then appends the first matching leaf here so the trail reads
 * `brand / section / sub-page`. Keeps the full path in one place (the topbar)
 * instead of each page rendering its own breadcrumb.
 */
export interface LeafCrumb {
  /** Matches the current pathname of a sub-route. */
  match: (pathname: string) => boolean;
  /** i18n key for the leaf label; resolved at render via useT. */
  labelKey: string;
}

export const LEAF_CRUMBS: LeafCrumb[] = [
  { match: (p) => p === "/stations/new", labelKey: "stations.addStation" },
  {
    match: (p) => p.startsWith("/stations/") && p.endsWith("/edit"),
    labelKey: "stations.editTitle",
  },
];
