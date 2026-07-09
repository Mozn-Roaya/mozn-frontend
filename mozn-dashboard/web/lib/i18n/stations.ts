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
  "stations.colSignal": { en: "Signal", ar: "الإشارة" },
  "stations.colBattery": { en: "Battery", ar: "البطارية" },
  "stations.colLastReading": { en: "Last reading", ar: "آخر قراءة" },

  // Selection / row aria
  "stations.selectAll": { en: "Select all", ar: "تحديد الكل" },
  "stations.selectRow": { en: "Select {name}", ar: "تحديد {name}" },
  "stations.rowActions": { en: "Actions for {name}", ar: "إجراءات {name}" },

  // Signal tooltip
  "stations.signalTooltip": { en: "Signal: {label} ({n}/4)", ar: "الإشارة: {label} ({n}/4)" },
  "stations.signalAria": { en: "Signal {strength} of 4", ar: "الإشارة {strength} من 4" },

  // Row menu
  "stations.editStation": { en: "Edit station", ar: "تعديل المحطة" },

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
  "stations.viewLive": { en: "Live view", ar: "العرض المباشر" },

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

  // Telemetry
  "stations.protocol": { en: "Communication protocol", ar: "بروتوكول الاتصال" },
  "stations.protocol.cellular": { en: "Cellular (4G)", ar: "خلوي (4G)" },
  "stations.protocol.satellite": { en: "Satellite", ar: "قمر صناعي" },
  "stations.protocol.lora": { en: "LoRaWAN", ar: "LoRaWAN" },
  "stations.interval": { en: "Data interval", ar: "فترة إرسال البيانات" },
  "stations.interval.1": { en: "Every 1 min", ar: "كل دقيقة" },
  "stations.interval.5": { en: "Every 5 min", ar: "كل 5 دقائق" },
  "stations.interval.15": { en: "Every 15 min", ar: "كل 15 دقيقة" },
  "stations.interval.60": { en: "Every 60 min", ar: "كل 60 دقيقة" },

  // Public preview
  "stations.previewHint": {
    en: "Exactly what citizens will see on the map after activation.",
    ar: "ما سيراه المواطنون تماماً على الخريطة بعد التفعيل.",
  },

  // Response steps — per-station override of the alert template's steps
  "stations.section.steps": { en: "Response steps", ar: "خطوات الاستجابة" },
  "stations.stepsHint": {
    en: "Safety guidance citizens see when this station raises a flash-flood alert.",
    ar: "إرشادات السلامة التي يراها المواطنون عند إطلاق هذه المحطة تنبيه فيضان مفاجئ.",
  },
  "stations.stepsInheritedTitle": {
    en: "Inherited from the “{event}” template",
    ar: "موروثة من قالب «{event}»",
  },
  "stations.stepsInheritedEmpty": {
    en: "This alert template has no response steps yet.",
    ar: "لا يحتوي قالب التنبيه هذا على خطوات استجابة بعد.",
  },
  "stations.stepsOverrideBtn": { en: "Override for this station", ar: "تخصيص لهذه المحطة" },
  "stations.stepsOverrideActive": {
    en: "Custom steps for this station",
    ar: "خطوات مخصّصة لهذه المحطة",
  },
  "stations.stepsRevert": { en: "Revert to template", ar: "العودة إلى القالب" },
  "stations.stepsOverrideNote": {
    en: "These steps replace the template’s steps for this station only — other stations keep the template.",
    ar: "تحلّ هذه الخطوات محل خطوات القالب لهذه المحطة فقط — تبقى المحطات الأخرى على القالب.",
  },
  "stations.noSteps": {
    en: "No steps yet. Add the first action below.",
    ar: "لا توجد خطوات بعد. أضف أول إجراء أدناه.",
  },
  "stations.dragStep": {
    en: "Reorder step {n} — drag, or use the arrow keys",
    ar: "أعد ترتيب الخطوة {n} — اسحب، أو استخدم مفاتيح الأسهم",
  },
  "stations.addStep": { en: "Add step", ar: "إضافة خطوة" },
  "stations.removeStep": { en: "Remove step", ar: "حذف الخطوة" },

  // Station Live View (A2.3) — hardware health
  "stations.live.title": { en: "Live view", ar: "العرض المباشر" },
  "stations.live.subtitle": { en: "Hardware health & raw telemetry", ar: "صحة العتاد والقياسات الخام" },
  "stations.live.noTelemetryTitle": { en: "No telemetry yet", ar: "لا توجد قياسات بعد" },
  "stations.live.noTelemetry": {
    en: "This station hasn't reported any hardware telemetry yet.",
    ar: "لم تُرسل هذه المحطة أي قياسات عتاد حتى الآن.",
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
  "stations.section.comms": { en: "Communication & data", ar: "الاتصال والبيانات" },
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
