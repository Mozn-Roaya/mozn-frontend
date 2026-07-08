import type { Entry } from "../i18n";

// Alert Management (A3.2). Manage active & past alerts in a single table:
// modify severity, acknowledge, resolve. Reuses severity.*/region.*/
// thresholds.metric.* vocab. Follows the Alert History table conventions.
export const alertManagement: Record<string, Entry> = {
  // Chrome
  "nav.activeAlerts": { en: "Active Alerts", ar: "التنبيهات النشطة" },
  "page.activeAlerts.title": { en: "Alert Management", ar: "إدارة التنبيهات" },
  "page.activeAlerts.subtitle": {
    en: "Manage live and recent alerts — adjust severity, acknowledge, or resolve. Every action is logged to the audit trail.",
    ar: "أدِر التنبيهات الحيّة والحديثة — عدّل الخطورة أو أقِرّ أو أنهِ. تُسجَّل كل الإجراءات في سجل التدقيق.",
  },

  // Toolbar
  "alertmgmt.searchPlaceholder": {
    en: "Search alerts, stations, regions…",
    ar: "ابحث في التنبيهات والمحطات والمناطق…",
  },
  "alertmgmt.searchAria": { en: "Search alerts", ar: "بحث في التنبيهات" },
  "alertmgmt.count": {
    en: "{shown} of {total} alerts",
    ar: "{shown} من {total} تنبيه",
  },

  // Type
  "alertmgmt.type.compound": { en: "Compound", ar: "مركّب" },

  // Columns
  "alertmgmt.col.severity": { en: "Severity", ar: "الخطورة" },
  "alertmgmt.col.type": { en: "Alert", ar: "التنبيه" },
  "alertmgmt.col.status": { en: "Status", ar: "الحالة" },
  "alertmgmt.col.action": { en: "Action", ar: "الإجراء" },

  // Detail labels
  "alertmgmt.trigger": { en: "Trigger & readings", ar: "المُحفّز والقراءات" },
  "alertmgmt.duration": { en: "Duration", ar: "المدة" },
  "alertmgmt.durationValue": { en: "{min} min", ar: "{min} دقيقة" },

  // Status pills
  "alertmgmt.status.active": { en: "Active", ar: "نشط" },
  "alertmgmt.status.acknowledged": { en: "Acknowledged", ar: "تم الإقرار" },
  "alertmgmt.status.resolved": { en: "Resolved", ar: "منتهٍ" },

  // Actions
  "alertmgmt.action.more": { en: "Alert actions", ar: "إجراءات التنبيه" },
  "alertmgmt.action.acknowledge": { en: "Acknowledge", ar: "إقرار" },
  "alertmgmt.action.resolve": { en: "Resolve", ar: "إنهاء" },
  "alertmgmt.action.severity": { en: "Set severity", ar: "تعيين الخطورة" },

  // Toasts
  "alertmgmt.toast.acknowledged": { en: "Alert acknowledged · logged", ar: "تم الإقرار بالتنبيه · سُجّل" },
  "alertmgmt.toast.resolved": { en: "Alert resolved · logged", ar: "تم إنهاء التنبيه · سُجّل" },
  "alertmgmt.toast.severity": { en: "Severity changed to {tier} · logged", ar: "تغيّرت الخطورة إلى {tier} · سُجّل" },

  // Empty
  "alertmgmt.empty.none": { en: "No alerts match your filters.", ar: "لا توجد تنبيهات مطابقة." },
  "alertmgmt.empty.filteredTitle": { en: "No matching alerts", ar: "لا توجد تنبيهات مطابقة" },
  "alertmgmt.empty.title": { en: "No active alerts", ar: "لا توجد تنبيهات نشطة" },
  "alertmgmt.empty.body": {
    en: "Active alerts will appear here as soon as a station reports a threshold breach.",
    ar: "ستظهر التنبيهات النشطة هنا فور رصد إحدى المحطات لتجاوز أحد الحدود.",
  },
};
