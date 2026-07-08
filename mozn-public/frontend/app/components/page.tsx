import { WarningAlert } from "@/features/alerts";
import {
  LibyaMap,
  MapPin,
  MapPinLabel,
  MapPinLegend,
  MapPinStation,
} from "@/features/map";
import {
  StationHeader,
  TemperatureCard,
  WeatherMetric,
  ForecastList,
} from "@/features/station";

import {
  CompassIcon,
  CloudRainIcon,
  WindIcon,
  DropletIcon,
  GaugeIcon,
} from "../../components/icons";
import { LibraryFooter } from "../../components/library/footer";
import { Hero } from "../../components/library/hero";
import { Section, Cell } from "../../components/library/section";
import { IconButton, MapControlStack } from "../../components/ui/icon-button";


import type { Station, DailyForecast } from "../../components/api/types";

const demoStation: Station = {
  id: "demo",
  municipality_id: "demo",
  wu_station_id: "#0002",
  name: "Benghazi Port",
  name_ar: "ميناء بنغازي",
  station_type: "outdoor",
  latitude: 32.12,
  longitude: 20.07,
  elevation: 0,
  is_active: true,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  status: "warning",
  active_alerts: { total: 0, yellow: 0, orange: 0, red: 0 },
  forecast_alerts: [],
};

const demoForecast: DailyForecast[] = [
  { day: "2026-05-06T00:00:00Z", temp_high_c: 28, temp_low_c: 19, humidity_avg: 45, wind_speed_max_kmh: 12, wind_gust_max_kmh: 18, rain_total_mm: 0, uv_index_max: 7 },
  { day: "2026-05-07T00:00:00Z", temp_high_c: 28, temp_low_c: 19, humidity_avg: 70, wind_speed_max_kmh: 14, wind_gust_max_kmh: 20, rain_total_mm: 0, uv_index_max: 6 },
  { day: "2026-05-08T00:00:00Z", temp_high_c: 26, temp_low_c: 18, humidity_avg: 75, wind_speed_max_kmh: 18, wind_gust_max_kmh: 28, rain_total_mm: 2, uv_index_max: 5 },
  { day: "2026-05-09T00:00:00Z", temp_high_c: 22, temp_low_c: 14, humidity_avg: 80, wind_speed_max_kmh: 22, wind_gust_max_kmh: 35, rain_total_mm: 8, uv_index_max: 3 },
  { day: "2026-05-10T00:00:00Z", temp_high_c: 25, temp_low_c: 16, humidity_avg: 70, wind_speed_max_kmh: 14, wind_gust_max_kmh: 22, rain_total_mm: 0, uv_index_max: 6 },
  { day: "2026-05-11T00:00:00Z", temp_high_c: 19, temp_low_c: 11, humidity_avg: 40, wind_speed_max_kmh: 10, wind_gust_max_kmh: 16, rain_total_mm: 0, uv_index_max: 7 },
  { day: "2026-05-12T00:00:00Z", temp_high_c: 10, temp_low_c: 8, humidity_avg: 85, wind_speed_max_kmh: 24, wind_gust_max_kmh: 38, rain_total_mm: 12, uv_index_max: 2 },
];

export default function ComponentsLibraryPage() {
  return (
    <main className="min-h-screen bg-(--color-bg-canvas) py-[80px]">
      <div className="mx-auto w-full max-w-[1280px] px-[24px] flex flex-col gap-[56px]">
        <Hero />
        <hr className="m-0 border-0 h-px bg-(--color-border-subtle)" />

        <Section
          title="Foundations"
          description="Primitive building blocks — 16×16 utility icons for weather metric cards and the compass indicator."
          count="5 components"
        >
          <div className="grid grid-cols-5 gap-[20px]">
            <Cell label="Weather / Compass">
              <CompassIcon size={28} className="text-(--color-text-primary)" />
            </Cell>
            <Cell label="Icons / Rainfall">
              <CloudRainIcon size={16} className="text-(--color-text-primary)" />
            </Cell>
            <Cell label="Icons / Wind">
              <WindIcon size={16} className="text-(--color-text-primary)" />
            </Cell>
            <Cell label="Icons / Humidity">
              <DropletIcon size={16} className="text-(--color-text-primary)" />
            </Cell>
            <Cell label="Icons / Pressure">
              <GaugeIcon size={16} className="text-(--color-text-primary)" />
            </Cell>
          </div>
        </Section>

        <Section
          title="Controls"
          description="Interactive primitives — zoom, locate, and layer buttons. Single component, multiple icon variants."
          count="4 variants"
        >
          <div className="grid grid-cols-5 gap-[20px]">
            <Cell label="Icon = plus">
              <IconButton icon="plus" />
            </Cell>
            <Cell label="Icon = minus">
              <IconButton icon="minus" />
            </Cell>
            <Cell label="Icon = map-pin">
              <IconButton icon="map-pin" />
            </Cell>
            <Cell label="Icon = layers">
              <IconButton icon="layers" />
            </Cell>
            <Cell label="Stacked (map control stack)">
              <MapControlStack />
            </Cell>
          </div>
        </Section>

        <Section
          title="Map"
          description="The Libya regions canvas and all map markers — pin states, station indicators, on-map labels, and the map legend row."
          count="5 components"
        >
          <div className="flex flex-col gap-[20px]">
            <Cell label="Map / Libya" className="py-[24px]">
              <LibyaMap className="h-[340px] w-auto" />
            </Cell>
            <div className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-[20px]">
              <Cell label="Map Pin / Pin">
                <MapPin kind="normal" />
              </Cell>
              <Cell label="Map Pin / Station">
                <MapPinStation kind="red" location="Location" hazard="Severe" />
              </Cell>
              <Cell label="Map Pin / Label">
                <MapPinLabel location="Location" hazard="Hazard" />
              </Cell>
              <Cell label="Map Pin / Legend">
                <MapPinLegend />
              </Cell>
            </div>
          </div>
        </Section>

        <Section
          title="Alerts"
          description="Emergency warning cards with live-alert pill, action checklist, and contact buttons. Dropdown-capable."
          count="2 variants"
        >
          <div className="grid grid-cols-2 gap-[20px]">
            <Cell label="Warning Alert · Expanded" contentClassName="py-[8px]">
              <WarningAlert layout="expanded" />
            </Cell>
            <Cell label="Warning Alert · Collapsed" contentClassName="py-[8px]">
              <WarningAlert layout="collapsed" />
            </Cell>
          </div>
        </Section>

        <Section
          title="Panels"
          description="High-level data modules composed for the station detail side panel — Temperature, Weather Metrics, and Forecast."
          count="4 components"
        >
          <div className="grid grid-cols-3 gap-[20px]">
            <Cell label="Station Header">
              <StationHeader station={demoStation} />
            </Cell>
            <Cell label="Temperature Card">
              <TemperatureCard current={38} feelsLike={42} high={39} low={19} />
            </Cell>
            <Cell label="Weather Metrics (2×2)">
              <WeatherMetric
                type="wind"
                title="Wind Speed"
                value={35}
                unit="km/h"
                description="Light breeze from the N."
                direction="N"
              />
            </Cell>
            <Cell label="Forecast List" className="col-span-1 row-span-2">
              <ForecastList subtitle="Benghazi" days={demoForecast} />
            </Cell>
          </div>
        </Section>

        <hr className="m-0 border-0 h-px bg-(--color-border-subtle)" />
        <LibraryFooter />
      </div>
    </main>
  );
}
