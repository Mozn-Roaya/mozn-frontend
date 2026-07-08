/**
 * Editable role/capability matrix. Grants are plain booleans (granted / not),
 * persisted to localStorage — standing in for the real backend RBAC endpoints,
 * exactly like features/settings/preferences does for operational config.
 */

import type { UserRole } from "@/types/shared";

/** Column order for the matrix; labels come from `role.${role}`. */
export const PERMISSION_ROLES: UserRole[] = ["Super Admin", "Gov Editor", "Gov Viewer"];

/** Row order for the matrix; labels come from `roles.cap.${cap}`. */
export const CAPABILITIES = [
  "viewStations",
  "manageStations",
  "configureThresholds",
  "manageAlerts",
  "manageUsers",
  "viewInbox",
  "ackAlerts",
  "viewHistory",
  "configureValidation",
  "exportData",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export type PermissionMatrix = Record<Capability, Record<UserRole, boolean>>;

/**
 * Default grants. Super Admin keeps full access on every capability — that's a
 * structural invariant, not seed data (its cells are hard-locked in the UI so
 * an admin can't revoke the rights that let them manage everyone else). Every
 * other role starts ungranted; real grants come from the backend RBAC endpoint
 * once it exists, so no non-admin role ships with fabricated access.
 */
export const DEFAULT_PERMISSIONS: PermissionMatrix = {
  viewStations: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  manageStations: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  configureThresholds: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  manageAlerts: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  manageUsers: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  viewInbox: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  ackAlerts: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  viewHistory: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  configureValidation: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
  exportData: { "Super Admin": true, "Gov Editor": false, "Gov Viewer": false },
};

const STORAGE_KEY = "mozn-role-permissions";

/** Deep-copy the matrix so callers never mutate DEFAULT_PERMISSIONS in place. */
function clone(matrix: PermissionMatrix): PermissionMatrix {
  return Object.fromEntries(
    CAPABILITIES.map((cap) => [cap, { ...matrix[cap] }]),
  ) as PermissionMatrix;
}

/**
 * Load persisted grants, merged cell-by-cell over the defaults so that a newly
 * added capability or role always has a value even against older stored data.
 * Safe to call during SSR (returns the defaults).
 */
export function loadPermissions(): PermissionMatrix {
  const merged = clone(DEFAULT_PERMISSIONS);
  if (typeof window === "undefined") return merged;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return merged;
    const parsed = JSON.parse(raw) as Partial<Record<Capability, Partial<Record<UserRole, unknown>>>>;
    for (const cap of CAPABILITIES) {
      for (const role of PERMISSION_ROLES) {
        const value = parsed?.[cap]?.[role];
        if (typeof value === "boolean") merged[cap][role] = value;
      }
    }
    return merged;
  } catch {
    return merged;
  }
}

export function savePermissions(matrix: PermissionMatrix): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  } catch {
    /* storage unavailable */
  }
}
