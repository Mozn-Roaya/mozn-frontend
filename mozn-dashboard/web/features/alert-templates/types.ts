import type { LocalizedStep } from "@/types/shared";

export type TemplateVersionKey = "enDay" | "enNight" | "arDay" | "arNight";

/** A pre-written alert message with its four mandatory versions (A3.1). */
export interface AlertTemplate {
  id: string;
  /** i18n suffix under templates.event.* */
  eventKey: string;
  /**
   * Optional custom display name in both site languages; overrides the event
   * label when set. Bilingual like the message versions and response steps —
   * the list/editor show the name for the active locale.
   */
  name?: { en: string; ar: string };
  versions: Record<TemplateVersionKey, string>;
  /** Numbered response guidance citizens see when the alert is expanded —
   * authored in both languages (see LocalizedStep). */
  steps: LocalizedStep[];
}
