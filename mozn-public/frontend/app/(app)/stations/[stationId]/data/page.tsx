import { notFound } from "next/navigation";

import { ExpandedPanel, ExpandedData } from "@/features/station";

import { getStation } from "../../../../../components/api/stations";

export default async function StationDataPage({
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

  return (
    <ExpandedPanel station={station} tab="data">
      <ExpandedData station={station} />
    </ExpandedPanel>
  );
}
