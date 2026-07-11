import type { Entry } from "../i18n";

// Shared chrome + cross-page vocab. Page namespaces reuse the status/severity/
// region/signal/role/common.* keys here instead of redefining them.
export const chrome: Record<string, Entry> = {
  // Sidebar nav
  "nav.dashboard": { en: "Dashboard", ar: "لوحة المعلومات" },
  "nav.alertInbox": { en: "Alert Inbox", ar: "صندوق التنبيهات" },
  "nav.alertsThresholds": { en: "Alerts & Thresholds", ar: "التنبيهات والحدود" },
  "nav.stations": { en: "Stations", ar: "المحطات" },
  "nav.historyAudit": { en: "History & Audit", ar: "السجل والتدقيق" },
  "nav.activityLog": { en: "Activity Log", ar: "سجل النشاط" },
  "nav.usersAccess": { en: "Users & Access", ar: "المستخدمون والصلاحيات" },
  "nav.settings": { en: "Settings", ar: "الإعدادات" },
  "nav.comingSoon": { en: "Coming soon", ar: "قريباً" },
  "nav.primaryAria": { en: "Primary navigation", ar: "التنقل الرئيسي" },
  "navGroup.monitoring": { en: "Monitoring", ar: "المراقبة" },
  "navGroup.records": { en: "Records", ar: "السجلات" },
  "navGroup.account": { en: "Account", ar: "الحساب" },

  // Sidebar / topbar chrome
  "chrome.brandName": { en: "MOZN", ar: "مزن" },
  "chrome.adminPanel": { en: "Admin Panel", ar: "لوحة التحكم" },
  "topbar.search": { en: "Search stations, alerts…", ar: "ابحث في المحطات والتنبيهات…" },
  "topbar.searchLabel": { en: "Search", ar: "بحث" },

  // Command palette (global search)
  "palette.title": { en: "Search", ar: "بحث" },
  "palette.description": {
    en: "Search stations and jump to any screen.",
    ar: "ابحث في المحطات وانتقل إلى أي شاشة.",
  },
  "palette.placeholder": {
    en: "Search stations, pages, regions…",
    ar: "ابحث في المحطات والصفحات والمناطق…",
  },
  "palette.groupPages": { en: "Pages", ar: "الصفحات" },
  "palette.groupStations": { en: "Stations", ar: "المحطات" },
  "palette.loadingStations": { en: "Loading stations…", ar: "جارٍ تحميل المحطات…" },
  "palette.empty": { en: "No results for “{query}”", ar: "لا نتائج لـ ”{query}“" },
  "palette.hintNavigate": { en: "Navigate", ar: "تنقّل" },
  "palette.hintSelect": { en: "Open", ar: "فتح" },
  "palette.hintClose": { en: "Close", ar: "إغلاق" },
  "topbar.openMenu": { en: "Open menu", ar: "فتح القائمة" },
  "topbar.navigation": { en: "Navigation", ar: "التنقل" },
  "topbar.navDesc": { en: "Primary navigation menu", ar: "قائمة التنقل الرئيسية" },
  "topbar.breadcrumbAria": { en: "Breadcrumb", ar: "مسار التنقل" },

  // Theme toggle
  "theme.toLight": { en: "Switch to light mode", ar: "التبديل إلى الوضع الفاتح" },
  "theme.toDark": { en: "Switch to dark mode", ar: "التبديل إلى الوضع الداكن" },
  // Language switcher (topbar)
  "language.switch": { en: "Change language", ar: "تغيير اللغة" },

  // Account menu (user card)
  "account.notSignedIn": { en: "Not signed in", ar: "لم يتم تسجيل الدخول" },
  "account.settings": { en: "Settings", ar: "الإعدادات" },
  "account.signOut": { en: "Sign out", ar: "تسجيل الخروج" },
  "account.signedOut": { en: "Signed out", ar: "تم تسجيل الخروج" },

  // Notifications
  "notif.title": { en: "Notifications", ar: "التنبيهات" },
  "notif.aria": { en: "Notifications", ar: "التنبيهات" },
  "notif.ariaUnread": { en: "Notifications, {count} unread", ar: "التنبيهات، {count} غير مقروءة" },
  "notif.new": { en: "{count} new", ar: "{count} جديدة" },
  "notif.markAllRead": { en: "Mark all read", ar: "تعليم الكل كمقروء" },
  "notif.caughtUp": { en: "You're all caught up.", ar: "لا توجد تنبيهات جديدة." },
  "notif.viewAll": { en: "View all in Alert Inbox", ar: "عرض الكل في صندوق التنبيهات" },
  "notif.unread": { en: "Unread", ar: "غير مقروءة" },
  // Real-time alert toast (SSE)
  "events.newAlert": { en: "New alert: {param}", ar: "تنبيه جديد: {param}" },

  // Server-rendered page headings (app/(dashboard)/*/page.tsx)
  "page.stations.title": { en: "Stations", ar: "المحطات" },
  "page.stations.subtitle": {
    en: "{total} stations across {regions} regions · {needAttention} need attention",
    ar: "{total} محطة في {regions} مناطق · {needAttention} بحاجة إلى انتباه",
  },
  "page.inbox.title": { en: "Station Alert Inbox", ar: "صندوق تنبيهات المحطات" },
  "page.inbox.subtitle": {
    en: "Station-generated flags awaiting team review. Triage critical items within the 2-minute SLA.",
    ar: "إشارات صادرة عن المحطات بانتظار مراجعة الفريق. عالِج الحالات الحرجة خلال مهلة دقيقتين.",
  },
  "page.alerts.title": { en: "Alerts & Thresholds", ar: "التنبيهات والحدود" },
  "page.alerts.subtitle": {
    en: "Set the readings that change a station's pin colour and trigger team review.",
    ar: "حدّد القراءات التي تغيّر لون مؤشّر المحطة وتستدعي مراجعة الفريق.",
  },
  "page.users.title": { en: "Users & Access", ar: "المستخدمون والصلاحيات" },
  "page.users.subtitle": {
    en: "{admins} MOZN admins · {gov} government accounts · access granted by the MOZN team.",
    ar: "{admins} من مدراء مزن · {gov} حساب حكومي · تُمنح الصلاحيات من قِبل فريق مزن.",
  },
  "page.settings.title": { en: "Settings", ar: "الإعدادات" },
  "page.settings.subtitle": {
    en: "MOZN team notification preferences and data validation rules.",
    ar: "تفضيلات إشعارات فريق مزن وقواعد التحقق من البيانات.",
  },

  // Error / loading
  "error.title": { en: "Couldn't load the dashboard", ar: "تعذّر تحميل لوحة المعلومات" },
  "error.body": { en: "Something went wrong while fetching system data. Please try again.", ar: "حدث خطأ أثناء جلب بيانات النظام. يرجى المحاولة مرة أخرى." },

  // Common buttons / fragments (reused everywhere)
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.close": { en: "Close", ar: "إغلاق" },
  "common.save": { en: "Save changes", ar: "حفظ التغييرات" },
  "common.export": { en: "Export", ar: "تصدير" },
  "common.exportReport": { en: "Export report", ar: "تصدير التقرير" },
  "common.clear": { en: "Clear", ar: "مسح" },
  "common.retry": { en: "Retry", ar: "إعادة المحاولة" },
  "common.delete": { en: "Delete", ar: "حذف" },
  "common.viewDetails": { en: "View details", ar: "عرض التفاصيل" },
  "common.of": { en: "{shown} of {total}", ar: "{shown} من {total}" },
  "common.selected": { en: "{count} selected", ar: "{count} محدد" },
  "common.testMode": { en: "Test mode", ar: "وضع الاختبار" },
  "common.comfortable": { en: "Comfortable rows", ar: "صفوف مريحة" },
  "common.compact": { en: "Compact rows", ar: "صفوف مدمجة" },

  // Sort control

  // Filter overflow
  "common.clearFilters": { en: "Clear filters", ar: "مسح الفلاتر" },
  "common.noResults": { en: "No results.", ar: "لا نتائج." },
  "common.selectAll": { en: "Select all", ar: "تحديد الكل" },
  "common.selectRow": { en: "Select row", ar: "تحديد الصف" },

  // Table pagination footer
  "common.show": { en: "Show", ar: "عرض" },
  "common.ofResults": { en: "of {total} results", ar: "من {total} نتيجة" },
  "common.prevPage": { en: "Previous page", ar: "الصفحة السابقة" },
  "common.nextPage": { en: "Next page", ar: "الصفحة التالية" },
  "common.gotoPage": { en: "Go to page {n}", ar: "الانتقال إلى الصفحة {n}" },

  // Station operational status
  "status.online": { en: "Online", ar: "متصلة" },
  "status.offline": { en: "Offline", ar: "غير متصلة" },
  "status.maintenance": { en: "Maintenance", ar: "صيانة" },
  "status.anomaly": { en: "Anomaly", ar: "خلل" },
  "status.warning": { en: "Warning", ar: "تحذير" },

  // Alert severity
  "severity.critical": { en: "Critical", ar: "حرج" },
  "severity.warning": { en: "Warning", ar: "تحذير" },
  "severity.watch": { en: "Watch", ar: "مراقبة" },
  "severity.advisory": { en: "Advisory", ar: "إرشادي" },

  // Map-pin hazard words — mirror the public map's severity vocabulary so the
  // two maps' pin labels read identically (red → Severe, orange → Warning,
  // yellow → Watch).
  "pin.severe": { en: "Severe", ar: "شديد" },
  "pin.warning": { en: "Warning", ar: "تحذير" },
  "pin.watch": { en: "Watch", ar: "ترقب" },

  // Inbox severity
  "inboxSeverity.critical": { en: "Critical", ar: "حرج" },
  "inboxSeverity.urgent": { en: "Urgent", ar: "عاجل" },
  "inboxSeverity.routine": { en: "Routine", ar: "روتيني" },

  // Alert outcome
  "outcome.all-clear": { en: "All clear", ar: "انتهى الخطر" },
  "outcome.auto-cleared": { en: "Auto-cleared", ar: "أُغلق تلقائياً" },

  // Roles
  "role.Super Admin": { en: "Super Admin", ar: "مدير عام" },
  "role.Gov Editor": { en: "Gov Editor", ar: "محرر حكومي" },
  "role.Gov Viewer": { en: "Gov Viewer", ar: "مشاهد حكومي" },

  // Regions (data values displayed across pages). These mirror the backend
  // region names; unknown ones fall back to the raw name (see translate()).
  "region.Northwest": { en: "Northwest", ar: "الشمال الغربي" },
  "region.East": { en: "East", ar: "المنطقة الشرقية" },
  "region.West": { en: "West", ar: "المنطقة الغربية" },
  "region.South": { en: "South", ar: "المنطقة الجنوبية" },
  // Legacy Figma region names (kept for any older references).
  "region.Cyrenaica (East)": { en: "Cyrenaica (East)", ar: "برقة (الشرق)" },
  "region.Tripolitania (West)": { en: "Tripolitania (West)", ar: "طرابلس (الغرب)" },
  "region.Fezzan (South)": { en: "Fezzan (South)", ar: "فزان (الجنوب)" },
  "region.Coastal Sirte": { en: "Coastal Sirte", ar: "سرت الساحلية" },

  // Signal strength (0–4)
  "signal.0": { en: "No signal", ar: "لا إشارة" },
  "signal.1": { en: "Weak", ar: "ضعيفة" },
  "signal.2": { en: "Fair", ar: "مقبولة" },
  "signal.3": { en: "Good", ar: "جيدة" },
  "signal.4": { en: "Strong", ar: "قوية" },
};
