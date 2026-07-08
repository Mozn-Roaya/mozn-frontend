"use client";

import * as React from "react";

import { CheckIcon, DownloadIcon } from "@/components/icons";
import { cn } from "@/components/lib/cn";
import { localeFor, type Dict } from "@/components/lib/i18n";
import { useLang, useT } from "@/components/state/lang-context";

import { buildCsv, triggerDownload, type IncludeKey } from "../lib/csv";

import type { Reading, Station } from "@/components/api/types";

// The station drives which readings are exported; period + column selection
// are picked in-form. Readings are fetched fresh on download (sized to the
// chosen period) rather than seeded from the server.

type Format = "CSV" | "PDF" | "PNG";
type Period = "24h" | "7d" | "30d" | "6mo" | "1yr";

// Readings arrive at ~15-min intervals; row counts drive both the export size
// and the meta line. 6mo/1yr are capped when actually fetching so a public
// download can't pull an unbounded payload.
const ROWS_BY_PERIOD: Record<Period, number> = {
  "24h": 96,
  "7d": 672,
  "30d": 2880,
  "6mo": 17520,
  "1yr": 35040,
};
const FETCH_CAP = 5000;

function includeFields(t: Dict): Array<{ key: IncludeKey; label: string }> {
  return [
    { key: "temperature", label: t.fieldTemperature },
    { key: "humidity", label: t.fieldHumidity },
    { key: "rainfall", label: t.fieldRainfall },
    { key: "waterLevel", label: t.fieldWaterLevel },
    { key: "windSpeed", label: t.fieldWindSpeed },
    { key: "coordinates", label: t.fieldCoordinates },
  ];
}

type ExpandedDataProps = {
  station: Station;
};

export function ExpandedData({ station }: ExpandedDataProps) {
  const t = useT();
  const lang = useLang();
  const [format, setFormat] = React.useState<Format>("CSV");
  const [period, setPeriod] = React.useState<Period>("7d");
  const [include, setInclude] = React.useState<Record<IncludeKey, boolean>>({
    temperature: true,
    humidity: true,
    rainfall: true,
    waterLevel: true,
    windSpeed: true,
    coordinates: true,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCount = Object.values(include).filter(Boolean).length;
  const rows = ROWS_BY_PERIOD[period];
  // ~20 bytes for the timestamp column + ~9 bytes per selected metric column.
  const estKb = Math.max(1, Math.round((rows * (20 + selectedCount * 9)) / 1024));

  function toggle(key: IncludeKey) {
    setInclude((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function download() {
    if (format !== "CSV" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const pageSize = Math.min(rows, FETCH_CAP);
      const res = await fetch(
        `/api/proxy/public/readings?station_id=${encodeURIComponent(
          station.id,
        )}&page=1&page_size=${pageSize}`,
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const readings: Reading[] = json.data ?? [];
      const csv = buildCsv(readings, station, include);
      triggerDownload(
        csv,
        `${station.wu_station_id || station.id}-readings-${period}.csv`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-[20px] w-full">
      <Section label={t.formatLabel}>
        <Segmented>
          {(["CSV", "PDF", "PNG"] as const).map((f) => {
            const disabled = f !== "CSV";
            return (
              <SegmentButton
                key={f}
                active={format === f}
                disabled={disabled}
                title={disabled ? t.comingSoon : undefined}
                onClick={() => !disabled && setFormat(f)}
              >
                {f}
              </SegmentButton>
            );
          })}
        </Segmented>
      </Section>

      <Divider />

      <Section label={t.periodLabel}>
        <Segmented>
          {(["24h", "7d", "30d", "6mo", "1yr"] as const).map((p) => (
            <SegmentButton
              key={p}
              active={period === p}
              onClick={() => setPeriod(p)}
            >
              {t.periods[p]}
            </SegmentButton>
          ))}
        </Segmented>
      </Section>

      <Divider />

      <Section label={t.includeLabel}>
        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px]">
          {includeFields(t).map((f) => (
            <Checkbox
              key={f.key}
              checked={include[f.key]}
              onChange={() => toggle(f.key)}
              label={f.label}
            />
          ))}
        </div>
      </Section>

      <Divider />

      <div className="flex flex-col gap-[10px]">
        <button
          type="button"
          onClick={download}
          disabled={format !== "CSV" || busy}
          className={cn(
            "flex h-[52px] w-full items-center justify-center gap-[8px] rounded-xl",
            "bg-(--color-bg-inverse) text-(--color-text-inverse)",
            "text-body-sm font-semibold transition-opacity",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          <DownloadIcon size={18} />
          {busy ? t.preparing : t.download(format)}
        </button>
        {error && (
          <p className="text-center text-body-xxs text-(--color-text-warning) m-0">
            {t.couldntPrepare(error)}
          </p>
        )}
        <p className="text-center text-body-xs text-(--color-text-muted) m-0">
          {t.readingsMeta(rows.toLocaleString(localeFor(lang)), estKb)}
        </p>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-label-sm font-semibold uppercase tracking-[0.8px] text-(--color-text-muted)">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[4px] rounded-[11px] bg-(--color-bg-secondary) p-[4px]">
      {children}
    </div>
  );
}

function SegmentButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "flex h-[34px] flex-1 items-center justify-center rounded-lg text-body-sm transition-colors",
        active
          ? "bg-(--color-bg-primary) font-semibold text-(--color-text-primary) shadow-[0_1px_2px_0_rgba(0,0,0,0.08)]"
          : "font-medium text-(--color-text-muted)",
        disabled
          ? "cursor-not-allowed text-(--color-interactive-disabled-text)"
          : !active && "hover:text-(--color-text-primary)",
      )}
    >
      {children}
    </button>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[12px] select-none">
      <span
        className={cn(
          "grid size-[16px] shrink-0 place-items-center rounded-md border border-solid transition-colors",
          checked
            ? "border-transparent bg-(--color-bg-inverse) text-(--color-text-inverse)"
            : "border-(--color-border-strong) bg-(--color-bg-primary)",
        )}
      >
        {checked && <CheckIcon size={11} strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-body-sm text-(--color-text-secondary)">{label}</span>
    </label>
  );
}

function Divider() {
  return <div className="h-px w-full bg-(--color-border-subtle)" />;
}
