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
  /** True for Gov Editor / Gov Viewer — the region-scoped, mostly read-only roles. */
  isGov: boolean;
  /** Gov Viewer can read but not mutate; Super Admin and Gov Editor can act. */
  readOnly: boolean;
  /** Region this (gov) account is scoped to. Super Admin sees all regions. */
  assignedRegion: string;
}

const RoleContext = React.createContext<RoleContextValue>({
  name: "",
  email: "",
  role: "Gov Viewer",
  setRole: () => {},
  isGov: true,
  readOnly: true,
  assignedRegion: "",
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
      // Derived from the current (possibly previewed) role, matching the design's
      // role model. At login this is the user's real role, so gating is correct.
      isGov: role !== "Super Admin",
      readOnly: role === "Gov Viewer",
      assignedRegion: initialUser.assignedRegion,
    }),
    [role, initialUser.name, initialUser.email, initialUser.assignedRegion],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return React.useContext(RoleContext);
}
