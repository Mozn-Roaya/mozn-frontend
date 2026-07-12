"use client";

import * as React from "react";

import { useT } from "@/components/providers/locale-provider";

/**
 * Standard page title block for inner admin screens: title + subtitle + actions.
 *
 * Client component so it translates on the client: pass `titleKey`/`subtitleKey`
 * (+ `subtitleVars` for interpolated data) and the heading re-renders instantly
 * when the language changes — no server round-trip. Plain `title`/`subtitle`
 * strings are still accepted for callers that already translate (client screens).
 */
export function PageHeading({
  title,
  subtitle,
  titleKey,
  subtitleKey,
  subtitleVars,
  children,
}: {
  title?: string;
  subtitle?: string;
  titleKey?: string;
  subtitleKey?: string;
  subtitleVars?: Record<string, string | number>;
  children?: React.ReactNode;
}) {
  const t = useT();
  const resolvedTitle = titleKey ? t(titleKey) : title ?? "";
  const resolvedSubtitle = subtitleKey ? t(subtitleKey, subtitleVars) : subtitle;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{resolvedTitle}</h1>
        {resolvedSubtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{resolvedSubtitle}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
