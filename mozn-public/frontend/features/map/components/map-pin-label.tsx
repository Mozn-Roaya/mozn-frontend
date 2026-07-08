import { cn } from "@/components/lib/cn";

type MapPinLabelProps = {
  readonly location?: string;
  readonly hazard?: string;
  readonly className?: string;
};

export function MapPinLabel({
  location = "Location",
  hazard = "Hazard",
  className,
}: MapPinLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[4px] rounded-[100px] px-[8px] py-[3px]",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "text-(--color-text-primary) whitespace-nowrap",
        "shadow-[0_2px_3px_0_rgba(33,41,51,0.05)]",
        "text-body-sm font-medium",
        className,
      )}
    >
      <span>{location}</span>
      <span aria-hidden>·</span>
      <span>{hazard}</span>
    </span>
  );
}
