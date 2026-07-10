"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { listNearestStations } from "@/components/api/stations";
import { cn } from "@/components/lib/cn";
import { stationName } from "@/components/lib/i18n";
import { useLang, useT } from "@/components/state/lang-context";
import { useStations } from "@/components/state/stations-context";

import { MapControls } from "./map-controls";
import { MapPinLegend } from "./map-pin-legend";
import { MapStatusPill } from "./map-status-pill";

import type { LeafletLibyaMapHandle } from "../types";
import type { Station } from "@/components/api/types";

type MapCanvasProps = {
  readonly className?: string;
};

const STATION_PATH_REGEX = /^\/stations\/([^/]+)/;

const LeafletLibyaMap = dynamic(
  () => import("./leaflet-libya-map").then((m) => m.LeafletLibyaMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-(--color-bg-canvas) text-body-sm text-(--color-text-muted)" />
    ),
  },
);

function selectedIdFromPath(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(STATION_PATH_REGEX);
  if (!match?.[1]) return undefined;
  return decodeURIComponent(match[1]);
}

function findStation(
  stations: readonly Station[],
  id: string | undefined,
): Station | undefined {
  if (!id) return undefined;
  return stations.find((s) => s.id === id);
}

export function MapCanvas({ className }: MapCanvasProps) {
  const pathname = usePathname();
  const router = useRouter();
  const stations = useStations();
  const t = useT();
  const lang = useLang();

  const selectedStationId = selectedIdFromPath(pathname);
  const selectedStation = React.useMemo(
    () => findStation(stations, selectedStationId),
    [stations, selectedStationId],
  );

  const mapRef = React.useRef<LeafletLibyaMapHandle>(null);
  // Default to dots only — station names overlap heavily at the country zoom.
  // The map control toggles labels on; a selected pin always shows its label.
  const [showLabels, setShowLabels] = React.useState(false);
  const [zoom, setZoom] = React.useState<number | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  const handleSelectStation = React.useCallback(
    (id: string) => {
      router.push(`/stations/${encodeURIComponent(id)}`);
    },
    [router],
  );

  const handleZoomIn = React.useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);
  const handleZoomOut = React.useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);
  const handleRecenter = React.useCallback(() => {
    mapRef.current?.recenter();
  }, []);
  const handleToggleLabels = React.useCallback(() => {
    setShowLabels((v) => !v);
  }, []);

  // "Stations near me" — geolocates the user, asks the backend for the 5
  // nearest stations by great-circle distance, then flies the camera to fit
  // them. Intentionally silent on permission denial / timeout: the button
  // returns to idle and a `console.warn` records the reason. No toast system
  // exists in the app today and a button for this single feature isn't
  // worth installing one.
  const handleLocate = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nearest = await listNearestStations(
            position.coords.latitude,
            position.coords.longitude,
            5,
          );
          if (nearest.length > 0) {
            mapRef.current?.flyToBounds(
              nearest.map((s) => [s.latitude, s.longitude] as const),
            );
          } else {
            console.warn("[locate] no nearby stations returned");
          }
        } catch (err) {
          console.warn("[locate] nearest-stations fetch failed:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("[locate] geolocation error:", err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );
  }, []);

  const recenterLabel = selectedStation
    ? t.recenterOn(stationName(selectedStation, lang))
    : t.resetView;

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden bg-(--color-bg-canvas)",
        className,
      )}
    >
      <LeafletLibyaMap
        ref={mapRef}
        stations={stations}
        selectedStationId={selectedStationId}
        showLabels={showLabels}
        lang={lang}
        onSelectStation={handleSelectStation}
        onZoomChange={setZoom}
      />

      <MapControls
        showLabels={showLabels}
        recenterLabel={recenterLabel}
        hideOnMobile={Boolean(selectedStation)}
        isLocating={isLocating}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        onToggleLabels={handleToggleLabels}
        onLocate={handleLocate}
      />

      <div
        className={cn(
          "absolute start-[16px] md:start-[24px] lg:start-[80px] bottom-[16px] md:bottom-[24px] lg:bottom-[40px] z-[1000]",
          selectedStation && "hidden lg:block",
        )}
      >
        <MapPinLegend />
      </div>

      <MapStatusPill
        stationCount={stations.length}
        zoom={zoom}
        hideOnMobile={Boolean(selectedStation)}
      />
    </div>
  );
}
