/**
 * Users API contract types. Mirror the JSON served by the Go backend
 * (internal/model/users.go). Part of the shared types/ contract layer so the
 * fetch layer (lib/api) can reference them without reaching into features/. The
 * users feature re-exports these from features/users/types.
 */
import type { FilterTab, UserRole } from "@/types/shared";

export type { UserRole };

export interface UserRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  regions: string;
  lastActive: string;
  active: boolean;
  /** Optional contact metadata (A4.1). Absent on backend-seeded rows. */
  phone?: string;
  organization?: string;
  /** Real backend role name (admin, gov_editor, …) — drives edit-dialog preselect. */
  roleName: string;
  /** Real assigned region UUIDs — drives edit-dialog preselect + region_ids writes. */
  regionIds: string[];
}

export interface UsersPage {
  adminCount: number;
  govCount: number;
  filters: FilterTab[];
  users: UserRow[];
}

/** A real backend role for the assignment dropdown (not the 3 collapsed UI roles). */
export interface RoleOption {
  id: string;
  name: string;
  label: string;
}

/** A region for the assignment multi-select. */
export interface RegionOption {
  id: string;
  name: string;
}

/** POST /api/users — create. Role is sent by NAME; regions by UUID. */
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role_name: string;
  region_ids: string[];
}

/** PUT /api/users/:id — the backend updates only these (not name/email). */
export interface UpdateUserInput {
  role_id?: string;
  is_active?: boolean;
  phone?: string;
  organization?: string;
  region_ids?: string[];
}
