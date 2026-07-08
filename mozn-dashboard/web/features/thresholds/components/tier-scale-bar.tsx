"use client";

// Colour-graduated escalation bar for one metric: normal → advisory → watch →
// warning bands sized to where each tier cut-off sits on the metric's range,
// with the cut-off values marked above. Purely a visualisation — editing happens
// in the number inputs beside it (Datadog-style "see the escalation, type the
// value"). Rendered LTR since a numeric scale always ascends left→right.

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
}: {
  advisory: number;
  watch: number;
  warning: number;
  unit: string;
}) {
  // Headroom above the Warning cut-off so its band always reads as a band.
  const max = Math.max(warning * 1.35, warning + 10);
  const w = (from: number, to: number) =>
    `${Math.max(0, ((to - from) / max) * 100)}%`;
  const left = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  const stops: { v: number; tone: string }[] = [
    { v: advisory, tone: "advisory" },
    { v: watch, tone: "watch" },
    { v: warning, tone: "warning" },
  ];

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
          <span style={{ width: w(0, advisory), backgroundColor: TONE_HEX.normal }} />
          <span style={{ width: w(advisory, watch), backgroundColor: TONE_HEX.advisory }} />
          <span style={{ width: w(watch, warning), backgroundColor: TONE_HEX.watch }} />
          <span style={{ flex: "1 1 auto", backgroundColor: TONE_HEX.warning }} />
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
