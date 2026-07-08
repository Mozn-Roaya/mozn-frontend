import Link from "next/link";
import * as React from "react";

import { MapPinIcon, ShareIcon, XIcon } from "@/components/icons";
import { cn } from "@/components/lib/cn";
import { getDict, stationName, type Lang } from "@/components/lib/i18n";

import type { Station } from "@/components/api/types";

type StationHeaderProps = {
  station: Station;
  className?: string;
  lang?: Lang;
};

export function StationHeader({ station, className, lang = "en" }: StationHeaderProps) {
  const t = getDict(lang);
  const name = stationName(station, lang);
  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      <div className="flex flex-1 min-w-px flex-col gap-[2px]">
        <div className="flex items-center gap-[8px]">
          <MapPinIcon size={16} className="text-(--color-text-muted)" />
          <span className="text-body-sm font-medium text-(--color-text-muted) whitespace-nowrap">
            {t.stationLabel}
          </span>
        </div>
        <p className="text-heading-xl font-bold text-(--color-text-primary) truncate m-0">
          {name}
        </p>
        <p className="text-body-sm text-(--color-text-muted) whitespace-nowrap m-0">
          {station.wu_station_id}
        </p>
      </div>
      <div className="flex items-center gap-[14px]">
        <button
          type="button"
          aria-label={t.shareStationAria}
          className="text-(--color-text-secondary) hover:text-(--color-text-primary)"
        >
          <ShareIcon size={18} />
        </button>
        <Link
          href="/"
          aria-label={t.closeStationAria}
          className="text-(--color-text-secondary) hover:text-(--color-text-primary)"
        >
          <XIcon size={18} />
        </Link>
      </div>
    </div>
  );
}
