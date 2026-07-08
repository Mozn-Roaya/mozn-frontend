"use client";

import L, { type Map as LMap, type LayerGroup } from "leaflet";
import * as React from "react";

import libyaGeo from "../data/libya.geo.json";
import worldGeo from "../data/world-no-libya.geo.json";
import { useMapTheme } from "../hooks/use-map-theme";
import {
  FIT_PADDING_PX,
  FLY_DURATION_S,
  LIBYA_BOUNDS,
  MAP_MAX_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  STATION_ZOOM,
  ZOOM_STEP,
} from "../lib/bounds";
import { stationIconHtml } from "../lib/pin-html";
import {
  MASK_COLOR,
  MASK_OPACITY,
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  TILE_URL,
  paletteFor,
  readMapTheme,
} from "../lib/theme-style";

import type { LeafletLibyaMapHandle, MapTheme } from "../types";
import type { Station } from "@/components/api/types";
import type { Lang } from "@/components/lib/i18n";

type LeafletLibyaMapProps = {
  readonly stations: readonly Station[];
  readonly selectedStationId?: string;
  readonly showLabels: boolean;
  readonly lang?: Lang;
  readonly onSelectStation: (id: string) => void;
  readonly onZoomChange?: (zoom: number) => void;
};

const MAP_OPTIONS: L.MapOptions = {
  zoomControl: false,
  attributionControl: false,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  maxBoundsViscosity: 0.85,
  worldCopyJump: false,
  zoomSnap: 0.25,
  zoomDelta: ZOOM_STEP,
  wheelPxPerZoomLevel: 80,
};

const FIT_BOUNDS_OPTIONS: L.FitBoundsOptions = {
  padding: [FIT_PADDING_PX, FIT_PADDING_PX],
};

const FLY_OPTIONS = { duration: FLY_DURATION_S } as const;

const WORLD_FEATURE = worldGeo as GeoJSON.FeatureCollection;
const LIBYA_FEATURE = libyaGeo as GeoJSON.FeatureCollection;

function isModifiedClick(event: MouseEvent | undefined): boolean {
  if (!event) return false;
  return (
    event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0
  );
}

export const LeafletLibyaMap = React.forwardRef<
  LeafletLibyaMapHandle,
  LeafletLibyaMapProps
