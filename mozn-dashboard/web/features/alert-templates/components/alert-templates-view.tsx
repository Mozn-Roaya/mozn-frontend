"use client";

import * as React from "react";
import {
  Check,
  CloudRain,
  Eye,
  GripVertical,
  Headset,
  Info,
  LayoutTemplate,
  type LucideIcon,
  MoreHorizontal,
  Pencil,
  PencilLine,
  PhoneCall,
  Plus,
  Save,
  ThermometerSnowflake,
  ThermometerSun,
  Trash2,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
import { useAdminConfig } from "@/components/providers/admin-config-provider";
import type {
  AlertTemplate,
  TemplateVersionKey,
} from "@/features/alert-templates/types";
import type { LocalizedStep } from "@/types/shared";

const EVENT_ICON: Record<string, LucideIcon> = {
  flashFlood: Waves,
  heavyRain: CloudRain,
  highWind: Wind,
  heatwave: ThermometerSun,
  coastalSurge: Waves,
  tempDrop: ThermometerSnowflake,
};

const VERSION_KEYS: TemplateVersionKey[] = ["enDay", "enNight", "arDay", "arNight"];
const isArabicVersion = (k: TemplateVersionKey) => k === "arDay" || k === "arNight";

/**
 * Structural placeholder used only when there are no templates to select, so
 * `active` (below) is always a well-typed `AlertTemplate` and every hook that
 * reads it can run unconditionally. Every field is blank/empty — this is not
 * seed content and is never inserted into `templates`.
 */
const EMPTY_TEMPLATE: AlertTemplate = {
  id: "",
  eventKey: "",
  versions: { enDay: "", enNight: "", arDay: "", arNight: "" },
  steps: [],
};

const doneCount = (v: Record<TemplateVersionKey, string>) =>
  VERSION_KEYS.filter((k) => v[k].trim() !== "").length;

/**
 * Four-segment meter mirroring the four required versions (EN/AR × day/night).
 * Lives in the editor header as the single detailed completion read — the
 * template list uses a plain ready/×4 marker so the two don't compete.
 */
function VersionMeter({ done }: { done: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {VERSION_KEYS.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-6 rounded-full transition-colors",
            i < done ? "bg-status-normal" : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

export function AlertTemplatesView() {
  const { t, locale } = useLocale();
  const { templateSteps, setTemplateSteps, contactsForCity } = useAdminConfig();
  // The preview mirrors the citizen alert card, which shows national emergency
  // numbers; templates aren't city-scoped, so fall back to the national default.
  const contacts = contactsForCity();
  const [templates, setTemplates] = React.useState<AlertTemplate[]>([]);
  const [activeId, setActiveId] = React.useState("");
  const hasTemplates = templates.length > 0;
  const active =
    templates.find((tp) => tp.id === activeId) ?? templates[0] ?? EMPTY_TEMPLATE;

  // Event names are keyed under templates.event.*; user-created templates use a
  // unique "custom-N" key with no dictionary entry, so fall back to the generic
  // "New template" label for those.
  const eventLabel = React.useCallback(
    (key: string) =>
      dict["templates.event." + key]
        ? t("templates.event." + key)
        : t("templates.event.custom"),
    [t],
  );

  // The event label in a specific language (not the active locale) — used to
  // seed each side of the bilingual rename dialog with a sensible default.
  const eventLabelIn = React.useCallback(
    (key: string, lang: "en" | "ar") =>
      (dict["templates.event." + key] ?? dict["templates.event.custom"])[lang],
    [],
  );

  // A template's display name is its custom name for the active locale (falling
  // back to the other language, then the event label) — so both seeded and
  // user-created templates read correctly in either language.
  const templateName = React.useCallback(
    (tp: AlertTemplate) => {
      const name =
        tp.name?.[locale]?.trim() || tp.name?.[locale === "en" ? "ar" : "en"]?.trim();
      return name || eventLabel(tp.eventKey);
    },
    [eventLabel, locale],
  );

  // Append a blank template and open it for editing. A unique eventKey keeps each
  // new template's saved response steps isolated in the shared store.
  const nextCustom = React.useRef(1);
  const addTemplate = () => {
    const n = nextCustom.current++;
    const id = `tpl-custom-${n}`;
    setTemplates((prev) => [
      ...prev,
      {
        id,
        eventKey: `custom-${n}`,
        versions: { enDay: "", enNight: "", arDay: "", arNight: "" },
        steps: [],
      },
    ]);
    setActiveId(id);
  };

  // Open a template for editing. Selecting a row already swaps the (always
  // visible) editor, so a plain setActiveId here was a no-op on the template
  // that's already active — "Edit" looked broken. We also bring the editor into
  // view and focus its first message field for feedback every time. The focus
  // move must happen in the menu's onCloseAutoFocus (below): Radix returns focus
  // to the trigger on close, which would otherwise clobber an earlier focus().
  const pendingEditFocus = React.useRef(false);
  const openEdit = (tp: AlertTemplate) => {
    setActiveId(tp.id);
    pendingEditFocus.current = true;
  };
  const focusEditor = (e: Event) => {
    if (!pendingEditFocus.current) return;
    pendingEditFocus.current = false;
    e.preventDefault(); // keep Radix from restoring focus to the trigger
    const first = document.getElementById("tpl-enDay") as HTMLTextAreaElement | null;
    if (!first) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    first.focus({ preventScroll: true });
  };

  // Rename — a small dialog seeded with the current display name.
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState({ en: "", ar: "" });
  const openRename = (tp: AlertTemplate) => {
    setRenameId(tp.id);
    setRenameDraft({
      en: tp.name?.en?.trim() || eventLabelIn(tp.eventKey, "en"),
      ar: tp.name?.ar?.trim() || eventLabelIn(tp.eventKey, "ar"),
    });
  };
  const commitRename = () => {
    const en = renameDraft.en.trim();
    const ar = renameDraft.ar.trim();
    if (!renameId || !en || !ar) return;
    setTemplates((prev) =>
      prev.map((tp) => (tp.id === renameId ? { ...tp, name: { en, ar } } : tp)),
    );
    setRenameId(null);
    toast(t("templates.renamedToast"));
  };

  // Delete — confirmed, since there's no undo. Guarded so at least one template
  // always remains (the editor assumes an active template exists).
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const deleteTarget = templates.find((tp) => tp.id === deleteId) ?? null;
  const confirmDelete = () => {
    if (!deleteId) return;
    setTemplates((prev) => {
      const next = prev.filter((tp) => tp.id !== deleteId);
      if (deleteId === activeId && next.length) setActiveId(next[0].id);
      return next;
    });
    setDeleteId(null);
    toast(t("templates.deletedToast"));
  };

  // The committed steps live in the shared store (so the citizen card reads
  // them); fall back to the template's own seed when the store has none.
  const savedSteps = templateSteps[active.eventKey] ?? active.steps;

  // Draft buffers for the active template; Save commits them.
  const [draft, setDraft] = React.useState<Record<TemplateVersionKey, string>>(active.versions);
  const [steps, setSteps] = React.useState<LocalizedStep[]>(savedSteps);
  const [previewKey, setPreviewKey] = React.useState<TemplateVersionKey>("enDay");

  // Reset the drafts when switching templates (steps come from the store).
  // Adjusting state during render — tracked against the previously loaded id —
  // rather than in an effect avoids a frame showing the old template's draft.
  const [draftForId, setDraftForId] = React.useState(activeId);
  if (draftForId !== activeId) {
    setDraftForId(activeId);
    const next = templates.find((tp) => tp.id === activeId);
    if (next) {
      setDraft(next.versions);
      setSteps(templateSteps[next.eventKey] ?? next.steps);
    }
  }

  const done = doneCount(draft);
  const ready = done === VERSION_KEYS.length;
  const versionsDirty = VERSION_KEYS.some((k) => draft[k] !== active.versions[k]);
  const stepsDirty =
    steps.length !== savedSteps.length ||
    steps.some((s, i) => s.en !== savedSteps[i].en || s.ar !== savedSteps[i].ar);
  // Response steps are separate citizen guidance, so they save on their own.
  // Message-version edits still require all four versions before they persist
  // (the A3.1 "complete before publish" rule).
  const canSave = stepsDirty || (versionsDirty && ready);

  const Icon = EVENT_ICON[active.eventKey] ?? TriangleAlert;
  const eventName = templateName(active);

  // Step list helpers. Each step holds both languages; edits target one side.
  const setStep = (i: number, lang: keyof LocalizedStep, value: string) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, [lang]: value } : st)));
  const addStep = () => setSteps((s) => [...s, { en: "", ar: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: -1 | 1) => moveStepTo(i, i + dir);
  const moveStepTo = (from: number, to: number) =>
    setSteps((s) => {
      if (to < 0 || to >= s.length || from === to) return s;
      const next = [...s];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Drag-to-reorder state for the step list (native HTML5 DnD, drag from handle).
  const [dragStep, setDragStep] = React.useState<number | null>(null);
  const [overStep, setOverStep] = React.useState<number | null>(null);
  const endStepDrag = () => {
    setDragStep(null);
    setOverStep(null);
  };

  const save = () => {
    // Drop steps blank in both languages; trim what remains.
    const cleanedSteps = steps
      .map((s) => ({ en: s.en.trim(), ar: s.ar.trim() }))
      .filter((s) => s.en || s.ar);
    setTemplates((prev) =>
      prev.map((tp) => (tp.id === activeId ? { ...tp, versions: draft, steps: cleanedSteps } : tp)),
    );
    // Commit steps to the shared store so the citizen alert card reflects them.
    setTemplateSteps(active.eventKey, cleanedSteps);
    setSteps(cleanedSteps);
    toast(t("templates.savedToast"));
  };

  const previewText = draft[previewKey].trim();
  const previewArabic = isArabicVersion(previewKey);
  // The preview mirrors the citizen card: show each step in the previewed
  // language, falling back to the other side when one is still blank.
  const previewSteps = steps
    .map((s) => (previewArabic ? s.ar || s.en : s.en || s.ar).trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeading title={t("page.templates.title")} subtitle={t("page.templates.subtitle")} />

      {/* Three panes: pick (list) → edit (editor) → result (preview). Left and
          right rails are sticky so the busy centre editor scrolls between them;
          on narrow screens the grid collapses to a single stacked column. */}
      <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)_360px]">
        {/* ── Pane 1 · Template list ─────────────────────────────────────── */}
        <Card className="flex flex-col overflow-hidden p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("templates.libraryTitle")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={addTemplate}
              aria-label={t("templates.newTemplate")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <ul className="flex flex-col gap-0.5 overflow-y-auto p-2">
            {!hasTemplates ? (
              <li className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <LayoutTemplate className="size-5 text-muted-foreground" aria-hidden />
                <span className="text-sm text-muted-foreground">
                  {t("templates.list.empty")}
                </span>
              </li>
            ) : (
            templates.map((tp) => {
              const tdone = doneCount(tp.versions);
              const tready = tdone === VERSION_KEYS.length;
              const TIcon = EVENT_ICON[tp.eventKey] ?? TriangleAlert;
              const selected = tp.id === activeId;
              const status = tready
                ? t("templates.complete")
                : t("templates.incomplete", { done: tdone });
              return (
                <li key={tp.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveId(tp.id)}
                    aria-pressed={selected}
                    aria-label={t("templates.selectAria", { event: templateName(tp), status })}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg py-2 pe-9 ps-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "bg-brand-subtle" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <TIcon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {templateName(tp)}
                      </span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          tready ? "text-status-normal" : "text-status-advisory",
                        )}
                      >
                        {tready ? t("templates.complete") : `${tdone}/4`}
                      </span>
                    </span>
                    {tready ? (
                      <Check className="size-4 shrink-0 text-status-normal" aria-hidden />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-status-advisory" aria-hidden />
                    )}
                  </button>

                  {/* Row actions — a sibling of the select button (not nested) so
                      we never place an interactive control inside another. */}
                  <div className="absolute end-1 top-1/2 -translate-y-1/2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          aria-label={t("templates.actionsAria", { event: templateName(tp) })}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={focusEditor}>
                        <DropdownMenuItem onClick={() => openEdit(tp)}>
                          <Pencil className="size-4" />
                          {t("templates.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRename(tp)}>
                          <PencilLine className="size-4" />
                          {t("templates.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(tp.id)}
                          disabled={templates.length <= 1}
                          className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                        >
                          <Trash2 className="size-4" />
                          {t("templates.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })
            )}
          </ul>
        </Card>

        {hasTemplates ? (
        <>
        {/* ── Pane 2 · Editor ────────────────────────────────────────────── */}
        <Card className="divide-y divide-border-subtle p-0">
          {/* Header — active template, live completion meter, and Save. */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {eventName}
                </h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <VersionMeter done={done} />
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      ready ? "text-status-normal" : "text-status-advisory",
                    )}
                  >
                    {ready ? t("templates.complete") : `${done}/4`}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={save} disabled={!canSave}>
              <Save className="size-4" />
              {t("templates.save")}
            </Button>
          </div>

          {/* Message versions — 2×2 matrix: Language × day/night. */}
          <div className="p-5">
            <SectionHead
              title={t("templates.section.messages")}
              hint={t("templates.section.messagesHint")}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {VERSION_KEYS.map((k) => {
                const ar = isArabicVersion(k);
                const filled = draft[k].trim() !== "";
                return (
                  <div key={k} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`tpl-${k}`} className="text-sm font-medium text-foreground">
                        {t("templates.v." + k)}
                      </label>
                      {filled ? (
                        <Check className="size-4 text-status-normal" aria-hidden />
                      ) : (
                        <span className="size-1.5 rounded-full bg-status-advisory" aria-hidden />
                      )}
                    </div>
                    <Textarea
                      id={`tpl-${k}`}
                      value={draft[k]}
                      onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                      onFocus={() => setPreviewKey(k)}
                      dir={ar ? "rtl" : "ltr"}
                      rows={3}
                      className={cn(
                        "min-h-20 resize-none",
                        !filled && "border-status-advisory/40",
                      )}
                      placeholder={ar ? t("templates.placeholder.ar") : t("templates.placeholder.en")}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Response steps. */}
          <div className="p-5">
            <SectionHead
              title={t("templates.section.steps")}
              hint={t("templates.section.stepsHint")}
            />
            {/* Drag a row by its handle to reorder; the handle is also
                keyboard-operable (ArrowUp/ArrowDown) for a11y. */}
            <ul className="mt-4 grid gap-2">
              {steps.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border bg-secondary/40 py-6 text-center text-sm text-muted-foreground">
                  {t("templates.noSteps")}
                </li>
              ) : (
                steps.map((step, i) => (
                  <li
                    key={i}
                    onDragOver={(e) => {
                      if (dragStep === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overStep !== i) setOverStep(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragStep !== null) moveStepTo(dragStep, i);
                      endStepDrag();
                    }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg transition-colors",
                      dragStep === i && "opacity-40",
                      overStep === i &&
                        dragStep !== null &&
                        dragStep !== i &&
                        "bg-brand-subtle/50 ring-2 ring-inset ring-brand-foreground/40",
                    )}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDragStep(i);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(i));
                      }}
                      onDragEnd={endStepDrag}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          moveStep(i, -1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          moveStep(i, 1);
                        }
                      }}
                      className="mt-1 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                      aria-label={t("templates.dragStep", { n: i + 1 })}
                      title={t("templates.dragStep", { n: i + 1 })}
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </button>
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-subtle text-xs font-semibold tabular-nums text-brand-foreground">
                      {i + 1}
                    </span>
                    {/* Both language versions of the one step, kept in the same
                        row so they stay paired through reorder / add / remove. */}
                    <div className="grid flex-1 gap-1.5">
                      <Input
                        value={step.en}
                        dir="ltr"
                        onChange={(e) => setStep(i, "en", e.target.value)}
                        placeholder={t("templates.stepHint.en")}
                        aria-label={t("templates.stepEn", { n: i + 1 })}
                      />
                      <Input
                        value={step.ar}
                        dir="rtl"
                        onChange={(e) => setStep(i, "ar", e.target.value)}
                        placeholder={t("templates.stepHint.ar")}
                        aria-label={t("templates.stepAr", { n: i + 1 })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-1 size-8 shrink-0 text-muted-foreground hover:text-text-warning"
                      onClick={() => removeStep(i)}
                      aria-label={t("templates.removeStep")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
            <Button variant="outline" size="sm" className="mt-3 w-fit" onClick={addStep}>
              <Plus className="size-4" />
              {t("templates.addStep")}
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden />
              {t("templates.emergencyNote")}
            </p>
          </div>
        </Card>

        {/* ── Pane 3 · Live preview (sticky) ─────────────────────────────── */}
        <Card className="p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-foreground">
              <Eye className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">{t("templates.preview")}</h2>
              {/* Name the version being previewed so it isn't implicit — it
                  follows whichever message field is focused. */}
              <p className="truncate text-xs text-muted-foreground">
                {t("templates.v." + previewKey)}
              </p>
            </div>
          </div>

          {/* Citizen-facing banner mock — mirrors the live AlertCard citizens see
              in the station detail (see station-summary-card.tsx): a tinted
              warning header band with a LIVE pill, then the numbered response
              steps and national emergency contacts. */}
          <div
            dir={previewArabic ? "rtl" : "ltr"}
            className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            {/* Header band */}
            <div className="bg-status-warning/10 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <TriangleAlert className="size-5 shrink-0 text-status-warning" aria-hidden />
                  <span className="truncate text-lg font-bold text-foreground">{eventName}</span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-status-warning px-2 py-0.5">
                  <span className="size-1 rounded-full bg-white" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                    {t("dashboard.station.live")}
                  </span>
                </span>
              </div>
              {previewText ? (
                <p className="mt-2 text-xs leading-[18px] text-text-secondary">{previewText}</p>
              ) : (
                <p className="mt-2 text-xs italic leading-[18px] text-muted-foreground">
                  {t("templates.preview.empty")}
                </p>
              )}
            </div>

            {/* Expanded body: response steps + emergency contacts */}
            {previewSteps.length > 0 ? (
              <div className="flex flex-col gap-4 px-5 py-4">
                <ol className="flex flex-col gap-3.5">
                  {previewSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-status-warning/10 text-xs font-semibold tabular-nums text-status-warning">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
                <div className="h-px w-full bg-border-subtle" />
                <div className="flex gap-2.5">
                  <ContactTile
                    icon={Headset}
                    label={t("dashboard.station.emergencyServices")}
                    number={contacts.emergencyServices}
                  />
                  <ContactTile
                    icon={PhoneCall}
                    label={t("dashboard.station.civilDefense")}
                    number={contacts.civilDefense}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Info note */}
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-text-link/10 px-3.5 py-3 text-xs leading-relaxed text-text-link">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("templates.preview.note")}
          </p>
        </Card>
        </>
        ) : (
        <Card className="lg:col-span-2">
          <EmptyState
            icon={LayoutTemplate}
            title={t("templates.empty.title")}
            message={t("templates.empty.body")}
            action={
              <Button onClick={addTemplate}>
                <Plus className="size-4" />
                {t("templates.newTemplate")}
              </Button>
            }
          />
        </Card>
        )}
      </div>

      {/* Rename template */}
      <Dialog open={renameId !== null} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground"
            >
              <PencilLine className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("templates.rename.title")}</DialogTitle>
              <DialogDescription>{t("templates.rename.desc")}</DialogDescription>
            </div>
          </DialogHeader>

          <form
            id="template-rename-form"
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              commitRename();
            }}
          >
            <div className="grid gap-2">
              <label htmlFor="template-name-en" className="text-sm font-medium text-foreground">
                {t("templates.rename.labelEn")}
              </label>
              <Input
                id="template-name-en"
                dir="ltr"
                value={renameDraft.en}
                onChange={(e) => setRenameDraft((d) => ({ ...d, en: e.target.value }))}
                placeholder={t("templates.rename.placeholderEn")}
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="template-name-ar" className="text-sm font-medium text-foreground">
                {t("templates.rename.labelAr")}
              </label>
              <Input
                id="template-name-ar"
                dir="rtl"
                value={renameDraft.ar}
                onChange={(e) => setRenameDraft((d) => ({ ...d, ar: e.target.value }))}
                placeholder={t("templates.rename.placeholderAr")}
                autoComplete="off"
              />
            </div>
          </form>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="template-rename-form"
              disabled={!renameDraft.en.trim() || !renameDraft.ar.trim()}
            >
              <Check className="size-4" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete template — confirmed (no undo) */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning"
            >
              <TriangleAlert className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("templates.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("templates.delete.desc", {
                  name: deleteTarget ? templateName(deleteTarget) : "",
                })}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button variant="destructive" type="button" onClick={confirmDelete}>
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Emergency-contact tile in the preview — matches the citizen AlertCard. */
function ContactTile({
  icon: Icon,
  label,
  number,
}: {
  icon: LucideIcon;
  label: string;
  number: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums text-foreground">{number}</p>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
