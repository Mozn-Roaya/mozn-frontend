import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Placeholder shown when a list/inbox has no rows. Wraps the shadcn `Empty`
 * primitive: the icon renders in an `EmptyMedia` badge, with an optional
 * `title` above the `message` description, and an optional `action` (e.g. a
 * "Clear filters" button) rendered below.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        {title ? <EmptyTitle>{title}</EmptyTitle> : null}
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
