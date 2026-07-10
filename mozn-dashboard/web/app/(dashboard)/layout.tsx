import { redirect } from "next/navigation";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { RoleProvider } from "@/components/providers/role-provider";
import { AdminConfigProvider } from "@/components/providers/admin-config-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RouteGuard } from "@/components/layout/route-guard";
import { AutoRefresh } from "@/components/providers/auto-refresh";
import { Toaster } from "@/components/ui/toaster";
import { getServerLocale } from "@/lib/i18n-server";
import { backendData, getCurrentUser } from "@/lib/backend";
import { buildSessionUser } from "@/lib/mappers";
import type { BackendRegion } from "@/lib/backend-types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();

  // Auth gate: every dashboard screen requires a valid backend session. Any
  // failure to resolve the signed-in user (missing/expired token, backend
  // unreachable) bounces to the login screen, which lives outside this group.
  const me = await getCurrentUser().catch(() => null);
  if (!me) redirect("/login");

  // Resolve the user's scoped region UUIDs to names for the identity chip.
  // Best-effort: gov roles may lack regions.view, in which case names are
  // omitted and the session falls back to a generic label.
  let regionNameById = new Map<string, string>();
  try {
    const regions = await backendData<BackendRegion[]>("/api/regions");
    regionNameById = new Map(regions.map((r) => [r.id, r.name]));
  } catch {
    /* region names are optional for the session chip */
  }
  const sessionUser = buildSessionUser(me, regionNameById);

  return (
    <LocaleProvider initialLocale={locale}>
      <RoleProvider initialUser={sessionUser}>
      <AdminConfigProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar />
        {/*
          Single scroll container. The document (html/body) never scrolls, so
          the viewport scrollbar can't toggle on/off when page height changes
          (e.g. the Stations bulk-action bar) — that was the "shake". And because
          Radix's scroll-lock acts on <body> (which isn't the scroller here), it
          can no longer add compensation margins or repaint the sticky header.
          `overflow-y-scroll` keeps the track always present so it never jumps.
        */}
        <div className="flex h-dvh flex-1 flex-col lg:ps-[260px]">
          <Topbar />
          {/*
            The scroller lives on <main>, below the Topbar — so the always-present
            scrollbar gutter never runs alongside the header. The document
            (html/body) still never scrolls (the outer wrapper is overflow-hidden),
            so Radix's body scroll-lock can't add compensation margins or toggle a
            viewport scrollbar — that was the "shake". `overflow-y-scroll` keeps the
            track always present so the content width never jumps.

            `relative` makes this the positioning context for its content: the
            charts' `sr-only` a11y labels are `position:absolute`, and without a
            positioned ancestor they anchored to the document, extending the html
            scroll height and toggling a *document* scrollbar on tall pages (the
            dashboard) but not short ones (the inbox) — a 10px horizontal shake on
            every navigation. Containing them here keeps that overflow inside the
            main scroller where it belongs.
          */}
          <main className="relative flex flex-1 flex-col overflow-y-scroll">
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <RouteGuard>{children}</RouteGuard>
            </div>
          </main>
        </div>
      </div>
      <AutoRefresh />
      <Toaster />
      </AdminConfigProvider>
      </RoleProvider>
    </LocaleProvider>
  );
}
