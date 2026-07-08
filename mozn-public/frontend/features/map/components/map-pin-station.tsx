import { cn } from "@/components/lib/cn";

import { MapPin } from "./map-pin";
import { MapPinLabel } from "./map-pin-label";

import type { PinKind } from "../lib/pin-status";

type MapPinStationProps = {
  readonly kind?: PinKind;
  readonly location?: string;
  readonly hazard?: string;
  readonly showLabel?: boolean;
  readonly className?: string;
};

export function MapPinStation({
  kind = "normal",
  location = "Location",
  hazard = "Hazard",
  showLabel = true,
  className,
}: MapPinStationProps) {
  return (
    <span className={cn("inline-flex items-center gap-[4px]", className)}>
      <MapPin kind={kind} />
      {showLabel && <MapPinLabel location={location} hazard={hazard} />}
    </span>
  );
}
