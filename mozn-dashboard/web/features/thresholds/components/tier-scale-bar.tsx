"use client";

// Colour-graduated escalation bar for one metric: normal → advisory → watch →
// warning bands sized to where each tier cut-off sits on the metric's range,
// with the cut-off values marked above. Purely a visualisation — editing happens
// in the number inputs beside it (Datadog-style "see the escalation, type the
// value"). Rendered LTR since a numeric scale always ascends left→right.
//
// `invert` handles low-side params (temp_low_c): the reading breaches BELOW the
// cut-off, so the safe (normal/green) zone is at the HIGH end and the warning
// (red) zone at the LOW end — the escalation runs right→left.

const TONE_HEX: Record<string, string> = {
  normal: "#10b981",
  advisory: "#f59e0b",
  watch: "#fb923c",
  warning: "#ef4444",
};

export function TierScaleBar({
  advisory,
  watch,
  warning,
  unit,
  invert = false,
}: {
  advisory: number;
  watch: number;
  warning: number;
  unit: string;
  invert?: boolean;
}) {
  const stops = [
    { v: advisory, tone: "advisory" },
    { v: watch, tone: "watch" },
    { v: warning, tone: "warning" },
  ].sort((a, b) => a.v - b.v);

  // Headroom above the largest cut-off so the top band always reads as a band.
  const hi = stops[stops.length - 1].v;
  const max = Math.max(hi * 1.35, hi + 10);
  const w = (from: number, to: number) =>
    `${Math.max(0, ((to - from) / max) * 100)}%`;
  const left = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  // Bands along the ascending numeric axis. High-side: safe zone (normal) sits
  // below the lowest cut-off. Low-side: safe zone sits above the highest cut-off,
  // so the tone assignment shifts and the tail band is normal.
  const bounds = [0, stops[0].v, stops[1].v, stops[2].v, max];
  const tones = invert
    ? [stops[0].tone, stops[1].tone, stops[2].tone, "normal"]
    : ["normal", stops[0].tone, stops[1].tone, stops[2].tone];

  return (
    <div dir="ltr" className="pt-6" aria-hidden>
      <div className="relative">
        {/* Cut-off value markers, positioned above their band boundary. */}
        {stops.map((s) => (
          <span
            key={s.tone}
            className="absolute -top-5 -translate-x-1/2 text-[11px] font-semibold tabular-nums"
            style={{ left: left(s.v), color: TONE_HEX[s.tone] }}
          >
            {s.v}
          </span>
        ))}
        {/* The graduated band track. */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {tones.map((tone, i) => (
            <span
              key={i}
              style={
                i === tones.length - 1
                  ? { flex: "1 1 auto", backgroundColor: TONE_HEX[tone] }
                  : { width: w(bounds[i], bounds[i + 1]), backgroundColor: TONE_HEX[tone] }
              }
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>0</span>
        <span>
          {Math.round(max)} {unit}
        </span>
      </div>
    </div>
  );
}
