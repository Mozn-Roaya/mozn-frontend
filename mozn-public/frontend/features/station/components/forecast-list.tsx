import * as React from "react";

import { SunIcon, CloudSunIcon, CloudRainIcon, type IconProps } from "@/components/icons";
import { cn } from "@/components/lib/cn";
import { getDict, type Dict, type Lang } from "@/components/lib/i18n";

import type { DailyForecast } from "@/components/api/types";

type Condition = "sunny" | "cloudy" | "rain" | "storms";

const conditionIcon: Record<Condition, React.ComponentType<IconProps>> = {
  sunny: SunIcon,
  cloudy: CloudSunIcon,
  rain: CloudRainIcon,
  storms: CloudRainIcon,
};

function deriveCondition(
  d: DailyForecast,
  t: Dict,
): {
  condition: Condition;
  label: string;
} {
  if (d.rain_total_mm >= 5) return { condition: "storms", label: t.condStorms };
  if (d.rain_total_mm > 0) return { condition: "rain", label: t.condRain };
  if (d.humidity_avg >= 65) return { condition: "cloudy", label: t.condCloudy };
  return { condition: "sunny", label: t.condSunny };
}

function formatDay(iso: string, isToday: boolean, t: Dict): string {
  if (isToday) return t.today;
  const d = new Date(iso);
  return t.daysShort[d.getUTCDay()];
}

const rangeGradient =
  "linear-gradient(90deg, #34d164 0%, #73d340 35%, #ffd30a 70%, #ff8c00 100%)";

type ForecastListProps = {
  title?: string;
  subtitle?: string;
  days?: DailyForecast[];
  scaleMin?: number;
  scaleMax?: number;
  className?: string;
  lang?: Lang;
};

function DayRow({
  day,
  isToday,
  scaleMin,
  scaleMax,
  t,
}: {
  day: DailyForecast;
  isToday: boolean;
  scaleMin: number;
  scaleMax: number;
  t: Dict;
}) {
  const { condition, label } = deriveCondition(day, t);
  const Icon = conditionIcon[condition];
  const range = Math.max(1, scaleMax - scaleMin);
  const lowPct = ((day.temp_low_c - scaleMin) / range) * 100;
  const highPct = ((day.temp_high_c - scaleMin) / range) * 100;

  return (
    <div
      className={cn(
        "flex items-center gap-[8px] h-[48px] w-full",
        isToday && "rounded-[12px] bg-(--color-bg-secondary) px-[10px]",
      )}
    >
      <div className="flex flex-col gap-px w-[68px] shrink-0">
        <span
          className={cn(
            "text-body-sm text-(--color-text-primary)",
            isToday
              ? "font-semibold"
              : "font-medium",
          )}
        >
          {formatDay(day.day, isToday, t)}
        </span>
        <span className="text-body-xxs text-(--color-text-muted)">
          {label}
        </span>
      </div>
      <Icon size={20} className="shrink-0 text-(--color-text-secondary)" />
      <span className="shrink-0 w-[28px] text-end text-body-xs text-(--color-text-muted)">
        {Math.round(day.temp_low_c)}°
      </span>
      <div className="relative flex-1 min-w-[40px] h-[5px] rounded-[2.5px] bg-(--color-border-subtle)">
        <div
          className="absolute top-0 h-[5px] rounded-[2.5px]"
          style={{
            left: `${lowPct.toFixed(2)}%`,
            width: `${Math.max(0, highPct - lowPct).toFixed(2)}%`,
            backgroundImage: rangeGradient,
          }}
        />
      </div>
      <span className="shrink-0 w-[28px] text-end text-body-xs font-semibold text-(--color-text-primary)">
        {Math.round(day.temp_high_c)}°
      </span>
    </div>
  );
}

export function ForecastList({
  title,
  subtitle = "",
  days = [],
  scaleMin,
  scaleMax,
  className,
  lang = "en",
}: ForecastListProps) {
  const t = getDict(lang);
  const resolvedTitle = title ?? t.forecastTitle;
  // Derive a sensible scale from the forecast values themselves.
  const allTemps = days.flatMap((d) => [d.temp_low_c, d.temp_high_c]);
  const minResolved =
    scaleMin ?? (allTemps.length ? Math.min(...allTemps) - 2 : 0);
  const maxResolved =
    scaleMax ?? (allTemps.length ? Math.max(...allTemps) + 2 : 40);

  return (
    <div
      className={cn(
        "flex flex-col items-start w-full pt-[20px] pb-[16px] px-[20px] rounded-[16px]",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "shadow-card",
        className,
      )}
    >
      <div className="flex items-center w-full">
        <div className="flex flex-col gap-[2px]">
          <p className="text-heading-sm font-bold text-(--color-text-primary) m-0">
            {resolvedTitle}
          </p>
          {subtitle && (
            <p className="text-body-xs text-(--color-text-muted) m-0">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="h-[10px]" />
      {days.length === 0 && (
        <p className="px-2 py-4 text-body-sm text-(--color-text-muted)">
          {t.noForecast}
        </p>
      )}
      {days.map((d, idx) => (
        <React.Fragment key={d.day}>
          <DayRow
            day={d}
            isToday={idx === 0}
            scaleMin={minResolved}
            scaleMax={maxResolved}
            t={t}
          />
          {idx === 0 && <div className="h-[6px]" />}
          {idx < days.length - 1 && (
            <div className="h-px w-full bg-(--color-border-subtle)" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
