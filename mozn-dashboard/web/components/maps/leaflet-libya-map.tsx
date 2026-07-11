"use client";

import L, { type Map as LMap, type LayerGroup } from "leaflet";
import * as React from "react";

import type { MapStation } from "@/types/dashboard";

import libyaGeo from "./data/libya.geo.json";
import worldGeo from "./data/world-no-libya.geo.json";
import {
  FIT_PADDING_PX,
  FLY_DURATION_S,
  LIBYA_BOUNDS,
  MAP_MAX_BOUNDS,
  MASK_COLOR,
  MASK_OPACITY,
  MAX_ZOOM,
  MIN_ZOOM,
  STATION_ZOOM,
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  TILE_URL,
  ZOOM_STEP,
  paletteFor,
  readMapTheme,
  stationIconHtml,
  type MapTheme,
  type PinKind,
} from "./leaflet-config";

export type LeafletLibyaMapHandle = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly recenter: () => void;
};

type LeafletLibyaMapProps = {
  readonly stations: readonly MapStation[];
  readonly selectedStationId?: string;
  readonly showLabels: boolean;
  readonly theme: MapTheme;
  /** Localised hazard/status word per pin kind, used for pin labels + aria. */
  readonly pinLabels: Readonly<Record<PinKind, string>>;
  /** Active locale so pin labels use the Arabic station name in 'ar'. */
  readonly locale?: string;
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

export const LeafletLibyaMap = React.forwardRef<
  LeafletLibyaMapHandle,
  LeafletLibyaMapProps
>(function LeafletLibyaMap(
  {
    stations,
    selectedStationId,
    showLabels,
    theme,
    pinLabels,
    locale,
    onSelectStation,
    onZoomChange,
  },
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
  const pinLabelsRef = React.useRef(pinLabels);

  // Keep handler/data refs current so listeners and marker builders don't need
  // to be rebound every render.
  React.useEffect(() => {
    onSelectRef.current = onSelectStation;
  }, [onSelectStation]);
  React.useEffect(() => {
    onZoomRef.current = onZoomChange;
  }, [onZoomChange]);
  React.useEffect(() => {
    pinLabelsRef.current = pinLabels;
  }, [pinLabels]);

  // Map init — runs once. In React strict mode (dev) the effect double-fires by
  // design; `isMounted` short-circuits anything that calls back after teardown.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
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

    // Opaque mask over every other country — Libya-only, like the location picker.
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

  // Theme reactivity — driven by the `theme` prop (next-themes). Swaps the tile
  // URL and re-styles the GeoJSON layers; globals.css fades the transition.
  React.useEffect(() => {
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
  }, [theme]);

  // (Re)render station markers when data, selection, or label visibility change.
  React.useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    stations.forEach((station) => {
      const isSelected = station.id === selectedStationId;
      const showLabel = showLabels || isSelected;
      const icon = L.divIcon({
        className: "mz-pin-marker",
        html: stationIconHtml(station, {
          selected: isSelected,
          showLabel,
          pinLabels: pinLabelsRef.current,
          locale,
        }),
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
      marker.on("click", () => onSelectRef.current(station.id));
      marker.addTo(layer);
    });
  }, [stations, selectedStationId, showLabels, locale]);

  // Latest stations in a ref so the camera effect can read coordinates WITHOUT
  // depending on `stations`. Depending on it re-flew the camera on every
  // SSE/router.refresh() (which hands down a new array reference), discarding the
  // user's manual pan/zoom. Marker rendering above still reacts to `stations`.
  const stationsRef = React.useRef(stations);
  // Update the ref in an effect (not during render — react-hooks/refs) so the
  // camera effect below reads the latest coordinates without depending on it.
  React.useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  // Camera reacts to SELECTION only: fly to the station or back to the overview.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedStationId) {
      map.flyToBounds(LIBYA_BOUNDS, { ...FIT_BOUNDS_OPTIONS, ...FLY_OPTIONS });
      return;
    }
    const target = stationsRef.current.find((s) => s.id === selectedStationId);
    if (!target) return;
    map.flyTo([target.latitude, target.longitude], STATION_ZOOM, FLY_OPTIONS);
  }, [selectedStationId]);

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
        map.flyToBounds(LIBYA_BOUNDS, { ...FIT_BOUNDS_OPTIONS, ...FLY_OPTIONS });
      },
    }),
    [selectedStationId, stations],
  );

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
});

export default LeafletLibyaMap;
