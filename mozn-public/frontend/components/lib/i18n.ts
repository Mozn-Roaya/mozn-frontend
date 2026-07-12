// Bilingual (English / Arabic) UI copy for the Mozn early-warning app.
//
// Pure and isomorphic — no React, no next/headers — so it can be imported from
// both Server and Client Components. Server code resolves the active language
// from the `mozn-lang` cookie (see `lang-server.ts`); client code reads it from
// the LanguageProvider context (see `state/lang-context.tsx`). Both call
// `getDict(lang)` to get the same strings.
//
// Dynamic content (station names, alert messages, guidance steps) is NOT here —
// the backend already returns Arabic variants (`name_ar`, `message_ar`,
// `guidance_steps_ar`); components pick the right field via `pickLang`.

export type Lang = "en" | "ar";

/** Cookie + localStorage key holding the active language. Client-safe so both
 *  the server reader and the client toggle share one source of truth. */
export const LANG_COOKIE = "mozn-lang";

/** Cardinal wind directions, indexed to match `station-overview`'s CARDINAL. */
type CardinalKey = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

const EN = {
  // Top bar / chrome
  homeAria: "Mozn home",
  dashboardLink: "Dashboard",
  dashboardLinkAria: "Open the admin dashboard",
  searchPlaceholder: "Search stations…",
  loadingStations: "Loading stations…",
  noMatch: (q: string) => `No stations match “${q}”.`,
  // Theme toggle (icon-only button — aria-label is its only accessible name).
  themeToDark: "Switch to dark mode",
  themeToLight: "Switch to light mode",
  // Station-type labels shown in search results; unknown types fall back to
  // the raw backend value (see station-search).
  stationTypes: {
    pws: "Personal Station",
    aws: "Automatic Station",
    outdoor: "Outdoor Station",
  } as Record<string, string>,

  // Station tabs
  tabOverview: "Overview",
  tabCharts: "Charts",
  tabData: "Data",
  tabShare: "Share",

  // Station header
  stationLabel: "Station:",
  shareStationAria: "Share station",
  closeStationAria: "Close station",
  detailsAria: (name: string) => `${name} details`,

  // Map
  loadingMap: "Loading map…",
  resetView: "Reset view",
  recenterOn: (name: string) => `Recenter on ${name}`,
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  hideLabels: "Hide station labels",
  showLabels: "Show station labels",
  locating: "Locating…",
  stationsNearMe: "Stations near me",
  legendNormal: "Normal",
  legendWarning: "Warning",
  legendOffline: "Offline",
  // QA: pluralize so a single station reads "1 station", not "1 stations".
  stationsCount: (n: number) => `${n} ${n === 1 ? "station" : "stations"}`,
  zoomLevel: (z: string) => `Zoom ${z}`,
  // Pin hazard words (map pin label)
  pinSevere: "Severe",
  pinWarning: "Warning",
  pinWatch: "Watch",
  pinOffline: "Offline",
  pinNormal: "Normal",
  // Accessible name for the standalone status dot (e.g. in search results).
  pinStatusAria: (status: string) => `Station status: ${status}`,
  windDirAria: (dir: string) => `Wind direction ${dir}`,

  // Temperature card
  temperature: "Temperature",
  feelsLike: (n: number) => `Feels like ${n}°`,
  high: "H",
  low: "L",

  // Weather metrics
  rainfall: "Rainfall",
  windSpeed: "Wind Speed",
  humidity: "Humidity",
  pressure: "Pressure",
  noReading: "No reading.",

  // Wind descriptions
  windCalm: "Calm conditions.",
  windLight: (dir: string) => `Light breeze from the ${dir}.`,
  windModerate: (dir: string) => `Moderate breeze from the ${dir}.`,
  windStrong: (dir: string) => `Strong wind from the ${dir}.`,
  windGale: (dir: string) => `Gale-force wind from the ${dir}.`,
  // Humidity descriptions
  humidityDry: "Dry — stay hydrated.",
  humidityComfortable: "Comfortable humidity levels.",
  humidityHumid: "Humid conditions.",
  humidityVery: "Very humid — heat stress likely.",
  // Pressure descriptions
  pressureLow: "Low pressure — unsettled weather.",
  pressureHigh: "High pressure — calm weather.",
  pressureSteady: "Steady, stable conditions.",
  // Rain descriptions
  rainHeavy: "Heavy rain right now.",
  rainLight: "Light rain falling.",
  rainToday: (mm: string) => `${mm} mm so far today.`,
  rainNone: "None expected today.",

  // Cardinal directions (full words — used for the compass aria-label)
  cardinals: {
    N: "N",
    NE: "NE",
    E: "E",
    SE: "SE",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  } as Record<CardinalKey, string>,
  // Compact codes for the tiny compass badge (full Arabic words overflow it).
  cardinalsShort: {
    N: "N",
    NE: "NE",
    E: "E",
    SE: "SE",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  } as Record<CardinalKey, string>,

  // Forecast
  forecastTitle: "7-Day Forecast",
  noForecast: "No forecast available.",
  today: "Today",
  daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as string[],
  condSunny: "Sunny",
  condCloudy: "Cloudy",
  condRain: "Rain",
  condStorms: "Storms",

  // Offline state
  offline: "Offline",
  stationUnavailable: "Station unavailable",
  offlineBody:
    "We can’t reach this station right now, so live readings, history, and forecasts aren’t available.",
  lastSeen: "Last seen",

  // Alerts
  hazardHighTemp: "High Temperature",
  hazardLowTemp: "Low Temperature",
  hazardHeavyRain: "Heavy Rainfall",
  hazardWindGust: "Strong Wind Gust",
  hazardHighWind: "High Wind",
  hazardHighUV: "High UV",
  hazardGeneric: "Weather Alert",
  sevSevere: "Severe Warning",
  sevWarning: "Warning",
  sevWatch: "Watch",
  sevAlert: "Alert",
  // Compose title from hazard + severity word.
  alertTitle: (hazard: string, sev: string) => `${hazard} ${sev}`,
  live: "Live",
  callAria: (label: string, num: string) => `Call ${label} at ${num}`,
  alertActiveDefault:
    "Active alert detected for this station — monitor and follow guidance below.",
  alertActiveRange: (range: string) => `Active ${range}`,
  alertStartsInSuffix: (lead: string) => ` · starts in ${lead}`,
  alertStartsIn: (lead: string) => `Starts in ${lead}`,
  alertIssued: (dt: string) => `Issued ${dt}`,
  defaultWarningTitle: "Flash Flood Warning",
  defaultWarningDescription:
    "Immediate action required — monitor alerts and follow guidance below.",
  defaultGuidance: [
    "Move to higher ground immediately. Do not wait for official orders.",
    "Avoid walking or driving through floodwaters. Turn around, don’t drown.",
    "Monitor MOZN alerts and local radio for updates every 30 minutes.",
    "Call 191 emergency services if trapped or in immediate danger.",
  ] as string[],
  contactEmergency: "Emergency Services",
  contactCivilDefense: "Civil Defense",

  // Share tab
  shareTitle: (name: string) => `Share ${name}`,
  publicLink: "Public link",
  embedSnippet: "Embed snippet",
  copy: "Copy",
  copied: "Copied!",
  copyFailed: "Copy failed",
  shareStationWord: "Station",
  never: "never",

  // Expanded panel (charts + data)
  closeAria: "Close",
  libya: "Libya",
  dataByMozn: "Data by MOZN — free for public use",
  loadingShort: "Loading…",
  couldntLoadHistory: "Couldn’t load history",
  noHistory: "No history data for this range.",
  // Charts — focused-metric KPI tiles
  statNow: "Now",
  statAvg: "Avg",
  statMin: "Min",
  statMax: "Max",
  formatLabel: "Format",
  periodLabel: "Period",
  // Duration labels for the range/period selectors (charts + data export).
  periods: {
    "24h": "24h",
    "7d": "7d",
    "30d": "30d",
    "6mo": "6mo",
    "1yr": "1yr",
  } as Record<string, string>,
  includeLabel: "Include",
  comingSoon: "Coming soon",
  preparing: "Preparing…",
  download: (fmt: string) => `Download ${fmt}`,
  couldntPrepare: (err: string) => `Couldn’t prepare download: ${err}`,
  // QA: export is hourly (one row per hour; CSV header "Time (hour)"), not 15-min.
  readingsMeta: (rows: string, kb: number) =>
    `${rows} readings · hourly · ~${kb} KB`,
  fieldTemperature: "Temperature",
  fieldHumidity: "Humidity",
  fieldRainfall: "Rainfall",
  fieldWindSpeed: "Wind Speed",
  fieldPressure: "Pressure",
  fieldCoordinates: "Coordinates",

  // Live event toasts (SSE — new/cleared alerts + station status changes)
  toastNewWarning: "New warning",
  toastWarningCleared: "Warning cleared",
  toastStatusMaintenance: "Under maintenance",
  toastStatusRestored: "Back online",
  toastStatusDeactivated: "Deactivated",
  toastDismiss: "Dismiss notification",
};

