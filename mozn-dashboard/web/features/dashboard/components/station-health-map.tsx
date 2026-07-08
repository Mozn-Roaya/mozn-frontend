"use client";

import { Card } from "@/components/ui/card";
import type { StationHealthMap as StationHealthMapData } from "@/features/dashboard/types";
import { MapCanvas } from "./map-canvas";

/**
 * Full-bleed station map. The title, legend and coverage note float on top of
 * the map (rendered inside MapCanvas) instead of a card header/footer, so the
 * map fills the whole card.
 */
export function StationHealthMap({ map }: { map: StationHealthMapData }) {
  return (
    <Card className="relative min-h-[460px] overflow-hidden p-0">
      <MapCanvas stations={map.stations} />
    </Card>
  );
}
