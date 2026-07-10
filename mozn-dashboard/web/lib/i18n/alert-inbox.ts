import type { Entry } from "../i18n";

// Alert Inbox namespace. Reuses chrome.ts shared keys for severity
// (inboxSeverity.*), status, region, and common.* — only inbox-specific
// strings are defined here.
export const alertInbox: Record<string, Entry> = {
  // KPI stat cards

  // Table column headers
  "inbox.col.severity": { en: "Severity", ar: "الخطورة" },
  "inbox.col.alert": { en: "Alert", ar: "التنبيه" },
  "inbox.col.reading": { en: "Reading", ar: "القراءة" },
  "inbox.col.waiting": { en: "Waiting", ar: "منذ" },
  "inbox.col.action": { en: "Action", ar: "الإجراء" },

  // SLA countdown labels (routine urgency has no SLA)
  "inbox.sla.none": { en: "No SLA", ar: "بدون مهلة" },
  "inbox.sla.remaining": { en: "{time} to SLA", ar: "{time} حتى المهلة" },
  "inbox.sla.passed": { en: "SLA passed", ar: "تجاوزت المهلة" },

  // Toolbar search
  "inbox.searchPlaceholder": { en: "Search alerts…", ar: "ابحث في التنبيهات…" },
  "inbox.searchAria": { en: "Search alerts", ar: "البحث في التنبيهات" },

  // SLA focus (command strip) + row clock

  // Expanded detail

  // Empty state — no-data ("inbox zero") vs. filtered (no match).
  "inbox.empty.title": { en: "Inbox zero", ar: "الصندوق فارغ" },
  "inbox.empty.body": {
    en: "No alerts in this view. New flags will appear here.",
    ar: "لا توجد تنبيهات في هذا العرض. ستظهر التنبيهات الجديدة هنا.",
  },
  "inbox.empty.filteredTitle": { en: "No matching alerts", ar: "لا توجد تنبيهات مطابقة" },
  "inbox.empty.filtered": {
    en: "No alerts match these filters.",
    ar: "لا توجد تنبيهات مطابقة لهذه التصفية.",
  },

  // Alert card chips
  "inbox.chip.escalated": { en: "Escalated", ar: "مُصعّد" },
  "inbox.chip.acknowledged": { en: "Acknowledged", ar: "تم الإقرار" },

  // Recommended action label
  "inbox.recommended": { en: "Recommended:", ar: "الإجراء الموصى به:" },

  // Alert card actions
  "inbox.action.reopen": { en: "Reopen", ar: "إعادة فتح" },
  "inbox.action.confirm": { en: "Confirm alert", ar: "تأكيد التنبيه" },
  "inbox.action.acknowledge": { en: "Acknowledge", ar: "إقرار" },
  "inbox.action.escalate": { en: "Escalate", ar: "تصعيد" },
  "inbox.action.escalated": { en: "Escalated", ar: "مُصعّد" },
  "inbox.action.more": { en: "More actions", ar: "إجراءات أخرى" },
  "inbox.action.setMaintenance": { en: "Set maintenance", ar: "جدولة صيانة" },
  "inbox.action.dismiss": { en: "Dismiss", ar: "تجاهل" },

  // Trend direction (per-item reading movement)

  // Acknowledge dialog (note required)
  "inbox.ack.title": { en: "Acknowledge alert", ar: "الإقرار بالتنبيه" },
  "inbox.ack.desc": {
    en: "Add a short note on how you triaged this. The note is recorded in the audit trail.",
    ar: "أضف ملاحظة موجزة حول كيفية فرزك لهذا التنبيه. تُسجَّل الملاحظة في سجل التدقيق.",
  },
  "inbox.ack.noteLabel": { en: "Triage note", ar: "ملاحظة الفرز" },
  "inbox.ack.notePlaceholder": {
    en: "e.g. Confirmed against upstream stations — monitoring.",
    ar: "مثال: تم التأكّد مقابل المحطات العليا — قيد المراقبة.",
  },
  "inbox.ack.confirm": { en: "Acknowledge", ar: "إقرار" },

  // Dismiss dialog (reason required)
  "inbox.dismiss.title": { en: "Dismiss alert", ar: "تجاهل التنبيه" },
  "inbox.dismiss.desc": {
    en: "A reason is required. Dismissing removes the flag from the inbox.",
    ar: "السبب مطلوب. التجاهل يزيل الإشارة من الصندوق.",
  },
  "inbox.dismiss.reasonLabel": { en: "Reason for dismissal", ar: "سبب التجاهل" },
  "inbox.dismiss.reasonPlaceholder": {
    en: "e.g. Sensor spike — not a real event.",
    ar: "مثال: ارتفاع مفاجئ في الحسّاس — ليس حدثاً حقيقياً.",
  },
  "inbox.dismiss.confirm": { en: "Dismiss alert", ar: "تجاهل التنبيه" },

  // Toast messages
  "inbox.toast.reopened": { en: "Alert reopened", ar: "تمت إعادة فتح التنبيه" },
  "inbox.toast.confirmed": { en: "Alert confirmed · published", ar: "تم تأكيد التنبيه · نُشر" },
  "inbox.toast.acknowledged": { en: "Alert acknowledged", ar: "تم الإقرار بالتنبيه" },
  "inbox.toast.escalated": { en: "Escalated to operations", ar: "تم التصعيد إلى العمليات" },
  "inbox.toast.maintenance": {
    en: "Station set to maintenance",
    ar: "تم تحويل المحطة إلى الصيانة",
  },
  "inbox.toast.dismissed": { en: "Alert dismissed", ar: "تم تجاهل التنبيه" },
  "inbox.toast.failed": { en: "Action failed", ar: "فشل الإجراء" },

  // Bulk actions
  "inbox.bulk.confirmed": { en: "Confirmed {count} alert(s)", ar: "تم تأكيد {count} تنبيه" },
  "inbox.bulk.dismissed": { en: "Dismissed {count} alert(s)", ar: "تم تجاهل {count} تنبيه" },
  "inbox.bulk.failed": { en: "Some actions failed", ar: "فشلت بعض الإجراءات" },
  "inbox.bulk.dismissTitle": { en: "Dismiss {count} alert(s)?", ar: "تجاهل {count} تنبيه؟" },
  "inbox.bulk.dismissDesc": {
    en: "A reason is required and applied to every selected alert.",
    ar: "السبب مطلوب ويُطبَّق على كل تنبيه محدد.",
  },
};