export type Dict = typeof EN;

const AR: Dict = {
  // Top bar / chrome
  homeAria: "الصفحة الرئيسية لمزن",
  dashboardLink: "لوحة التحكم",
  dashboardLinkAria: "فتح لوحة تحكم المشرف",
  searchPlaceholder: "ابحث عن المحطات…",
  loadingStations: "جارٍ تحميل المحطات…",
  noMatch: (q: string) => `لا توجد محطات تطابق «${q}».`,
  themeToDark: "التبديل إلى الوضع الداكن",
  themeToLight: "التبديل إلى الوضع الفاتح",
  stationTypes: {
    pws: "محطة شخصية",
    aws: "محطة آلية",
    outdoor: "محطة خارجية",
  },

  // Station tabs
  tabOverview: "نظرة عامة",
  tabCharts: "المخططات",
  tabData: "البيانات",
  tabShare: "مشاركة",

  // Station header
  stationLabel: "المحطة:",
  shareStationAria: "مشاركة المحطة",
  closeStationAria: "إغلاق المحطة",
  detailsAria: (name: string) => `تفاصيل ${name}`,

  // Map
  loadingMap: "جارٍ تحميل الخريطة…",
  resetView: "إعادة الضبط",
  recenterOn: (name: string) => `توسيط على ${name}`,
  zoomIn: "تكبير",
  zoomOut: "تصغير",
  hideLabels: "إخفاء أسماء المحطات",
  showLabels: "إظهار أسماء المحطات",
  locating: "جارٍ تحديد الموقع…",
  stationsNearMe: "المحطات القريبة مني",
  legendNormal: "طبيعي",
  legendWarning: "تحذير",
  legendOffline: "غير متصل",
  stationsCount: (n: number) => `${n} محطة`,
  zoomLevel: (z: string) => `تكبير ${z}`,
  pinSevere: "شديد",
  pinWarning: "تحذير",
  pinWatch: "ترقب",
  pinOffline: "غير متصل",
  pinNormal: "طبيعي",
  pinStatusAria: (status: string) => `حالة المحطة: ${status}`,
  windDirAria: (dir: string) => `اتجاه الرياح ${dir}`,

  // Temperature card
  temperature: "درجة الحرارة",
  feelsLike: (n: number) => `الإحساس كأنها ${n}°`,
  high: "ع",
  low: "ص",

  // Weather metrics
  rainfall: "هطول الأمطار",
  windSpeed: "سرعة الرياح",
  humidity: "الرطوبة",
  pressure: "الضغط",
  noReading: "لا توجد قراءة.",

  windCalm: "أجواء هادئة.",
  windLight: (dir: string) => `نسيم خفيف من ${dir}.`,
  windModerate: (dir: string) => `نسيم معتدل من ${dir}.`,
  windStrong: (dir: string) => `رياح قوية من ${dir}.`,
  windGale: (dir: string) => `رياح عاصفة من ${dir}.`,
  humidityDry: "جاف — حافظ على ترطيب جسمك.",
  humidityComfortable: "مستويات رطوبة مريحة.",
  humidityHumid: "أجواء رطبة.",
  humidityVery: "رطوبة عالية — إجهاد حراري محتمل.",
  pressureLow: "ضغط منخفض — طقس غير مستقر.",
  pressureHigh: "ضغط مرتفع — طقس هادئ.",
  pressureSteady: "أجواء ثابتة ومستقرة.",
  rainHeavy: "أمطار غزيرة الآن.",
  rainLight: "أمطار خفيفة تتساقط.",
  rainToday: (mm: string) => `${mm} ملم حتى الآن اليوم.`,
  rainNone: "لا أمطار متوقعة اليوم.",

  cardinals: {
    N: "الشمال",
    NE: "الشمال الشرقي",
    E: "الشرق",
    SE: "الجنوب الشرقي",
    S: "الجنوب",
    SW: "الجنوب الغربي",
    W: "الغرب",
    NW: "الشمال الغربي",
  },
  // Compact Arabic compass codes (ش=شمال، ج=جنوب، ق=شرق، غ=غرب).
  cardinalsShort: {
    N: "ش",
    NE: "ش ق",
    E: "ق",
    SE: "ج ق",
    S: "ج",
    SW: "ج غ",
    W: "غ",
    NW: "ش غ",
  },

  // Forecast
  forecastTitle: "توقعات 7 أيام",
  noForecast: "لا توجد توقعات متاحة.",
  today: "اليوم",
  daysShort: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
  condSunny: "مشمس",
  condCloudy: "غائم",
  condRain: "ممطر",
  condStorms: "عواصف",

  // Offline state
  offline: "غير متصل",
  stationUnavailable: "المحطة غير متاحة",
  offlineBody:
    "تعذّر الوصول إلى هذه المحطة حالياً، لذا فإن القراءات الحية والسجل والتوقعات غير متوفرة.",
  lastSeen: "آخر ظهور",

  // Alerts
  hazardHighTemp: "درجة حرارة مرتفعة",
  hazardLowTemp: "درجة حرارة منخفضة",
  hazardHeavyRain: "أمطار غزيرة",
  hazardWindGust: "هبّات رياح قوية",
  hazardHighWind: "رياح شديدة",
  hazardHighUV: "أشعة فوق بنفسجية عالية",
  hazardGeneric: "تنبيه جوي",
  sevSevere: "تحذير شديد",
  sevWarning: "تحذير",
  sevWatch: "ترقب",
  sevAlert: "تنبيه",
  // Arabic reads more naturally as "{severity}: {hazard}".
  alertTitle: (hazard: string, sev: string) => `${sev}: ${hazard}`,
  live: "مباشر",
  callAria: (label: string, num: string) => `اتصل بـ ${label} على ${num}`,
  alertActiveDefault:
    "تم رصد تنبيه نشط لهذه المحطة — تابع واتبع الإرشادات أدناه.",
  alertActiveRange: (range: string) => `نشط ${range}`,
  alertStartsInSuffix: (lead: string) => ` · يبدأ خلال ${lead}`,
  alertStartsIn: (lead: string) => `يبدأ خلال ${lead}`,
  alertIssued: (dt: string) => `صدر ${dt}`,
  defaultWarningTitle: "تحذير من فيضان مفاجئ",
  defaultWarningDescription:
    "مطلوب اتخاذ إجراء فوري — تابع التنبيهات واتبع الإرشادات أدناه.",
  defaultGuidance: [
    "انتقل إلى مكان مرتفع فوراً. لا تنتظر الأوامر الرسمية.",
    "تجنّب المشي أو القيادة في مياه الفيضان. عُد أدراجك ولا تخاطر.",
    "تابع تنبيهات مزن والإذاعة المحلية للتحديثات كل 30 دقيقة.",
    "اتصل بخدمات الطوارئ على الرقم 191 إذا كنت محاصراً أو في خطر مباشر.",
  ],
  contactEmergency: "خدمات الطوارئ",
  contactCivilDefense: "الدفاع المدني",

  // Share tab
  shareTitle: (name: string) => `مشاركة ${name}`,
  publicLink: "رابط عام",
  embedSnippet: "كود التضمين",
  copy: "نسخ",
  copied: "تم النسخ!",
  copyFailed: "تعذّر النسخ",
  shareStationWord: "المحطة",
  never: "أبداً",

  // Expanded panel
  closeAria: "إغلاق",
  libya: "ليبيا",
  dataByMozn: "بيانات من مزن — مجانية للاستخدام العام",
  loadingShort: "جارٍ التحميل…",
  couldntLoadHistory: "تعذّر تحميل السجل",
  noHistory: "لا توجد بيانات سجل لهذا النطاق.",
  // Charts — focused-metric KPI tiles
  statNow: "الآن",
  statAvg: "المتوسط",
  statMin: "الأدنى",
  statMax: "الأعلى",
  formatLabel: "الصيغة",
  periodLabel: "الفترة",
  periods: {
    "24h": "24 ساعة",
    "7d": "7 أيام",
    "30d": "30 يوم",
    "6mo": "6 أشهر",
    "1yr": "سنة",
  },
  includeLabel: "التضمين",
  comingSoon: "قريباً",
  preparing: "جارٍ التحضير…",
  download: (fmt: string) => `تنزيل ${fmt}`,
  couldntPrepare: (err: string) => `تعذّر تحضير التنزيل: ${err}`,
  readingsMeta: (rows: string, kb: number) =>
    `${rows} قراءة · كل ساعة · ~${kb} ك.ب`,
  fieldTemperature: "درجة الحرارة",
  fieldHumidity: "الرطوبة",
  fieldRainfall: "هطول الأمطار",
  fieldWindSpeed: "سرعة الرياح",
  fieldPressure: "الضغط الجوي",
  fieldCoordinates: "الإحداثيات",

  // Live event toasts (SSE — new/cleared alerts + station status changes)
  toastNewWarning: "تحذير جديد",
  toastWarningCleared: "تم رفع التحذير",
  toastStatusMaintenance: "تحت الصيانة",
  toastStatusRestored: "عاد للعمل",
  toastStatusDeactivated: "معطّلة",
  toastDismiss: "إغلاق الإشعار",
};

const DICTS: Record<Lang, Dict> = { en: EN, ar: AR };

export function getDict(lang: Lang): Dict {
  return DICTS[lang] ?? EN;
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ar";
}

/**
 * BCP-47 locale for `Intl` / `toLocale*` formatting. Arabic uses Arabic month
 * and day names but the Latin numbering system (`-nu-latn`) so numeric values
 * stay consistent with the tabular-nums design across the app.
 */
export function localeFor(lang: Lang): string {
  return lang === "ar" ? "ar-u-nu-latn" : "en-US";
}

/**
 * Pick the language-appropriate value from a bilingual pair. Falls back to the
 * base value when the Arabic variant is missing/empty.
 */
export function pickLang(
  lang: Lang,
  base: string | undefined,
  arabic: string | undefined,
): string {
  if (lang === "ar") return (arabic && arabic.trim()) || base || "";
  return base || "";
}

/** Localised display name for a station (Arabic `name_ar` in AR, else `name`). */
export function stationName(
  s: { name: string; name_ar: string },
  lang: Lang,
): string {
  return pickLang(lang, s.name, s.name_ar);
}
