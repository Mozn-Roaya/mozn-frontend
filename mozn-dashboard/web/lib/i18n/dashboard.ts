import type { Entry } from "../i18n";

// Dashboard / System Overview namespace. Keys are namespaced "dashboard.*".
// Shared vocab (status.*, region.*, severity.*, common.*) lives in chrome.ts —
// reuse those here instead of redefining.
export const dashboard: Record<string, Entry> = {
  // Section group labels (System Overview hierarchy)
  "dashboard.section.glance": { en: "At a glance", ar: "نظرة سريعة" },
  "dashboard.section.operations": { en: "Operations", ar: "العمليات" },
  "dashboard.section.analytics": { en: "Analytics", ar: "التحليلات" },

  // Page header
  "dashboard.header.reporting": {
    en: "{online}/{total} stations reporting",
    ar: "{online}/{total} محطة ترسل البيانات",
  },
  "dashboard.systemStatusAria": { en: "System status", ar: "حالة النظام" },
  "dashboard.testModeAria": { en: "Test mode", ar: "وضع الاختبار" },
  "dashboard.exportFilename": { en: "system-status-report", ar: "تقرير-حالة-النظام" },
  "dashboard.exportCol.metric": { en: "Metric", ar: "المقياس" },
  "dashboard.exportCol.value": { en: "Value", ar: "القيمة" },
  "dashboard.toast.exported": {
    en: "System status report exported to CSV",
    ar: "تم تصدير تقرير حالة النظام إلى ملف CSV",
  },
  "dashboard.toast.testOn": {
    en: "Test mode on — alerts are simulated",
    ar: "وضع الاختبار مفعّل — التنبيهات محاكاة",
  },
  "dashboard.toast.testOff": { en: "Test mode off", ar: "وضع الاختبار متوقف" },
  "dashboard.toast.refreshed": { en: "Dashboard refreshed", ar: "تم تحديث لوحة المعلومات" },
  "dashboard.refresh": { en: "Refresh", ar: "تحديث" },
  "dashboard.updatedJustNow": { en: "Updated just now", ar: "حُدّث للتو" },
  "dashboard.updated": { en: "Updated {rel}", ar: "حُدّث {rel}" },
  "dashboard.testModeInfo": {
    en: "Simulates alerts and readings for training. Live stations and citizen notifications are unaffected.",
    ar: "يحاكي التنبيهات والقراءات لأغراض التدريب. لا يؤثر على المحطات الفعلية أو إشعارات المواطنين.",
  },
  // System quality KPIs (A1)

  // Status strip empty state (no stats returned)
  "dashboard.glance.empty": {
    en: "No status metrics to show.",
    ar: "لا توجد مقاييس حالة لعرضها.",
  },

  // Status strip hints (one-word context under each stat)
  "dashboard.hint.reportingNow": { en: "reporting now", ar: "تُبلّغ الآن" },
  "dashboard.hint.noSignal": { en: "no signal", ar: "لا إشارة" },
  "dashboard.hint.scheduled": { en: "scheduled", ar: "مجدولة" },
  "dashboard.hint.needsReview": { en: "needs review", ar: "بحاجة لمراجعة" },
  "dashboard.hint.openNow": { en: "open now", ar: "مفتوحة الآن" },

  // Station health map controls
  "dashboard.map.zoomIn": { en: "Zoom in", ar: "تكبير" },
  "dashboard.map.zoomOut": { en: "Zoom out", ar: "تصغير" },
  "dashboard.map.reset": { en: "Reset view", ar: "إعادة ضبط العرض" },
  "dashboard.map.toggleLabels": { en: "Toggle labels", ar: "إظهار/إخفاء التسميات" },
  "dashboard.map.close": { en: "Close", ar: "إغلاق" },
  "dashboard.map.empty": { en: "No stations to show on the map.", ar: "لا توجد محطات لعرضها على الخريطة." },
  "dashboard.map.emptyTitle": { en: "No stations on the map", ar: "لا توجد محطات على الخريطة" },
  "dashboard.map.emptyBody": {
    en: "Stations added to the network will appear here.",
    ar: "ستظهر المحطات المُضافة إلى الشبكة هنا.",
  },

  // Station summary card (Figma "Station Summary")
  "dashboard.station.eyebrow": { en: "Station:", ar: "المحطة:" },
  "dashboard.station.temperature": { en: "Temperature", ar: "درجة الحرارة" },
  "dashboard.station.feelsLike": { en: "Feels like {v}°", ar: "الإحساس كأنها {v}°" },
  "dashboard.station.highLow": {
    en: "H: {high}°   L: {low}°",
    ar: "العظمى: {high}°   الصغرى: {low}°",
  },
  "dashboard.station.live": { en: "LIVE", ar: "مباشر" },
  "dashboard.station.emergencyServices": { en: "Emergency Services", ar: "خدمات الطوارئ" },
  "dashboard.station.civilDefense": { en: "Civil Defense", ar: "الدفاع المدني" },
  "dashboard.station.rainfall": { en: "Rainfall", ar: "الأمطار" },
  "dashboard.station.wind": { en: "Wind Speed", ar: "سرعة الرياح" },
  "dashboard.station.humidity": { en: "Humidity", ar: "الرطوبة" },
  "dashboard.station.pressure": { en: "Pressure", ar: "الضغط" },
  "dashboard.station.forecast": { en: "3-Day Forecast", ar: "توقعات 3 أيام" },
  "dashboard.station.noData": {
    en: "No weather data available for this station yet.",
    ar: "لا تتوفر بيانات طقس لهذه المحطة بعد.",
  },
  "dashboard.station.offline": { en: "Station offline", ar: "المحطة غير متصلة" },
  "dashboard.station.offlineDesc": {
    en: "No signal — last data {t}.",
    ar: "لا إشارة — آخر بيانات {t}.",
  },
  "dashboard.station.maintenance": { en: "Under maintenance", ar: "تحت الصيانة" },
  "dashboard.station.maintenanceDesc": {
    en: "Scheduled maintenance — readings paused.",
    ar: "صيانة مجدولة — تم إيقاف القراءات مؤقتًا.",
  },
  // Forecast conditions
  "dashboard.station.cond.sunny": { en: "Sunny", ar: "مشمس" },
  "dashboard.station.cond.cloudy": { en: "Cloudy", ar: "غائم" },
  "dashboard.station.cond.rain": { en: "Rain", ar: "أمطار" },
  "dashboard.station.cond.storms": { en: "Storms", ar: "عواصف" },
  // Forecast day labels
  "dashboard.station.day.today": { en: "Today", ar: "اليوم" },
  "dashboard.station.day.sun": { en: "Sun", ar: "الأحد" },
  "dashboard.station.day.mon": { en: "Mon", ar: "الإثنين" },
  "dashboard.station.day.tue": { en: "Tue", ar: "الثلاثاء" },
  "dashboard.station.day.wed": { en: "Wed", ar: "الأربعاء" },
  "dashboard.station.day.thu": { en: "Thu", ar: "الخميس" },
  "dashboard.station.day.fri": { en: "Fri", ar: "الجمعة" },
  "dashboard.station.day.sat": { en: "Sat", ar: "السبت" },

  // Needs attention
  "dashboard.needsAttention.title": { en: "Needs attention", ar: "بحاجة إلى انتباه" },
  "dashboard.needsAttention.open": { en: "{count} open", ar: "{count} مفتوحة" },
  "dashboard.needsAttention.openInbox": {
    en: "Open alert inbox",
    ar: "فتح صندوق التنبيهات",
  },
  "dashboard.needsAttention.emptyTitle": { en: "All clear", ar: "كل شيء على ما يرام" },
  "dashboard.needsAttention.empty": {
    en: "Nothing needs attention right now.",
    ar: "لا شيء يحتاج إلى انتباه الآن.",
  },

  // Recent activity
  "dashboard.recentActivity.title": { en: "Recent activity", ar: "النشاط الأخير" },
  "dashboard.recentActivity.viewLog": { en: "View log", ar: "عرض السجل" },
  "dashboard.recentActivity.empty": {
    en: "No recent activity.",
    ar: "لا يوجد نشاط حديث.",
  },

  // Stations by region

  // Fleet status (donut)
  "dashboard.fleet.title": { en: "Station status", ar: "حالة المحطات" },
  "dashboard.fleet.subtitle": {
    en: "{total} stations by state",
    ar: "{total} محطة حسب الحالة",
  },
  "dashboard.fleet.total": { en: "stations", ar: "محطة" },
  "dashboard.fleet.online": { en: "Online", ar: "متصلة" },
  "dashboard.fleet.offline": { en: "Offline", ar: "غير متصلة" },
  "dashboard.fleet.maintenance": { en: "Maintenance", ar: "صيانة" },
  "dashboard.fleet.anomaly": { en: "Anomaly", ar: "خلل" },
  "dashboard.fleet.empty": { en: "No station data.", ar: "لا توجد بيانات محطات." },

  // Alerts by severity
  "dashboard.alertTrend.title": { en: "Alert trend", ar: "اتجاه التنبيهات" },
  "dashboard.alertTrend.subtitle": {
    en: "Alerts opened over the last 7 days",
    ar: "التنبيهات الصادرة خلال آخر 7 أيام",
  },
  "dashboard.alertTrend.active": { en: "active now", ar: "نشطة الآن" },
  "dashboard.alertTrend.opened": { en: "opened", ar: "صادرة" },
  "dashboard.alertTrend.now": { en: "Now", ar: "الآن" },
  "dashboard.alertTrend.empty": {
    en: "No active alerts to chart.",
    ar: "لا توجد تنبيهات نشطة لعرضها.",
  },

  // Stations by region rollup
  "dashboard.regions.title": { en: "Stations by region", ar: "المحطات حسب المنطقة" },
  "dashboard.regions.empty": {
    en: "No regions configured yet.",
    ar: "لا توجد مناطق مُعدّة بعد.",
  },
};
