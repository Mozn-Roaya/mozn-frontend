import { notFound } from "next/navigation";

import { getStations } from "@/lib/api";
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

  return (
    <StationForm
      mode="edit"
      regions={regions}
      initial={{ name: row.name, nameAr: row.nameAr, region: row.region }}
    />
  );
}
