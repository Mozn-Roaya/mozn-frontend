/**
 * Settings API contract types. Mirror the JSON served by the Go backend
 * (internal/model/settings.go). Part of the shared types/ contract layer so the
 * fetch layer (lib/api) can reference them without reaching into features/. The
 * settings feature re-exports these from features/settings/types.
 */
export interface NotificationPref {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  highlight?: boolean;
}

export interface ValidationRule {
  metric: string;
  validRange: string;
  maxRate: string;
  active: boolean;
}

export interface SettingsPage {
  notifications: NotificationPref[];
  validationNote: string;
  validationRules: ValidationRule[];
}
