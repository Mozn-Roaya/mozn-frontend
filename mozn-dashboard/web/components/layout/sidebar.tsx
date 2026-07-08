import { SidebarContent } from "./sidebar-content";

/** Fixed desktop sidebar (≥ lg). The mobile drawer lives in the Topbar. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-[260px] border-e border-border bg-card lg:block">
      <SidebarContent />
    </aside>
  );
}
