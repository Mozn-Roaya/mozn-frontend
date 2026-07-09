import type { Entry } from "../i18n";

// Alert Templates (A3.1). Pre-written messages per event type, each requiring
// four versions (EN/AR × day/night) before it can be saved.
export const alertTemplates: Record<string, Entry> = {
  // Page chrome
  "nav.alertTemplates": { en: "Alert Templates", ar: "قوالب التنبيهات" },
  "page.templates.title": { en: "Alert Templates", ar: "قوالب التنبيهات" },
  "page.templates.subtitle": {
    en: "Pre-written messages per event type. Each needs all four versions — English & Arabic, day & night — before it can be published.",
    ar: "رسائل مُعدّة مسبقاً لكل نوع حدث. يحتاج كل قالب إلى نسخه الأربع — بالإنجليزية والعربية، نهاراً وليلاً — قبل النشر.",
  },

  // Completeness
  "templates.complete": { en: "Ready", ar: "جاهز" },
  "templates.incomplete": { en: "{done}/4 versions", ar: "{done}/4 نسخ" },

  // Event names
  "templates.event.flashFlood": { en: "Flash flood warning", ar: "تحذير فيضان مفاجئ" },
  "templates.event.heavyRain": { en: "Heavy rain", ar: "أمطار غزيرة" },
  "templates.event.highWind": { en: "High wind advisory", ar: "إنذار رياح عالية" },
  "templates.event.heatwave": { en: "Extreme heat", ar: "حرّ شديد" },
  "templates.event.coastalSurge": { en: "Coastal surge", ar: "مدّ ساحلي" },
  "templates.event.tempDrop": { en: "Temperature drop", ar: "انخفاض الحرارة" },
  "templates.event.custom": { en: "New template", ar: "قالب جديد" },

  // Version labels
  "templates.v.enDay": { en: "English · Day", ar: "إنجليزية · نهار" },
  "templates.v.enNight": { en: "English · Night", ar: "إنجليزية · ليل" },
  "templates.v.arDay": { en: "Arabic · Day", ar: "عربية · نهار" },
  "templates.v.arNight": { en: "Arabic · Night", ar: "عربية · ليل" },

  // Actions
  "templates.newTemplate": { en: "New template", ar: "قالب جديد" },
  "templates.edit": { en: "Edit", ar: "تعديل" },
  "templates.rename": { en: "Rename", ar: "إعادة تسمية" },
  "templates.delete": { en: "Delete", ar: "حذف" },
  "templates.actionsAria": {
    en: "Actions for {event}",
    ar: "إجراءات {event}",
  },

  // Rename dialog
  "templates.rename.title": { en: "Rename template", ar: "إعادة تسمية القالب" },
  "templates.rename.desc": {
    en: "Give this template a clear, recognizable name.",
    ar: "أعطِ هذا القالب اسماً واضحاً يسهل تمييزه.",
  },
  "templates.rename.labelEn": { en: "Name (English)", ar: "الاسم (بالإنجليزية)" },
  "templates.rename.labelAr": { en: "Name (Arabic)", ar: "الاسم (بالعربية)" },
  "templates.rename.placeholderEn": {
    en: "e.g. Coastal flood — night",
    ar: "e.g. Coastal flood — night",
  },
  "templates.rename.placeholderAr": {
    en: "مثال: فيضان ساحلي — ليل",
    ar: "مثال: فيضان ساحلي — ليل",
  },
  "templates.renamedToast": { en: "Template renamed", ar: "تمت إعادة تسمية القالب" },

  // Delete dialog
  "templates.delete.title": { en: "Delete this template?", ar: "حذف هذا القالب؟" },
  "templates.delete.desc": {
    en: "“{name}” and all its message versions will be removed. This can’t be undone.",
    ar: "سيُحذف «{name}» وكل نسخ رسالته. لا يمكن التراجع عن هذا.",
  },
  "templates.deletedToast": { en: "Template deleted", ar: "تم حذف القالب" },
  "templates.placeholder.en": {
    en: "e.g. Flash flood warning for {region}. Move to higher ground now.",
    ar: "النص الإنجليزي…",
  },
  "templates.placeholder.ar": {
    en: "النص العربي…",
    ar: "مثال: تحذير من فيضان مفاجئ في {region}. اتجه إلى مكان مرتفع الآن.",
  },
  "templates.savedToast": { en: "Template saved", ar: "تم حفظ القالب" },
  "templates.saveFailed": {
    en: "Couldn’t save the template. Please try again.",
    ar: "تعذّر حفظ القالب. حاول مرة أخرى.",
  },
  "templates.deleteFailed": {
    en: "Couldn’t delete the template. Please try again.",
    ar: "تعذّر حذف القالب. حاول مرة أخرى.",
  },
  "templates.saveIncomplete": {
    en: "Fill in all four message versions before saving.",
    ar: "أكمل نسخ الرسالة الأربع قبل الحفظ.",
  },
  "templates.stepsRequired": {
    en: "Add at least one response step in both English and Arabic before saving.",
    ar: "أضف خطوة استجابة واحدة على الأقل بالإنجليزية والعربية قبل الحفظ.",
  },
  "templates.createdToast": { en: "Template created", ar: "تم إنشاء القالب" },

  // Create dialog
  "templates.create.title": { en: "New alert template", ar: "قالب تنبيه جديد" },
  "templates.create.desc": {
    en: "Pick the event and severity, then write all four message versions and at least one response step.",
    ar: "اختر الحدث والخطورة، ثم اكتب نسخ الرسالة الأربع وخطوة استجابة واحدة على الأقل.",
  },
  "templates.create.eventLabel": { en: "Event type", ar: "نوع الحدث" },
  "templates.create.severityLabel": { en: "Severity", ar: "الخطورة" },
  "templates.create.submit": { en: "Create template", ar: "إنشاء القالب" },

  // Preview
  "templates.preview": { en: "Preview", ar: "معاينة" },
  "templates.preview.empty": {
    en: "Write this version to preview it.",
    ar: "اكتب هذه النسخة لمعاينتها.",
  },
  "templates.preview.note": {
    en: "Day/night and language are selected automatically when the alert fires.",
    ar: "تُختار النسخة (نهار/ليل) واللغة تلقائياً عند إطلاق التنبيه.",
  },

  // Full-page sections
  "templates.libraryTitle": { en: "Templates", ar: "القوالب" },
  "templates.selectAria": {
    en: "{event} — {status}. Select to edit.",
    ar: "{event} — {status}. اختر للتعديل.",
  },
  "templates.section.messages": { en: "Message versions", ar: "نسخ الرسالة" },
  "templates.section.messagesHint": {
    en: "All four are required — English & Arabic, day & night.",
    ar: "النسخ الأربع مطلوبة — بالإنجليزية والعربية، نهاراً وليلاً.",
  },
  "templates.save": { en: "Save template", ar: "حفظ القالب" },

  // Response steps (the numbered guidance citizens see when the alert expands)
  "templates.section.steps": { en: "Response steps", ar: "خطوات الاستجابة" },
  "templates.section.stepsHint": {
    en: "Step-by-step guidance shown to citizens when the alert is expanded.",
    ar: "إرشادات خطوة بخطوة تظهر للمواطنين عند توسيع التنبيه.",
  },
  "templates.addStep": { en: "Add step", ar: "إضافة خطوة" },
  "templates.removeStep": { en: "Remove step", ar: "إزالة الخطوة" },
  "templates.dragStep": {
    en: "Reorder step {n} — drag, or use the arrow keys",
    ar: "أعد ترتيب الخطوة {n} — اسحب، أو استخدم مفاتيح الأسهم",
  },
  // Bilingual step fields — each field shows an example in its own language,
  // regardless of the UI locale, so the two inputs read distinctly.
  "templates.stepHint.en": {
    en: "e.g. Move to higher ground immediately.",
    ar: "e.g. Move to higher ground immediately.",
  },
  "templates.stepHint.ar": {
    en: "مثال: اتجه إلى مكان مرتفع فوراً.",
    ar: "مثال: اتجه إلى مكان مرتفع فوراً.",
  },
  "templates.stepEn": { en: "Step {n} — English", ar: "الخطوة {n} — بالإنجليزية" },
  "templates.stepAr": { en: "Step {n} — Arabic", ar: "الخطوة {n} — بالعربية" },
  "templates.noSteps": { en: "No response steps yet.", ar: "لا توجد خطوات استجابة بعد." },
  "templates.emergencyNote": {
    en: "Emergency numbers are set in Settings → Alerting.",
    ar: "تُضبط أرقام الطوارئ في الإعدادات ← الإنذار.",
  },

  // Empty state (no templates yet — replaces the editor/preview panes)
  "templates.list.empty": { en: "No templates yet", ar: "لا توجد قوالب بعد" },
  "templates.empty.title": { en: "No alert templates yet", ar: "لا توجد قوالب تنبيهات بعد" },
  "templates.empty.body": {
    en: "Create a template to define the pre-written message and response steps for an event type.",
    ar: "أنشئ قالباً لتحديد الرسالة المُعدّة مسبقاً وخطوات الاستجابة لنوع حدث معيّن.",
  },
};
