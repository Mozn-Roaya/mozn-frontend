import * as React from "react";

import { getDict, localeFor, type Lang } from "@/components/lib/i18n";

import { TemperatureCard } from "./temperature-card";
import { WeatherMetric } from "./weather-metric";
import {
  degToCardinal,
  humidityDescription,
  pressureDescription,
  rainDescription,
  windDescription,
} from "../lib/weather-summary";

import type { EstimatedConditions } from "@/components/api/open-meteo";
import type { DailyForecast, Station } from "@/components/api/types";

/**
 * The offline station panel, filled in.
 *
 * An offline station still sits at a known coordinate with knowable weather, so
 * rather than an empty "unavailable" card this shows approximate conditions for
 * that coordinate from an outside model (`getEstimatedConditions`) — clearly
 * marked, station-offline stated first.
 *
 * Disclosure is deliberately layered: the banner states it in a sentence, and
 * every value-bearing surface below carries its own "Estimated" badge, because
 * a single card is screenshot-able and shareable apart from the banner.
 *
 * Today's high/low still come from the Mozn daily forecast (which is
 * model-generated and works while offline), keeping that row identical to an
 * online station's panel.
 */

function formatLastSeen(iso: string | undefined, lang: Lang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(localeFor(lang), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `observed_at` is Open-Meteo's local wall-clock stamp (`timezone=auto`), so it
 * carries no zone. Parsing it as-is would have the browser apply *its* zone;
 * showing just the time-of-day it already contains is both simpler and honest.
 */
function formatObserved(iso: string, lang: Lang): string | null {
  const timePart = iso.includes("T") ? iso.split("T")[1] : null;
  if (!timePart) return null;
  const [h, m] = timePart.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  // Fixed UTC date + timeZone:UTC so only the hour/minute survive formatting,
  // while still getting locale-correct 12/24-hour form and Arabic numerals.
  const d = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return d.toLocaleTimeString(localeFor(lang), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Metric tiles show an em dash for a value the source didn't provide. */
function metricValue(
  value: number | null,
  format: (n: number) => string | number,
): string | number {
  return value === null ? "—" : format(value);
}

export function StationEstimated({
  station,
  estimate,
  forecast,
  lang = "en",
}: {
  station: Station;
  estimate: EstimatedConditions;
  forecast: DailyForecast[];
  lang?: Lang;
}) {
  const t = getDict(lang);
  const lastSeen = formatLastSeen(station.last_seen_at, lang);
  const observed = formatObserved(estimate.observed_at, lang);
  const today = forecast[0];
  const windDir =
    estimate.wind_dir === null ? "N" : degToCardinal(estimate.wind_dir);

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <div className="flex w-full flex-col gap-[8px] rounded-[16px] border border-solid border-(--color-border-subtle) bg-(--color-bg-secondary) px-[16px] py-[14px]">
        <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[4px]">
          <span className="inline-flex items-center gap-[8px]">
            <span
              className="size-[8px] rounded-full"
              style={{ backgroundColor: "var(--color-status-offline-400)" }}
            />
            <span className="text-label-md font-semibold uppercase text-(--color-text-primary)">
              {t.offline}
            </span>
          </span>
          {lastSeen && (
            <span className="text-body-xs text-(--color-text-muted)">
              {t.lastSeen} {lastSeen}
            </span>
          )}
        </div>

        <p className="m-0 text-body-sm text-(--color-text-secondary)">
          {t.offlineEstimateNote}
        </p>

        {/* Open-Meteo's licence requires this credit wherever its data shows. */}
        <p className="m-0 text-body-xxs text-(--color-text-muted)">
          {t.estimateSource(observed ?? "—")}
        </p>
      </div>

      <TemperatureCard
        current={estimate.temp_c}
        feelsLike={estimate.feels_like_c}
        high={today?.temp_high_c ?? null}
        low={today?.temp_low_c ?? null}
        scaleMin={0}
        scaleMax={50}
        badge={t.estimatedBadge}
        lang={lang}
      />

      <div className="grid grid-cols-2 gap-[24px]">
        <WeatherMetric
          type="rainfall"
          title={t.rainfall}
          value={metricValue(estimate.rain_rate_mm, (n) => n.toFixed(1))}
          unit="mm/hr"
          description={
            estimate.rain_rate_mm === null
              ? t.noReading
              : rainDescription(
                  estimate.rain_rate_mm,
                  estimate.rain_daily_mm ?? 0,
                  t,
                )
          }
          badge={t.estimatedBadge}
          className="!w-full"
        />
        <WeatherMetric
          type="wind"
          title={t.windSpeed}
          value={metricValue(estimate.wind_speed_kmh, Math.round)}
          unit="km/h"
          description={
            estimate.wind_speed_kmh === null
              ? t.noReading
              : windDescription(estimate.wind_speed_kmh, windDir, t)
          }
          direction={windDir}
          badge={t.estimatedBadge}
          lang={lang}
          className="!w-full"
        />
        <WeatherMetric
          type="humidity"
          title={t.humidity}
          value={metricValue(estimate.humidity, Math.round)}
          unit="%"
          description={
            estimate.humidity === null
              ? t.noReading
              : humidityDescription(estimate.humidity, t)
          }
          badge={t.estimatedBadge}
          className="!w-full"
        />
        <WeatherMetric
          type="pressure"
          title={t.pressure}
          value={metricValue(estimate.pressure_hpa, Math.round)}
          unit="hPa"
          description={
            estimate.pressure_hpa === null
              ? t.noReading
              : pressureDescription(estimate.pressure_hpa, t)
          }
          badge={t.estimatedBadge}
          className="!w-full"
        />
      </div>
    </div>
  );
}
