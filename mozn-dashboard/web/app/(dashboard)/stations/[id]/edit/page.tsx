import { notFound } from "next/navigation";

import { getStation, getStations } from "@/lib/api";
import { StationForm } from "@/features/stations/components/station-form";

export const dynamic = "force-dynamic";

export default async function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getStations();
  const regions = page.groups.map((g) => g.region);
  const row = page.groups.flatMap((g) => g.rows).find((r) => r.id === id);
  if (!row) notFound();

  // Full detail (coords, sensors, interval, status) so the form round-trips the
  // real values on save instead of clobbering them with defaults.
  const detail = await getStation(id).catch(() => null);

  return (
    <StationForm
      mode="edit"
      regions={regions}
      initial={{
        id: row.id,
        name: row.name,
        nameAr: row.nameAr,
        region: row.region,
        municipalityId: detail?.municipalityId ?? row.municipalityId,
        latitude: detail?.latitude,
        longitude: detail?.longitude,
        sensors: detail?.sensors,
        reportIntervalMinutes: detail?.reportIntervalMinutes,
        operationalStatus: detail?.operationalStatus,
        wuStationId: detail?.wuStationId,
      }}
    />
  );
}
