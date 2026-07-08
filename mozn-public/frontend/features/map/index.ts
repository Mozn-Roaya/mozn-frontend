// Public surface of the map feature.
//
// `LeafletLibyaMap` is intentionally NOT re-exported here: it imports the
// `leaflet` runtime which touches `window` at module load and blows up under
// SSR. The only legitimate consumer is `MapCanvas`, which loads it via
// `next/dynamic` from the component path directly. If you need it elsewhere,
// you need a dynamic import too.
export { LibyaMap } from "./components/libya-map";
export { MapCanvas } from "./components/map-canvas";
export { MapPin } from "./components/map-pin";
export { MapPinLabel } from "./components/map-pin-label";
export { MapPinLegend } from "./components/map-pin-legend";
export { MapPinStation } from "./components/map-pin-station";
export {
  SEVERITY_COLOR,
  STATUS_COLOR,
  hazardFor,
  pinColorFor,
  pinKindFor,
} from "./lib/pin-status";
export type { PinKind } from "./lib/pin-status";
export type { LeafletLibyaMapHandle, MapTheme } from "./types";
