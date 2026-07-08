import type * as React from "react";

import type { Badge } from "@/components/ui/badge";
import type { ActivityCategory } from "@/types/shared";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/**
 * Category → badge variant + (English) label. Single source of truth shared by
 * the full Activity Log table and the dashboard Recent Activity panel so both
 * render identically. The label feeds `t("history.category." + LABEL[cat])`.
 */
export const CATEGORY_VARIANT: Record<ActivityCategory, BadgeVariant> = {
  alert: "warning",
  threshold: "watch",
  station: "advisory",
  user: "brand",
  auth: "offline",
};

export const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  alert: "Alert",
  threshold: "Threshold",
  station: "Station",
  user: "User",
  auth: "Auth",
};
