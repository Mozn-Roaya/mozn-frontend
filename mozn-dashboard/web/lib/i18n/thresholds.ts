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
  "thresholds.saveFailed": { en: "Couldn't save thresholds", ar: "تعذّر حفظ الحدود" },
  "thresholds.saveInvalid": { en: "Fix the highlighted tiers first", ar: "صحّح المستويات المميّزة أولاً" },
  "thresholds.noChanges": { en: "No changes to save", ar: "لا توجد تغييرات للحفظ" },

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

  // Create-threshold dialog
  "thresholds.create.newButton": { en: "New threshold", ar: "حد جديد" },
  "thresholds.create.title": { en: "New threshold", ar: "حد جديد" },
  "thresholds.create.desc": {
    en: "Add an alert threshold for a region and parameter.",
    ar: "أضف حدًّا للتنبيه لمنطقة ومقياس محددين.",
  },
  "thresholds.create.region": { en: "Region", ar: "المنطقة" },
  "thresholds.create.regionPlaceholder": { en: "Select a region", ar: "اختر منطقة" },
  "thresholds.create.noRegions": {
    en: "No regions available to assign.",
    ar: "لا توجد مناطق متاحة للتعيين.",
  },
  "thresholds.create.parameter": { en: "Parameter", ar: "المقياس" },
  "thresholds.create.severity": { en: "Severity", ar: "مستوى الخطورة" },
  "thresholds.create.value": { en: "Value", ar: "القيمة" },
  "thresholds.create.appliesTo": { en: "Applies to", ar: "ينطبق على" },
  "thresholds.create.appliesTo.observed": { en: "Observed", ar: "المرصودة" },
  "thresholds.create.appliesTo.forecast": { en: "Forecast", ar: "المتوقعة" },
  "thresholds.create.appliesTo.both": { en: "Both", ar: "كلاهما" },
  "thresholds.create.previewHeading": { en: "Impact preview", ar: "معاينة الأثر" },
  "thresholds.create.previewHint": {
    en: "Run a dry run to see how many stations this would affect.",
    ar: "شغّل محاكاة لمعرفة عدد المحطات التي سيؤثّر عليها هذا الحد.",
  },
  "thresholds.create.previewButton": { en: "Preview impact", ar: "معاينة الأثر" },
  "thresholds.create.previewFailed": {
    en: "Couldn't preview impact",
    ar: "تعذّر معاينة الأثر",
  },
  "thresholds.create.affected": {
    en: "{count} stations affected",
    ar: "{count} محطة متأثرة",
  },
  "thresholds.create.wouldFire": {
    en: "{count} would fire now",
    ar: "{count} ستُطلق تنبيهًا الآن",
  },
  "thresholds.create.evaluated": {
    en: "{count} stations evaluated",
    ar: "تم تقييم {count} محطة",
  },
  "thresholds.create.fillFirst": {
    en: "Choose a region, parameter and value first",
    ar: "اختر المنطقة والمقياس والقيمة أولًا",
  },
  "thresholds.create.submit": { en: "Create threshold", ar: "إنشاء الحد" },
  "thresholds.create.created": { en: "Threshold created", ar: "تم إنشاء الحد" },
  "thresholds.create.failed": {
    en: "Couldn't create threshold",
    ar: "تعذّر إنشاء الحد",
  },

  // Delete-threshold confirm
  "thresholds.delete.label": { en: "Delete {tier} threshold", ar: "حذف حد {tier}" },
  "thresholds.delete.title": { en: "Delete this threshold?", ar: "حذف هذا الحد؟" },
  "thresholds.delete.desc": {
    en: "This removes the {tier} threshold for {metric}. Stations will stop alerting at this level.",
    ar: "سيؤدي هذا إلى إزالة حد {tier} لـ{metric}. ستتوقف المحطات عن التنبيه عند هذا المستوى.",
  },
  "thresholds.delete.confirm": { en: "Delete threshold", ar: "حذف الحد" },
  "thresholds.delete.deleted": { en: "Threshold deleted", ar: "تم حذف الحد" },
  "thresholds.delete.failed": {
    en: "Couldn't delete threshold",
    ar: "تعذّر حذف الحد",
  },

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
  "thresholds.history.revertFailed": { en: "Couldn't revert change", ar: "تعذّر التراجع عن التغيير" },
  "thresholds.history.emptyTitle": { en: "No changes yet", ar: "لا توجد تغييرات بعد" },
  "thresholds.history.empty": { en: "No changes recorded yet.", ar: "لا توجد تغييرات مسجّلة بعد." },
  "thresholds.history.by": { en: "by {name}", ar: "بواسطة {name}" },

  // Compound rules

  // Forecast-based
};
