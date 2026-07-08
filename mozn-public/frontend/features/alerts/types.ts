export type AlertLayout = "collapsed" | "expanded";

export type ContactIcon = "headset" | "phone-call";

export type ContactInfo = {
  readonly label: string;
  readonly number: string;
  readonly icon: ContactIcon;
};
