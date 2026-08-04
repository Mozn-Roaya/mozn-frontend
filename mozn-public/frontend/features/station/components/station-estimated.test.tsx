import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeStation } from "@/test/fixtures";

import { StationEstimated } from "./station-estimated";

import type { EstimatedConditions } from "@/components/api/open-meteo";
import type { DailyForecast } from "@/components/api/types";

// The disclosure is the whole point of this component, so it's asserted as
// hard as the numbers: offline stated up front, a per-surface "Estimated"
// badge on the temperature card and all four tiles, and the source credit.

const ESTIMATE: EstimatedConditions = {
  observed_at: "2026-08-04T20:15",
  temp_c: 34.2,
  feels_like_c: 35.4,
  humidity: 38,
  pressure_hpa: 1012.2,
  wind_speed_kmh: 11.7,
  wind_dir: 72,
  rain_rate_mm: 0,
  rain_daily_mm: 0,
};

const FORECAST: DailyForecast[] = [
  {
    day: "2026-08-04",
    temp_high_c: 38,
    temp_low_c: 29,
    humidity_avg: 40,
    wind_speed_max_kmh: 20,
    wind_gust_max_kmh: 30,
    rain_total_mm: 0,
    uv_index_max: 9,
  },
];

const OFFLINE = makeStation({
  status: "offline",
  last_seen_at: "2026-08-04T16:36:00Z",
});

function renderPanel(
  lang: "en" | "ar" = "en",
  estimate: EstimatedConditions = ESTIMATE,
) {
  return render(
    <StationEstimated
      station={OFFLINE}
      estimate={estimate}
      forecast={FORECAST}
      lang={lang}
    />,
  );
}

describe("StationEstimated", () => {
  it("renders the estimated values", () => {
    renderPanel();
    expect(screen.getByText("34")).toBeInTheDocument(); // temperature
    expect(screen.getByText("Feels like 35°")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument(); // humidity %
    expect(screen.getByText("12")).toBeInTheDocument(); // wind km/h, rounded
    expect(screen.getByText("1012")).toBeInTheDocument(); // pressure hPa
  });

  it("takes today's high/low from the forecast, not the estimate", () => {
    renderPanel();
    expect(screen.getByText("H: 38°")).toBeInTheDocument();
    expect(screen.getByText("L: 29°")).toBeInTheDocument();
  });

  it("states the station is offline, with the last-seen time", () => {
    renderPanel();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText(/^Last seen/)).toBeInTheDocument();
  });

  it("discloses that the readings are estimated and credits the source", () => {
    renderPanel();
    expect(
      screen.getByText(/estimated for this station’s location/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Open-Meteo/)).toBeInTheDocument();
  });

  it("badges every value-bearing surface — temp card plus all four tiles", () => {
    renderPanel();
    expect(screen.getAllByText("Estimated")).toHaveLength(5);
  });

  it("renders em dashes for values the source omitted", () => {
    renderPanel("en", {
      ...ESTIMATE,
      humidity: null,
      pressure_hpa: null,
      wind_speed_kmh: null,
      rain_rate_mm: null,
    });
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.getAllByText("No reading.")).toHaveLength(4);
    // Temperature is required, so it still renders.
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("renders Arabic copy", () => {
    renderPanel("ar");
    expect(screen.getByText("غير متصل")).toBeInTheDocument();
    expect(screen.getByText(/تقديرية لموقع المحطة من مصدر خارجي/)).toBeInTheDocument();
    expect(screen.getAllByText("تقديري")).toHaveLength(5);
  });
});
