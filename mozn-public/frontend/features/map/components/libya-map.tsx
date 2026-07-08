import { cn } from "@/components/lib/cn";

type LibyaMapProps = {
  readonly className?: string;
};

type Region = {
  readonly id: string;
  /** `[top, right, bottom, left]` as a percent of the 909×884 container. */
  readonly inset: readonly [number, number, number, number];
};

const REGIONS: readonly Region[] = [
  { id: "LYNL", inset: [5.92, 83.69, 64.62, 0] },
  { id: "LYNQ", inset: [0, 79.81, 93.21, 13.28] },
  { id: "LYKF", inset: [46.3, 1.1, 0, 62.02] },
  { id: "LYMQ", inset: [46.11, 37.87, 16.51, 12.32] },
  { id: "LYBU", inset: [7.42, 0, 61.42, 86.05] },
  { id: "LYWA", inset: [14.79, 1.1, 53.41, 57.78] },
  { id: "LYWS", inset: [27.63, 58.75, 47.63, 2.83] },
  { id: "LYGT", inset: [40.67, 86.74, 33.99, 0.03] },
  { id: "LYMB", inset: [3.29, 65.95, 90.44, 24.39] },
  { id: "LYTB", inset: [2.04, 71.06, 93.42, 23.38] },
  { id: "LYZA", inset: [2.37, 76.4, 92.64, 15.68] },
  { id: "LYDR", inset: [1.81, 12.08, 81.61, 79.46] },
  { id: "LYJA", inset: [1.8, 19.31, 83.7, 75.74] },
  { id: "LYMJ", inset: [3.11, 21.82, 83.45, 69.26] },
  { id: "LYBA", inset: [4.8, 24.33, 83.25, 66.78] },
  { id: "LYJI", inset: [3.58, 75.51, 92.86, 21.75] },
  { id: "LYJG", inset: [6.7, 64.53, 63.86, 13.95] },
  { id: "LYJU", inset: [25.42, 37.95, 46.08, 31.83] },
  { id: "LYSB", inset: [41.21, 56.29, 47.84, 28.81] },
  { id: "LYWD", inset: [44.51, 69.84, 42.78, 12.13] },
  { id: "LYMI", inset: [5.68, 54.71, 70.95, 25.41] },
  { id: "LYSR", inset: [14.81, 40.44, 64.29, 42.65] },
];

const MAP_ASPECT_RATIO = "909 / 883.6";

function insetStyle(inset: Region["inset"]) {
  const [top, right, bottom, left] = inset;
  return {
    top: `${top}%`,
    right: `${right}%`,
    bottom: `${bottom}%`,
    left: `${left}%`,
    width: `${100 - left - right}%`,
    height: `${100 - top - bottom}%`,
  } as const;
}

/**
 * Static SVG composition of Libya's regions. Used in the design-system
 * showcase only; the live map uses `<LeafletLibyaMap>`.
 */
export function LibyaMap({ className }: LibyaMapProps) {
  return (
    <div
      role="img"
      aria-label="Libya regions map"
      className={cn("relative", className)}
      style={{ aspectRatio: MAP_ASPECT_RATIO }}
    >
      {REGIONS.map((region) => (
        // eslint-disable-next-line @next/next/no-img-element -- raw SVG region tile, no Image optimization needed
        <img
          key={region.id}
          src={`/map/regions/${region.id}.svg`}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute block max-w-none size-full select-none"
          style={insetStyle(region.inset)}
        />
      ))}
    </div>
  );
}
