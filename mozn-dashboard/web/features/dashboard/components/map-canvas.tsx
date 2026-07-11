"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Layers, MapPin, MapPinOff, Minus, Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/common/empty-state";
import type { MapStation } from "@/features/dashboard/types";
import { STATION_STATUS } from "../lib/status";

import type { LeafletLibyaMapHandle } from "@/components/maps/leaflet-libya-map";
import type { MapTheme, PinKind } from "@/components/maps/leaflet-config";
import { MapControlButton } from "@/components/maps/map-control-button";
import { StationSummaryCard } from "@/components/station-detail/station-summary-card";
import { detailFromMapStation } from "@/components/station-detail/station-detail";

// Leaflet touches `window` on import, so the map is client-only.
const LeafletLibyaMap = dynamic(
  () =>
    import("@/components/maps/leaflet-libya-map").then((m) => m.LeafletLibyaMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-secondary/50 text-sm text-muted-foreground">
        …
      </div>
    ),
  },
);

export function MapCanvas({ stations }: { stations: MapStation[] }) {
  const t = useT();
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";

  const mapRef = React.useRef<LeafletLibyaMapHandle>(null);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  // Default to dots only — station names overlap at the country zoom; the
  // toolbar toggles labels on, and a selected pin always shows its label.
  const [showLabels, setShowLabels] = React.useState(false);

  // Localised word per pin kind. The three health statuses double as the
  // legend key; the three severity tiers (yellow/orange/red) colour alerting
  // pins, matching the public map's hazard vocabulary.
  const pinLabels = React.useMemo<Record<PinKind, string>>(
    () => ({
      online: t("status.online"),
      warning: t("status.warning"),
      offline: t("status.offline"),
      yellow: t("pin.watch"),
      orange: t("pin.warning"),
      red: t("pin.severe"),
    }),
    [t],
  );

  const selectedStation = React.useMemo(
    () => stations.find((s) => s.id === selectedId),
    [stations, selectedId],
  );

  // Toggle selection: clicking the active pin clears it (flies back to overview).
  const handleSelectStation = React.useCallback((id: string) => {
    setSelectedId((current) => (current === id ? undefined : id));
  }, []);

  const clearSelection = React.useCallback(() => setSelectedId(undefined), []);

  return (
    <div className="relative isolate h-full min-h-[460px] w-full overflow-hidden bg-secondary/40">
      <LeafletLibyaMap
        ref={mapRef}
        stations={stations}
        selectedStationId={selectedId}
        showLabels={showLabels}
        theme={theme}
        pinLabels={pinLabels}
        locale={locale}
        onSelectStation={handleSelectStation}
      />

      {/* Zero-station note — the basemap still renders (no pins to plot). A
          soft scrim dims it so the centred card reads as an intentional empty
          state rather than a popup floating over the map. Sits below the
          controls/legend (z-[1000]) so those stay reachable. */}
      {stations.length === 0 ? (
        <div className="absolute inset-0 z-[900] grid place-items-center bg-background/55 px-4 backdrop-blur-[2px]">
          <div className="max-w-xs rounded-2xl border border-border bg-card shadow-card">
            <EmptyState
              icon={MapPinOff}
              title={t("dashboard.map.emptyTitle")}
              message={t("dashboard.map.emptyBody")}
            />
          </div>
        </div>
      ) : null}

      {/* Map controls — separate rounded buttons stacked at the top-start. */}
      <div className="absolute start-4 top-4 z-[1000] flex flex-col gap-2.5">
        <MapControlButton label={t("dashboard.map.zoomIn")} onClick={() => mapRef.current?.zoomIn()}>
          <Plus className="size-4" />
        </MapControlButton>
        <MapControlButton label={t("dashboard.map.zoomOut")} onClick={() => mapRef.current?.zoomOut()}>
          <Minus className="size-4" />
        </MapControlButton>
        <MapControlButton label={t("dashboard.map.reset")} onClick={() => mapRef.current?.recenter()}>
          <MapPin className="size-4" />
        </MapControlButton>
        <MapControlButton
          label={t("dashboard.map.toggleLabels")}
          active={showLabels}
          onClick={() => setShowLabels((v) => !v)}
        >
          <Layers className="size-4" />
        </MapControlButton>
      </div>

      {/* Status legend — floating chip at the bottom-start. */}
      <div className="pointer-events-none absolute bottom-4 start-4 z-[1000] flex items-center gap-4 rounded-xl border border-border bg-card/90 px-4 py-2.5 shadow-card backdrop-blur">
        {(["online", "warning", "offline"] as const).map((key) => (
          <span
            key={key}
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <span className={cn("size-2 rounded-full", STATION_STATUS[key].dotClass)} />
            {pinLabels[key]}
          </span>
        ))}
      </div>

      {/* Station summary panel — appears on the end side when a pin is selected,
          leaving the start-side controls and legend visible. */}
      {selectedStation ? (
        <div
          className={cn(
            "absolute inset-y-3 end-3 z-[1000] w-[400px] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-card",
            "animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
          )}
        >
          <StationSummaryCard
            detail={detailFromMapStation(selectedStation)}
            stationId={selectedStation.id}
            onClose={clearSelection}
          />
        </div>
      ) : null}
    </div>
  );
}
