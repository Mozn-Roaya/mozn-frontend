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
const SEEN_KEY = "mozn-notifs-seen";
const CAP = 30;
let notifs: AlertNotif[] = [];
// ms watermark: on a server backfill, alerts issued AFTER this are unread
// (missed while away); older ones come in read so the badge isn't flooded.
let lastSeenAt = 0;
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

function persistSeen() {
  try {
    localStorage.setItem(SEEN_KEY, String(lastSeenAt));
  } catch {
    /* storage unavailable */
  }
}

/** Load persisted notifications once, on the client, after hydration — so the
 * server render (empty) and the client's first render (empty) match, then the
 * stored list fills in. Call from a client effect (see events-provider). */
export function hydrateNotifs() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    lastSeenAt = Number(localStorage.getItem(SEEN_KEY)) || 0;
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

/** Adds a notification; dedupes by alert id ACROSS the lifecycle so one alert
 *  going created → confirmed doesn't produce two bell entries. Returns whether it
 *  was actually added (the caller toasts only then, avoiding a double toast). */
export function pushAlertNotif(n: Omit<AlertNotif, "read">): boolean {
  if (notifs.some((x) => x.id === n.id)) return false; // dedup by alert id
  notifs = [{ ...n, read: false }, ...notifs].slice(0, CAP);
  persist();
  emit();
  return true;
}

/** Backfill from the server on load so a user who was away still sees what
 *  happened. Deduped by id (existing entries keep their read state). A new entry
 *  is unread iff it was issued after the user last viewed the bell (lastSeenAt);
 *  older history comes in read. First-ever load establishes "now" as the baseline
 *  so the initial history isn't all flagged unread. */
export function seedAlertNotifs(items: Array<Omit<AlertNotif, "read">>) {
  if (typeof window === "undefined" || items.length === 0) return;
  if (lastSeenAt === 0) {
    lastSeenAt = Date.now();
    persistSeen();
  }
  const seen = new Set(notifs.map((n) => n.id));
  const additions: AlertNotif[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    additions.push({ ...it, read: (Date.parse(it.issuedAt) || 0) <= lastSeenAt });
  }
  if (additions.length === 0) return;
  notifs = [...additions, ...notifs]
    .sort((a, b) => (Date.parse(b.issuedAt) || 0) - (Date.parse(a.issuedAt) || 0))
    .slice(0, CAP);
  persist();
  emit();
}

export function markAllNotifsRead() {
  // Mark this moment as "seen" so a later backfill won't resurface these as unread.
  lastSeenAt = Date.now();
  persistSeen();
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
