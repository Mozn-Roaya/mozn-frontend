import { getAlertHistory } from "@/lib/api";
import { AlertHistoryView } from "@/features/history/components/alert-history-view";

export const dynamic = "force-dynamic";

const RANGES = ["24h", "7d", "30d", "90d"];

export default async function HistoryPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.range && RANGES.includes(sp.range) ? sp.range : "7d";
  // The from/to window is computed inside getAlertHistory (server adapter).
  const alerts = await getAlertHistory({ range });

  return <AlertHistoryView page={alerts} range={range} />;
}
