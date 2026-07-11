import { getStations } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { StationsTable } from "@/features/stations/components/stations-table";
import { AddStationDialog } from "@/features/stations/components/add-station-dialog";

export const dynamic = "force-dynamic";

export default async function StationsPageRoute() {
  const page = await getStations();

  return (
    <div className="space-y-6">
      <PageHeading
        titleKey="page.stations.title"
        subtitleKey="page.stations.subtitle"
        subtitleVars={{
          total: page.total,
          regions: page.regionCount,
          needAttention: page.needAttention,
        }}
      >
        <AddStationDialog regions={page.groups.map((g) => g.region)} />
      </PageHeading>

      <StationsTable page={page} />
    </div>
  );
}
