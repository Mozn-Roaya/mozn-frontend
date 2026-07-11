// Data-value translations for backend-supplied free text.
//
// The Go API ships display strings (proper nouns, readings, relative times and
// fixture copy) that the keyed `dict` in i18n.ts does NOT cover. `translateData`
// looks a raw English value up here and falls back to the value unchanged when
// there is no Arabic mapping (or when the locale is English). Keys MUST match
// the backend string byte-for-byte, including the middot "·", em dash "—",
// en dash "–", arrow "→" and curly quotes "" "".
//
// NOTE: enum-like values the UI already translates by key (status, severity,
// region, signal, role, outcome, category, tier names, scale tones, metric
// keys) are intentionally absent — translating them here would be redundant or
// would collide with the keyed lookups.
export const dataDict: Record<string, string> = {
  /* --------------------------------- Dashboard --------------------------- */
  // Header
  "System Overview": "نظرة عامة على النظام",

  // Status-strip stat labels
  "Stations online": "محطات متصلة",
  "Offline": "غير متصلة",
  "Maintenance": "صيانة",
  "Anomaly": "خلل",
  "Active alerts": "تنبيهات نشطة",

  // Station health map
  "Station Health Map": "خريطة حالة المحطات",

  // Compact elapsed (dashboard feeds)
  "1h": "1س",
  "2m": "2د",
  "3m": "3د",
  "8m": "8د",
  "14m": "14د",
  "22m": "22د",
  "31m": "31د",
  "35m": "35د",

  /* ---------------------------------- Stations -------------------------- */
  // Relative "… ago" (stations lastReading + inbox timeAgo)
  "1 min ago": "قبل دقيقة",
  "2 min ago": "قبل دقيقتين",
  "3 min ago": "قبل 3 دقائق",
  "4 min ago": "قبل 4 دقائق",
  "5 min ago": "قبل 5 دقائق",
  "6 min ago": "قبل 6 دقائق",
  "7 min ago": "قبل 7 دقائق",
  "9 min ago": "قبل 9 دقائق",
  "12 min ago": "قبل 12 دقيقة",
  "14 min ago": "قبل 14 دقيقة",
  "18 min ago": "قبل 18 دقيقة",
  "25 min ago": "قبل 25 دقيقة",

  /* -------------------------------- Alert Inbox ------------------------- */
  // Filter pills
  "All": "الكل",
  "Critical": "حرج",
  "Urgent": "عاجل",
  "Routine": "روتيني",
  // Titles
  "Compound flood risk": "خطر فيضان مركّب",
  "High wind": "رياح عالية",
  "Water level rising": "ارتفاع منسوب المياه",
  "Heavy rain forecast": "توقّع أمطار غزيرة",
  // SLA chips
  "within SLA": "ضمن المهلة",
  "no SLA": "لا مهلة",
  // Metric labels + values
  "Rainfall": "أمطار",
  "Water level": "منسوب المياه",
  "Wind speed": "سرعة الرياح",
  "Forecast rain": "أمطار متوقّعة",
  // Meter (sustained / window)
  "Sustained": "متواصل",
  "Window": "النافذة",

  /* -------------------------------- Thresholds -------------------------- */
  // Tier units
  "mm/hr": "ملم/س",
  "km/h": "كم/س",
  "°C": "°م",
  "mm": "ملم",
  // Change-history entries (relative time)
  "2 days ago": "قبل يومين",
  "5 days ago": "قبل 5 أيام",

  /* --------------------------------- Users ------------------------------ */
  // Generic actor (activity log + recent activity)
  "System": "النظام",
  // Regions column (rendered raw, not via region.* keys)
  "All regions": "كل المناطق",
  "Cyrenaica (East)": "برقة (الشرق)",
  "Tripolitania (West)": "طرابلس (الغرب)",
  "Fezzan (South)": "فزان (الجنوب)",
  // Last active
  "Active now": "نشط الآن",
  "8 min ago": "قبل 8 دقائق",
  "1 h ago": "قبل ساعة",
  "2 h ago": "قبل ساعتين",
  "3 h ago": "قبل 3 ساعات",
  "Yesterday": "أمس",
  "3 days ago": "قبل 3 أيام",
  "1 week ago": "قبل أسبوع",
  "1 month ago": "قبل شهر",

  /* ----------------------------- Alert History -------------------------- */
  // Dates
  "10 Jun": "10 يونيو",
  "09 Jun": "09 يونيو",
  "08 Jun": "08 يونيو",
  "07 Jun": "07 يونيو",
  "05 Jun": "05 يونيو",
  "03 Jun": "03 يونيو",
  "01 Jun": "01 يونيو",

  /* ----------------------------- Activity Log --------------------------- */
  // Day group labels
  "Today · 10 June": "اليوم · 10 يونيو",
  "Yesterday · 9 June": "أمس · 9 يونيو",
  // Actions
  "Signed in": "سجّل الدخول",
  // Source
  "Automated": "تلقائي",

  /* --------------------------------- Settings --------------------------- */
  // Notification urgency rows ("Routine"/"Urgent"/"Critical" reuse the inbox entries)
  "Advisory matches": "مطابقات الإرشاد",
  "Watch & warning matches": "مطابقات المراقبة والتحذير",
  "Compound & warning-tier (audible)": "المركّبة ومستوى التحذير (مسموع)",
  // Parameter display labels (paramLabel) — shown across thresholds, alerts,
  // alert history, and validation rules. Keep in sync with PARAM_LABEL in mappers.ts.
  "Rainfall rate": "معدل هطول الأمطار",
  "Daily rainfall": "الأمطار اليومية",
  "Wind gust": "هبّة الرياح",
  "High temperature": "درجة حرارة مرتفعة",
  "Low temperature": "درجة حرارة منخفضة",
  "Air pressure": "الضغط الجوي",
  "Humidity": "الرطوبة",
  "UV index": "مؤشر الأشعة فوق البنفسجية",
  "Dew point": "نقطة الندى",
  "Solar radiation": "الإشعاع الشمسي",
  // Validation rules — metric / range / rate
  "Temperature": "درجة الحرارة",
  "Wind": "رياح",
  "-10 to 60 °C": "-10 إلى 60 °م",
  "0 to 200 mm/hr": "0 إلى 200 ملم/س",
  "0 to 250 km/h": "0 إلى 250 كم/س",
  "0 to 100 %": "0 إلى 100 %",
  "15° per 15 min": "15° لكل 15 دقيقة",
  "50 mm per 5 min": "50 ملم لكل 5 دقائق",
  // Validation note (section caption)
  "Readings outside these bounds are flagged and withheld from the public map.":
    "القراءات خارج هذه الحدود يتم وسمها وحجبها عن الخريطة العامة.",
  "When flagged: data is not published to the public map and cannot trigger inbox alerts. The MOZN team is notified separately, and citizens see the last valid reading labelled “Data under review”.":
    "عند وضع العلامة: لا تُنشر البيانات على الخريطة العامة ولا يمكنها تشغيل تنبيهات الصندوق. يُبلَّغ فريق مزن بشكل منفصل، ويرى المواطنون آخر قراءة صالحة موسومة بـ ”بيانات قيد المراجعة“.",
};
