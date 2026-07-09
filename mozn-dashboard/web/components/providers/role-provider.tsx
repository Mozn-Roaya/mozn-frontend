"use client";

import * as React from "react";

import type { UserRole } from "@/types/shared";
import type { SessionUser } from "@/lib/mappers";

interface RoleContextValue {
  /** Signed-in user's display name + email (from the backend session). */
  name: string;
  email: string;
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** True for a region-scoped account (from /api/me), not the previewed role. */
  isGov: boolean;
  /** True when the account holds no write permission at all (from /api/me). */
  readOnly: boolean;
  /** Region this (gov) account is scoped to. Super Admin sees all regions. */
  assignedRegion: string;
  /** The account's real backend permissions. */
  permissions: string[];
  /** Whether the signed-in account holds a specific backend permission. Gate
   * individual actions on this (e.g. can("thresholds.create")). */
  can: (permission: string) => boolean;
}

const RoleContext = React.createContext<RoleContextValue>({
  name: "",
  email: "",
  role: "Gov Viewer",
  setRole: () => {},
  isGov: true,
  readOnly: true,
  assignedRegion: "",
  permissions: [],
  can: () => false,
});

/**
 * Holds the signed-in identity + active role. Seeded from the real backend
 * session (`/api/me`, resolved server-side in the dashboard layout). The role
 * switcher stays as a client-side *preview* of the role-scoped experience — the
 * backend remains the source of truth and enforces permissions on every call,
 * so previewing a higher role just surfaces 403s on write, it doesn't grant
 * access.
 */
export function RoleProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser;
  children: React.ReactNode;
}) {
  const [role, setRole] = React.useState<UserRole>(initialUser.role);

  const value = React.useMemo<RoleContextValue>(
    () => ({
      name: initialUser.name,
      email: initialUser.email,
      role,
      setRole,
      // Gating reflects the REAL signed-in account (its /api/me permissions), not
      // the previewed role — "whoever logs in sees exactly what they have". The
      // role switcher stays a cosmetic label preview; the backend enforces perms.
      isGov: initialUser.isGov,
      readOnly: initialUser.readOnly,
      assignedRegion: initialUser.assignedRegion,
      permissions: initialUser.permissions,
      can: (permission: string) => initialUser.permissions.includes(permission),
    }),
    [
      role,
      initialUser.name,
      initialUser.email,
      initialUser.assignedRegion,
      initialUser.isGov,
      initialUser.readOnly,
      initialUser.permissions,
    ],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return React.useContext(RoleContext);
}
