import { getStations } from "@/lib/api";
import { StationForm } from "@/features/stations/components/station-form";

export const dynamic = "force-dynamic";

export default async function NewStationPage() {
  const page = await getStations();
  return <StationForm mode="create" regions={page.groups.map((g) => g.region)} />;
}
