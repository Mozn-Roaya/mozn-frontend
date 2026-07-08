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
}

export interface UsersPage {
  adminCount: number;
  govCount: number;
  filters: FilterTab[];
  users: UserRow[];
}
