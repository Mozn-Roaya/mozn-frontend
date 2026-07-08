import * as React from "react";

import { cn } from "@/components/lib/cn";
import { getDict, stationName, type Lang } from "@/components/lib/i18n";

import { StationHeader } from "./station-header";
import { StationTabs } from "./station-tabs";

import type { Station } from "@/components/api/types";

type StationSidePanelProps = {
  station: Station;
  children: React.ReactNode;
  className?: string;
  lang?: Lang;
};

export function StationSidePanel({
  station,
  children,
  className,
  lang = "en",
}: StationSidePanelProps) {
  const t = getDict(lang);
  const name = stationName(station, lang);
  return (
    <aside
      className={cn(
        "z-20 flex flex-col bg-(--color-bg-primary) shadow-sheet lg:shadow-card",
        "fixed inset-x-0 bottom-0 max-h-[80vh] rounded-t-[24px]",
        "lg:static lg:inset-auto lg:rounded-none lg:max-h-none lg:w-[416px] lg:h-full",
        className,
      )}
      aria-label={t.detailsAria(name)}
    >
      <div className="lg:hidden flex justify-center pt-[8px] pb-[4px]">
        <span className="h-[4px] w-[36px] rounded-full bg-(--color-border-default)" />
      </div>

      <div className="px-[16px] md:px-[24px] pt-[16px] lg:pt-[24px]">
        <StationHeader station={station} lang={lang} />
      </div>

      <div className="px-[16px] md:px-[24px] pt-[12px]">
        <StationTabs stationId={station.id} />
      </div>

      <div className="flex-1 overflow-y-auto px-[16px] md:px-[24px] pt-[16px] pb-[24px]">
        {children}
      </div>
    </aside>
  );
}
