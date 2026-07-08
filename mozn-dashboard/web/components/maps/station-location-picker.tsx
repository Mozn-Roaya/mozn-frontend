"use client";

import L, { type Map as LMap, type Marker } from "leaflet";
import { MapPin, Minus, Plus } from "lucide-react";
import * as React from "react";

import { useT } from "@/components/providers/locale-provider";
import libyaGeo from "./data/libya.geo.json";
import worldGeo from "./data/world-no-libya.geo.json";
import { MapControlButton } from "./map-control-button";
import {
  MAP_MAX_BOUNDS,
  MASK_COLOR,
  MASK_OPACITY,
  MAX_ZOOM,
  MIN_ZOOM,
  paletteFor,
  readMapTheme,
  TILE_ATTRIBUTION,
  TILE_SUBDOMAINS,
  TILE_URL,
  ZOOM_STEP,
  type MapTheme,
} from "./leaflet-config";

type Props = {
  /** Current position, if set. */
  lat?: number;
  lng?: number;
  theme: MapTheme;
  /** Fired when the user clicks the map or drags the pin. */
  onPick: (lat: number, lng: number) => void;
};

const WORLD_FEATURE = worldGeo as GeoJSON.FeatureCollection;
const LIBYA_FEATURE = libyaGeo as GeoJSON.FeatureCollection;
const PLACED_ZOOM = 8;

/** Tight framing on Libya's own extent so neighbours barely enter the frame. */
const FOCUS_BOUNDS: L.LatLngBoundsLiteral = [
  [18.8, 9.0],
  [33.9, 25.6],
];


// Self-contained placement pin (no labels) — green dot + halo + card-coloured ring.
const PIN_HTML = [
  '<span style="position:relative;display:block;width:24px;height:24px;">',
  '<span style="position:absolute;inset:0;border-radius:9999px;background:var(--status-normal);opacity:0.22;"></span>',
  '<span style="position:absolute;left:50%;top:50%;width:13px;height:13px;border-radius:9999px;transform:translate(-50%,-50%);background:var(--status-normal);box-shadow:0 0 0 2px var(--card),0 1px 3px rgba(0,0,0,.25);"></span>',
  "</span>",
].join("");

function makeIcon() {
  return L.divIcon({
    className: "mz-pick-pin",
    html: PIN_HTML,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function StationLocationPicker({ lat, lng, theme, onPick }: Props) {
  const t = useT();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LMap | null>(null);
  const markerRef = React.useRef<Marker | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const worldLayerRef = React.useRef<L.GeoJSON | null>(null);
  const libyaLayerRef = React.useRef<L.GeoJSON | null>(null);
  const onPickRef = React.useRef(onPick);

  React.useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const placeMarker = React.useCallback((map: LMap, position: L.LatLngExpression) => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      return;
    }
    const marker = L.marker(position, { icon: makeIcon(), draggable: true, autoPan: true });
    marker.on("dragend", () => {
      const ll = marker.getLatLng();
      onPickRef.current(ll.lat, ll.lng);
    });
    marker.addTo(map);
    markerRef.current = marker;
  }, []);

  // Init once.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const initialTheme = readMapTheme();
    const palette = paletteFor(initialTheme);

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: L.latLngBounds(MAP_MAX_BOUNDS),
      maxBoundsViscosity: 0.85,
      zoomSnap: 0.25,
      zoomDelta: ZOOM_STEP,
    });

    const hasPos = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
    if (hasPos) map.setView([lat!, lng!], PLACED_ZOOM);
    else map.fitBounds(FOCUS_BOUNDS, { padding: [8, 8] });

    tileLayerRef.current = L.tileLayer(TILE_URL[initialTheme], {
      attribution: TILE_ATTRIBUTION,
      subdomains: TILE_SUBDOMAINS,
      maxZoom: MAX_ZOOM,
      crossOrigin: true,
    }).addTo(map);

    // World layer is an opaque mask here (not a faint outline) — hides every
    // neighbouring country so only Libya's basemap is visible.
    worldLayerRef.current = L.geoJSON(WORLD_FEATURE, {
      style: { stroke: false, interactive: false, fillColor: MASK_COLOR[initialTheme], fillOpacity: MASK_OPACITY },
    }).addTo(map);
    libyaLayerRef.current = L.geoJSON(LIBYA_FEATURE, {
      style: { stroke: true, weight: 1, interactive: false, color: palette.libya.stroke, fillColor: palette.libya.fillColor, fillOpacity: palette.libya.fillOpacity },
    }).addTo(map);

    if (hasPos) placeMarker(map, [lat!, lng!]);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      worldLayerRef.current = null;
      libyaLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme reactivity.
  React.useEffect(() => {
    const palette = paletteFor(theme);
    tileLayerRef.current?.setUrl(TILE_URL[theme]);
    worldLayerRef.current?.setStyle({ stroke: false, fillColor: MASK_COLOR[theme], fillOpacity: MASK_OPACITY });
    libyaLayerRef.current?.setStyle({ color: palette.libya.stroke, fillColor: palette.libya.fillColor, fillOpacity: palette.libya.fillOpacity });
  }, [theme]);

  // Reflect external lat/lng changes (typing in the inputs) onto the map.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasPos = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
    if (!hasPos) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    placeMarker(map, [lat!, lng!]);
    map.panTo([lat!, lng!], { animate: true });
  }, [lat, lng, placeMarker]);

  const handleZoomIn = React.useCallback(
    () => mapRef.current?.zoomIn(ZOOM_STEP),
    [],
  );
  const handleZoomOut = React.useCallback(
    () => mapRef.current?.zoomOut(ZOOM_STEP),
    [],
  );
  const handleRecenter = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      map.setView(markerRef.current.getLatLng(), PLACED_ZOOM);
    } else {
      map.fitBounds(FOCUS_BOUNDS, { padding: [8, 8] });
    }
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {/* Styled map controls, matching the dashboard Station Health Map. */}
      <div className="absolute start-4 top-4 z-[1000] flex flex-col gap-2.5">
        <MapControlButton label={t("dashboard.map.zoomIn")} onClick={handleZoomIn}>
          <Plus className="size-4" />
        </MapControlButton>
        <MapControlButton label={t("dashboard.map.zoomOut")} onClick={handleZoomOut}>
          <Minus className="size-4" />
        </MapControlButton>
        <MapControlButton label={t("dashboard.map.reset")} onClick={handleRecenter}>
          <MapPin className="size-4" />
        </MapControlButton>
      </div>
    </>
  );
}

export default StationLocationPicker;
