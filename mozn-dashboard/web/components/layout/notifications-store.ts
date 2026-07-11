"use client";

import * as React from "react";

// Module-level store for the notification bell, fed by the real-time SSE stream
// (see events-provider.tsx). Mirrors the toaster's tiny external-store pattern so
// `pushAlertNotif` can be called from anywhere and the bell + badge re-render via
// useSyncExternalStore. Raw alert fields are kept (not pre-formatted) so the menu
// localizes them at render — they flip with the language instantly.
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

const CAP = 30;
let notifs: AlertNotif[] = [];
let listeners: Array<() => void> = [];

function emit() {
  for (const l of listeners) l();
}

export function pushAlertNotif(n: Omit<AlertNotif, "read">) {
  if (notifs.some((x) => x.id === n.id && x.type === n.type)) return; // dedup
  notifs = [{ ...n, read: false }, ...notifs].slice(0, CAP);
  emit();
}

export function markAllNotifsRead() {
  if (notifs.every((n) => n.read)) return;
  notifs = notifs.map((n) => (n.read ? n : { ...n, read: true }));
  emit();
}

export function markNotifRead(id: string) {
  notifs = notifs.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n));
  emit();
}

function subscribe(cb: () => void) {
  listeners = [...listeners, cb];
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

// `notifs` is only ever replaced (never mutated), so it's a stable snapshot.
// Empty on the server → no hydration mismatch (the client starts empty too).
export function useAlertNotifs(): AlertNotif[] {
  return React.useSyncExternalStore(
    subscribe,
    () => notifs,
    () => notifs,
  );
}
