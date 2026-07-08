import { getAlertHistory } from "@/lib/api";
import { AlertHistoryView } from "@/features/history/components/alert-history-view";

export const dynamic = "force-dynamic";

export default async function HistoryPageRoute() {
  const alerts = await getAlertHistory();

  return <AlertHistoryView page={alerts} />;
}
