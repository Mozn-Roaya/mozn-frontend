import { notFound } from "next/navigation";
import * as React from "react";

import { StationSidePanel } from "@/features/station";

import { getStation } from "../../../../components/api/stations";
import { getServerLang } from "../../../../components/lib/lang-server";

export default async function StationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = await params;
  const lang = await getServerLang();
  let station;
  try {
    // fresh:true so this matches the page's getStation({fresh:true}) — same fetch
    // options let Next dedupe them (one fetch, not two) and keep the side panel's
    // alert state in sync with the page instead of up-to-60s stale.
    station = await getStation(decodeURIComponent(stationId), { fresh: true });
  } catch {
    notFound();
  }
  if (!station) notFound();

  return (
    <StationSidePanel station={station} lang={lang}>
      {children}
    </StationSidePanel>
  );
}
