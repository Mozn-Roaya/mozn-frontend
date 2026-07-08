"use client";

import * as React from "react";
import { Activity } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { StationStatusBadge } from "@/components/common/status-badges";
import { EmptyState } from "@/components/common/empty-state";
import { useLocale, useT } from "@/components/providers/locale-provider";
import type { StationRow } from "@/features/stations/types";

export function StationLiveView({
  row,
  onOpenChange,
}: {
  row: StationRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const rtl = locale === "ar";

  const name = row ? (rtl ? row.nameAr || row.name : row.name) : "";

  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={rtl ? "left" : "right"}
        className="w-full gap-0 bg-background p-0 sm:max-w-[560px]"
      >
        {row ? (
          <div className="flex h-full flex-col">
            <SheetTitle className="sr-only">{name}</SheetTitle>
            <SheetDescription className="sr-only">{t("stations.live.subtitle")}</SheetDescription>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("stations.live.title")}
                </p>
                <h2 className="mt-1 truncate text-xl font-bold tracking-tight" dir="auto">{name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("region." + row.region)}</p>
              </div>
              <StationStatusBadge status={row.status} />
            </div>

            {/* No hardware telemetry source is wired up yet. */}
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
              <EmptyState
                icon={Activity}
                title={t("stations.live.noTelemetryTitle")}
                message={t("stations.live.noTelemetry")}
              />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
