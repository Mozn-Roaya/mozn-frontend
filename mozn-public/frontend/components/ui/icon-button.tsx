import * as React from "react";

import {
  PlusIcon,
  MinusIcon,
  MapPinIcon,
  LayersIcon,
  LocateFixedIcon,
  type IconProps,
} from "../icons";
import { cn } from "../lib/cn";

type IconKind = "plus" | "minus" | "map-pin" | "layers" | "locate-fixed";

const iconMap: Record<IconKind, React.ComponentType<IconProps>> = {
  plus: PlusIcon,
  minus: MinusIcon,
  "map-pin": MapPinIcon,
  layers: LayersIcon,
  "locate-fixed": LocateFixedIcon,
};

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconKind;
  label?: string;
};

export function IconButton({
  icon,
  label,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  const Icon = iconMap[icon];
  return (
    <button
      type={type}
      aria-label={label ?? icon}
      className={cn(
        "inline-flex items-center justify-center size-[32px] md:size-[40px] lg:size-[44px] rounded-[8px] md:rounded-[12px]",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-default)",
        "text-(--color-text-primary)",
        "shadow-card transition-colors",
        "hover:bg-(--color-bg-secondary) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-(--color-bg-primary)",
        "[&_svg]:size-[16px] md:[&_svg]:size-[20px] lg:[&_svg]:size-[22px]",
        className,
      )}
      {...props}
    >
      <Icon />
    </button>
  );
}

type MapControlStackProps = {
  className?: string;
  icons?: IconKind[];
};

export function MapControlStack({
  className,
  icons = ["plus", "minus", "map-pin", "layers"],
}: MapControlStackProps) {
  return (
    <div className={cn("flex flex-col gap-[8px]", className)}>
      {icons.map((icon) => (
        <IconButton key={icon} icon={icon} />
      ))}
    </div>
  );
}
