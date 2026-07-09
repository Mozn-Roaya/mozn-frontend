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
  /** Backend validation_rule row id — targets PUT /api/validation-rules/:id. */
  id: string;
  /** Raw backend parameter key (e.g. "temp_high_c") — needed to keep it on PUT. */
  parameter: string;
  metric: string;
  validRange: string;
  maxRate: string;
  active: boolean;
  /** Structured numeric fields for editing (avoid the lossy display-string round-trip). */
  validRangeMin: number | null;
  validRangeMax: number | null;
  maxRateOfChange: number | null;
  rateIntervalMin: number | null;
}

export interface SettingsPage {
  notifications: NotificationPref[];
  validationNote: string;
  validationRules: ValidationRule[];
}
