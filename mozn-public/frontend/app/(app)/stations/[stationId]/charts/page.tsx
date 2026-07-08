import { notFound } from "next/navigation";

import { ExpandedPanel, ExpandedCharts } from "@/features/station";

import { getReadingsHistory } from "../../../../../components/api/readings";
import { getStation } from "../../../../../components/api/stations";

export default async function StationChartsPage({
  params,
}: {
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = await params;
  const decodedId = decodeURIComponent(stationId);

  let station;
  try {
    station = await getStation(decodedId);
  } catch {
    notFound();
  }
  if (!station) notFound();

  // Figma defaults the period selector to 7d.
  const data = await getReadingsHistory(decodedId, "7d").catch(() => []);

  return (
    <ExpandedPanel station={station} tab="charts">
      <ExpandedCharts stationId={station.id} initial={{ range: "7d", data }} />
    </ExpandedPanel>
  );
}
