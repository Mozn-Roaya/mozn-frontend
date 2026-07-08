import * as React from "react";

import { cn } from "@/components/lib/cn";
import { getDict, type Lang } from "@/components/lib/i18n";

type TemperatureCardProps = {
  current?: number | null;
  feelsLike?: number | null;
  high?: number | null;
  low?: number | null;
  scaleMin?: number;
  scaleMax?: number;
  unit?: string;
  className?: string;
  lang?: Lang;
};

// Spectrum from cool blue → warm red, sampled from the Figma Temperature
// Card (node 446:37). Stops are absolute over the scale range — not
// interpolated.
const TEMP_STOPS: ReadonlyArray<readonly [number, readonly [number, number, number]]> =
  [
    [0, [99, 209, 255]],
    [30, [48, 209, 90]],
    [55, [255, 214, 10]],
    [80, [255, 140, 0]],
    [100, [238, 66, 53]],
  ];

const tempGradient = `linear-gradient(90deg, ${TEMP_STOPS.map(
  ([p, [r, g, b]]) => `rgb(${r} ${g} ${b}) ${p}%`,
).join(", ")})`;

// Linearly interpolate the gradient color at `percent` (0–100). Used for the
// marker ring so it always matches the underlying spectrum — matches Figma's
// asset behavior (the marker reads as a value indicator, not a hard pin).
function sampleGradient(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));
  for (let i = 0; i < TEMP_STOPS.length - 1; i++) {
    const [p0, c0] = TEMP_STOPS[i];
    const [p1, c1] = TEMP_STOPS[i + 1];
    if (p >= p0 && p <= p1) {
      const t = (p - p0) / (p1 - p0);
      const r = Math.round(c0[0] + t * (c1[0] - c0[0]));
      const g = Math.round(c0[1] + t * (c1[1] - c0[1]));
      const b = Math.round(c0[2] + t * (c1[2] - c0[2]));
      return `rgb(${r} ${g} ${b})`;
    }
  }
  return `rgb(${TEMP_STOPS[TEMP_STOPS.length - 1][1].join(" ")})`;
}

export function TemperatureCard({
  current = null,
  feelsLike = null,
  high = null,
  low = null,
  scaleMin = 0,
  scaleMax = 50,
  unit = "°C",
  className,
  lang = "en",
}: TemperatureCardProps) {
  const t = getDict(lang);
  const hasValue =
    current !== null && current !== undefined && Number.isFinite(current);
  const clamped = hasValue
    ? Math.max(scaleMin, Math.min(scaleMax, current))
    : scaleMin;
  const markerPct = ((clamped - scaleMin) / (scaleMax - scaleMin)) * 100;
  const markerColor = sampleGradient(markerPct);

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl p-4 flex flex-col gap-4",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-(--color-text-secondary)"
              aria-hidden
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z" />
            </svg>
            <span className="text-body-xs font-medium whitespace-nowrap text-(--color-text-secondary)">
              {t.temperature}
            </span>
          </div>
          {/*
            Figma node 446:37 aligns `°C` to the cap-height of the big number.
            `leading-none` tightens the number's line-box; `mt-1` then nudges
            the unit down so its cap-top lines up with the number's cap-top.
          */}
          <div className="flex items-start">
            <span className="text-display-xl font-bold leading-none text-(--color-text-primary)">
              {hasValue ? Math.round(current as number) : "—"}
            </span>
            <span className="ms-2 mt-1 text-body-xl text-(--color-text-secondary)">
              {unit}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 pt-2">
          {feelsLike !== null &&
            feelsLike !== undefined &&
            Number.isFinite(feelsLike) && (
              <span className="text-body-xxs whitespace-nowrap text-(--color-text-secondary)">
                {t.feelsLike(Math.round(feelsLike))}
              </span>
            )}
          {high !== null &&
            low !== null &&
            Number.isFinite(high) &&
            Number.isFinite(low) && (
              <div className="flex items-baseline gap-3 text-body-xs font-medium tabular-nums text-(--color-text-primary)">
                <span>{t.high}: {Math.round(high as number)}°</span>
                <span>{t.low}: {Math.round(low as number)}°</span>
              </div>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <div
            className="h-[5px] rounded-full"
            style={{
              backgroundImage: tempGradient,
              opacity: hasValue ? 1 : 0.4,
            }}
          />
          {hasValue && (
            <div
              className="absolute -top-[2.5px] size-2.5 rounded-full bg-(--color-bg-primary)"
              style={{
                left: `calc(${markerPct}% - 5px)`,
                boxShadow: `0 0 0 2px ${markerColor}`,
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-body-xxs text-(--color-text-muted)">
          <span>{scaleMin}°</span>
          <span>{scaleMax}°</span>
        </div>
      </div>
    </div>
  );
}
