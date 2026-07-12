"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Info, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadCsv } from "@/lib/export-csv";
import { toast } from "@/components/ui/toaster";
import { useLocale, useT, useTD } from "@/components/providers/locale-provider";
import type { DashboardHeader, StatCard } from "@/features/dashboard/types";

export function PageHeader({
  header,
  stats,
}: {
  header: DashboardHeader;
  stats: StatCard[];
}) {
  const t = useT();
  const td = useTD();
  const { locale } = useLocale();
  const router = useRouter();
  const [testMode, setTestMode] = React.useState(false);

  // Live "updated …" freshness. Both timestamps are client-only (never set
  // during SSR, so no hydration mismatch): `since` marks the last data load and
  // `now` re-samples every 15s so the relative label recomputes. Holding the
  // clock in state — rather than reading Date.now() during render — keeps render
  // pure and makes `now` the memo's real dependency.
  const [since, setSince] = React.useState<number | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    const start = Date.now();
    /* eslint-disable react-hooks/set-state-in-effect -- client-only mount timestamp; setting it during SSR would desync the server/client markup */
    setSince(start);
    setNow(start);
    /* eslint-enable react-hooks/set-state-in-effect */
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const updatedLabel = React.useMemo(() => {
    if (since == null || now == null) return null;
    const secs = Math.max(0, Math.round((now - since) / 1000));
    if (secs < 45) return t("dashboard.updatedJustNow");
    const mins = Math.round(secs / 60);
    const rel = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
      numeric: "always",
    }).format(-mins, "minute");
    return t("dashboard.updated", { rel });
  }, [since, now, locale, t]);

  const refresh = () => {
    router.refresh();
    const start = Date.now();
    setSince(start);
    setNow(start);
    toast(t("dashboard.toast.refreshed"), "info");
  };

  const exportReport = () => {
    downloadCsv(
      t("dashboard.exportFilename"),
      [
        { header: t("dashboard.exportCol.metric"), value: (s) => s.label },
        {
          header: t("dashboard.exportCol.value"),
          value: (s) => (s.total !== undefined ? `${s.value} / ${s.total}` : s.value),
        },
      ],
      stats,
    );
    toast(t("dashboard.toast.exported"));
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {td(header.title)}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className="size-2 rounded-full bg-status-normal"
            data-live={header.live}
            aria-hidden
          />
          {t("dashboard.header.reporting", { online: header.online, total: header.total })}
        </p>
      </div>

      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-3">
          {/* Data freshness + manual refresh (router.refresh re-runs the fetch). */}
          <div className="flex items-center gap-1">
            {updatedLabel ? (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {updatedLabel}
              </span>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 border border-border"
                  onClick={refresh}
                  aria-label={t("dashboard.refresh")}
                >
                  <RotateCw className="size-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("dashboard.refresh")}</TooltipContent>
            </Tooltip>
          </div>

          <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium">
            {t("common.testMode")}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="grid place-items-center rounded-full text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("dashboard.testModeInfo")}
                >
                  <Info className="size-3.5" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-56">
                {t("dashboard.testModeInfo")}
              </TooltipContent>
            </Tooltip>
            <Switch
              checked={testMode}
              onCheckedChange={(v) => {
                setTestMode(v);
                toast(
                  v ? t("dashboard.toast.testOn") : t("dashboard.toast.testOff"),
                  "info",
                );
              }}
              aria-label={t("dashboard.testModeAria")}
            />
          </label>
          <Button onClick={exportReport}>
            <Download className="size-4" />
            {t("common.exportReport")}
          </Button>
        </div>
      </TooltipProvider>
    </div>
  );
}
