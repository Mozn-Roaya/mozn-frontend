import { HeadsetIcon, PhoneCallIcon, type IconProps } from "@/components/icons";
import { getDict, type Lang } from "@/components/lib/i18n";

import type { ContactIcon, ContactInfo } from "../types";
import type * as React from "react";

type ContactCardProps = {
  readonly contact: ContactInfo;
  readonly lang?: Lang;
};

const CONTACT_ICON_SIZE_PX = 18;

const ICON_BY_NAME: Readonly<
  Record<ContactIcon, React.ComponentType<IconProps>>
> = {
  headset: HeadsetIcon,
  "phone-call": PhoneCallIcon,
};

function dialHref(rawNumber: string): string {
  // Emergency contact — make the number tappable via a tel: link.
  return `tel:${rawNumber.replace(/[^\d+]/g, "")}`;
}

export function ContactCard({ contact, lang = "en" }: ContactCardProps) {
  const Icon = ICON_BY_NAME[contact.icon];
  const t = getDict(lang);
  return (
    <a
      href={dialHref(contact.number)}
      className="flex flex-1 min-w-px items-center gap-[10px] px-[14px] py-[12px] rounded-[12px] bg-(--color-bg-primary) border border-solid border-(--color-border-subtle) hover:border-(--color-border-default) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) transition-colors"
      aria-label={t.callAria(contact.label, contact.number)}
    >
      <Icon
        size={CONTACT_ICON_SIZE_PX}
        className="shrink-0 text-(--color-text-primary)"
        aria-hidden
      />
      <div className="flex flex-col">
        <span className="text-body-xxs text-(--color-text-muted)">
          {contact.label}
        </span>
        <span className="text-body-md font-bold text-(--color-text-primary)">
          {contact.number}
        </span>
      </div>
    </a>
  );
}
