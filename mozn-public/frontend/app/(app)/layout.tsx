import * as React from "react";

import { MapCanvas } from "@/features/map";

import { listStations } from "../../components/api/stations";
import { getServerLang } from "../../components/lib/lang-server";
import { EventsListener } from "../../components/state/events-listener";
import { LanguageProvider } from "../../components/state/lang-context";
import { StationsProvider } from "../../components/state/stations-context";
import { TopBar } from "../../components/ui/top-bar";

import type { Station } from "../../components/api/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerLang();

  let stations: Station[] = [];
  try {
    // Fresh (uncached) so an SSE-triggered router.refresh() picks up a
    // just-confirmed alert's pin colour immediately, not after the cache TTL.
    stations = await listStations(undefined, { fresh: true });
  } catch (err) {
    console.error("Failed to load stations:", err);
  }

  return (
    <LanguageProvider lang={lang}>
      <StationsProvider stations={stations}>
        <EventsListener />
        <div className="relative h-screen w-screen overflow-hidden bg-(--color-bg-primary) flex flex-col lg:flex-row">
          <TopBar lang={lang} />
          <div className="relative flex-1 min-h-0">
            <MapCanvas />
          </div>
          {children}
        </div>
      </StationsProvider>
    </LanguageProvider>
  );
}
