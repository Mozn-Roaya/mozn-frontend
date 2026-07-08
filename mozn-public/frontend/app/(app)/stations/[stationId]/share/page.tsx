import { notFound } from "next/navigation";

import { ShareTab } from "@/features/station";

import { getStation } from "../../../../../components/api/stations";

export default async function StationSharePage({
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

  return <ShareTab station={station} />;
}
