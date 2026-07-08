import type { Entry } from "../i18n";

// Gov View (G1–G3), the demo role switcher, and route-access guard.
export const gov: Record<string, Entry> = {
  // Role switcher (demo control in the account menu)
  "role.switch.label": { en: "View as", ar: "العرض بدور" },
  "role.switch.hint": {
    en: "Demo — preview role-based access",
    ar: "عرض تجريبي — معاينة الوصول حسب الدور",
  },

  // Read-only / region scoping
  "gov.readOnly": { en: "Read-only", ar: "للقراءة فقط" },
  "gov.viewingRegion": { en: "Viewing {region}", ar: "عرض {region}" },
  "gov.regionalDashboard": { en: "Regional dashboard", ar: "لوحة المنطقة" },
  "gov.regionalSubtitle": {
    en: "Live conditions and alerts for your assigned region.",
    ar: "الأحوال والتنبيهات المباشرة للمنطقة المعيّنة لك.",
  },
  "gov.recentAlerts": { en: "Recent alerts", ar: "أحدث التنبيهات" },

  // Route access guard
  "access.restricted.title": { en: "Access restricted", ar: "الوصول مقيّد" },
  "access.restricted.body": {
    en: "Your role doesn't have access to this screen. Access is granted by the MOZN team.",
    ar: "دورك لا يملك الوصول إلى هذه الشاشة. تُمنح الصلاحيات من قِبل فريق مزن.",
  },
  "access.restricted.back": { en: "Go to dashboard", ar: "الذهاب إلى لوحة المعلومات" },
};
