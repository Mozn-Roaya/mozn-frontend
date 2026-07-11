import { notFound } from "next/navigation";

import { StationOverview, StationOffline } from "@/features/station";

import { listAlerts } from "../../../../components/api/alerts";
import { getDailyForecast } from "../../../../components/api/forecasts";
import { getLatestReading } from "../../../../components/api/readings";
import { getStation } from "../../../../components/api/stations";
import { getServerLang } from "../../../../components/lib/lang-server";

type WarningParam = "collapsed" | "expanded" | undefined;

export default async function StationOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ stationId: string }>;
  searchParams: Promise<{ warning?: string }>;
}) {
  const { stationId } = await params;
  const decodedId = decodeURIComponent(stationId);
  const { warning: warningRaw } = await searchParams;
  const lang = await getServerLang();

  let station;
  try {
    // fresh:true so a just-resolved/confirmed alert is reflected the moment the
    // page is opened (or on an SSE-triggered router.refresh) rather than lingering
    // for the Data-Cache TTL after the map pin has already updated.
    station = await getStation(decodedId, { fresh: true });
  } catch {
    notFound();
  }
  if (!station) notFound();

  if (station.status === "offline") {
    return <StationOffline station={station} lang={lang} />;
  }

  const [reading, forecast, alertsEnvelope] = await Promise.all([
    getLatestReading(decodedId).catch(() => null),
    getDailyForecast(decodedId, 7).catch(() => []),
    // `station_id` is forward-compatible — backend currently ignores it (no
    // such filter in swagger), so we request the full active-alerts set
    // (cap = 1000) and narrow client-side. Once the backend honors the
    // param, the response will already be narrow and the filter becomes a
    // no-op without code changes.
    listAlerts({ station_id: decodedId, page_size: 1000 }, { fresh: true }).catch(
      () => null,
    ),
  ]);

  const stationAlerts = (alertsEnvelope?.data ?? []).filter(
    (a) => a.station_id === decodedId,
  );

  const warningOverride: WarningParam =
    warningRaw === "expanded" || warningRaw === "collapsed" ? warningRaw : undefined;

  return (
    <StationOverview
      station={station}
      reading={reading}
      forecast={forecast}
      alerts={stationAlerts}
      warningOverride={warningOverride ?? null}
      lang={lang}
    />
  );
}
