import { ContactCard } from "./contact-card";

import type { ContactInfo } from "../types";
import type { Lang } from "@/components/lib/i18n";

type AlertContactsProps = {
  readonly contacts: readonly ContactInfo[];
  readonly lang?: Lang;
};

export function AlertContacts({ contacts, lang = "en" }: AlertContactsProps) {
  return (
    <div className="flex w-full gap-[12px] flex-wrap sm:flex-nowrap">
      {contacts.map((contact) => (
        <ContactCard key={contact.number} contact={contact} lang={lang} />
      ))}
    </div>
  );
}
