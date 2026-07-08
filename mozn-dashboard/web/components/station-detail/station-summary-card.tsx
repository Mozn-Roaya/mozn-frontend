"use client";

import * as React from "react";
import {
  ChevronDown,
  CloudLightning,
  CloudOff,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Headset,
  MapPin,
  PhoneCall,
  Sun,
  Thermometer,
  TriangleAlert,
  Wind,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale, useT, useTD } from "@/components/providers/locale-provider";
import { useAdminConfig } from "@/components/providers/admin-config-provider";
import { EmptyState } from "@/components/common/empty-state";
import type { StationDetail } from "./station-detail";
import type {
  ForecastDay,
  StationMetric,
  WeatherCondition,
} from "./station-weather";
import type { LocalizedStep } from "@/types/shared";

const TEMP_GRADIENT =
  "linear-gradient(90deg,#63d1ff 0%,#30d15a 30%,#ffd60a 55%,#ff8c00 80%,#ee4235 100%)";
const RANGE_GRADIENT = "linear-gradient(90deg,#34d399,#f59e0b)";
const TEMP_SCALE_MAX = 50;

const CONDITION_ICON: Record<WeatherCondition, LucideIcon> = {
  sunny: Sun,
  cloudy: CloudSun,
  rain: CloudRain,
  storms: CloudLightning,
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/** Bordered weather section card — the recurring surface inside the panel. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-card", className)}>
      {children}
    </div>
  );
}

function TemperatureCard({
  temp,
  feelsLike,
  high,
  low,
}: {
  temp: number;
  feelsLike: number;
  high: number;
  low: number;
}) {
  const t = useT();
  const markerPct = clamp((temp / TEMP_SCALE_MAX) * 100);
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-1.5 text-text-secondary">
        <Thermometer className="size-4" aria-hidden />
        <span className="text-xs font-medium">{t("dashboard.station.temperature")}</span>
      </div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="text-[62px] font-bold leading-[64px] tracking-tight tabular-nums text-foreground">
            {temp}
          </span>
          <span className="mb-3 text-xl text-text-secondary">°C</span>
        </div>
        <div className="mt-1 space-y-0.5 text-end">
          <p className="text-[10px] text-text-secondary">
            {t("dashboard.station.feelsLike", { v: feelsLike })}
          </p>
          <p className="text-xs font-medium tabular-nums text-foreground">
            {t("dashboard.station.highLow", { high, low })}
          </p>
        </div>
      </div>
      <div className="mt-3" dir="ltr">
        <div className="relative h-1 w-full rounded-full" style={{ backgroundImage: TEMP_GRADIENT }}>
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white shadow-sm"
            style={{ left: `${markerPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0°</span>
          <span>{TEMP_SCALE_MAX}°</span>
        </div>
      </div>
    </Panel>
  );
}

/** One emergency-contact tile in the expanded alert body. */
function ContactCard({
  icon: Icon,
  label,
  number,
}: {
  icon: LucideIcon;
  label: string;
  number: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums text-foreground">{number}</p>
      </div>
    </div>
  );
}

/**
 * Live alert banner. When the alert carries response `actions` it becomes a
 * collapsible (Figma "Warning Alert · Collapsed/Expanded"): the header is the
 * toggle button and expanding reveals the numbered action steps + emergency
 * contacts. Alerts without actions (e.g. sensor anomaly) stay a static banner.
 */
function AlertCard({
  title,
  description,
  actions,
  eventKey,
  stepsOverride,
  city,
  defaultOpen,
}: {
  title: string;
  description: string;
  actions?: string[];
  eventKey?: string;
  stepsOverride?: LocalizedStep[];
  city?: string;
  defaultOpen?: boolean;
}) {
  const t = useT();
  const td = useTD();
  const { locale } = useLocale();
  const { contactsForCity, templateSteps } = useAdminConfig();
  const emergencyContacts = contactsForCity(city);
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  const bodyId = React.useId();
  // Render each bilingual step in the reader's language, falling back to the
  // other language if one side is blank so a step never renders empty.
  const localize = (list: LocalizedStep[]) =>
    list
      .map((s) => (locale === "ar" ? s.ar || s.en : s.en || s.ar).trim())
      .filter(Boolean);
  // Resolution priority: a per-station override (when present) wins over the
  // admin-authored template steps (by event), which in turn win over the
  // alert's own seeded actions (translated via the data dictionary).
  const storeSteps = eventKey ? templateSteps[eventKey] : undefined;
  const steps =
    stepsOverride && stepsOverride.length > 0
      ? localize(stepsOverride)
      : storeSteps && storeSteps.length > 0
        ? localize(storeSteps)
        : (actions ?? []).map((a) => td(a));
  const hasBody = steps.length > 0;

  const head = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <TriangleAlert className="size-5 shrink-0 text-status-warning" aria-hidden />
          <span className="truncate text-lg font-bold text-foreground">{td(title)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span data-slot="pill" className="inline-flex items-center gap-1.5 rounded-full bg-status-warning px-2 py-0.5">
            <span className="size-1 rounded-full bg-white" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
              {t("dashboard.station.live")}
            </span>
          </span>
          {hasBody ? (
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs leading-[18px] text-text-secondary">{td(description)}</p>
    </>
  );

  return (
    <Panel className="overflow-hidden">
      {hasBody ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="block w-full bg-status-warning/10 px-5 py-4 text-start transition-colors hover:bg-status-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-warning/50"
        >
          {head}
        </button>
      ) : (
        <div className="bg-status-warning/10 px-5 py-4">{head}</div>
      )}

      {hasBody && open ? (
        <div
          id={bodyId}
          className="flex flex-col gap-4 px-5 py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
        >
          <ol className="flex flex-col gap-3.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-status-warning/10 text-xs font-semibold tabular-nums text-status-warning">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-foreground">{step}</p>
              </li>
            ))}
          </ol>
          <div className="h-px w-full bg-border-subtle" />
          <div className="flex gap-2.5">
            <ContactCard icon={Headset} label={t("dashboard.station.emergencyServices")} number={emergencyContacts.emergencyServices} />
            <ContactCard icon={PhoneCall} label={t("dashboard.station.civilDefense")} number={emergencyContacts.civilDefense} />
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function MetricCard({
  icon: Icon,
  label,
  metric,
  direction,
}: {
  icon: LucideIcon;
  label: string;
  metric: StationMetric;
  direction?: string;
}) {
  const td = useTD();
  return (
    <Panel className="relative p-3.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate text-xs font-medium">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-semibold leading-none tabular-nums text-foreground">
          {metric.value}
        </span>
        {metric.unit ? (
          <span className="text-[10px] text-muted-foreground">{td(metric.unit)}</span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">{td(metric.note)}</p>
      {direction ? (
        <span className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border text-[10px] font-semibold text-status-normal">
          {direction}
        </span>
      ) : null}
    </Panel>
  );
}

function ForecastRow({
  day,
  weekMin,
  weekMax,
  highlighted,
}: {
  day: ForecastDay;
  weekMin: number;
  weekMax: number;
  highlighted?: boolean;
}) {
  const t = useT();
  const Icon = CONDITION_ICON[day.condition];
  const span = Math.max(1, weekMax - weekMin);
  const left = clamp(((day.low - weekMin) / span) * 100);
  const width = clamp(((day.high - day.low) / span) * 100, 6);
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2.5 py-1.5",
        highlighted && "rounded-lg bg-secondary",
      )}
    >
      <div className="w-[60px] shrink-0">
        <p
          className={cn(
            "truncate text-sm text-foreground",
            highlighted ? "font-semibold" : "font-medium",
          )}
        >
          {t(`dashboard.station.day.${day.key}`)}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {t(`dashboard.station.cond.${day.condition}`)}
        </p>
      </div>
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div dir="ltr" className="flex flex-1 items-center gap-2">
        <span className="w-7 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
          {day.low}°
        </span>
        <div className="relative h-1 flex-1 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 rounded-full"
            style={{ left: `${left}%`, width: `${width}%`, backgroundImage: RANGE_GRADIENT }}
          />
        </div>
        <span className="w-7 shrink-0 text-xs font-semibold tabular-nums text-foreground">
          {day.high}°
        </span>
      </div>
    </div>
  );
}

function ForecastCard({ forecast, subtitle }: { forecast: ForecastDay[]; subtitle: string }) {
  const t = useT();
  const weekMin = Math.min(...forecast.map((d) => d.low));
  const weekMax = Math.max(...forecast.map((d) => d.high));
  return (
    <Panel className="px-3.5 pb-3 pt-4">
      <div className="px-1">
        <h4 className="text-lg font-bold leading-tight text-foreground">
          {t("dashboard.station.forecast")}
        </h4>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mt-2">
        {forecast.map((day, i) => (
          <div key={day.key}>
            {i > 0 ? <div className="mx-2.5 h-px bg-border-subtle" /> : null}
            <ForecastRow
              day={day}
              weekMin={weekMin}
              weekMax={weekMax}
              highlighted={day.key === "today"}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Full station summary card (Figma "Station Summary"). */
export function StationSummaryCard({
  detail,
  onClose,
}: {
  detail: StationDetail;
  onClose: () => void;
}) {
  const t = useT();
  const td = useTD();
  const { locale } = useLocale();
  const displayName =
    locale === "ar" && detail.nameAr ? detail.nameAr : td(detail.name);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="text-sm">{t("dashboard.station.eyebrow")}</span>
          </div>
          <h3 className="mt-0.5 truncate text-2xl font-bold leading-9 text-foreground" dir="auto">
            {displayName}
          </h3>
          <p className="text-sm tabular-nums text-muted-foreground">{detail.code}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dashboard.map.close")}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {detail.availability === "offline" ? (
        <Panel className="p-5">
          <div className="flex items-center gap-2.5 text-status-offline">
            <WifiOff className="size-5 shrink-0" aria-hidden />
            <span className="text-lg font-bold text-foreground">
              {t("dashboard.station.offline")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dashboard.station.offlineDesc", { t: td(detail.updated) })}
          </p>
        </Panel>
      ) : detail.availability === "maintenance" ? (
        <Panel className="p-5">
          <div className="flex items-center gap-2.5 text-text-link">
            <Wrench className="size-5 shrink-0" aria-hidden />
            <span className="text-lg font-bold text-foreground">
              {t("dashboard.station.maintenance")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dashboard.station.maintenanceDesc")}
          </p>
        </Panel>
      ) : detail.temp == null ? (
        <EmptyState icon={CloudOff} message={t("dashboard.station.noData")} />
      ) : (
        <>
          <TemperatureCard
            temp={detail.temp}
            feelsLike={detail.feelsLike ?? 0}
            high={detail.high ?? 0}
            low={detail.low ?? 0}
          />

          {detail.alert ? (
            <AlertCard
              title={detail.alert.title}
              description={detail.alert.description}
              actions={detail.alert.actions}
              eventKey={detail.alert.eventKey}
              stepsOverride={detail.alert.stepsOverride}
              city={detail.city}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            {detail.rainfall ? (
              <MetricCard icon={CloudRain} label={t("dashboard.station.rainfall")} metric={detail.rainfall} />
            ) : null}
            {detail.wind ? (
              <MetricCard
                icon={Wind}
                label={t("dashboard.station.wind")}
                metric={detail.wind}
                direction={detail.wind.direction}
              />
            ) : null}
            {detail.humidity ? (
              <MetricCard icon={Droplets} label={t("dashboard.station.humidity")} metric={detail.humidity} />
            ) : null}
            {detail.pressure ? (
              <MetricCard icon={Gauge} label={t("dashboard.station.pressure")} metric={detail.pressure} />
            ) : null}
          </div>

          {detail.forecast && detail.forecast.length > 0 ? (
            <ForecastCard forecast={detail.forecast} subtitle={t(`region.${detail.region}`)} />
          ) : null}
        </>
      )}
    </div>
  );
}
