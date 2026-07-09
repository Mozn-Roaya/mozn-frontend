import { getTemplates } from "@/lib/api";
import { AlertTemplatesView } from "@/features/alert-templates/components/alert-templates-view";

export const dynamic = "force-dynamic";

export default async function AlertTemplatesPageRoute() {
  // The dashboard reflects live state; if the backend is unreachable we still
  // render the (empty) view rather than erroring the whole route.
  const templates = await getTemplates().catch(() => []);
  return <AlertTemplatesView initialTemplates={templates} />;
}
