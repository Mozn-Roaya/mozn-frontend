import { Suspense } from "react";

import { getDashboardOverview } from "@/lib/api";
import { DashboardSwitch } from "@/features/dashboard/components/dashboard-switch";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

// The dashboard reflects live operational state — render per request.
export const dynamic = "force-dynamic";

async function DashboardData() {
  const overview = await getDashboardOverview();
  return <DashboardSwitch overview={overview} />;
}

export default function DashboardPage() {
  // Stream the overview: show the skeleton while the request resolves, so the
  // page paints instantly and reserves layout (scoped here, not the whole group).
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
