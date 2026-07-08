import { getDict, type Lang } from "@/components/lib/i18n";

import type { ContactInfo } from "../types";

// TODO(senior-review): the default guidance is flash-flood specific. When
// severity-aware copy lands, move these into a per-hazard catalog keyed by
// the alert's hazard string. The copy itself now lives in the i18n dict
// (`defaultGuidance`) so it stays bilingual.

/** Emergency contacts shown at the foot of an expanded alert. */
export function defaultContacts(lang: Lang = "en"): readonly ContactInfo[] {
  const t = getDict(lang);
  return [
    { label: t.contactEmergency, number: "191", icon: "headset" },
    { label: t.contactCivilDefense, number: "199", icon: "phone-call" },
  ];
}
