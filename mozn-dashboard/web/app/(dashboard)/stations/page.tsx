import { getStations } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { StationsTable } from "@/features/stations/components/stations-table";
import { AddStationDialog } from "@/features/stations/components/add-station-dialog";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function StationsPageRoute() {
  const page = await getStations();
  const { t } = await getServerT();

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.stations.title")}
        subtitle={t("page.stations.subtitle", {
          total: page.total,
          regions: page.regionCount,
          needAttention: page.needAttention,
        })}
      >
        <AddStationDialog regions={page.groups.map((g) => g.region)} />
      </PageHeading>

      <StationsTable page={page} />
    </div>
  );
}
