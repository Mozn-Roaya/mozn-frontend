import type { Entry } from "../i18n";

// History & Audit vocab (Alert History + Activity Log).
// Reuses severity.*/outcome.*/region.*/common.* from chrome.ts. Region data
// values returned by the API ("Tripolitania" …) don't match chrome's region.*
// keys, so their translations live here under the same region.* namespace.
export const history: Record<string, Entry> = {
  // Alert History — page heading
  "history.alerts.title": { en: "Alert History", ar: "سجل التنبيهات" },
  "history.alerts.subtitle": {
    en: "Chronological record of every alert. Retained for 2 years.",
    ar: "سجل زمني لكل تنبيه. يُحفظ لمدة سنتين.",
  },

  // Activity Log — page heading
  "history.activity.title": { en: "Activity Log", ar: "سجل النشاط" },
  "history.activity.subtitle": {
    en: "Full audit trail — configuration changes, account actions, acknowledgements and sign-ins.",
    ar: "سجل تدقيق كامل — تغييرات الإعدادات وإجراءات الحسابات والإقرارات وعمليات تسجيل الدخول.",
  },

  // Summary StatCards

  // Toolbar — search + filters
  "history.alerts.searchPlaceholder": {
    en: "Search alerts or regions…",
    ar: "ابحث في التنبيهات أو المناطق…",
  },
  "history.alerts.searchAria": {
    en: "Search alert history",
    ar: "البحث في سجل التنبيهات",
  },
  "history.activity.searchPlaceholder": {
    en: "Search user or action…",
    ar: "ابحث في المستخدم أو الإجراء…",
  },
  "history.activity.searchAria": {
    en: "Search activity",
    ar: "البحث في النشاط",
  },
  "history.filter.byDate": { en: "Filter by date", ar: "تصفية حسب التاريخ" },
  "history.opt.anyDate": { en: "Any date", ar: "أي تاريخ" },

  // Count summary
  "history.activity.count": {
    en: "{shown} of {total} events",
    ar: "{shown} من {total} حدث",
  },

  // Table column headers — Alert History
  "history.col.when": { en: "When", ar: "الوقت" },
  "history.col.severity": { en: "Severity", ar: "الخطورة" },
  "history.col.alert": { en: "Alert", ar: "التنبيه" },
  "history.col.region": { en: "Region", ar: "المنطقة" },
  "history.col.type": { en: "Type", ar: "النوع" },
  "history.col.ackTime": { en: "Ack time", ar: "وقت الإقرار" },
  "history.col.duration": { en: "Duration", ar: "المدة" },
  "history.col.outcome": { en: "Outcome", ar: "النتيجة" },

  // Table column headers — Activity Log
  "history.col.time": { en: "Time", ar: "الوقت" },
  "history.col.actor": { en: "User", ar: "المستخدم" },
  "history.col.action": { en: "Action", ar: "الإجراء" },
  "history.col.category": { en: "Category", ar: "الفئة" },

  // Empty states — filtered (no match) vs. genuinely empty (no data yet).
  "history.alerts.empty": {
    en: "No alerts match these filters.",
    ar: "لا توجد تنبيهات مطابقة لهذه التصفية.",
  },
  "history.alerts.emptyTitle": {
    en: "No matching alerts",
    ar: "لا توجد تنبيهات مطابقة",
  },
  "history.alerts.noDataTitle": { en: "No alerts yet", ar: "لا توجد تنبيهات بعد" },
  "history.alerts.noData": {
    en: "Triggered alerts will be recorded here.",
    ar: "سيتم تسجيل التنبيهات المُطلَقة هنا.",
  },
  "history.activity.empty": {
    en: "No activity matches these filters.",
    ar: "لا يوجد نشاط مطابق لهذه التصفية.",
  },
  "history.activity.emptyTitle": {
    en: "No matching activity",
    ar: "لا يوجد نشاط مطابق",
  },
  "history.activity.noDataTitle": { en: "No activity yet", ar: "لا يوجد نشاط بعد" },
  "history.activity.noData": {
    en: "Actions across the system will appear here as they happen.",
    ar: "ستظهر الإجراءات عبر النظام هنا فور حدوثها.",
  },
  "history.activity.view": { en: "View", ar: "عرض" },

  // Export toasts
  "history.export.nothing": {
    en: "Nothing to export for these filters",
    ar: "لا يوجد ما يمكن تصديره لهذه التصفية",
  },
  "history.export.alerts": {
    en: "Exported {count} alerts to CSV",
    ar: "تم تصدير {count} تنبيه إلى CSV",
  },
  "history.export.events": {
    en: "Exported {count} events to CSV",
    ar: "تم تصدير {count} حدث إلى CSV",
  },

  // Filter option labels — "All …" defaults
  "history.opt.allCategories": { en: "All categories", ar: "كل الفئات" },

  // Range options

  // Type options
  "history.type.Rainfall": { en: "Rainfall", ar: "الأمطار" },
  "history.type.Wind": { en: "Wind", ar: "الرياح" },
  "history.type.Water level": { en: "Water level", ar: "منسوب المياه" },
  "history.type.Temperature": { en: "Temperature", ar: "درجة الحرارة" },
  "history.type.Compound": { en: "Compound", ar: "مركّب" },

  // Activity category labels (badges + filter options)
  "history.category.Alert": { en: "Alert", ar: "تنبيه" },
  "history.category.Threshold": { en: "Threshold", ar: "حد" },
  "history.category.Station": { en: "Station", ar: "محطة" },
  "history.category.User": { en: "User", ar: "مستخدم" },
  "history.category.Auth": { en: "Auth", ar: "مصادقة" },

  // Region data values from the API (kept under the shared region.* namespace).
  "region.Tripolitania": { en: "Tripolitania", ar: "طرابلس" },
  "region.Cyrenaica": { en: "Cyrenaica", ar: "برقة" },
  "region.Fezzan": { en: "Fezzan", ar: "فزان" },
};
