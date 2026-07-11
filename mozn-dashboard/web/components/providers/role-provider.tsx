"use client";

import * as React from "react";

import type { UserRole } from "@/types/shared";
import type { SessionUser } from "@/lib/mappers";

interface RoleContextValue {
  /** Signed-in user's display name + email (from the backend session). */
  name: string;
  email: string;
  role: UserRole;
  /** True for a region-scoped account (from /api/me). */
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
  isGov: true,
  readOnly: true,
  assignedRegion: "",
  permissions: [],
  can: () => false,
});

/**
 * Holds the signed-in identity + role, seeded from the real backend session
 * (`/api/me`, resolved server-side in the dashboard layout). Everything here
 * reflects the actual account: whoever logs in sees exactly what their role
 * grants, and the backend enforces the same permissions on every call.
 */
export function RoleProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser;
  children: React.ReactNode;
}) {
  const value = React.useMemo<RoleContextValue>(
    () => ({
      name: initialUser.name,
      email: initialUser.email,
      role: initialUser.role,
      isGov: initialUser.isGov,
      readOnly: initialUser.readOnly,
      assignedRegion: initialUser.assignedRegion,
      permissions: initialUser.permissions,
      can: (permission: string) => initialUser.permissions.includes(permission),
    }),
    [
      initialUser.name,
      initialUser.email,
      initialUser.role,
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
