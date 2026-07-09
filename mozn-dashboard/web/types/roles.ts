/**
 * Role → permission matrix shapes (A4.2). Built by the server adapter
 * `getRoleMatrix` in lib/api from the real GET /api/roles + GET /api/permissions,
 * and consumed by the client matrix editor. Kept in the shared types/ layer so
 * both the server adapter and the client component can import them (lib/api is
 * server-only and can't be imported by a client component).
 */

export interface RoleMatrixRole {
  id: string;
  /** raw backend role name (admin, operator, gov_editor, …) */
  name: string;
  /** humanized for display */
  label: string;
  rank: number;
  /** currently-granted permission IDs */
  permissionIds: string[];
}

export interface RoleMatrixPermission {
  id: string;
  /** Raw backend permission string / RBAC contract, e.g. "alerts.resolve". Kept
   * for tooltips + as the stable identity; never shown as the primary label. */
  name: string;
  /** e.g. "alerts" (name before the dot) */
  group: string;
  /** e.g. "resolve" (name after the dot) */
  action: string;
  /** Humanized group for a section header, e.g. "audit_log" → "Audit Log". */
  groupLabel: string;
  /** Humanized action for the row label, e.g. "resolve" → "Resolve". */
  label: string;
}

export interface RoleMatrix {
  roles: RoleMatrixRole[];
  permissions: RoleMatrixPermission[];
}
