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
      { labelKey: "nav.alertInbox", icon: Inbox, href: "/alert-inbox" },
      { labelKey: "nav.activeAlerts", icon: BellRing, href: "/active-alerts" },
      { labelKey: "nav.alertsThresholds", icon: SlidersHorizontal, href: "/alerts" },
      { labelKey: "nav.alertTemplates", icon: FileText, href: "/alert-templates" },
      { labelKey: "nav.stations", icon: RadioTower, href: "/stations", gov: true },
    ],
  },
  {
    labelKey: "navGroup.records",
    items: [
      { labelKey: "nav.historyAudit", icon: History, href: "/history", gov: true },
      { labelKey: "nav.activityLog", icon: ScrollText, href: "/activity" },
    ],
  },
  {
    labelKey: "navGroup.account",
    items: [
      { labelKey: "nav.usersAccess", icon: Users, href: "/users" },
      { labelKey: "nav.settings", icon: Settings, href: "/settings" },
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
