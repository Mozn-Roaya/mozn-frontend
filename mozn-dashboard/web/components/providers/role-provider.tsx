"use client";

import * as React from "react";

import type { UserRole } from "@/types/shared";

const STORAGE_KEY = "mozn-demo-role";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** True for Gov Editor / Gov Viewer — the region-scoped, mostly read-only roles. */
  isGov: boolean;
  /** Gov Viewer can read but not mutate; Super Admin and Gov Editor can act. */
  readOnly: boolean;
  /** Region this (gov) account is scoped to. Super Admin sees all regions. */
  assignedRegion: string;
}

// No real signed-in identity exists in this demo, so default to the
// lowest-privilege role (region-scoped + read-only) rather than granting
// full admin access for free. This is a pure enum value — no person attached.
const DEFAULT_ROLE: UserRole = "Gov Viewer";
const GOV_REGION = "Cyrenaica (East)";

function isRole(value: unknown): value is UserRole {
  return value === "Super Admin" || value === "Gov Editor" || value === "Gov Viewer";
}

// Module-level pub/sub so the persisted role reads as an external store: the
// server snapshot is the default (no localStorage during SSR) and the client
// re-syncs from storage right after hydration — no synchronous setState in an
// effect, and no hydration mismatch.
let roleListeners: Array<() => void> = [];

function subscribeRole(onChange: () => void) {
  roleListeners = [...roleListeners, onChange];
  return () => {
    roleListeners = roleListeners.filter((l) => l !== onChange);
  };
}

function readStoredRole(): UserRole {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isRole(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_ROLE;
}

// isGov/readOnly below are the derived flags for DEFAULT_ROLE ("Gov Viewer");
// keep them in sync with the `value` memo's derivation if the default changes.
const RoleContext = React.createContext<RoleContextValue>({
  role: DEFAULT_ROLE,
  setRole: () => {},
  isGov: true,
  readOnly: true,
  assignedRegion: GOV_REGION,
});

/**
 * Holds the active role for the demo role-switcher. There is no real auth
 * backend here; this lets the UI preview the region-scoped Gov experience and
 * the role-based nav/permissions without a login server. Persisted to
 * localStorage so the choice survives reloads.
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const role = React.useSyncExternalStore(subscribeRole, readStoredRole, () => DEFAULT_ROLE);

  const setRole = React.useCallback((next: UserRole) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    for (const l of roleListeners) l();
  }, []);

  const value = React.useMemo<RoleContextValue>(
    () => ({
      role,
      setRole,
      isGov: role !== "Super Admin",
      readOnly: role === "Gov Viewer",
      assignedRegion: GOV_REGION,
    }),
    [role, setRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return React.useContext(RoleContext);
}
