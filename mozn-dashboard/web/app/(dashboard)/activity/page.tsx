import { getActivityLog } from "@/lib/api";
import { ActivityLogView } from "@/features/activity/components/activity-log-view";

export const dynamic = "force-dynamic";

export default async function ActivityLogPageRoute() {
  const activity = await getActivityLog();

  return <ActivityLogView page={activity} />;
}