>(function LeafletLibyaMap(
  { stations, selectedStationId, showLabels, lang = "en", onSelectStation, onZoomChange },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LMap | null>(null);
  const markerLayerRef = React.useRef<LayerGroup | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const worldLayerRef = React.useRef<L.GeoJSON | null>(null);
  const libyaLayerRef = React.useRef<L.GeoJSON | null>(null);
  const onSelectRef = React.useRef(onSelectStation);
  const onZoomRef = React.useRef(onZoomChange);

  // Keep handler refs current so the click listener doesn't need to be
  // rebound every render.
  React.useEffect(() => {
    onSelectRef.current = onSelectStation;
  }, [onSelectStation]);
  React.useEffect(() => {
    onZoomRef.current = onZoomChange;
  }, [onZoomChange]);

  // Map init — runs once. In React strict mode (dev) the effect double-fires
  // by design; `isMounted` lets us short-circuit anything that would call
  // back into the parent after teardown started.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    // Fast Refresh (dev) can re-run this module while a previous Leaflet map is
    // still bound to the same DOM node — its cleanup didn't run. Left as-is,
    // `L.map()` throws "already initialized" (→ full reload) and two maps stack
    // ("pins copied twice"). Reset the node so re-init is clean. No-op in prod.
    const bound = container as unknown as { _leaflet_id?: number };
    if (bound._leaflet_id != null) {
      container.replaceChildren();
      delete bound._leaflet_id;
    }
    let isMounted = true;

    const initialTheme = readMapTheme();
    const palette = paletteFor(initialTheme);

    const map = L.map(container, {
      ...MAP_OPTIONS,
      maxBounds: L.latLngBounds(MAP_MAX_BOUNDS),
    });
    map.fitBounds(LIBYA_BOUNDS, FIT_BOUNDS_OPTIONS);

    tileLayerRef.current = L.tileLayer(TILE_URL[initialTheme], {
      attribution: TILE_ATTRIBUTION,
      subdomains: TILE_SUBDOMAINS,
      maxZoom: MAX_ZOOM,
      crossOrigin: true,
    }).addTo(map);

    // Opaque scrim over every other country so only Libya's basemap reads.
    worldLayerRef.current = L.geoJSON(WORLD_FEATURE, {
      style: {
        stroke: false,
        interactive: false,
        fillColor: MASK_COLOR[initialTheme],
        fillOpacity: MASK_OPACITY,
      },
    }).addTo(map);

    libyaLayerRef.current = L.geoJSON(LIBYA_FEATURE, {
      style: {
        stroke: true,
        weight: 0.8,
        interactive: false,
        color: palette.libya.stroke,
        fillColor: palette.libya.fillColor,
        fillOpacity: palette.libya.fillOpacity,
      },
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const emitZoom = () => {
      if (!isMounted) return;
      onZoomRef.current?.(map.getZoom());
    };
    emitZoom();
    map.on("zoomend", emitZoom);

    return () => {
      isMounted = false;
      map.off("zoomend", emitZoom);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      tileLayerRef.current = null;
      worldLayerRef.current = null;
      libyaLayerRef.current = null;
    };
  }, []);

  // Theme reactivity — extracted into useMapTheme so the listener glue
  // (custom event + MutationObserver) lives outside this component.
  useMapTheme(
    React.useCallback((theme: MapTheme) => {
      const palette = paletteFor(theme);
      tileLayerRef.current?.setUrl(TILE_URL[theme]);
      worldLayerRef.current?.setStyle({
        stroke: false,
        fillColor: MASK_COLOR[theme],
        fillOpacity: MASK_OPACITY,
      });
      libyaLayerRef.current?.setStyle({
        color: palette.libya.stroke,
        fillColor: palette.libya.fillColor,
        fillOpacity: palette.libya.fillOpacity,
      });
    }, []),
  );

  // (Re)render station markers when their data, selection, or label visibility changes.
  React.useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    stations.forEach((station) => {
      const isSelected = station.id === selectedStationId;
      const showLabel = showLabels || isSelected;
      const icon = L.divIcon({
        className: "mz-pin-marker",
        html: stationIconHtml(station, { selected: isSelected, showLabel, lang }),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([station.latitude, station.longitude], {
        icon,
        keyboard: false,
        riseOnHover: true,
        bubblingMouseEvents: false,
        interactive: true,
      });
      marker.on("click", (event) => {
        // Modified click (ctrl/cmd/shift/middle) falls through to the
        // anchor's href so the station can open in a new tab.
        if (isModifiedClick(event.originalEvent)) return;
        event.originalEvent?.preventDefault();
        onSelectRef.current(station.id);
      });
      marker.addTo(layer);
    });
  }, [stations, selectedStationId, showLabels, lang]);

  // Camera reacts to selection: fly to the station or back to overview.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedStationId) {
      map.flyToBounds(LIBYA_BOUNDS, {
        ...FIT_BOUNDS_OPTIONS,
        ...FLY_OPTIONS,
      });
      return;
    }
    const target = stations.find((s) => s.id === selectedStationId);
    if (!target) return;
    map.flyTo([target.latitude, target.longitude], STATION_ZOOM, FLY_OPTIONS);
  }, [selectedStationId, stations]);

  React.useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(ZOOM_STEP),
      zoomOut: () => mapRef.current?.zoomOut(ZOOM_STEP),
      recenter: () => {
        const map = mapRef.current;
        if (!map) return;
        const selected = selectedStationId
          ? stations.find((s) => s.id === selectedStationId)
          : undefined;
        if (selected) {
          map.flyTo(
            [selected.latitude, selected.longitude],
            STATION_ZOOM,
            FLY_OPTIONS,
          );
          return;
        }
        map.flyToBounds(LIBYA_BOUNDS, {
          ...FIT_BOUNDS_OPTIONS,
          ...FLY_OPTIONS,
        });
      },
      flyToBounds: (points) => {
        const map = mapRef.current;
        if (!map || points.length === 0) return;
        const bounds = L.latLngBounds(
          points.map(([lat, lng]) => L.latLng(lat, lng)),
        );
        map.flyToBounds(bounds, { ...FIT_BOUNDS_OPTIONS, ...FLY_OPTIONS });
      },
    }),
    [selectedStationId, stations],
  );

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
});

export default LeafletLibyaMap;
