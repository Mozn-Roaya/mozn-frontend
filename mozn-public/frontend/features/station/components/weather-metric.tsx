import * as React from "react";

import {
  CloudRainIcon,
  WindIcon,
  DropletIcon,
  GaugeIcon,
  type IconProps,
} from "@/components/icons";
import { cn } from "@/components/lib/cn";
import { getDict, type Lang } from "@/components/lib/i18n";

export type WeatherMetricType = "rainfall" | "wind" | "humidity" | "pressure";

const iconByType: Record<WeatherMetricType, React.ComponentType<IconProps>> = {
  rainfall: CloudRainIcon,
  wind: WindIcon,
  humidity: DropletIcon,
  pressure: GaugeIcon,
};

type CompassProps = {
  direction?: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  lang?: Lang;
};

const compassRotation: Record<NonNullable<CompassProps["direction"]>, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
};

function Compass({ direction = "N", lang = "en" }: CompassProps) {
  const rot = compassRotation[direction];
  const t = getDict(lang);
  return (
    <span
      className="relative inline-block size-[28px]"
      aria-label={t.windDirAria(t.cardinals[direction])}
    >
      <span className="absolute inset-0 rounded-full border border-solid border-(--color-border-default)" />
      {/* Figma node I414:101;410:40 — exact text container so the 7px label
          sits visually centered. `leading-[0]` on the wrapper kills the
          ascender/descender bias at small sizes; the inner span restores a
          normal line-box for the glyph itself. */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28px] h-[8.4px] flex flex-col justify-center text-center leading-[0] text-[7px] font-semibold text-(--color-status-normal-500)">
        <span className="leading-normal">{t.cardinalsShort[direction]}</span>
      </span>
      {/* Rotation layer fills the compass, so its rotate() pivots around the
          true compass center (50% 50% of 28×28). The dot sits at the top of
          this layer; rotating the layer carries the dot around the ring. */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <span className="absolute left-1/2 top-0 size-[5px] -translate-x-1/2 -translate-y-[1.75px] rounded-full bg-(--color-status-normal-500)" />
      </span>
    </span>
  );
}

type WeatherMetricProps = {
  type: WeatherMetricType;
  title: string;
  value: string | number;
  unit: string;
  description: string;
  direction?: CompassProps["direction"];
  className?: string;
  lang?: Lang;
};

export function WeatherMetric({
  type,
  title,
  value,
  unit,
  description,
  direction,
  className,
  lang = "en",
}: WeatherMetricProps) {
  const Icon = iconByType[type];
  const showCompass = type === "wind";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-[6px] w-full min-h-[104px] p-[14px] rounded-[16px]",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-[8px]">
        <Icon size={16} className="text-(--color-text-secondary)" />
        <span className="text-body-xs font-medium text-(--color-text-muted) whitespace-nowrap">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-[4px] whitespace-nowrap">
        <span className="text-heading-lg font-semibold text-(--color-text-primary)">
          {value}
        </span>
        <span className="text-body-xxs text-(--color-text-muted)">
          {unit}
        </span>
      </div>
      <p className="text-body-xxs text-(--color-text-muted) m-0 truncate">
        {description}
      </p>
      {showCompass && (
        <span className="absolute end-[13px] top-1/2 -translate-y-1/2">
          <Compass direction={direction ?? "N"} lang={lang} />
        </span>
      )}
    </div>
  );
}
