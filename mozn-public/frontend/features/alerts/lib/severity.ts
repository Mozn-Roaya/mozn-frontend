import { AlertTriangleIcon, type IconProps } from "@/components/icons";

import type * as React from "react";

/**
 * Domain severity. Components and consumers reason about *this* — never the
 * raw API string. Lower `sortOrder` renders first (most urgent at the top).
 */
export type Severity = "info" | "warning" | "critical";

/**
 * Raw API severity. Kept narrow so a typo at a call site is a compile error,
 * and so the API↔domain edge is the only place that knows about colors.
 */
export type ApiSeverity = "yellow" | "orange" | "red";

export type SeverityClasses = {
  /** Header surface (the colored band behind the title). */
  readonly surface: string;
  /** Title-icon tint and the "live pill" background. */
  readonly accent: string;
  /** Numbered action badge background. */
  readonly badge: string;
  /** Numbered action badge text. */
  readonly badgeText: string;
};

export type SeverityMeta = {
  readonly id: Severity;
  readonly label: string;
  /** Lower = more urgent. Use this for sorting alert lists. */
  readonly sortOrder: number;
  readonly icon: React.ComponentType<IconProps>;
  readonly classes: SeverityClasses;
};

/**
 * Per-severity color binding. Each domain severity maps 1:1 to an API color
 * (yellow→info, orange→warning, red→critical via `API_TO_DOMAIN` below) and
 * uses the matching `--color-severity-*` hue so the alert panel, map pin, and
 * live pill all agree at a glance. Header surface and step badge use the two
 * `--color-bg-severity-*-{subtle,step}` tints defined in globals.css.
 */
export const SEVERITY_META: Readonly<Record<Severity, SeverityMeta>> = {
  critical: {
    id: "critical",
    label: "Critical",
    sortOrder: 0,
    icon: AlertTriangleIcon,
    classes: {
      surface: "bg-(--color-bg-severity-red-subtle)",
      accent:
        "text-(--color-severity-red-500) bg-(--color-severity-red-500)",
      badge: "bg-(--color-bg-severity-red-step)",
      badgeText: "text-(--color-severity-red-500)",
    },
  },
  warning: {
    id: "warning",
    label: "Warning",
    sortOrder: 1,
    icon: AlertTriangleIcon,
    classes: {
      surface: "bg-(--color-bg-severity-orange-subtle)",
      accent:
        "text-(--color-severity-orange-500) bg-(--color-severity-orange-500)",
      badge: "bg-(--color-bg-severity-orange-step)",
      badgeText: "text-(--color-severity-orange-500)",
    },
  },
  info: {
    id: "info",
    label: "Advisory",
    sortOrder: 2,
    icon: AlertTriangleIcon,
    classes: {
      surface: "bg-(--color-bg-severity-yellow-subtle)",
      accent:
        "text-(--color-severity-yellow-500) bg-(--color-severity-yellow-500)",
      badge: "bg-(--color-bg-severity-yellow-step)",
      badgeText: "text-(--color-severity-yellow-500)",
    },
  },
};

const API_TO_DOMAIN: Readonly<Record<ApiSeverity, Severity>> = {
  yellow: "info",
  orange: "warning",
  red: "critical",
};

export function severityFromApi(raw: ApiSeverity): Severity {
  return API_TO_DOMAIN[raw];
}

export function severityClasses(severity: Severity): SeverityClasses {
  return SEVERITY_META[severity].classes;
}
