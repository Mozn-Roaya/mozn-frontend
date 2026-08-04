"use client";

import * as React from "react";

import { cn } from "@/components/lib/cn";
import { useT } from "@/components/state/lang-context";
import { IconButton } from "@/components/ui/icon-button";

type MapControlsProps = {
  readonly showLabels: boolean;
  readonly hideOnMobile: boolean;
  readonly isLocating: boolean;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onToggleLabels: () => void;
  readonly onLocate: () => void;
};

/**
 * Floating stack of map control buttons (zoom in / out, label toggle, and
 * "Stations near me"). Side-effect-free — all interactions are passed in as
 * `on*` props. `geolocationSupported` resolves once on mount to avoid an
 * SSR/CSR mismatch on the `disabled` attribute.
 *
 * There is no recenter/reset-view button: the camera already follows selection
 * on its own (see the selection effect in `leaflet-libya-map.tsx`), so the
 * control was redundant.
 */
export function MapControls({
  showLabels,
  hideOnMobile,
  isLocating,
  onZoomIn,
  onZoomOut,
  onToggleLabels,
  onLocate,
}: MapControlsProps) {
  const t = useT();
  const [geolocationSupported, setGeolocationSupported] = React.useState(false);
  React.useEffect(() => {
    setGeolocationSupported(
      typeof navigator !== "undefined" && "geolocation" in navigator,
    );
  }, []);

  return (
    <div
      className={cn(
        "absolute start-[16px] md:start-[24px] lg:start-[80px] top-[96px] md:top-[120px] lg:top-[160px] z-[1000] flex flex-col gap-[8px]",
        hideOnMobile && "hidden lg:flex",
      )}
    >
      <IconButton icon="plus" label={t.zoomIn} onClick={onZoomIn} />
      <IconButton icon="minus" label={t.zoomOut} onClick={onZoomOut} />
      <IconButton
        icon="layers"
        label={showLabels ? t.hideLabels : t.showLabels}
        // QA: aria-pressed must reflect the real toggle state (labels on).
        aria-pressed={showLabels}
        onClick={onToggleLabels}
        className={cn(!showLabels && "bg-(--color-bg-secondary)")}
      />
      <IconButton
        icon="locate-fixed"
        label={isLocating ? t.locating : t.stationsNearMe}
        onClick={onLocate}
        disabled={isLocating || !geolocationSupported}
        className={cn(isLocating && "animate-pulse")}
      />
    </div>
  );
}
