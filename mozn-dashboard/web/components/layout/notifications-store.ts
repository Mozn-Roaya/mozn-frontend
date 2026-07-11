"use client";

import * as React from "react";

// Module-level store for the notification bell, fed by the real-time SSE stream
// (events-provider.tsx). Persisted to localStorage so notifications SURVIVE
// reloads + navigation (they used to live only in memory and vanished on
// refresh). Raw alert fields are kept (not pre-formatted) so the menu localizes
// them at render and they flip with the language instantly.
export interface AlertNotif {
  /** Alert id + event type form the dedup key (same event can arrive twice). */
  id: string;
  type: string; // "alert.created" | "alert.confirmed"
  severity: string; // yellow | orange | red
  parameter: string;
  message: string;
  messageAr: string;
  issuedAt: string; // ISO
  read: boolean;
}

const KEY = "mozn-notifs";
const CAP = 30;
let notifs: AlertNotif[] = [];
let listeners: Array<() => void> = [];
let hydrated = false;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(notifs));
  } catch {
    /* storage unavailable / full — keep in memory */
  }
}

/** Load persisted notifications once, on the client, after hydration — so the
 * server render (empty) and the client's first render (empty) match, then the
 * stored list fills in. Call from a client effect (see events-provider). */
export function hydrateNotifs() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as AlertNotif[]) : [];
    if (Array.isArray(saved) && saved.length) {
      notifs = saved.slice(0, CAP);
      emit();
    }
  } catch {
    /* corrupt payload — start clean */
  }
}

export function pushAlertNotif(n: Omit<AlertNotif, "read">) {
  if (notifs.some((x) => x.id === n.id && x.type === n.type)) return; // dedup
  notifs = [{ ...n, read: false }, ...notifs].slice(0, CAP);
  persist();
  emit();
}

export function markAllNotifsRead() {
  if (notifs.every((n) => n.read)) return;
  notifs = notifs.map((n) => (n.read ? n : { ...n, read: true }));
  persist();
  emit();
}

export function markNotifRead(id: string) {
  if (!notifs.some((n) => n.id === id && !n.read)) return;
  notifs = notifs.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n));
  persist();
  emit();
}

export function clearNotifs() {
  if (notifs.length === 0) return;
  notifs = [];
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

// `notifs` is only ever replaced (never mutated), so it's a stable snapshot.
// Server snapshot is always empty → matches the client's first render (which is
// also empty until hydrateNotifs runs), so no hydration mismatch.
export function useAlertNotifs(): AlertNotif[] {
  return React.useSyncExternalStore(
    subscribe,
    () => notifs,
    () => [],
  );
}
