"use client";

import { cn } from "@/components/lib/cn";
import { useT } from "@/components/state/lang-context";

type MapStatusPillProps = {
  readonly stationCount: number;
  readonly zoom: number | null;
  readonly hideOnMobile: boolean;
};

/** Small "12 stations · Zoom 7.5" indicator pinned to the bottom (inline-end). */
export function MapStatusPill({
  stationCount,
  zoom,
  hideOnMobile,
}: MapStatusPillProps) {
  const t = useT();
  return (
    <div
      aria-live="polite"
      className={cn(
        "absolute end-[16px] md:end-[24px] lg:end-[80px] bottom-[16px] md:bottom-[24px] z-[1000] px-[12px] py-[4px] rounded-full bg-(--color-bg-primary) border border-solid border-(--color-border-subtle) text-body-xxs text-(--color-text-muted) pointer-events-none",
        hideOnMobile ? "hidden lg:inline-block" : "hidden md:inline-block",
      )}
    >
      {t.stationsCount(stationCount)}
      {zoom !== null ? ` · ${t.zoomLevel(zoom.toFixed(1))}` : ""}
    </div>
  );
}
