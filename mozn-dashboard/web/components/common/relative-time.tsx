"use client";

import * as React from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { relativeTime } from "@/lib/mappers";

/**
 * Locale-aware relative time ("7 h ago" / "قبل 7 ساعات") rendered on the client
 * from a raw ISO timestamp, so it re-localizes instantly when the language
 * changes — no server refetch. `suppressHydrationWarning` covers the rare case
 * where the server and client clocks land the value in different buckets.
 */
export function RelativeTime({ iso, className }: { iso?: string | null; className?: string }) {
  const { locale } = useLocale();
  return (
    <span className={className} suppressHydrationWarning>
      {relativeTime(iso, locale)}
    </span>
  );
}
