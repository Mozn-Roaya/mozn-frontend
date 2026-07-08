import type { Entry } from "../i18n";

// Namespaced keys for the Alerts & Thresholds screen. Shared vocabulary
// (severity.*, region.*, common.*) lives in chrome.ts and is reused here.
export const thresholds: Record<string, Entry> = {
  // Metric selector (threshold parameter names)
  "thresholds.metric.rainfall": { en: "Rainfall", ar: "الأمطار" },
  "thresholds.metric.wind": { en: "Wind", ar: "الرياح" },
  "thresholds.metric.water": { en: "Water level", ar: "منسوب المياه" },
  "thresholds.metric.temperature": { en: "Temperature", ar: "درجة الحرارة" },

  // Threshold card heading + overrides toggle
  "thresholds.perStationOverrides": {
    en: "Per-station overrides",
    ar: "تجاوزات لكل محطة",
  },

  // Tier mode badges
  // Alert-level key (single-metric tab legend)

  // Tier sustained-duration help text

  // Edit affordance (aria-label per tier)

  // Impact bar
  "thresholds.impact.note": {
    en: "If applied now, {count} stations would change state.",
    ar: "في حال التطبيق الآن، ستتغيّر حالة {count} محطات.",
  },
  "thresholds.saveApply": { en: "Save & apply", ar: "حفظ وتطبيق" },
  "thresholds.savedToast": {
    en: "Thresholds saved and applied",
    ar: "تم حفظ الحدود وتطبيقها",
  },

  // Top-level tabs (Single metric / Compound rules / Forecast-based)

  // Section group labels (single-screen hierarchy)
  "thresholds.section.perMetric": { en: "Per-metric thresholds", ar: "حدود لكل مقياس" },
  "thresholds.section.perMetricDesc": {
    en: "Set the Advisory, Watch and Warning cut-offs for each measured metric.",
    ar: "حدّد عتبات الإرشاد والمراقبة والتحذير لكل مقياس.",
  },

  // Master–detail metric editor
  "thresholds.editor.metricsAria": { en: "Metrics", ar: "المقاييس" },
  "thresholds.editor.selectMetric": { en: "Edit {metric} thresholds", ar: "تعديل حدود {metric}" },
  "thresholds.mustExceed": { en: "Must be above {prev}", ar: "يجب أن تكون أكبر من {prev}" },
  "thresholds.summaryFrom": { en: "Triggers from", ar: "يبدأ التفعيل من" },
  // Empty state (no metrics returned — replaces the whole editor)
  "thresholds.editor.empty.title": { en: "No threshold metrics yet", ar: "لا توجد مقاييس حدود بعد" },
  "thresholds.editor.empty.body": {
    en: "Metric thresholds will appear here once they're available.",
    ar: "ستظهر حدود المقاييس هنا بمجرد توفرها.",
  },

  // Table column headers (compound / forecast tabs)

  // Tier editor dialog

  // Change history
  "thresholds.history.title": { en: "Change history", ar: "سجل التغييرات" },
  "thresholds.history.revert": { en: "Revert", ar: "تراجع" },
  "thresholds.history.revertConfirmTitle": {
    en: "Revert this change?",
    ar: "تراجع عن هذا التغيير؟",
  },
  "thresholds.history.revertConfirmDesc": {
    en: "This restores the threshold values from before “{change}”. You can re-apply it later from the history.",
    ar: "سيعيد هذا قيم الحدود إلى ما قبل «{change}». يمكنك إعادة تطبيقه لاحقًا من السجل.",
  },
  "thresholds.history.revertConfirmCta": { en: "Revert change", ar: "نعم، تراجع" },
  "thresholds.history.reverted": { en: "Change reverted", ar: "تم التراجع عن التغيير" },
  "thresholds.history.emptyTitle": { en: "No changes yet", ar: "لا توجد تغييرات بعد" },
  "thresholds.history.empty": { en: "No changes recorded yet.", ar: "لا توجد تغييرات مسجّلة بعد." },
  "thresholds.history.by": { en: "by {name}", ar: "بواسطة {name}" },

  // Compound rules

  // Forecast-based
};
