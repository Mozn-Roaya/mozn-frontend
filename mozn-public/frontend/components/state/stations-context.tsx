"use client";

import * as React from "react";

import type { Station } from "../api/types";

const StationsContext = React.createContext<Station[]>([]);

export function StationsProvider({
  stations,
  children,
}: {
  stations: Station[];
  children: React.ReactNode;
}) {
  return <StationsContext.Provider value={stations}>{children}</StationsContext.Provider>;
}

export function useStations(): Station[] {
  return React.useContext(StationsContext);
}
