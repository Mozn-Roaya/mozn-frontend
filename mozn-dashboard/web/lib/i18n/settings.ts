import type { Entry } from "../i18n";

// Settings screen for the MOZN Early Warning System console. Namespaced
// "settings.*". Shared vocab (common.*, status.*) lives in chrome.ts and is
// reused, not redefined here.
export const settings: Record<string, Entry> = {
  // Nav aria-label for the section rail
  "settings.title": { en: "Settings", ar: "الإعدادات" },

  // Section rail
  "settings.section.appearance": { en: "Appearance", ar: "المظهر" },
  "settings.section.alerting": { en: "Alerting & escalation", ar: "التنبيه والتصعيد" },
  "settings.section.monitoring": { en: "Station monitoring", ar: "مراقبة المحطات" },
  "settings.section.live": { en: "Live data", ar: "البيانات الحيّة" },

  // Shared units. Arabic minutes agree with the count: singular "دقيقة" for
  // 1–2 and 11+, plural "دقائق" for 3–10 (see minutesUnit in settings-view).
  "settings.unit.minutes": { en: "min", ar: "دقيقة" },
  "settings.unit.minutesPlural": { en: "min", ar: "دقائق" },

  /* ------------------------------ Appearance ----------------------------- */
  "settings.theme.label": { en: "Theme", ar: "السمة" },
  "settings.theme.desc": {
    en: "Light, dark, or match your system.",
    ar: "فاتح أو داكن أو حسب النظام.",
  },
  "settings.theme.light": { en: "Light", ar: "فاتح" },
  "settings.theme.dark": { en: "Dark", ar: "داكن" },
  "settings.theme.system": { en: "System", ar: "النظام" },

  "settings.language.label": { en: "Language", ar: "اللغة" },
  "settings.language.desc": {
    en: "Display language for the console.",
    ar: "لغة عرض لوحة التحكم.",
  },

  "settings.tempUnit.label": { en: "Temperature unit", ar: "وحدة الحرارة" },
  "settings.tempUnit.desc": {
    en: "Unit for temperature readings across the console.",
    ar: "وحدة قراءات الحرارة في أنحاء لوحة التحكم.",
  },
  "settings.windUnit.label": { en: "Wind speed unit", ar: "وحدة سرعة الرياح" },
  "settings.windUnit.desc": {
    en: "Unit for wind readings across the console.",
    ar: "وحدة قراءات الرياح في أنحاء لوحة التحكم.",
  },

  /* ------------------------- Alerting & escalation ----------------------- */
  // Urgency tiers (server-supplied)
  "settings.urgency.title": { en: "Notify by urgency", ar: "الإشعار حسب الأولوية" },
  "settings.urgency.desc": {
    en: "Which alert tiers trigger a notification.",
    ar: "مستويات التنبيه التي تُطلق إشعاراً.",
  },
  "settings.urgency.empty": {
    en: "No notification tiers configured.",
    ar: "لا توجد مستويات إشعار مُهيّأة.",
  },

  // Delivery

  // Escalation
  "settings.escalation.title": { en: "Escalation", ar: "التصعيد" },
  "settings.escalation.desc": {
    en: "How unacknowledged alerts move up the response chain.",
    ar: "كيف تتصاعد التنبيهات غير المُقرّة عبر سلسلة الاستجابة.",
  },
  "settings.sla.label": { en: "SLA acknowledgement window", ar: "مهلة الإقرار (SLA)" },
  "settings.sla.desc": {
    en: "How long an alert may stay unacknowledged before it breaches SLA.",
    ar: "المدة التي يبقى فيها التنبيه دون إقرار قبل تجاوز اتفاقية مستوى الخدمة.",
  },
  "settings.autoEscalate.label": { en: "Auto-escalate unacknowledged", ar: "تصعيد تلقائي للتنبيهات غير المُقرّة" },
  "settings.autoEscalate.desc": {
    en: "Escalate to the next tier when no one acknowledges in time.",
    ar: "التصعيد إلى المستوى التالي عندما لا يُقِر أحد في الوقت المناسب.",
  },
  "settings.autoEscalate.after": { en: "Escalate after", ar: "التصعيد بعد" },
  "settings.autoEscalate.afterDesc": {
    en: "Delay before an unacknowledged alert escalates.",
    ar: "المهلة قبل تصعيد التنبيه غير المُقَرّ.",
  },

  /* --------------------------- Station monitoring ------------------------ */
  "settings.health.title": { en: "Station health", ar: "حالة المحطات" },
  "settings.health.desc": {
    en: "Thresholds that flag a station as needing attention.",
    ar: "الحدود التي تُصنِّف المحطة على أنها بحاجة إلى انتباه.",
  },
  "settings.offline.label": { en: "Mark offline after no report for", ar: "اعتبارها غير متصلة بعد انقطاع التقارير لمدة" },
  "settings.offline.desc": {
    en: "How long a station may go silent before it's flagged offline.",
    ar: "المدة التي تتوقف فيها المحطة عن الإرسال قبل اعتبارها غير متصلة.",
  },
  "settings.lowBattery.label": { en: "Low-battery warning at", ar: "تحذير انخفاض البطارية عند" },
  "settings.lowBattery.desc": {
    en: "Warn when a station's battery drops below this level.",
    ar: "التحذير عند انخفاض بطارية المحطة دون هذا المستوى.",
  },
  // Data validation rules (table)
  "settings.validation.groupTitle": { en: "Data validation rules", ar: "قواعد التحقق من البيانات" },
  "settings.validation.groupDesc": {
    en: "Plausibility checks applied to incoming station readings.",
    ar: "فحوص معقولية تُطبَّق على قراءات المحطات الواردة.",
  },
  "settings.table.metric": { en: "Metric", ar: "المقياس" },
  "settings.table.validRange": { en: "Valid range", ar: "النطاق الصالح" },
  "settings.table.maxRate": { en: "Max rate of change", ar: "أقصى معدل تغيّر" },
  "settings.table.status": { en: "Status", ar: "الحالة" },
  "settings.validation.emptyTitle": { en: "No validation rules", ar: "لا توجد قواعد تحقق" },
  "settings.validation.empty": {
    en: "No validation rules configured.",
    ar: "لا توجد قواعد تحقق مُهيّأة.",
  },
  "settings.table.active": { en: "Active", ar: "نشط" },
  "settings.table.edit": { en: "Edit rule", ar: "تعديل القاعدة" },
  "settings.validation.editTitle": { en: "Edit validation rule — {metric}", ar: "تعديل قاعدة التحقق — {metric}" },
  "settings.validation.editDesc": {
    en: "Readings outside the valid range or exceeding the max rate of change are withheld from the public map and flagged for review.",
    ar: "تُحجب القراءات خارج النطاق الصالح أو التي تتجاوز أقصى معدل تغيّر عن الخريطة العامة وتُعلَّم للمراجعة.",
  },
  "settings.validation.rangeFrom": { en: "From", ar: "من" },
  "settings.validation.rangeTo": { en: "To", ar: "إلى" },
  "settings.validation.rangeHint": {
    en: "Readings outside these bounds are withheld.",
    ar: "تُحجب القراءات خارج هذين الحدّين.",
  },
  "settings.validation.limitRate": { en: "Limit rate of change", ar: "الحد من معدل التغيّر" },
  "settings.validation.limitRateHint": {
    en: "Reject spikes faster than this — likely sensor faults.",
    ar: "رفض القفزات الأسرع من ذلك — أعطال محتملة في المستشعر.",
  },
  "settings.validation.ratePer": { en: "per", ar: "لكل" },
  "settings.validation.activeLabel": { en: "Rule active", ar: "القاعدة مفعّلة" },
  "settings.validation.activeHint": {
    en: "Turn off to pause this check without deleting it.",
    ar: "أوقفها لتعليق هذا الفحص دون حذفه.",
  },
  "settings.validation.saved": { en: "Validation rule updated", ar: "تم تحديث قاعدة التحقق" },

  /* ------------------------------- Live data ----------------------------- */
  "settings.live.title": { en: "Live data", ar: "البيانات الحيّة" },
  "settings.live.desc": {
    en: "How the console keeps its live panels current.",
    ar: "كيف تُبقي لوحة التحكم لوحاتها الحيّة محدَّثة.",
  },
  "settings.refresh.label": { en: "Dashboard auto-refresh", ar: "التحديث التلقائي للوحة" },
  "settings.refresh.desc": {
    en: "How often live panels pull new data.",
    ar: "كم مرة تجلب اللوحات الحيّة بيانات جديدة.",
  },
  "settings.refresh.off": { en: "Off", ar: "إيقاف" },
  "settings.refresh.30s": { en: "Every 30 seconds", ar: "كل 30 ثانية" },
  "settings.refresh.1m": { en: "Every minute", ar: "كل دقيقة" },
  "settings.refresh.5m": { en: "Every 5 minutes", ar: "كل 5 دقائق" },
  "settings.refresh.15m": { en: "Every 15 minutes", ar: "كل 15 دقيقة" },
  "settings.region.label": { en: "Default region focus", ar: "التركيز الافتراضي على المنطقة" },
  "settings.region.desc": {
    en: "Region selected first when you open the console.",
    ar: "المنطقة المحدَّدة أولاً عند فتح لوحة التحكم.",
  },
  "settings.region.all": { en: "All regions", ar: "كل المناطق" },
  "settings.region.empty": { en: "No regions available", ar: "لا توجد مناطق متاحة" },

  // Save-on-change bar
  "settings.unsaved": { en: "You have unsaved changes", ar: "لديك تغييرات غير محفوظة" },
  "settings.discard": { en: "Discard", ar: "تجاهل" },
  "settings.saved": { en: "Settings saved", ar: "تم حفظ الإعدادات" },
  "settings.saveFailed": {
    en: "Couldn't save settings. Please try again.",
    ar: "تعذّر حفظ الإعدادات. حاول مرة أخرى.",
  },
};
