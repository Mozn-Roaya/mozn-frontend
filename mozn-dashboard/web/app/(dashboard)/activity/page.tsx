import { getActivityLog } from "@/lib/api";
import { ActivityLogView } from "@/features/activity/components/activity-log-view";

export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export default async function ActivityLogPageRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(first(sp.page)) || 1;
  const pageSize = Number(first(sp.page_size)) || 25;
  const categoryParam = first(sp.category);
  const categories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
  const from = first(sp.from);
  const to = first(sp.to);

  const activity = await getActivityLog({ page, pageSize, categories, from, to });

  return <ActivityLogView page={activity} />;
}
