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
    station = await getStation(decodeURIComponent(stationId));
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
