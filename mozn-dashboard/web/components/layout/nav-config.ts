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
  /** Visible to Gov roles (region-scoped). Items without it are admin-only. */
  gov?: boolean;
  /** Backend view-permission the screen needs. For non-Gov accounts the nav +
   * route guard hide the item when the account lacks it — so e.g. an `operator`
   * (no users/settings perms) doesn't see admin screens it would only 403 on.
   * Gov roles are gated by the `gov` flag instead. */
  permission?: string;
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
      { labelKey: "nav.dashboard", icon: LayoutDashboard, href: "/", gov: true },
      { labelKey: "nav.alertInbox", icon: Inbox, href: "/alert-inbox", permission: "alerts.view" },
      { labelKey: "nav.activeAlerts", icon: BellRing, href: "/active-alerts", permission: "alerts.view" },
      { labelKey: "nav.alertsThresholds", icon: SlidersHorizontal, href: "/alerts", permission: "thresholds.view" },
      { labelKey: "nav.alertTemplates", icon: FileText, href: "/alert-templates", permission: "templates.view" },
      { labelKey: "nav.stations", icon: RadioTower, href: "/stations", gov: true, permission: "stations.view" },
    ],
  },
  {
    labelKey: "navGroup.records",
    items: [
      { labelKey: "nav.historyAudit", icon: History, href: "/history", gov: true, permission: "audit_log.view" },
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
