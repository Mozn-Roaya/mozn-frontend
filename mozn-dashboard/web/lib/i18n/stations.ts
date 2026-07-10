import type { Entry } from "../i18n";

// Stations page vocab. Reuses status.*/region.*/signal.*/common.* from chrome.ts.
export const stations: Record<string, Entry> = {
  // Toolbar
  "stations.searchPlaceholder": { en: "Search stations…", ar: "ابحث في المحطات…" },
  "stations.searchAria": { en: "Search stations", ar: "البحث في المحطات" },

  // Bulk-action bar
  "stations.setMaintenance": { en: "Set maintenance", ar: "تعيين الصيانة" },

  // Table column headers
  "stations.colStation": { en: "Station", ar: "المحطة" },
  "stations.colRegion": { en: "Region", ar: "المنطقة" },
  "stations.colStatus": { en: "Status", ar: "الحالة" },
  "stations.colLastReading": { en: "Last reading", ar: "آخر قراءة" },

  // Selection / row aria
  "stations.selectAll": { en: "Select all", ar: "تحديد الكل" },
  "stations.selectRow": { en: "Select {name}", ar: "تحديد {name}" },
  "stations.rowActions": { en: "Actions for {name}", ar: "إجراءات {name}" },

  // Row menu
  "stations.editStation": { en: "Edit station", ar: "تعديل المحطة" },
  "stations.deleteStation": { en: "Delete station", ar: "حذف المحطة" },
  "stations.deletedToast": {
    en: 'Station "{name}" deleted',
    ar: 'حُذفت المحطة "{name}"',
  },
  "stations.deleteFailed": { en: "Couldn't delete station", ar: "تعذّر حذف المحطة" },
  "stations.delete.title": { en: "Delete station?", ar: "حذف المحطة؟" },
  "stations.delete.desc": {
    en: "This permanently removes “{name}” and its configuration. This action cannot be undone.",
    ar: "سيؤدي هذا إلى إزالة «{name}» وإعداداتها نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
  },
  "stations.delete.confirm": { en: "Delete station", ar: "حذف المحطة" },

  // Empty state — filtered (no match) vs. genuinely empty (no data yet).
  "stations.empty": { en: "No stations match your filters.", ar: "لا توجد محطات تطابق عوامل التصفية." },
  "stations.emptyTitle": { en: "No matching stations", ar: "لا توجد محطات مطابقة" },
  "stations.noDataTitle": { en: "No stations yet", ar: "لا توجد محطات بعد" },
  "stations.noData": {
    en: "Stations added to the network will appear here.",
    ar: "ستظهر المحطات المُضافة إلى الشبكة هنا.",
  },

  // CSV export
  "stations.exportedToast": {
    en: "Exported {count} station(s) to CSV",
    ar: "تم تصدير {count} محطة إلى CSV",
  },

  // Add station dialog
  "stations.addStation": { en: "Add station", ar: "إضافة محطة" },
  "stations.stationName": { en: "Station name", ar: "اسم المحطة" },
  "stations.nameArabic": { en: "Name (Arabic)", ar: "الاسم (بالعربية)" },
  "stations.region": { en: "Region", ar: "المنطقة" },
  "stations.namePlaceholder": { en: "e.g. Coastal Station", ar: "مثال: المحطة الساحلية" },
  "stations.addedToast": {
    en: 'Station "{name}" added to {region}',
    ar: 'أُضيفت المحطة "{name}" إلى {region}',
  },

  // Edit station dialog
  "stations.editTitle": { en: "Edit station", ar: "تعديل المحطة" },
  "stations.savedToast": {
    en: 'Saved changes to "{name}"',
    ar: 'تم حفظ التغييرات على "{name}"',
  },
  "stations.saveFailed": { en: "Couldn't save station", ar: "تعذّر حفظ المحطة" },
  "stations.maintenanceToast": { en: "Set to maintenance · logged", ar: "تم التحويل إلى الصيانة · سُجّل" },
  "stations.maintenanceFailed": { en: "Couldn't update station", ar: "تعذّر تحديث المحطة" },

  // Form section headers
  "stations.section.identity": { en: "Identity", ar: "الهوية" },
  "stations.section.location": { en: "Location", ar: "الموقع" },

  // Location fields
  "stations.latitude": { en: "Latitude", ar: "خط العرض" },
  "stations.longitude": { en: "Longitude", ar: "خط الطول" },
  "stations.coordError": {
    en: "Coordinates fall outside Libya's boundary.",
    ar: "الإحداثيات تقع خارج حدود ليبيا.",
  },

  // Sensors
  "stations.sensorsHint": {
    en: "Select the sensors physically installed at this station.",
    ar: "حدّد الحسّاسات المركّبة فعلياً في هذه المحطة.",
  },
  "stations.sensor.temperature": { en: "Temperature", ar: "درجة الحرارة" },
  "stations.sensor.humidity": { en: "Humidity", ar: "الرطوبة" },
  "stations.sensor.wind": { en: "Wind", ar: "الرياح" },
  "stations.sensor.rainfall": { en: "Rainfall", ar: "الأمطار" },
  "stations.sensor.water": { en: "Water level", ar: "منسوب المياه" },
  "stations.sensor.pressure": { en: "Pressure", ar: "الضغط الجوي" },

  // Public preview
  "stations.previewHint": {
    en: "Exactly what citizens will see on the map after activation.",
    ar: "ما سيراه المواطنون تماماً على الخريطة بعد التفعيل.",
  },

  // Full-page station form (matches Figma "Add Station")
  "stations.saveActivate": { en: "Save & activate", ar: "حفظ وتفعيل" },
  "stations.identityHint": {
    en: "Both language names are required and shown to citizens.",
    ar: "اسما اللغتين مطلوبان ويظهران للمواطنين.",
  },
  "stations.locationHint": {
    en: "Place the pin within Libya's boundary.",
    ar: "ضع المؤشّر ضمن حدود ليبيا.",
  },
  "stations.section.sensors": { en: "Sensors", ar: "الحسّاسات" },
  "stations.stationId": { en: "Station ID", ar: "معرّف المحطة" },
  "stations.stationIdAuto": { en: "Auto-generated on save", ar: "يُنشأ تلقائيًا عند الحفظ" },
  "stations.wuStationId": { en: "Weather Underground ID", ar: "معرّف Weather Underground" },
  "stations.wuStationIdPlaceholder": { en: "e.g. ILIBYA42 (optional)", ar: "مثال: ILIBYA42 (اختياري)" },
  "stations.initialStatus": { en: "Initial status", ar: "الحالة الأولية" },
  "stations.status.active": { en: "Active", ar: "نشطة" },
  "stations.chip.withinLibya": { en: "Within Libya boundary", ar: "داخل حدود ليبيا" },
  "stations.previewEyebrow": { en: "Public Preview", ar: "المعاينة العامة" },
  "stations.previewActivateNote": {
    en: "Station stays hidden from the public map until you activate it.",
    ar: "تبقى المحطة مخفية عن الخريطة العامة حتى تقوم بتفعيلها.",
  },

  // City + per-city emergency contacts
  "stations.city": { en: "City", ar: "المدينة" },
  "stations.cityPlaceholder": { en: "Select a city…", ar: "اختر مدينة…" },
  "stations.noMunicipalities": { en: "No cities available", ar: "لا توجد مدن متاحة" },
  "stations.section.emergency": { en: "Emergency contacts", ar: "أرقام الطوارئ" },
  "stations.emergencySharedHint": {
    en: "Shown to citizens during alerts — shared by all stations in {city}.",
    ar: "تظهر للمواطنين أثناء التنبيهات — مشتركة بين كل محطات {city}.",
  },
  "stations.emergencyPickHint": {
    en: "Pick the city above to view and edit its emergency numbers.",
    ar: "اختر المدينة أعلاه لعرض أرقام الطوارئ الخاصة بها وتعديلها.",
  },
  "stations.emergencyNeedsCity": {
    en: "Select the city above to configure its emergency numbers.",
    ar: "حدّد المدينة أعلاه لضبط أرقام الطوارئ الخاصة بها.",
  },
  "stations.contactsSaved": { en: "Emergency numbers saved", ar: "تم حفظ أرقام الطوارئ" },
  "stations.contactsSaveFailed": { en: "Couldn't save numbers", ar: "تعذّر حفظ الأرقام" },
  "stations.emergencyServices": { en: "Emergency services", ar: "خدمات الطوارئ" },
  "stations.civilDefense": { en: "Civil defense", ar: "الدفاع المدني" },
};
