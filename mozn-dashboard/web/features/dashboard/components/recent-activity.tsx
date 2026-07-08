"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableBodyRowClass,
  tableHeaderRowClass,
} from "@/components/ui/table";
import type { ActivityItem } from "@/features/dashboard/types";
import {
  CATEGORY_LABEL,
  CATEGORY_VARIANT,
} from "@/components/common/activity-category";
import { SectionCard } from "./section-card";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// A five-row preview of the full Activity Log. Columns, cells, and styling
// mirror activity-log-view.tsx exactly (actor chip · action · category · time);
// this panel is read-only, so headers are not sortable and there is no toolbar.
export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const { locale, t, td } = useLocale();

  // Localized "10 Jun" with Western digits — matches the Activity Log column.
  const fmtDate = React.useCallback(
    (value: string) => {
      const m = value.match(/(\d{1,2})\s+([A-Za-z]+)/);
      if (!m || MONTHS[m[2]] === undefined) return td(value);
      const d = new Date(new Date().getFullYear(), MONTHS[m[2]], Number(m[1]));
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
        day: "numeric",
        month: "short",
      }).format(d);
    },
    [locale, td],
  );

  return (
    <SectionCard
      icon={History}
      title={t("dashboard.recentActivity.title")}
      bodyClassName="px-0"
      action={
        <Link
          href="/activity"
          className="flex items-center gap-1 rounded-md text-sm font-medium text-text-link transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("dashboard.recentActivity.viewLog")}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={History} message={t("dashboard.recentActivity.empty")} />
      ) : (
        <Table className="[&_tr:last-child]:border-0">
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className="ps-6">{t("history.col.actor")}</TableHead>
              <TableHead>{t("history.col.action")}</TableHead>
              <TableHead>{t("history.col.category")}</TableHead>
              <TableHead className="pe-6">{t("history.col.time")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 5).map((item) => (
              <TableRow key={item.id} className={tableBodyRowClass}>
                <TableCell className="align-middle ps-6">
                  <span className="font-medium text-foreground">{td(item.actor)}</span>
                </TableCell>
                <TableCell className="align-middle text-foreground">
                  {td(item.action)}
                </TableCell>
                <TableCell className="align-middle">
                  <Badge
                    variant={CATEGORY_VARIANT[item.category]}
                    className="uppercase tracking-wide"
                  >
                    {t("history.category." + CATEGORY_LABEL[item.category])}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap pe-6 align-middle">
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-medium text-foreground">
                      {fmtDate(item.date)}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {item.time}
                    </span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
