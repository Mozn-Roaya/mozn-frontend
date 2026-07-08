"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * Build a compact page window with ellipses, e.g. [1, "…", 4, 5, 6, "…", 12].
 * Always keeps the first and last page visible plus a neighbourhood of the
 * current page, so the pager stays a fixed, predictable width.
 */
function pageWindow(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(count - 1, current + 1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < count - 1) out.push("…");
  out.push(count);
  return out;
}

/**
 * Shared table footer: page-size selector + result count on the leading edge,
 * page navigation on the trailing edge. Used under every data table so
 * pagination looks and behaves identically across the system.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  /** Total number of rows across all pages (post-filter). */
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { t, locale } = useLocale();
  const rtl = locale === "ar";

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const pages = pageWindow(current, pageCount);

  // In RTL the "previous" control points right and "next" points left.
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Page size + result count */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{t("common.show")}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger
            aria-label={t("common.show")}
            className="h-9 w-auto min-w-0 gap-1.5 px-2.5 font-medium text-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          {/* Footer sits at the bottom of the page — open upward so the list
              isn't crushed against the viewport edge. */}
          <SelectContent side="top">
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {t("common.ofResults", { total })}
        </span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label={t("common.prevPage")}
        >
          <PrevIcon className="size-4" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === current ? "default" : "ghost"}
              size="icon"
              className={cn(
                "size-9 tabular-nums",
                p !== current && "text-muted-foreground",
              )}
              onClick={() => onPageChange(p)}
              aria-label={t("common.gotoPage", { n: p })}
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pageCount}
          aria-label={t("common.nextPage")}
        >
          <NextIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
