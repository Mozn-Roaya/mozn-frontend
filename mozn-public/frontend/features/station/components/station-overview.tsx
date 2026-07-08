import * as React from "react";

import { getDict, pickLang, stationName, type Lang } from "@/components/lib/i18n";
import {
  WarningAlert,
  alertTimeRange,
  alertTitle,
  severityFromApi,
} from "@/features/alerts";

import { ForecastList } from "./forecast-list";
import { TemperatureCard } from "./temperature-card";
import { WeatherMetric } from "./weather-metric";
import {
  degToCardinal,
  humidityDescription,
  pressureDescription,
  rainDescription,
  windDescription,
} from "../lib/weather-summary";

import type {
  Station,
  Reading,
  DailyForecast,
  Alert,
} from "@/components/api/types";

type StationOverviewProps = {
  station: Station;
  reading: Reading | null;
  forecast: DailyForecast[];
  alerts?: Alert[];
  warningOverride?: "collapsed" | "expanded" | null;
  lang?: Lang;
};

export function StationOverview({
  station,
  reading,
  forecast,
  alerts = [],
  warningOverride,
  lang = "en",
}: StationOverviewProps) {
  const t = getDict(lang);
  const counts = station.active_alerts ?? { total: 0, yellow: 0, orange: 0, red: 0 };
  const forecastAlerts = station.forecast_alerts ?? [];
  const primaryAlert = alerts[0];
  const hasAlert =
    !!primaryAlert ||
    counts.red > 0 ||
    counts.orange > 0 ||
    forecastAlerts.length > 0;

  // Default to "expanded" when an alert is present so the guidance steps
  // are visible the moment the station is opened. Callers that want the
  // compact header-only form can still pass `?warning=collapsed` via the
  // URL — that route still feeds through `warningOverride`.
  const warningLayout: "collapsed" | "expanded" | null =
    warningOverride ?? (hasAlert ? "expanded" : null);

  const nonEmpty = (s?: string) => {
    const t = s?.trim();
    return t ? t : undefined;
  };

  const severity =
    primaryAlert?.severity ??
    forecastAlerts[0]?.severity ??
    (counts.red > 0 ? "red" : counts.orange > 0 ? "orange" : counts.yellow > 0 ? "yellow" : undefined);

  // Hazard-aware title built from `parameter + severity` (e.g. "High
  // Temperature Watch"). Prefer the full Alert's parameter; fall back to the
  // station's first forecast-alert if no listAlerts row exists yet.
  const alertParameter =
    primaryAlert?.parameter ?? forecastAlerts[0]?.parameter;
  const warningTitle = alertTitle(alertParameter, severity, lang);

  const warningDescription =
    nonEmpty(pickLang(lang, primaryAlert?.message, primaryAlert?.message_ar)) ??
    t.alertActiveDefault;

  // Time line under the description: prefers the alert's explicit window,
  // falls back to the forecast snapshot's window, then to lead_time alone.
  const warningMeta = alertTimeRange(
    {
      startsAt: primaryAlert?.starts_at ?? forecastAlerts[0]?.starts_at,
      expiresAt: primaryAlert?.expires_at ?? forecastAlerts[0]?.expires_at,
      leadTime: primaryAlert?.lead_time ?? forecastAlerts[0]?.lead_time,
      issuedAt: primaryAlert?.issued_at,
    },
    lang,
  );

  // Guidance is snapshotted onto the alert at issue time by the backend
  // (`alert_templates` keyed by event_type + severity). Falls back to
  // undefined when the API omits the field or the snapshot is empty — at
  // which point `<WarningAlert>` renders its built-in DEFAULT_GUIDANCE.
  const guidanceSteps =
    lang === "ar" && primaryAlert?.guidance_steps_ar?.length
      ? primaryAlert.guidance_steps_ar
      : primaryAlert?.guidance_steps_en;
  const warningSteps =
    guidanceSteps && guidanceSteps.length > 0 ? guidanceSteps : undefined;

  const today = forecast[0];

  const windDir = reading ? degToCardinal(reading.wind_dir) : "N";

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <TemperatureCard
        current={reading?.temp_c ?? null}
        feelsLike={reading?.heatindex_c ?? reading?.windchill_c ?? null}
        high={today?.temp_high_c ?? null}
        low={today?.temp_low_c ?? null}
        scaleMin={0}
        scaleMax={50}
        lang={lang}
      />

      {warningLayout && (
        <WarningAlert
          title={warningTitle}
          description={warningDescription}
          meta={warningMeta}
          severity={severity ? severityFromApi(severity) : "critical"}
          steps={warningSteps}
          layout={warningLayout}
          className="!w-full"
          lang={lang}
        />
      )}

      <div className="grid grid-cols-2 gap-[24px]">
        <WeatherMetric
          type="rainfall"
          title={t.rainfall}
          value={reading ? reading.rain_rate_mm.toFixed(1) : "—"}
          unit="mm/hr"
          description={
            reading
              ? rainDescription(reading.rain_rate_mm, reading.rain_daily_mm, t)
              : t.noReading
          }
          className="!w-full"
        />
        <WeatherMetric
          type="wind"
          title={t.windSpeed}
          value={reading ? Math.round(reading.wind_speed_kmh) : "—"}
          unit="km/h"
          description={
            reading
              ? windDescription(reading.wind_speed_kmh, windDir, t)
              : t.noReading
          }
          direction={windDir}
          lang={lang}
          className="!w-full"
        />
        <WeatherMetric
          type="humidity"
          title={t.humidity}
          value={reading ? Math.round(reading.humidity) : "—"}
          unit="%"
          description={
            reading ? humidityDescription(reading.humidity, t) : t.noReading
          }
          className="!w-full"
        />
        <WeatherMetric
          type="pressure"
          title={t.pressure}
          value={reading ? Math.round(reading.pressure_hpa) : "—"}
          unit="hPa"
          description={
            reading ? pressureDescription(reading.pressure_hpa, t) : t.noReading
          }
          className="!w-full"
        />
      </div>

      <ForecastList
        title={t.forecastTitle}
        subtitle={stationName(station, lang)}
        days={forecast}
        lang={lang}
        className="!w-full"
      />
    </div>
  );
}
